-- =====================================================
-- OPTIMIZED CLASS MANAGEMENT SCHEMA FOR FSAS
-- =====================================================
-- This schema optimizes class management across academic periods
-- without creating multiple tables per class

-- =====================================================
-- STEP 1: ENHANCED ACADEMIC PERIODS
-- =====================================================

-- Enhanced academic periods with better period management
CREATE TABLE IF NOT EXISTS academic_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- 'Fall 2025', 'Spring 2026'
    year INTEGER NOT NULL,
    semester VARCHAR(20) NOT NULL, -- 'fall', 'spring', 'summer'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true, -- For soft deletion
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure only one current period
    CONSTRAINT unique_current_period EXCLUDE (is_current WITH =) WHERE (is_current = true)
);

-- =====================================================
-- STEP 2: ENHANCED COURSE CATALOG
-- =====================================================

-- Course catalog (master list of all possible courses)
CREATE TABLE IF NOT EXISTS courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL, -- 'CSC-105', 'MAT-201'
    name VARCHAR(200) NOT NULL,
    description TEXT,
    credits INTEGER DEFAULT 3,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique course codes
    UNIQUE(code)
);

-- =====================================================
-- STEP 3: ENHANCED CLASS INSTANCES
-- =====================================================

-- Class instances (specific offerings of courses in specific periods)
CREATE TABLE IF NOT EXISTS class_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    professor_id UUID NOT NULL REFERENCES professors(user_id) ON DELETE CASCADE,
    academic_period_id UUID NOT NULL REFERENCES academic_periods(id) ON DELETE CASCADE,
    
    -- Class-specific details
    room_location VARCHAR(100),
    schedule_info VARCHAR(200), -- 'MWF 10:00-10:50'
    max_students INTEGER DEFAULT 30,
    current_enrollment INTEGER DEFAULT 0, -- Denormalized for performance
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false, -- Professor can control visibility
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one instance per course per professor per period
    UNIQUE(course_id, professor_id, academic_period_id)
);

-- =====================================================
-- STEP 4: ENHANCED ENROLLMENT SYSTEM
-- =====================================================

-- Student enrollments in class instances
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    class_instance_id UUID NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
    academic_period_id UUID NOT NULL REFERENCES academic_periods(id),
    
    -- Enrollment details
    enrolled_by UUID NOT NULL REFERENCES professors(user_id), -- Who enrolled the student
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'dropped', 'completed', 'withdrawn'
    final_grade VARCHAR(2), -- 'A', 'B+', 'C', etc.
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one enrollment per student per class instance
    UNIQUE(student_id, class_instance_id)
);

-- =====================================================
-- STEP 5: OPTIMIZED SESSION MANAGEMENT
-- =====================================================

-- Class sessions (individual class meetings)
CREATE TABLE IF NOT EXISTS class_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_instance_id UUID NOT NULL REFERENCES class_instances(id) ON DELETE CASCADE,
    
    -- Session details
    session_number INTEGER NOT NULL, -- 1, 2, 3, etc. for the class
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_location VARCHAR(100),
    notes TEXT,
    
    -- QR Code management
    qr_secret VARCHAR(255),
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false,
    
    -- Status tracking
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'active', 'completed', 'cancelled'
    total_enrolled INTEGER DEFAULT 0, -- Denormalized for performance
    attendance_count INTEGER DEFAULT 0, -- Denormalized for performance
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique session numbers per class instance
    UNIQUE(class_instance_id, session_number)
);

-- =====================================================
-- STEP 6: OPTIMIZED ATTENDANCE TRACKING
-- =====================================================

-- Attendance records (one per student per session)
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    
    -- Attendance details
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'present', -- 'present', 'late', 'absent', 'excused'
    minutes_late INTEGER DEFAULT 0, -- Calculated from start_time
    
    -- Security and audit
    device_fingerprint VARCHAR(255),
    ip_address INET,
    qr_secret_used VARCHAR(255), -- Track which QR code was used
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one record per student per session
    UNIQUE(session_id, student_id)
);

-- =====================================================
-- STEP 7: ATTENDANCE SUMMARY VIEWS (FOR PERFORMANCE)
-- =====================================================

-- Materialized view for quick attendance statistics
CREATE MATERIALIZED VIEW IF NOT EXISTS attendance_summary AS
SELECT 
    ci.id as class_instance_id,
    ci.course_id,
    c.code as course_code,
    c.name as course_name,
    ci.academic_period_id,
    ap.name as period_name,
    ci.professor_id,
    p.employee_id,
    u.first_name || ' ' || u.last_name as professor_name,
    
    -- Session counts
    COUNT(cs.id) as total_sessions,
    COUNT(CASE WHEN cs.status = 'completed' THEN 1 END) as completed_sessions,
    COUNT(CASE WHEN cs.is_active = true THEN 1 END) as active_sessions,
    
    -- Enrollment counts
    COUNT(DISTINCT e.student_id) as total_enrolled,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.student_id END) as active_enrolled,
    
    -- Attendance statistics
    COUNT(ar.id) as total_attendance_records,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
    
    -- Calculated percentages
    CASE 
        WHEN COUNT(ar.id) > 0 THEN 
            ROUND((COUNT(CASE WHEN ar.status = 'present' THEN 1 END)::DECIMAL / COUNT(ar.id)) * 100, 2)
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
GROUP BY ci.id, ci.course_id, c.code, c.name, ci.academic_period_id, ap.name, 
         ci.professor_id, p.employee_id, u.first_name, u.last_name;

-- Create index on materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_attendance_summary_class_instance 
ON attendance_summary(class_instance_id);

