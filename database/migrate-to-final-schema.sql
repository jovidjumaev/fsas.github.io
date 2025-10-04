-- =====================================================
-- MIGRATION SCRIPT: CURRENT SCHEMA TO FINAL OPTIMIZED SCHEMA
-- =====================================================
-- This script migrates your existing database to the final optimized schema
-- Run this after backing up your current database

-- =====================================================
-- STEP 1: BACKUP EXISTING DATA
-- =====================================================

-- Create backup tables (optional, for safety)
CREATE TABLE IF NOT EXISTS classes_backup AS SELECT * FROM classes;
CREATE TABLE IF NOT EXISTS sessions_backup AS SELECT * FROM sessions;
CREATE TABLE IF NOT EXISTS attendance_backup AS SELECT * FROM attendance;
CREATE TABLE IF NOT EXISTS enrollments_backup AS SELECT * FROM enrollments;

-- =====================================================
-- STEP 2: CREATE NEW TABLES
-- =====================================================

-- Create courses table (extract unique courses from existing classes)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 3,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(code)
);

-- Create class_instances table
CREATE TABLE IF NOT EXISTS class_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES professors(user_id) ON DELETE CASCADE,
    academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
    section_number INTEGER NOT NULL,
    class_code VARCHAR(20) NOT NULL UNIQUE,
    days_of_week TEXT[] NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    first_class_date DATE NOT NULL,
    last_class_date DATE NOT NULL,
    room_location VARCHAR(100),
    max_students INTEGER DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    enrollment_deadline DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(course_id, academic_period_id, section_number)
);

-- Create class_sessions table
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_instance_id UUID NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_location VARCHAR(100),
    status VARCHAR(20) DEFAULT 'scheduled',
    notes TEXT,
    qr_secret VARCHAR(255),
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false,
    attendance_count INTEGER DEFAULT 0,
    total_enrolled INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(class_instance_id, session_number)
);

-- Create attendance_records table
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'present',
    minutes_late INTEGER DEFAULT 0,
    device_fingerprint VARCHAR(255),
    ip_address INET,
    qr_secret_used VARCHAR(255),
    status_changed_by UUID REFERENCES professors(user_id),
    status_changed_at TIMESTAMP WITH TIME ZONE,
    status_change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- =====================================================
-- STEP 3: CREATE UTILITY FUNCTIONS
-- =====================================================

-- Function to generate random class code
CREATE OR REPLACE FUNCTION generate_class_code(course_code VARCHAR(20))
RETURNS VARCHAR(20) AS $$
DECLARE
    random_part VARCHAR(6);
    full_code VARCHAR(20);
    code_exists BOOLEAN;
BEGIN
    LOOP
        random_part := upper(substring(md5(random()::text) from 1 for 6));
        full_code := course_code || '-' || random_part;
        
        SELECT EXISTS(SELECT 1 FROM class_instances WHERE class_code = full_code) INTO code_exists;
        EXIT WHEN NOT code_exists;
    END LOOP;
    
    RETURN full_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get next section number
CREATE OR REPLACE FUNCTION get_next_section_number(p_course_id UUID, p_academic_period_id UUID)
RETURNS INTEGER AS $$
DECLARE
    next_section INTEGER;
BEGIN
    SELECT COALESCE(MAX(section_number), 0) + 1
    INTO next_section
    FROM class_instances
    WHERE course_id = p_course_id 
    AND academic_period_id = p_academic_period_id;
    
    RETURN next_section;
END;
$$ LANGUAGE plpgsql;

-- Function to generate class sessions
CREATE OR REPLACE FUNCTION generate_class_sessions(p_class_instance_id UUID)
RETURNS VOID AS $$
DECLARE
    class_rec RECORD;
    current_date_val DATE;
    session_number INTEGER := 1;
    day_of_week INTEGER;
    target_days INTEGER[];
    i INTEGER;
