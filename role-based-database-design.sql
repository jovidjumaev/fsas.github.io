-- =====================================================
-- ROLE-BASED DATABASE DESIGN
-- =====================================================
-- This script creates role-specific tables and views
-- for students and professors with optimized data access

-- =====================================================
-- 1. STUDENT-SPECIFIC TABLES & VIEWS
-- =====================================================

-- Student Dashboard View - All data a student needs
CREATE OR REPLACE VIEW student_dashboard AS
SELECT 
    s.id as student_id,
    s.student_id as student_number,
    s.enrollment_year,
    s.major,
    s.graduation_year,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.is_active,
    u.created_at as account_created
FROM students s
JOIN users u ON s.user_id = u.id
WHERE u.is_active = true;

-- Student Enrollments View - Classes student is enrolled in
CREATE OR REPLACE VIEW student_enrollments AS
SELECT 
    e.id as enrollment_id,
    e.student_id,
    e.class_id,
    e.enrollment_date,
    e.status as enrollment_status,
    c.code as class_code,
    c.name as class_name,
    c.room_location,
    c.schedule_info,
    c.max_students,
    c.is_active as class_active,
    ap.name as academic_period,
    ap.year,
    ap.semester,
    d.name as department_name,
    d.code as department_code,
    p.employee_id as professor_id,
    CONCAT(u.first_name, ' ', u.last_name) as professor_name,
    u.email as professor_email
FROM enrollments e
JOIN classes c ON e.class_id = c.id
JOIN academic_periods ap ON c.academic_period_id = ap.id
JOIN departments d ON c.department_id = d.id
JOIN professors p ON c.professor_id = p.user_id
JOIN users u ON p.user_id = u.id
WHERE e.status = 'enrolled';

-- Student Attendance Summary View
CREATE OR REPLACE VIEW student_attendance_summary AS
SELECT 
    a.student_id,
    a.session_id,
    a.status as attendance_status,
    a.created_at as attendance_date,
    s.date as session_date,
    s.start_time,
    s.end_time,
    s.room_location,
    s.notes as session_notes,
    c.code as class_code,
    c.name as class_name,
    c.room_location as class_room,
    c.schedule_info,
    ap.name as academic_period,
    ap.year,
    ap.semester
FROM attendance a
JOIN sessions s ON a.session_id = s.id
JOIN classes c ON s.class_id = c.id
JOIN academic_periods ap ON c.academic_period_id = ap.id;

-- Student Upcoming Sessions View
CREATE OR REPLACE VIEW student_upcoming_sessions AS
SELECT 
    s.id as session_id,
    s.class_id,
    s.date as session_date,
    s.start_time,
    s.end_time,
    s.room_location,
    s.notes,
    s.is_active,
    c.code as class_code,
    c.name as class_name,
    c.schedule_info,
    ap.name as academic_period,
    ap.year,
    ap.semester,
    d.name as department_name,
    CONCAT(u.first_name, ' ', u.last_name) as professor_name
FROM sessions s
JOIN classes c ON s.class_id = c.id
JOIN academic_periods ap ON c.academic_period_id = ap.id
JOIN departments d ON c.department_id = d.id
JOIN professors p ON c.professor_id = p.user_id
JOIN users u ON p.user_id = u.id
WHERE s.date >= CURRENT_DATE 
  AND s.is_active = true
  AND EXISTS (
    SELECT 1 FROM enrollments e 
    WHERE e.class_id = s.class_id 
    AND e.student_id = ? -- This will be parameterized
    AND e.status = 'enrolled'
  )
ORDER BY s.date, s.start_time;

-- =====================================================
-- 2. PROFESSOR-SPECIFIC TABLES & VIEWS
-- =====================================================

-- Professor Dashboard View - All data a professor needs
CREATE OR REPLACE VIEW professor_dashboard AS
SELECT 
    p.id as professor_id,
    p.employee_id,
    p.title,
    p.department_id,
    p.hire_date,
    p.is_active as professor_active,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.is_active,
    u.created_at as account_created,
    d.name as department_name,
    d.code as department_code
FROM professors p
JOIN users u ON p.user_id = u.id
LEFT JOIN departments d ON p.department_id = d.id
WHERE u.is_active = true;

-- Professor Classes View - All classes taught by professor
CREATE OR REPLACE VIEW professor_classes AS
SELECT 
    c.id as class_id,
    c.code,
    c.name,
    c.description,
    c.room_location,
    c.schedule_info,
    c.max_students,
    c.is_active,
    c.created_at,
    c.updated_at,
    ap.id as academic_period_id,
    ap.name as academic_period,
    ap.year,
    ap.semester,
    ap.start_date,
    ap.end_date,
    d.id as department_id,
    d.name as department_name,
    d.code as department_code,
    COUNT(e.id) as enrolled_students,
    COUNT(CASE WHEN e.status = 'enrolled' THEN 1 END) as active_enrollments