-- =====================================================
-- STEP 8: PERFORMANCE INDEXES
-- =====================================================

-- Academic periods indexes
CREATE INDEX IF NOT EXISTS idx_academic_periods_current ON academic_periods(is_current) WHERE is_current = true;
CREATE INDEX IF NOT EXISTS idx_academic_periods_active ON academic_periods(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_academic_periods_year_semester ON academic_periods(year, semester);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_courses_active ON courses(is_active) WHERE is_active = true;

-- Class instances indexes
CREATE INDEX IF NOT EXISTS idx_class_instances_course ON class_instances(course_id);
CREATE INDEX IF NOT EXISTS idx_class_instances_professor ON class_instances(professor_id);
CREATE INDEX IF NOT EXISTS idx_class_instances_period ON class_instances(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_class_instances_active ON class_instances(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_class_instances_published ON class_instances(is_published) WHERE is_published = true;

-- Enrollments indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_instance ON enrollments(class_instance_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_period ON enrollments(academic_period_id);

-- Class sessions indexes
CREATE INDEX IF NOT EXISTS idx_class_sessions_instance ON class_sessions(class_instance_id);
CREATE INDEX IF NOT EXISTS idx_class_sessions_date ON class_sessions(date);
CREATE INDEX IF NOT EXISTS idx_class_sessions_active ON class_sessions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_class_sessions_status ON class_sessions(status);

-- Attendance records indexes
CREATE INDEX IF NOT EXISTS idx_attendance_records_session ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_scanned_at ON attendance_records(scanned_at);
CREATE INDEX IF NOT EXISTS idx_attendance_records_status ON attendance_records(status);

-- =====================================================
-- STEP 9: TRIGGERS FOR DATA CONSISTENCY
-- =====================================================

-- Function to update enrollment count
CREATE OR REPLACE FUNCTION update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update current enrollment count
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
        -- Update current enrollment count
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

-- Create triggers for enrollment count updates
DROP TRIGGER IF EXISTS trigger_update_enrollment_count ON enrollments;
CREATE TRIGGER trigger_update_enrollment_count
    AFTER INSERT OR UPDATE OR DELETE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_count();

-- Function to update session attendance count
CREATE OR REPLACE FUNCTION update_session_attendance_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        -- Update attendance count for the session
        UPDATE class_sessions 
        SET attendance_count = (
            SELECT COUNT(*) 
            FROM attendance_records 
            WHERE session_id = NEW.session_id
        )
        WHERE id = NEW.session_id;
        
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Update attendance count for the session
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

-- Create triggers for attendance count updates
DROP TRIGGER IF EXISTS trigger_update_session_attendance_count ON attendance_records;
CREATE TRIGGER trigger_update_session_attendance_count
    AFTER INSERT OR UPDATE OR DELETE ON attendance_records
    FOR EACH ROW
    EXECUTE FUNCTION update_session_attendance_count();

-- Function to refresh materialized view
CREATE OR REPLACE FUNCTION refresh_attendance_summary()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY attendance_summary;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STEP 10: ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 11: SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample academic periods
INSERT INTO academic_periods (name, year, semester, start_date, end_date, is_current) VALUES
('Fall 2024', 2024, 'fall', '2024-08-26', '2024-12-13', false),
('Spring 2025', 2025, 'spring', '2025-01-13', '2025-05-09', true),
('Fall 2025', 2025, 'fall', '2025-08-25', '2025-12-12', false)
ON CONFLICT DO NOTHING;

-- Insert sample courses
INSERT INTO courses (code, name, description, credits) VALUES
('CSC-105', 'Introduction to Computer Science', 'Basic programming concepts and problem solving', 3),
('CSC-301', 'Data Structures', 'Advanced data structures and algorithms', 3),
('MAT-201', 'Calculus II', 'Advanced calculus concepts', 4),
('ENG-101', 'Composition I', 'Basic writing and communication skills', 3)
ON CONFLICT (code) DO NOTHING;

-- =====================================================
-- STEP 12: USEFUL QUERIES FOR THE APPLICATION
-- =====================================================

-- Query to get all classes for a professor in a specific period
-- SELECT ci.*, c.code, c.name, ap.name as period_name, 
--        ci.current_enrollment, ci.max_students
-- FROM class_instances ci
-- JOIN courses c ON ci.course_id = c.id
-- JOIN academic_periods ap ON ci.academic_period_id = ap.id
-- WHERE ci.professor_id = $1 AND ci.academic_period_id = $2;

-- Query to get attendance for a specific class instance
-- SELECT cs.*, 
--        COUNT(ar.id) as attendance_count,
--        COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
--        COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count
-- FROM class_sessions cs
-- LEFT JOIN attendance_records ar ON cs.id = ar.session_id
-- WHERE cs.class_instance_id = $1
-- GROUP BY cs.id
-- ORDER BY cs.date, cs.start_time;

-- Query to get student attendance summary
-- SELECT s.student_id, u.first_name, u.last_name,
--        COUNT(ar.id) as total_sessions,
--        COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
--        COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
--        COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count
-- FROM enrollments e
-- JOIN students s ON e.student_id = s.user_id
-- JOIN users u ON s.user_id = u.id
-- JOIN class_sessions cs ON e.class_instance_id = cs.class_instance_id
-- LEFT JOIN attendance_records ar ON cs.id = ar.session_id AND ar.student_id = s.user_id
-- WHERE e.class_instance_id = $1 AND e.status = 'active'
-- GROUP BY s.student_id, u.first_name, u.last_name
-- ORDER BY u.last_name, u.first_name;
