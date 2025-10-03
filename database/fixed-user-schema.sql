-- =====================================================
-- FIXED USER AUTHENTICATION SCHEMA FOR FSAS
-- =====================================================
-- This schema fixes the authentication issues by creating
-- the proper tables that match the auth context expectations

-- =====================================================
-- STEP 1: CREATE USER ROLE ENUM
-- =====================================================

-- Create user role enum
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('student', 'professor', 'admin');
    END IF;
END $$;

-- =====================================================
-- STEP 2: CREATE CORE USER TABLES
-- =====================================================

-- Core users table (matches auth context expectations)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL UNIQUE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Student-specific data
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE NOT NULL,
    enrollment_year INTEGER NOT NULL,
    major VARCHAR(100),
    gpa DECIMAL(3,2),
    graduation_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professor-specific data
CREATE TABLE IF NOT EXISTS professors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(100), -- Professor, Associate Professor, etc.
    office_location VARCHAR(100),
    phone VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 3: CREATE ORGANIZATIONAL STRUCTURE
-- =====================================================

-- Departments (for organizational structure)
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Academic periods (semesters/years)
CREATE TABLE IF NOT EXISTS academic_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL, -- 'Fall 2024', 'Spring 2025'
    year INTEGER NOT NULL,
    semester VARCHAR(20) NOT NULL, -- 'fall', 'spring', 'summer'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_current BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 4: CREATE COURSE MANAGEMENT TABLES
-- =====================================================

-- Classes (courses)
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(20) NOT NULL,
    name VARCHAR(200) NOT NULL,
    professor_id UUID NOT NULL REFERENCES professors(user_id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    academic_period_id UUID REFERENCES academic_periods(id),
    credits INTEGER DEFAULT 3,
    description TEXT,
    room_location VARCHAR(100),
    schedule_info VARCHAR(200),
    max_students INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 5: CREATE ENROLLMENT SYSTEM
-- =====================================================

-- Course enrollments (professors add students to classes)
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    academic_period_id UUID NOT NULL REFERENCES academic_periods(id),
    enrolled_by UUID NOT NULL REFERENCES professors(user_id), -- Who enrolled the student
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'dropped', 'completed'
    final_grade VARCHAR(2), -- 'A', 'B+', 'C', etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one enrollment per student per class per period
    UNIQUE(student_id, class_id, academic_period_id)
);

-- =====================================================
-- STEP 6: CREATE SESSION AND ATTENDANCE TABLES
-- =====================================================

-- Class sessions
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room_location VARCHAR(100),
    notes TEXT,
    qr_secret VARCHAR(255),
    qr_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance records
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'present', -- 'present', 'late', 'absent'
    device_fingerprint VARCHAR(255),
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- QR code usage tracking
CREATE TABLE IF NOT EXISTS qr_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    qr_secret VARCHAR(255) NOT NULL,
    used_by UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    device_fingerprint VARCHAR(255),
    ip_address INET
);

-- =====================================================
-- STEP 7: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Student indexes
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_year ON students(enrollment_year);

-- Professor indexes
CREATE INDEX IF NOT EXISTS idx_professors_user_id ON professors(user_id);
CREATE INDEX IF NOT EXISTS idx_professors_employee_id ON professors(employee_id);

-- Class indexes
CREATE INDEX IF NOT EXISTS idx_classes_professor_id ON classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_classes_department_id ON classes(department_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_period_id ON classes(academic_period_id);

-- Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);

-- Session indexes
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_scanned_at ON attendance(scanned_at);

-- =====================================================
-- STEP 8: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_usage ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 9: CREATE RLS POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Students can view their own student record
CREATE POLICY "Students can view own record" ON students
    FOR SELECT USING (auth.uid() = user_id);

-- Professors can view their own professor record
CREATE POLICY "Professors can view own record" ON professors
    FOR SELECT USING (auth.uid() = user_id);

-- Public read access for departments and academic periods
CREATE POLICY "Public read access to departments" ON departments
    FOR SELECT USING (true);

CREATE POLICY "Public read access to academic periods" ON academic_periods
    FOR SELECT USING (true);

-- Students can view their own enrollments
CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = student_id);

-- Professors can view enrollments for their classes
CREATE POLICY "Professors can view class enrollments" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM classes c 
            WHERE c.id = enrollments.class_id 
            AND c.professor_id = auth.uid()
        )
    );

-- Students can view their own attendance
CREATE POLICY "Students can view own attendance" ON attendance
    FOR SELECT USING (auth.uid() = student_id);

-- Professors can view attendance for their sessions
CREATE POLICY "Professors can view session attendance" ON attendance
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM sessions s 
            JOIN classes c ON s.class_id = c.id 
            WHERE s.id = attendance.session_id 
            AND c.professor_id = auth.uid()
        )
    );

-- =====================================================
-- STEP 10: INSERT SAMPLE DATA
-- =====================================================

-- Insert sample departments
INSERT INTO departments (id, name, code, description) VALUES
    ('dept-001', 'Computer Science', 'CS', 'Computer Science Department'),
    ('dept-002', 'Mathematics', 'MATH', 'Mathematics Department'),
    ('dept-003', 'Physics', 'PHYS', 'Physics Department')
ON CONFLICT (id) DO NOTHING;

-- Insert sample academic periods
INSERT INTO academic_periods (id, name, year, semester, start_date, end_date, is_current) VALUES
    ('period-001', 'Fall 2024', 2024, 'fall', '2024-08-15', '2024-12-15', true),
    ('period-002', 'Spring 2025', 2025, 'spring', '2025-01-15', '2025-05-15', false)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 11: CREATE HELPER FUNCTIONS
-- =====================================================

-- Function to create user profile after auth signup
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert into users table
    INSERT INTO users (id, email, first_name, last_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'role', 'student')::user_role
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create user profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_user_profile();

-- =====================================================
-- SCHEMA COMPLETE!
-- =====================================================
-- This schema provides:
-- 1. ✅ Proper user authentication tables
-- 2. ✅ Role-based access control
-- 3. ✅ Supabase Auth integration
-- 4. ✅ Row Level Security policies
-- 5. ✅ Proper foreign key relationships
-- 6. ✅ Performance indexes
-- =====================================================
