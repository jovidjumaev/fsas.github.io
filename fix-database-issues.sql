-- =====================================================
-- IMMEDIATE DATABASE FIXES
-- =====================================================
-- Phase 1: Fix schema inconsistencies and add essential features

-- 1. Fix schema inconsistencies
-- Remove student_id from users table (it belongs in students table)
ALTER TABLE users DROP COLUMN IF EXISTS student_id;

-- Add student_id to students table if not exists
ALTER TABLE students ADD COLUMN IF NOT EXISTS student_id VARCHAR(20) UNIQUE;

-- 2. Add essential indexes for performance
CREATE INDEX IF NOT EXISTS idx_classes_professor_id ON classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_classes_department_id ON classes(department_id);
CREATE INDEX IF NOT EXISTS idx_classes_academic_period_id ON classes(academic_period_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_class_id ON enrollments(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_session_id ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_sessions_class_id ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_qr_usage_session_id ON qr_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_usage_used_by ON qr_usage(used_by);

-- 3. Add data validation constraints
-- Email validation (drop first if exists, then add)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_email_format') THEN
    ALTER TABLE users DROP CONSTRAINT check_email_format;
  END IF;
END $$;
ALTER TABLE users ADD CONSTRAINT check_email_format 
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- GPA validation
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_gpa_range') THEN
    ALTER TABLE students DROP CONSTRAINT check_gpa_range;
  END IF;
END $$;
ALTER TABLE students ADD CONSTRAINT check_gpa_range 
  CHECK (gpa IS NULL OR (gpa >= 0.0 AND gpa <= 4.0));

-- Grade validation
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'check_grade_format') THEN
    ALTER TABLE enrollments DROP CONSTRAINT check_grade_format;
  END IF;
END $$;
ALTER TABLE enrollments ADD CONSTRAINT check_grade_format 
  CHECK (final_grade IS NULL OR final_grade ~ '^[A-F][+-]?$|^PASS$|^FAIL$|^WITHDRAW$');

-- 4. Add missing essential fields
-- Add to users table
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
ALTER TABLE users ADD COLUMN profile_image_url TEXT;
ALTER TABLE users ADD COLUMN last_login TIMESTAMP WITH TIME ZONE;

-- Add to classes table
ALTER TABLE classes ADD COLUMN max_students INTEGER DEFAULT 30;
ALTER TABLE classes ADD COLUMN room_location VARCHAR(100);
ALTER TABLE classes ADD COLUMN schedule_info TEXT; -- e.g., "MWF 10:00-10:50"
ALTER TABLE classes ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Add to sessions table
ALTER TABLE sessions ADD COLUMN room_location VARCHAR(100);
ALTER TABLE sessions ADD COLUMN notes TEXT;
ALTER TABLE sessions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Add to students table
ALTER TABLE students ADD COLUMN enrollment_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE students ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- 5. Add soft delete support
ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE classes ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE sessions ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE enrollments ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE students ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE;

-- 6. Create audit log table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  old_values JSONB,
  new_values JSONB,
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- 7. Add notification system
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'attendance', 'grade', 'enrollment', 'system'
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX idx_notifications_type ON notifications(type);

-- 8. Add analytics table
CREATE TABLE attendance_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  total_students INTEGER NOT NULL,
  present_count INTEGER NOT NULL,
  absent_count INTEGER NOT NULL,
  late_count INTEGER NOT NULL,
  attendance_rate DECIMAL(5,2) NOT NULL,
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_attendance_analytics_class_id ON attendance_analytics(class_id);
CREATE INDEX idx_attendance_analytics_calculated_at ON attendance_analytics(calculated_at);

-- 9. Update existing data with new fields
-- Update classes with default values
UPDATE classes SET 
  max_students = 30,
  is_active = TRUE
WHERE max_students IS NULL OR is_active IS NULL;

-- Update sessions with default values
UPDATE sessions SET 
  is_active = TRUE
WHERE is_active IS NULL;

-- Update students with default values
UPDATE students SET 
  enrollment_date = CURRENT_DATE,
  is_active = TRUE
WHERE enrollment_date IS NULL OR is_active IS NULL;

-- 10. Create useful views
CREATE OR REPLACE VIEW active_classes AS
SELECT c.*, d.name as department_name, d.code as department_code,
       ap.name as period_name, ap.year, ap.semester,
       p.employee_id, p.title as professor_title,
       u.first_name, u.last_name, u.email as professor_email
FROM classes c
LEFT JOIN departments d ON c.department_id = d.id
LEFT JOIN academic_periods ap ON c.academic_period_id = ap.id
LEFT JOIN professors p ON c.professor_id = p.user_id
LEFT JOIN users u ON p.user_id = u.id
WHERE c.deleted_at IS NULL AND c.is_active = TRUE;

CREATE OR REPLACE VIEW student_enrollments AS
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

-- 11. Add helpful functions
CREATE OR REPLACE FUNCTION get_class_attendance_stats(class_uuid UUID)
RETURNS TABLE (
  total_sessions INTEGER,
  total_students INTEGER,
  avg_attendance_rate DECIMAL(5,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT s.id)::INTEGER as total_sessions,
    COUNT(DISTINCT e.student_id)::INTEGER as total_students,
    ROUND(
      AVG(
        CASE 
          WHEN COUNT(a.id) > 0 THEN 
            (COUNT(CASE WHEN a.status = 'present' THEN 1 END)::DECIMAL / COUNT(a.id)) * 100
          ELSE 0 
        END
      ), 2
    ) as avg_attendance_rate
  FROM classes c
  LEFT JOIN sessions s ON c.id = s.class_id AND s.deleted_at IS NULL
  LEFT JOIN enrollments e ON c.id = e.class_id AND e.deleted_at IS NULL
  LEFT JOIN attendance a ON s.id = a.session_id
  WHERE c.id = class_uuid AND c.deleted_at IS NULL
  GROUP BY c.id;
END;
$$ LANGUAGE plpgsql;

-- 12. Add triggers for audit logging
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, user_id)
    VALUES (TG_TABLE_NAME, OLD.id, TG_OP, row_to_json(OLD), OLD.id);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(OLD), row_to_json(NEW), NEW.id);
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO audit_logs (table_name, record_id, action, new_values, user_id)
    VALUES (TG_TABLE_NAME, NEW.id, TG_OP, row_to_json(NEW), NEW.id);
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for main tables
CREATE TRIGGER audit_users_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_classes_trigger
  AFTER INSERT OR UPDATE OR DELETE ON classes
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_enrollments_trigger
  AFTER INSERT OR UPDATE OR DELETE ON enrollments
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- 13. Add comments for documentation
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
COMMENT ON TABLE audit_logs IS 'Audit trail for all data changes';
COMMENT ON TABLE notifications IS 'User notification system';
COMMENT ON TABLE attendance_analytics IS 'Pre-calculated attendance statistics';

-- 14. Grant necessary permissions
-- (These would be set up based on your RLS policies)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
-- GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
