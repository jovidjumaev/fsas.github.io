-- =====================================================
-- MIGRATION: Current Schema → Optimized Design
-- =====================================================
-- This script migrates from the current simplified schema
-- to the optimized role-based design
-- =====================================================

-- =====================================================
-- STEP 1: CREATE NEW TABLES
-- =====================================================

-- Create departments table
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create academic periods table
CREATE TABLE IF NOT EXISTS academic_periods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  year INTEGER NOT NULL,
  semester VARCHAR(20) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  is_current BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create students table
CREATE TABLE IF NOT EXISTS students (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  enrollment_year INTEGER NOT NULL,
  major VARCHAR(100),
  gpa DECIMAL(3,2),
  graduation_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create professors table
CREATE TABLE IF NOT EXISTS professors (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(100),
  office_location VARCHAR(100),
  phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(user_id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  academic_period_id UUID NOT NULL REFERENCES academic_periods(id),
  enrolled_by UUID NOT NULL REFERENCES professors(user_id),
  enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'active',
  final_grade VARCHAR(2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(student_id, class_id, academic_period_id)
);

-- =====================================================
-- STEP 2: ADD NEW COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add department and academic period references to classes
ALTER TABLE classes ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS academic_period_id UUID REFERENCES academic_periods(id);
ALTER TABLE classes ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 3;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS description TEXT;

-- =====================================================
-- STEP 3: INSERT SAMPLE DATA
-- =====================================================

-- Insert sample departments
INSERT INTO departments (name, code, description) VALUES
  ('Computer Science', 'CS', 'Computer Science Department'),
  ('Mathematics', 'MATH', 'Mathematics Department'),
  ('Physics', 'PHYS', 'Physics Department');

-- Insert sample academic periods
INSERT INTO academic_periods (name, year, semester, start_date, end_date, is_current) VALUES
  ('Fall 2024', 2024, 'fall', '2024-08-15', '2024-12-15', true),
  ('Spring 2025', 2025, 'spring', '2025-01-15', '2025-05-15', false);

-- =====================================================
-- STEP 4: MIGRATE EXISTING DATA
-- =====================================================

-- Migrate users to students (for users with role = 'student')
INSERT INTO students (user_id, student_id, enrollment_year, major, created_at)
SELECT 
  id as user_id,
  student_id,
  EXTRACT(YEAR FROM created_at) as enrollment_year,
  'Computer Science' as major, -- Default major
  created_at
FROM users 
WHERE role = 'student'
ON CONFLICT (user_id) DO NOTHING;

-- Migrate users to professors (for users with role = 'professor')
INSERT INTO professors (user_id, employee_id, title, created_at)
SELECT 
  id as user_id,
  'EMP-' || SUBSTRING(id::text, 1, 8) as employee_id, -- Generate employee ID
  'Professor' as title, -- Default title
  created_at
FROM users 
WHERE role = 'professor'
ON CONFLICT (user_id) DO NOTHING;

-- Update classes with academic period and department
UPDATE classes 
SET 
  academic_period_id = (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
  department_id = (SELECT id FROM departments WHERE code = 'CS' LIMIT 1)
WHERE academic_period_id IS NULL;

-- =====================================================
-- STEP 5: CREATE INDEXES
-- =====================================================

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

-- Class indexes
CREATE INDEX IF NOT EXISTS idx_classes_department_id ON classes(department_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_period_id ON classes(academic_period_id);

-- Enrollment indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_academic_period_id ON enrollments(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_status ON enrollments(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_enrolled_by ON enrollments(enrolled_by);

-- =====================================================
-- STEP 6: ENABLE ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on new tables
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Create public read policies for development
CREATE POLICY "Allow public read access to departments" ON departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to academic_periods" ON academic_periods FOR SELECT USING (true);
CREATE POLICY "Allow public read access to students" ON students FOR SELECT USING (true);
CREATE POLICY "Allow public read access to professors" ON professors FOR SELECT USING (true);
CREATE POLICY "Allow public read access to enrollments" ON enrollments FOR SELECT USING (true);

-- =====================================================
-- STEP 7: CREATE USEFUL VIEWS
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
-- MIGRATION COMPLETE!
-- =====================================================
-- Your database now has:
-- 1. ✅ Role-based user tables (users, students, professors)
-- 2. ✅ Department/organization structure
-- 3. ✅ Academic periods (semesters/years)
-- 4. ✅ Enrollment system (professors add students)
-- 5. ✅ Grade tracking capability
-- 6. ✅ All existing data preserved
-- =====================================================
