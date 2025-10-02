-- =====================================================
-- SAFE DATABASE FIXES (Error-Proof Version)
-- =====================================================
-- This version handles potential errors gracefully

-- 1. Fix schema inconsistencies
-- Remove student_id from users table if it exists
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'users' AND column_name = 'student_id') THEN
    ALTER TABLE users DROP COLUMN student_id;
    RAISE NOTICE 'Removed student_id column from users table';
  END IF;
END $$;

-- Add student_id to students table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'students' AND column_name = 'student_id') THEN
    ALTER TABLE students ADD COLUMN student_id VARCHAR(20) UNIQUE;
    RAISE NOTICE 'Added student_id column to students table';
  END IF;
END $$;

-- 2. Add essential indexes (only if they don't exist)
DO $$ 
BEGIN
  -- Classes indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_professor_id') THEN
    CREATE INDEX idx_classes_professor_id ON classes(professor_id);
    RAISE NOTICE 'Created idx_classes_professor_id';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_department_id') THEN
    CREATE INDEX idx_classes_department_id ON classes(department_id);
    RAISE NOTICE 'Created idx_classes_department_id';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_classes_academic_period_id') THEN
    CREATE INDEX idx_classes_academic_period_id ON classes(academic_period_id);
    RAISE NOTICE 'Created idx_classes_academic_period_id';
  END IF;
  
  -- Enrollments indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_enrollments_student_id') THEN
    CREATE INDEX idx_enrollments_student_id ON enrollments(student_id);
    RAISE NOTICE 'Created idx_enrollments_student_id';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_enrollments_class_id') THEN
    CREATE INDEX idx_enrollments_class_id ON enrollments(class_id);
    RAISE NOTICE 'Created idx_enrollments_class_id';
  END IF;
  
  -- Attendance indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_student_id') THEN
    CREATE INDEX idx_attendance_student_id ON attendance(student_id);
    RAISE NOTICE 'Created idx_attendance_student_id';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_attendance_session_id') THEN
    CREATE INDEX idx_attendance_session_id ON attendance(session_id);
    RAISE NOTICE 'Created idx_attendance_session_id';
  END IF;
  
  -- Sessions indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_sessions_class_id') THEN
    CREATE INDEX idx_sessions_class_id ON sessions(class_id);
    RAISE NOTICE 'Created idx_sessions_class_id';
  END IF;
  
  -- QR usage indexes
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_qr_usage_session_id') THEN
    CREATE INDEX idx_qr_usage_session_id ON qr_usage(session_id);
    RAISE NOTICE 'Created idx_qr_usage_session_id';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_qr_usage_used_by') THEN
    CREATE INDEX idx_qr_usage_used_by ON qr_usage(used_by);
    RAISE NOTICE 'Created idx_qr_usage_used_by';
  END IF;
END $$;

-- 3. Add missing essential fields (only if they don't exist)
DO $$ 
BEGIN
  -- Users table fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'phone') THEN
    ALTER TABLE users ADD COLUMN phone VARCHAR(20);
    RAISE NOTICE 'Added phone column to users table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'profile_image_url') THEN
    ALTER TABLE users ADD COLUMN profile_image_url TEXT;
    RAISE NOTICE 'Added profile_image_url column to users table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'last_login') THEN
    ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added last_login column to users table';
  END IF;
  
  -- Classes table fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'max_students') THEN
    ALTER TABLE classes ADD COLUMN max_students INTEGER DEFAULT 30;
    RAISE NOTICE 'Added max_students column to classes table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'room_location') THEN
    ALTER TABLE classes ADD COLUMN room_location VARCHAR(100);
    RAISE NOTICE 'Added room_location column to classes table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'schedule_info') THEN
    ALTER TABLE classes ADD COLUMN schedule_info TEXT;
    RAISE NOTICE 'Added schedule_info column to classes table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'is_active') THEN
    ALTER TABLE classes ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column to classes table';
  END IF;
  
  -- Sessions table fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'room_location') THEN
    ALTER TABLE sessions ADD COLUMN room_location VARCHAR(100);
    RAISE NOTICE 'Added room_location column to sessions table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'notes') THEN
    ALTER TABLE sessions ADD COLUMN notes TEXT;
    RAISE NOTICE 'Added notes column to sessions table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'is_active') THEN
    ALTER TABLE sessions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column to sessions table';
  END IF;
  
  -- Students table fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'enrollment_date') THEN
    ALTER TABLE students ADD COLUMN enrollment_date DATE DEFAULT CURRENT_DATE;
    RAISE NOTICE 'Added enrollment_date column to students table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'is_active') THEN
    ALTER TABLE students ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    RAISE NOTICE 'Added is_active column to students table';
  END IF;
  
  -- Soft delete fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'deleted_at') THEN
    ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added deleted_at column to users table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'classes' AND column_name = 'deleted_at') THEN
    ALTER TABLE classes ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added deleted_at column to classes table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'deleted_at') THEN
    ALTER TABLE sessions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added deleted_at column to sessions table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'deleted_at') THEN
    ALTER TABLE enrollments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added deleted_at column to enrollments table';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'students' AND column_name = 'deleted_at') THEN
    ALTER TABLE students ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
    RAISE NOTICE 'Added deleted_at column to students table';
  END IF;
