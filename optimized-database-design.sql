-- =====================================================
-- OPTIMIZED DATABASE DESIGN FOR FSAS
-- =====================================================
-- Based on requirements:
-- 1. Department/organization structure
-- 2. Students can enroll in multiple classes
-- 3. Professors add students to classes (not self-enrollment)
-- 4. Grade tracking
-- 5. No department assignment for professors
-- 6. No complex admin permission levels
-- =====================================================

-- =====================================================
-- STEP 1: CREATE CORE USER TABLES
-- =====================================================

-- Core users table (minimal shared data)
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
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  enrollment_year INTEGER NOT NULL,
  major VARCHAR(100),
  gpa DECIMAL(3,2),
  graduation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Professor-specific data (simplified - no department assignment)
CREATE TABLE IF NOT EXISTS professors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(100), -- Professor, Associate Professor, etc.
  office_location VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- STEP 2: CREATE ORGANIZATIONAL STRUCTURE
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
-- STEP 3: CREATE COURSE MANAGEMENT TABLES
-- =====================================================

-- Classes (courses) - updated to reference new structure
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  professor_id UUID NOT NULL REFERENCES professors(user_id) ON DELETE CASCADE,
  department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  credits INTEGER DEFAULT 3,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique course per professor per semester
  UNIQUE(professor_id, code, academic_period_id)
);

-- Add academic period reference to classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_period_id UUID REFERENCES academic_periods(id);

-- =====================================================
-- STEP 4: CREATE ENROLLMENT SYSTEM
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
-- STEP 5: UPDATE EXISTING TABLES
-- =====================================================

-- Update sessions to reference new class structure
-- (sessions table already exists, just need to ensure it works with new structure)

-- Update attendance to reference new student structure
-- (attendance table already exists, just need to ensure it works with new structure)

-- =====================================================
-- STEP 6: CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- User indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

-- Student indexes
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_enrollment_year ON students(enrollment_year);
CREATE INDEX IF NOT EXISTS idx_students_major ON students(major);

-- Professor indexes
CREATE INDEX IF NOT EXISTS idx_professors_employee_id ON professors(employee_id);
CREATE INDEX IF NOT EXISTS idx_professors_title ON professors(title);

-- Department indexes
CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(code);
CREATE INDEX IF NOT EXISTS idx_departments_name ON departments(name);

-- Academic period indexes
CREATE INDEX IF NOT EXISTS idx_academic_periods_year_semester ON academic_periods(year, semester);
CREATE INDEX IF NOT EXISTS idx_academic_periods_current ON academic_periods(is_current);
CREATE INDEX IF NOT EXISTS idx_academic_periods_dates ON academic_periods(start_date, end_date);

-- Class indexes
CREATE INDEX IF NOT EXISTS idx_classes_professor_id ON classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_classes_department_id ON classes(department_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_period_id ON classes(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);

-- Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_academic_period_id ON enrollments(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_by ON enrollments(enrolled_by);

-- =====================================================
-- STEP 7: CREATE ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Public read access for development (can be restricted later)
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public read access to professors" ON professors FOR SELECT USING (true);
CREATE POLICY "Allow public read access to departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to academic_periods" ON academic_periods FOR SELECT USING (true);
CREATE POLICY "Allow public read access to classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to enrollments" ON enrollments FOR SELECT USING (true);

-- =====================================================
-- STEP 8: CREATE USEFUL VIEWS
-- =====================================================

-- View for student enrollments with class details
CREATE OR REPLACE VIEW student_enrollments AS
SELECT 
  e.id as enrollment_id,
  s.student_id,
  u.first_name,
  u.last_name,
  c.code as class_code,
  c.name as class_name,
  p.employee_id as professor_id,
  prof_user.first_name as professor_first_name,
  prof_user.last_name as professor_last_name,
  ap.name as academic_period,
  e.enrollment_date,
  e.status,
  e.final_grade,
  e.created_at
FROM enrollments e
JOIN students s ON e.student_id = s.user_id
JOIN users u ON s.user_id = u.id
JOIN classes c ON e.class_id = c.id
JOIN professors p ON c.professor_id = p.user_id
JOIN users prof_user ON p.user_id = prof_user.id
JOIN academic_periods ap ON e.academic_period_id = ap.id;

-- View for professor's classes with enrollment counts
CREATE OR REPLACE VIEW professor_classes AS
SELECT 
  c.id as class_id,
  c.code as class_code,
  c.name as class_name,
  p.employee_id as professor_id,
  u.first_name as professor_first_name,
  u.last_name as professor_last_name,
  d.name as department_name,
  ap.name as academic_period,
  COUNT(e.id) as enrollment_count,
  COUNT(CASE WHEN e.status = 'active' THEN 1 END) as active_enrollments,
  c.created_at
FROM classes c
JOIN professors p ON c.professor_id = p.user_id
JOIN users u ON p.user_id = u.id
LEFT JOIN departments d ON c.department_id = d.id
JOIN academic_periods ap ON c.academic_period_id = ap.id
LEFT JOIN enrollments e ON c.id = e.class_id
GROUP BY c.id, c.code, c.name, p.employee_id, u.first_name, u.last_name, d.name, ap.name, c.created_at;

-- =====================================================
-- STEP 9: SAMPLE DATA FOR TESTING
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
-- DESIGN COMPLETE!
-- =====================================================
-- This design provides:
-- 1. ✅ Department/organization structure
-- 2. ✅ Students can enroll in multiple classes
-- 3. ✅ Professors add students to classes (enrolled_by field)
-- 4. ✅ Grade tracking (final_grade field)
-- 5. ✅ No department assignment for professors (optional)
-- 6. ✅ Simple admin system (just role-based)
-- =====================================================