FROM classes c
JOIN academic_periods ap ON c.academic_period_id = ap.id
JOIN departments d ON c.department_id = d.id
LEFT JOIN enrollments e ON c.id = e.class_id
WHERE c.professor_id = ? -- This will be parameterized
GROUP BY c.id, ap.id, d.id
ORDER BY ap.year DESC, ap.semester, c.code;

-- Professor Sessions View - All sessions for professor's classes
CREATE OR REPLACE VIEW professor_sessions AS
SELECT 
    s.id as session_id,
    s.class_id,
    s.date as session_date,
    s.start_time,
    s.end_time,
    s.room_location,
    s.notes,
    s.is_active,
    s.created_at,
    s.updated_at,
    c.code as class_code,
    c.name as class_name,
    c.schedule_info,
    ap.name as academic_period,
    ap.year,
    ap.semester,
    COUNT(a.id) as attendance_count,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count
FROM sessions s
JOIN classes c ON s.class_id = c.id
JOIN academic_periods ap ON c.academic_period_id = ap.id
LEFT JOIN attendance a ON s.id = a.session_id
WHERE c.professor_id = ? -- This will be parameterized
GROUP BY s.id, c.id, ap.id
ORDER BY s.date DESC, s.start_time;

-- Professor Students View - All students in professor's classes
CREATE OR REPLACE VIEW professor_students AS
SELECT 
    s.id as student_id,
    s.student_id as student_number,
    s.enrollment_year,
    s.major,
    s.graduation_year,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    e.id as enrollment_id,
    e.class_id,
    e.enrollment_date,
    e.status as enrollment_status,
    c.code as class_code,
    c.name as class_name,
    ap.name as academic_period,
    ap.year,
    ap.semester
FROM students s
JOIN users u ON s.user_id = u.id
JOIN enrollments e ON s.id = e.student_id
JOIN classes c ON e.class_id = c.id
JOIN academic_periods ap ON c.academic_period_id = ap.id
WHERE c.professor_id = ? -- This will be parameterized
  AND e.status = 'enrolled'
ORDER BY u.last_name, u.first_name;

-- Professor Attendance Analytics View
CREATE OR REPLACE VIEW professor_attendance_analytics AS
SELECT 
    c.id as class_id,
    c.code as class_code,
    c.name as class_name,
    s.id as session_id,
    s.date as session_date,
    s.start_time,
    s.end_time,
    COUNT(a.id) as total_attendance,
    COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
    COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
    ROUND(
        COUNT(CASE WHEN a.status = 'present' THEN 1 END) * 100.0 / 
        NULLIF(COUNT(a.id), 0), 2
    ) as attendance_percentage,
    ap.name as academic_period,
    ap.year,
    ap.semester
FROM classes c
JOIN sessions s ON c.id = s.class_id
JOIN academic_periods ap ON c.academic_period_id = ap.id
LEFT JOIN attendance a ON s.id = a.session_id
WHERE c.professor_id = ? -- This will be parameterized
GROUP BY c.id, s.id, ap.id
ORDER BY s.date DESC;

-- =====================================================
-- 3. ROLE-BASED RLS POLICIES
-- =====================================================

-- Student RLS Policies
DO $$ 
BEGIN
    -- Students can only see their own data
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_dashboard' AND policyname = 'Students can view their own dashboard') THEN
        CREATE POLICY "Students can view their own dashboard" ON student_dashboard
            FOR SELECT USING (student_id = auth.uid()::text);
    END IF;
    
    -- Students can only see their own enrollments
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_enrollments' AND policyname = 'Students can view their own enrollments') THEN
        CREATE POLICY "Students can view their own enrollments" ON student_enrollments
            FOR SELECT USING (student_id = auth.uid()::text);
    END IF;
    
    -- Students can only see their own attendance
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'student_attendance_summary' AND policyname = 'Students can view their own attendance') THEN
        CREATE POLICY "Students can view their own attendance" ON student_attendance_summary
            FOR SELECT USING (student_id = auth.uid()::text);
    END IF;
END $$;