END $$;

-- 4. Update existing data with default values
UPDATE classes SET 
  max_students = COALESCE(max_students, 30),
  is_active = COALESCE(is_active, TRUE)
WHERE max_students IS NULL OR is_active IS NULL;

UPDATE sessions SET 
  is_active = COALESCE(is_active, TRUE)
WHERE is_active IS NULL;

UPDATE students SET 
  enrollment_date = COALESCE(enrollment_date, CURRENT_DATE),
  is_active = COALESCE(is_active, TRUE)
WHERE enrollment_date IS NULL OR is_active IS NULL;

-- 5. Create useful views (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'active_classes') THEN
    CREATE VIEW active_classes AS
    SELECT c.id, c.code, c.name, c.professor_id, c.semester, c.year, c.created_at, c.updated_at,
           c.department_id, c.academic_period_id, c.credits, c.description, c.max_students, 
           c.room_location, c.schedule_info, c.is_active, c.deleted_at,
           d.name as department_name, d.code as department_code,
           ap.name as period_name, ap.year as period_year, ap.semester as period_semester,
           p.employee_id, p.title as professor_title,
           u.first_name, u.last_name, u.email as professor_email
    FROM classes c
    LEFT JOIN departments d ON c.department_id = d.id
    LEFT JOIN academic_periods ap ON c.academic_period_id = ap.id
    LEFT JOIN professors p ON c.professor_id = p.user_id
    LEFT JOIN users u ON p.user_id = u.id
    WHERE c.deleted_at IS NULL AND c.is_active = TRUE;
    RAISE NOTICE 'Created active_classes view';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.views WHERE table_name = 'student_enrollments') THEN
    CREATE VIEW student_enrollments AS
    SELECT e.*, s.student_id, s.major, s.gpa,
           u.first_name, u.last_name, u.email,
           c.code as class_code, c.name as class_name,
           d.name as department_name
    FROM enrollments e
    LEFT JOIN students s ON e.student_id = s.user_id
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN classes c ON e.class_id = c.id
    LEFT JOIN departments d ON c.department_id = d.id
    WHERE e.deleted_at IS NULL;
    RAISE NOTICE 'Created student_enrollments view';
  END IF;
END $$;

-- 6. Add helpful comments
COMMENT ON TABLE users IS 'Core user accounts for all system users';
COMMENT ON TABLE students IS 'Student-specific information and academic records';
COMMENT ON TABLE professors IS 'Professor-specific information and employment details';
COMMENT ON TABLE classes IS 'Course classes with department and period assignments';
COMMENT ON TABLE sessions IS 'Individual class sessions for attendance tracking';
COMMENT ON TABLE attendance IS 'Student attendance records for each session';
COMMENT ON TABLE enrollments IS 'Student enrollments in classes with grade tracking';
COMMENT ON TABLE departments IS 'Academic departments and organizational units';
COMMENT ON TABLE academic_periods IS 'Academic terms and semesters';
COMMENT ON TABLE qr_usage IS 'QR code usage tracking for attendance';

-- 7. Final status message
SELECT 'Database fixes applied successfully!' as status,
       'Schema inconsistencies fixed' as fixes_1,
       'Essential indexes created' as fixes_2,
       'Missing fields added' as fixes_3,
       'Default values updated' as fixes_4,
       'Useful views created' as fixes_5;
