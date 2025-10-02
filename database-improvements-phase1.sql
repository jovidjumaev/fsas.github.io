-- =====================================================
-- DATABASE IMPROVEMENTS - PHASE 1
-- =====================================================
-- This script adds RLS policies, performance indexes, and data validation constraints
-- Run this in Supabase Dashboard SQL Editor

-- =====================================================
-- 1. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE professors ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;

-- Users table policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can view their own data') THEN
    CREATE POLICY "Users can view their own data" ON users
      FOR SELECT USING (auth.uid() = id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'users' AND policyname = 'Users can update their own data') THEN
    CREATE POLICY "Users can update their own data" ON users
      FOR UPDATE USING (auth.uid() = id);
  END IF;
END $$;

-- Students table policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Students can view their own data') THEN
    CREATE POLICY "Students can view their own data" ON students
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'students' AND policyname = 'Students can update their own data') THEN
    CREATE POLICY "Students can update their own data" ON students
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Professors table policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professors' AND policyname = 'Professors can view their own data') THEN
    CREATE POLICY "Professors can view their own data" ON professors
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'professors' AND policyname = 'Professors can update their own data') THEN
    CREATE POLICY "Professors can update their own data" ON professors
      FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- Departments table policies (public read, admin write)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Anyone can view departments') THEN
    CREATE POLICY "Anyone can view departments" ON departments
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'departments' AND policyname = 'Only admins can modify departments') THEN
    CREATE POLICY "Only admins can modify departments" ON departments
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Academic periods table policies (public read, admin write)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'academic_periods' AND policyname = 'Anyone can view academic periods') THEN
    CREATE POLICY "Anyone can view academic periods" ON academic_periods
      FOR SELECT USING (true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'academic_periods' AND policyname = 'Only admins can modify academic periods') THEN
    CREATE POLICY "Only admins can modify academic periods" ON academic_periods
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Classes table policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Anyone can view active classes') THEN
    CREATE POLICY "Anyone can view active classes" ON classes
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'classes' AND policyname = 'Professors can manage their own classes') THEN
    CREATE POLICY "Professors can manage their own classes" ON classes
      FOR ALL USING (
        professor_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Sessions table policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Anyone can view active sessions') THEN
    CREATE POLICY "Anyone can view active sessions" ON sessions
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'sessions' AND policyname = 'Professors can manage sessions for their classes') THEN
    CREATE POLICY "Professors can manage sessions for their classes" ON sessions
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM classes 
          WHERE classes.id = sessions.class_id 
          AND classes.professor_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- Attendance table policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance' AND policyname = 'Students can view their own attendance') THEN
    CREATE POLICY "Students can view their own attendance" ON attendance
      FOR SELECT USING (
        student_id = auth.uid() OR
        EXISTS (
          SELECT 1 FROM sessions s
          JOIN classes c ON s.class_id = c.id
          WHERE s.id = attendance.session_id
          AND c.professor_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance' AND policyname = 'Students can create their own attendance') THEN
    CREATE POLICY "Students can create their own attendance" ON attendance
      FOR INSERT WITH CHECK (student_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'attendance' AND policyname = 'Professors can manage attendance for their classes') THEN
    CREATE POLICY "Professors can manage attendance for their classes" ON attendance
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM sessions s
          JOIN classes c ON s.class_id = c.id
          WHERE s.id = attendance.session_id
          AND c.professor_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- QR usage table policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qr_usage' AND policyname = 'Users can view their own QR usage') THEN
    CREATE POLICY "Users can view their own QR usage" ON qr_usage
      FOR SELECT USING (used_by = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'qr_usage' AND policyname = 'System can create QR usage records') THEN
    CREATE POLICY "System can create QR usage records" ON qr_usage
      FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Enrollments table policies
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Students can view their own enrollments') THEN
    CREATE POLICY "Students can view their own enrollments" ON enrollments
      FOR SELECT USING (student_id = auth.uid());
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Professors can view enrollments for their classes') THEN
    CREATE POLICY "Professors can view enrollments for their classes" ON enrollments
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM classes 
          WHERE classes.id = enrollments.class_id 
          AND classes.professor_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'enrollments' AND policyname = 'Professors can manage enrollments for their classes') THEN
    CREATE POLICY "Professors can manage enrollments for their classes" ON enrollments
      FOR ALL USING (
        EXISTS (
          SELECT 1 FROM classes 
          WHERE classes.id = enrollments.class_id 
          AND classes.professor_id = auth.uid()
        ) OR
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- =====================================================
-- 2. PERFORMANCE INDEXES
-- =====================================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Students table indexes
CREATE INDEX IF NOT EXISTS idx_students_user_id ON students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_student_id ON students(student_id);
CREATE INDEX IF NOT EXISTS idx_students_created_at ON students(created_at);

-- Professors table indexes
CREATE INDEX IF NOT EXISTS idx_professors_user_id ON professors(user_id);
CREATE INDEX IF NOT EXISTS idx_professors_employee_id ON professors(employee_id);
CREATE INDEX IF NOT EXISTS idx_professors_department_id ON professors(department_id);

-- Classes table indexes
CREATE INDEX IF NOT EXISTS idx_classes_professor_id ON classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_classes_department_id ON classes(department_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_period_id ON classes(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_is_active ON classes(is_active);
CREATE INDEX IF NOT EXISTS idx_classes_created_at ON classes(created_at);

-- Sessions table indexes
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_class_date ON sessions(class_id, date);
CREATE INDEX IF NOT EXISTS idx_sessions_is_active ON sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- Attendance table indexes
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_session ON attendance(student_id, session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);
CREATE INDEX IF NOT EXISTS idx_attendance_created_at ON attendance(created_at);
CREATE INDEX IF NOT EXISTS idx_attendance_scanned_at ON attendance(scanned_at);

-- QR usage table indexes
CREATE INDEX IF NOT EXISTS idx_qr_usage_session_id ON qr_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_usage_used_by ON qr_usage(used_by);
CREATE INDEX IF NOT EXISTS idx_qr_usage_used_at ON qr_usage(used_at);
CREATE INDEX IF NOT EXISTS idx_qr_usage_session_used_by ON qr_usage(session_id, used_by);

-- Enrollments table indexes
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_academic_period_id ON enrollments(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_class ON enrollments(student_id, class_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_created_at ON enrollments(created_at);

-- =====================================================
-- 3. DATA VALIDATION CONSTRAINTS
-- =====================================================

-- Users table constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_email_format') THEN
    ALTER TABLE users ADD CONSTRAINT check_email_format 
      CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_role_values') THEN
    ALTER TABLE users ADD CONSTRAINT check_role_values 
      CHECK (role IN ('student', 'professor', 'admin'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_first_name_not_empty') THEN
    ALTER TABLE users ADD CONSTRAINT check_first_name_not_empty 
      CHECK (LENGTH(TRIM(first_name)) > 0);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_last_name_not_empty') THEN
    ALTER TABLE users ADD CONSTRAINT check_last_name_not_empty 
      CHECK (LENGTH(TRIM(last_name)) > 0);
  END IF;
END $$;

-- Students table constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_student_id_format') THEN
    ALTER TABLE students ADD CONSTRAINT check_student_id_format 
      CHECK (student_id ~* '^[A-Za-z0-9]{6,20}$');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_enrollment_year') THEN
    ALTER TABLE students ADD CONSTRAINT check_enrollment_year 
      CHECK (enrollment_year >= 2020 AND enrollment_year <= 2030);
  END IF;
END $$;

-- Professors table constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_employee_id_format') THEN
    ALTER TABLE professors ADD CONSTRAINT check_employee_id_format 
      CHECK (employee_id ~* '^[A-Za-z0-9-]{3,20}$');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_title_values') THEN
    ALTER TABLE professors ADD CONSTRAINT check_title_values 
      CHECK (title IN ('Professor', 'Associate Professor', 'Assistant Professor', 'Lecturer', 'Instructor'));
  END IF;
END $$;

-- Classes table constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_code_format') THEN
    ALTER TABLE classes ADD CONSTRAINT check_code_format 
      CHECK (code ~* '^[A-Z]{3,4}-[0-9]{3}$');
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_credits_positive') THEN
    ALTER TABLE classes ADD CONSTRAINT check_credits_positive 
      CHECK (credits > 0 AND credits <= 6);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_max_students_positive') THEN
    ALTER TABLE classes ADD CONSTRAINT check_max_students_positive 
      CHECK (max_students > 0 AND max_students <= 500);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_name_not_empty') THEN
    ALTER TABLE classes ADD CONSTRAINT check_name_not_empty 
      CHECK (LENGTH(TRIM(name)) > 0);
  END IF;
END $$;

-- Sessions table constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_session_times') THEN
    ALTER TABLE sessions ADD CONSTRAINT check_session_times 
      CHECK (start_time < end_time);
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_session_duration') THEN
    ALTER TABLE sessions ADD CONSTRAINT check_session_duration 
      CHECK (EXTRACT(EPOCH FROM (end_time - start_time)) BETWEEN 1800 AND 14400); -- 30 min to 4 hours
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_session_date_not_future') THEN
    ALTER TABLE sessions ADD CONSTRAINT check_session_date_not_future 
      CHECK (date <= CURRENT_DATE + INTERVAL '1 year');
  END IF;
END $$;

-- Attendance table constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_status_values') THEN
    ALTER TABLE attendance ADD CONSTRAINT check_status_values 
      CHECK (status IN ('present', 'absent', 'late'));
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_scanned_at_not_future') THEN
    ALTER TABLE attendance ADD CONSTRAINT check_scanned_at_not_future 
      CHECK (scanned_at IS NULL OR scanned_at <= NOW());
  END IF;
END $$;

-- QR usage table constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_used_at_not_future') THEN
    ALTER TABLE qr_usage ADD CONSTRAINT check_used_at_not_future 
      CHECK (used_at <= NOW());
  END IF;
END $$;

-- Enrollments table constraints
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_enrollment_date_not_future') THEN
    ALTER TABLE enrollments ADD CONSTRAINT check_enrollment_date_not_future 
      CHECK (enrollment_date <= CURRENT_DATE);
  END IF;
END $$;

-- =====================================================
-- 4. ADDITIONAL UTILITY FUNCTIONS
-- =====================================================

-- Function to validate student enrollment
CREATE OR REPLACE FUNCTION validate_student_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if student is enrolled in the class
  IF NOT EXISTS (
    SELECT 1 FROM enrollments e
    JOIN sessions s ON s.class_id = e.class_id
    WHERE e.student_id = NEW.student_id 
    AND s.id = NEW.session_id
  ) THEN
    RAISE EXCEPTION 'Student not enrolled in this class';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate attendance enrollment (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'validate_attendance_enrollment'
  ) THEN
    CREATE TRIGGER validate_attendance_enrollment
      BEFORE INSERT ON attendance
      FOR EACH ROW EXECUTE FUNCTION validate_student_enrollment();
  END IF;
END $$;

-- Function to update attendance analytics
CREATE OR REPLACE FUNCTION update_attendance_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- This function can be used to update analytics when attendance changes
  -- For now, just return the new record
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. VERIFICATION QUERIES
-- =====================================================

-- Check RLS is enabled
SELECT 'RLS Status Check:' as info;
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true
ORDER BY tablename;

-- Check indexes were created
SELECT 'Indexes Created:' as info;
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;

-- Check constraints were added
SELECT 'Constraints Added:' as info;
SELECT conname, contype 
FROM pg_constraint 
WHERE conrelid IN (
  SELECT oid FROM pg_class 
  WHERE relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
  AND relkind = 'r'
)
AND conname LIKE 'check_%'
ORDER BY conname;

-- Final status
SELECT 'Database improvements Phase 1 completed successfully!' as status;