BEGIN
    SELECT * INTO class_rec
    FROM class_instances
    WHERE id = p_class_instance_id;
    
    target_days := ARRAY[]::INTEGER[];
    FOR i IN 1..array_length(class_rec.days_of_week, 1) LOOP
        CASE class_rec.days_of_week[i]
            WHEN 'Monday' THEN target_days := array_append(target_days, 1);
            WHEN 'Tuesday' THEN target_days := array_append(target_days, 2);
            WHEN 'Wednesday' THEN target_days := array_append(target_days, 3);
            WHEN 'Thursday' THEN target_days := array_append(target_days, 4);
            WHEN 'Friday' THEN target_days := array_append(target_days, 5);
            WHEN 'Saturday' THEN target_days := array_append(target_days, 6);
            WHEN 'Sunday' THEN target_days := array_append(target_days, 7);
        END CASE;
    END LOOP;
    
    current_date_val := class_rec.first_class_date;
    
    WHILE current_date_val <= class_rec.last_class_date LOOP
        day_of_week := EXTRACT(DOW FROM current_date_val);
        
        IF day_of_week = ANY(target_days) AND day_of_week NOT IN (0, 6) THEN
            INSERT INTO class_sessions (
                class_instance_id,
                session_number,
                date,
                start_time,
                end_time,
                room_location,
                status
            ) VALUES (
                p_class_instance_id,
                session_number,
                current_date_val,
                class_rec.start_time,
                class_rec.end_time,
                class_rec.room_location,
                'scheduled'
            );
            
            session_number := session_number + 1;
        END IF;
        
        current_date_val := current_date_val + INTERVAL '1 day';
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 4: MIGRATE DATA
-- =====================================================

-- Migrate courses from existing classes
INSERT INTO courses (code, name, description, credits, department_id, created_at)
SELECT DISTINCT 
    code, 
    name, 
    description, 
    COALESCE(credits, 3), 
    department_id,
    MIN(created_at) as created_at
FROM classes 
WHERE code IS NOT NULL AND name IS NOT NULL
GROUP BY code, name, description, COALESCE(credits, 3), department_id;

-- Migrate class instances from existing classes with proper section numbering
WITH class_instances_with_sections AS (
    SELECT 
        c.id as course_id,
        cl.professor_id,
        cl.academic_period_id,
        ROW_NUMBER() OVER (PARTITION BY c.id, cl.academic_period_id ORDER BY cl.created_at) as section_number,
        generate_class_code(cl.code) as class_code,
        ARRAY['Monday', 'Wednesday', 'Friday'] as days_of_week, -- Default schedule
        '10:00:00'::TIME as start_time, -- Default time
        '10:50:00'::TIME as end_time, -- Default time
        COALESCE(cl.created_at::DATE, CURRENT_DATE) as first_class_date,
        COALESCE(cl.created_at::DATE + INTERVAL '15 weeks', CURRENT_DATE + INTERVAL '15 weeks') as last_class_date,
        cl.room_location,
        cl.max_students,
        cl.is_active,
        COALESCE(cl.created_at::DATE + INTERVAL '14 days', CURRENT_DATE + INTERVAL '14 days') as enrollment_deadline,
        cl.created_at,
        cl.updated_at
    FROM classes cl
    JOIN courses c ON cl.code = c.code AND cl.name = c.name
)
INSERT INTO class_instances (
    course_id, professor_id, academic_period_id, section_number, class_code,
    days_of_week, start_time, end_time, first_class_date, last_class_date,
    room_location, max_students, is_active, enrollment_deadline, created_at, updated_at
)
SELECT 
    course_id, professor_id, academic_period_id, section_number, class_code,
    days_of_week, start_time, end_time, first_class_date, last_class_date,
    room_location, max_students, is_active, enrollment_deadline, created_at, updated_at
FROM class_instances_with_sections;

-- Migrate sessions to class_sessions
INSERT INTO class_sessions (
    class_instance_id, session_number, date, start_time, end_time,
    room_location, status, qr_secret, qr_expires_at, is_active, created_at, updated_at
)
SELECT 
    ci.id as class_instance_id,
    ROW_NUMBER() OVER (PARTITION BY s.class_id ORDER BY s.date, s.start_time) as session_number,
    s.date,
    s.start_time,
    s.end_time,
    s.room_location,
    CASE 
        WHEN s.is_active = true THEN 'scheduled'
        ELSE 'cancelled'
    END as status,
    s.qr_secret,
    s.qr_expires_at,
    s.is_active,
    s.created_at,
    s.updated_at
FROM sessions s
JOIN classes cl ON s.class_id = cl.id
JOIN class_instances ci ON cl.professor_id = ci.professor_id 
    AND cl.academic_period_id = ci.academic_period_id
    AND cl.code = (SELECT code FROM courses WHERE id = ci.course_id)
    AND cl.name = (SELECT name FROM courses WHERE id = ci.course_id);