-- Professor RLS Policies
DO $$ 
BEGIN
    -- Professors can only see their own data
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professor_dashboard' AND policyname = 'Professors can view their own dashboard') THEN
        CREATE POLICY "Professors can view their own dashboard" ON professor_dashboard
            FOR SELECT USING (professor_id = auth.uid()::text);
    END IF;
    
    -- Professors can only see their own classes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professor_classes' AND policyname = 'Professors can view their own classes') THEN
        CREATE POLICY "Professors can view their own classes" ON professor_classes
            FOR SELECT USING (professor_id = auth.uid()::text);
    END IF;
    
    -- Professors can only see their own sessions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professor_sessions' AND policyname = 'Professors can view their own sessions') THEN
        CREATE POLICY "Professors can view their own sessions" ON professor_sessions
            FOR SELECT USING (professor_id = auth.uid()::text);
    END IF;
    
    -- Professors can only see students in their classes
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professor_students' AND policyname = 'Professors can view their students') THEN
        CREATE POLICY "Professors can view their students" ON professor_students
            FOR SELECT USING (professor_id = auth.uid()::text);
    END IF;
    
    -- Professors can only see their own analytics
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professor_attendance_analytics' AND policyname = 'Professors can view their analytics') THEN
        CREATE POLICY "Professors can view their analytics" ON professor_attendance_analytics
            FOR SELECT USING (professor_id = auth.uid()::text);
    END IF;
END $$;

-- =====================================================
-- 4. ROLE-BASED FUNCTIONS
-- =====================================================

-- Function to get student dashboard data
CREATE OR REPLACE FUNCTION get_student_dashboard(student_user_id UUID)
RETURNS TABLE (
    student_id UUID,
    student_number VARCHAR,
    enrollment_year INTEGER,
    major VARCHAR,
    graduation_year INTEGER,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    is_active BOOLEAN,
    account_created TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM student_dashboard 
    WHERE student_dashboard.student_id = student_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get professor dashboard data
CREATE OR REPLACE FUNCTION get_professor_dashboard(professor_user_id UUID)
RETURNS TABLE (
    professor_id UUID,
    employee_id VARCHAR,
    title VARCHAR,
    department_id UUID,
    hire_date DATE,
    professor_active BOOLEAN,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    is_active BOOLEAN,
    account_created TIMESTAMP WITH TIME ZONE,
    department_name VARCHAR,
    department_code VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM professor_dashboard 
    WHERE professor_dashboard.professor_id = professor_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get student enrollments
CREATE OR REPLACE FUNCTION get_student_enrollments(student_user_id UUID)
RETURNS TABLE (
    enrollment_id UUID,
    student_id UUID,
    class_id UUID,
    enrollment_date DATE,
    enrollment_status VARCHAR,
    class_code VARCHAR,
    class_name VARCHAR,
    room_location VARCHAR,
    schedule_info VARCHAR,
    max_students INTEGER,
    class_active BOOLEAN,
    academic_period VARCHAR,
    year INTEGER,
    semester VARCHAR,
    department_name VARCHAR,
    department_code VARCHAR,
    professor_id VARCHAR,
    professor_name VARCHAR,
    professor_email VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM student_enrollments 
    WHERE student_enrollments.student_id = student_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get professor classes
CREATE OR REPLACE FUNCTION get_professor_classes(professor_user_id UUID)
RETURNS TABLE (
    class_id UUID,
    code VARCHAR,
    name VARCHAR,
    description TEXT,
    room_location VARCHAR,
    schedule_info VARCHAR,
    max_students INTEGER,
    is_active BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    academic_period_id UUID,
    academic_period VARCHAR,
    year INTEGER,
    semester VARCHAR,
    start_date DATE,
    end_date DATE,
    department_id UUID,
    department_name VARCHAR,
    department_code VARCHAR,
    enrolled_students BIGINT,
    active_enrollments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM professor_classes 
    WHERE professor_classes.professor_id = professor_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 5. INDEXES FOR PERFORMANCE
-- =====================================================

-- Student-specific indexes
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_student_dashboard_student_id ON students(user_id);

-- Professor-specific indexes
CREATE INDEX IF NOT EXISTS idx_classes_professor_id ON classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_professor_dashboard_professor_id ON professors(user_id);

-- =====================================================
-- 6. SAMPLE DATA FOR TESTING
-- =====================================================

-- Note: This section would be populated with sample data
-- after the views and functions are created

COMMENT ON VIEW student_dashboard IS 'Student dashboard view with all student information';
COMMENT ON VIEW student_enrollments IS 'Student enrollments with class and professor details';
COMMENT ON VIEW student_attendance_summary IS 'Student attendance records with session details';
COMMENT ON VIEW student_upcoming_sessions IS 'Upcoming sessions for enrolled students';
COMMENT ON VIEW professor_dashboard IS 'Professor dashboard view with all professor information';
COMMENT ON VIEW professor_classes IS 'Professor classes with enrollment statistics';
COMMENT ON VIEW professor_sessions IS 'Professor sessions with attendance statistics';
COMMENT ON VIEW professor_students IS 'Students enrolled in professor classes';
COMMENT ON VIEW professor_attendance_analytics IS 'Professor attendance analytics and reports';