-- Migrate attendance records
INSERT INTO attendance_records (
    session_id, student_id, scanned_at, status, device_fingerprint, ip_address, created_at
)
SELECT 
    cs.id as session_id,
    a.student_id,
    a.scanned_at,
    a.status,
    a.device_fingerprint,
    a.ip_address,
    a.created_at
FROM attendance a
JOIN sessions s ON a.session_id = s.id
JOIN classes cl ON s.class_id = cl.id
JOIN class_instances ci ON cl.professor_id = ci.professor_id 
    AND cl.academic_period_id = ci.academic_period_id
    AND cl.code = (SELECT code FROM courses WHERE id = ci.course_id)
    AND cl.name = (SELECT name FROM courses WHERE id = ci.course_id)
JOIN class_sessions cs ON ci.id = cs.class_instance_id 
    AND s.date = cs.date 
    AND s.start_time = cs.start_time;

-- Add class_instance_id column to enrollments table
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS class_instance_id UUID REFERENCES class_instances(id);

-- Update enrollment references
UPDATE enrollments 
SET class_instance_id = ci.id
FROM class_instances ci
JOIN classes cl ON ci.course_id = (SELECT id FROM courses WHERE code = cl.code AND name = cl.name)
WHERE enrollments.class_id = cl.id
AND ci.professor_id = cl.professor_id
AND ci.academic_period_id = cl.academic_period_id;

-- =====================================================
-- STEP 5: CREATE INDEXES
-- =====================================================

-- Academic periods indexes
CREATE INDEX IF NOT EXISTS idx_academic_periods_current ON academic_periods(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_academic_periods_year_semester ON academic_periods(year, semester);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active) WHERE is_active = true;

-- Class instances indexes
CREATE INDEX IF NOT EXISTS idx_class_instances_course ON class_instances(course_id);
CREATE INDEX IF NOT EXISTS idx_class_instances_professor ON class_instances(professor_id);
CREATE INDEX IF NOT EXISTS idx_class_instances_period ON class_instances(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_class_instances_section ON class_instances(course_id, academic_period_id, section_number);
CREATE INDEX IF NOT EXISTS idx_class_instances_class_code ON class_instances(class_code);
CREATE INDEX IF NOT EXISTS idx_class_instances_active ON class_instances(is_active) WHERE is_active = true;

-- Class sessions indexes
CREATE INDEX IF NOT EXISTS idx_class_sessions_instance ON class_sessions(class_instance_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON class_sessions(status);
CREATE INDEX IF NOT EXISTS idx_class_sessions_active ON class_sessions(is_active) WHERE is_active = true;

-- Attendance records indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_scanned_at ON attendance_records(scanned_at);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);

-- =====================================================
-- STEP 6: CREATE TRIGGERS
-- =====================================================

-- Function to update enrollment count
CREATE OR REPLACE FUNCTION update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE class_instances 
        SET current_enrollment = (
            SELECT COUNT(*) 
            FROM enrollments 
            WHERE class_instance_id = NEW.class_instance_id 
            AND status = 'active'
        )
        WHERE id = NEW.class_instance_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE class_instances 
        SET current_enrollment = (
            SELECT COUNT(*) 
            FROM enrollments 
            WHERE class_instance_id = OLD.class_instance_id 
            AND status = 'active'
        )
        WHERE id = OLD.class_instance_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update session attendance count
CREATE OR REPLACE FUNCTION update_session_attendance_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE class_sessions 
        SET attendance_count = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = NEW.session_id
        )
        WHERE id = NEW.session_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE class_sessions 
        SET attendance_count = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = OLD.session_id
        )
        WHERE id = OLD.session_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_update_enrollment_count ON enrollments;
CREATE TRIGGER trigger_update_enrollment_count
    AFTER INSERT OR UPDATE OR DELETE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_count();

DROP TRIGGER IF EXISTS trigger_update_session_attendance_count ON attendance_records;
CREATE TRIGGER trigger_update_session_attendance_count
    AFTER INSERT OR UPDATE OR DELETE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_session_attendance_count();

-- =====================================================
-- STEP 7: CREATE MATERIALIZED VIEW
-- =====================================================

-- Create materialized view for attendance summary
CREATE MATERIALIZED VIEW IF NOT EXISTS class_attendance_summary AS
SELECT 
    ci.id as class_instance_id,
    ci.class_code,
    c.code as course_code,
    c.name as course_name,
    ci.section_number,
    ap.name as period_name,
    ci.professor_id,
    p.employee_id,
    u.first_name || ' ' || u.last_name as professor_name,
    
    -- Session counts
    COUNT(cs.id) as total_sessions,
    COUNT(CASE WHEN cs.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN cs.status = 'cancelled' THEN 1 END) as cancelled_sessions,
    COUNT(CASE WHEN cs.is_active = true THEN 1 END) as active_sessions,
    
    -- Enrollment counts
    COUNT(DISTINCT e.student_id) as total_enrolled,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.student_id END) as active_enrolled,
    
    -- Attendance statistics (only for non-cancelled sessions)
    COUNT(CASE WHEN cs.status != 'cancelled' THEN ar.id END) as total_attendance_records,
    COUNT(CASE WHEN cs.status != 'cancelled' AND ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN cs.status != 'cancelled' AND ar.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN cs.status != 'cancelled' AND ar.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN cs.status != 'cancelled' AND ar.status = 'excused' THEN 1 END) as excused_count,
    
    -- Calculated percentages
    CASE 
        WHEN COUNT(CASE WHEN cs.status != 'cancelled' THEN ar.id END) > 0 THEN 
            ROUND((COUNT(CASE WHEN cs.status != 'cancelled' AND ar.status = 'present' THEN 1 END)::DECIMAL / 
                   COUNT(CASE WHEN cs.status != 'cancelled' THEN ar.id END)) * 100, 2)
        ELSE 0 
    END as attendance_rate

FROM class_instances ci
LEFT JOIN courses c ON ci.course_id = c.id
LEFT JOIN academic_periods ap ON ci.academic_period_id = ap.id
LEFT JOIN professors p ON ci.professor_id = p.user_id
LEFT JOIN users u ON p.user_id = u.id
LEFT JOIN enrollments e ON ci.id = e.class_instance_id
LEFT JOIN class_sessions cs ON ci.id = cs.class_instance_id
LEFT JOIN attendance_records ar ON cs.id = ar.session_id
WHERE ci.is_active = true
GROUP BY ci.id, ci.class_code, c.code, c.name, ci.section_number, ap.name, 
         ci.professor_id, p.employee_id, u.first_name, u.last_name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_class_attendance_summary_class_instance 
ON class_attendance_summary(class_instance_id);

-- =====================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 9: UPDATE COUNTS
-- =====================================================

-- Update current enrollment counts
UPDATE class_instances 
SET current_enrollment = (
    SELECT COUNT(*) 
    FROM enrollments 
    WHERE class_instance_id = class_instances.id 
    AND status = 'active'
);

-- Update session attendance counts
UPDATE class_sessions 
SET attendance_count = (
    SELECT COUNT(*) 
    FROM attendance_records 
    WHERE session_id = class_sessions.id
);

-- =====================================================
-- STEP 10: VERIFICATION QUERIES
-- =====================================================

-- Verify data migration
SELECT 'Courses migrated:' as check_type, COUNT(*) as count FROM courses
UNION ALL
SELECT 'Class instances migrated:', COUNT(*) FROM class_instances
UNION ALL
SELECT 'Class sessions migrated:', COUNT(*) FROM class_sessions
UNION ALL
SELECT 'Attendance records migrated:', COUNT(*) FROM attendance_records;

-- Check for any missing data
SELECT 'Missing class instances:' as issue, COUNT(*) as count 
FROM classes cl 
LEFT JOIN class_instances ci ON cl.professor_id = ci.professor_id 
    AND cl.academic_period_id = ci.academic_period_id
    AND cl.code = (SELECT code FROM courses WHERE id = ci.course_id)
WHERE ci.id IS NULL;

-- =====================================================
-- STEP 11: CLEANUP (OPTIONAL - RUN AFTER VERIFICATION)
-- =====================================================

-- Uncomment these lines after verifying the migration worked correctly
-- DROP TABLE IF EXISTS classes CASCADE;
-- DROP TABLE IF EXISTS sessions CASCADE;
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS qr_usage CASCADE;
