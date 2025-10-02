-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'professor', 'admin');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent');

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Courses table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_code VARCHAR(20) NOT NULL,
  course_name VARCHAR(200) NOT NULL,
  professor_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  semester VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique course per professor per semester
  UNIQUE(professor_id, course_code, semester, year)
);

-- Class sessions table
CREATE TABLE class_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  qr_code_secret VARCHAR(255) NOT NULL,
  qr_code_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  
  -- Ensure only one active session per course at a time
  -- Note: This constraint will be enforced via application logic
  -- EXCLUDE USING gist (course_id WITH =) WHERE (is_active = true)
);

-- Attendance records table
CREATE TABLE attendance_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status attendance_status NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one attendance record per student per session
  UNIQUE(session_id, student_id)
);

-- QR code usage tracking table
CREATE TABLE qr_code_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES class_sessions(id) ON DELETE CASCADE,
  qr_code_secret VARCHAR(255) NOT NULL,
  used_by UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  
  -- Ensure QR code can only be used once per student
  UNIQUE(session_id, qr_code_secret, used_by)
);

-- Add constraint to ensure only one active session per course
-- This replaces the problematic EXCLUDE constraint
CREATE UNIQUE INDEX idx_class_sessions_one_active_per_course 
ON class_sessions (course_id) 
WHERE is_active = true;

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_student_id ON user_profiles(student_id);
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_role ON user_profiles(role);

CREATE INDEX idx_courses_professor_id ON courses(professor_id);
CREATE INDEX idx_courses_semester_year ON courses(semester, year);

CREATE INDEX idx_class_sessions_course_id ON class_sessions(course_id);
CREATE INDEX idx_class_sessions_date ON class_sessions(session_date);
CREATE INDEX idx_class_sessions_active ON class_sessions(is_active);
CREATE INDEX idx_class_sessions_expires ON class_sessions(qr_code_expires_at);

CREATE INDEX idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX idx_attendance_records_scanned_at ON attendance_records(scanned_at);
CREATE INDEX idx_attendance_records_status ON attendance_records(status);

CREATE INDEX idx_qr_usage_session_id ON qr_code_usage(session_id);
CREATE INDEX idx_qr_usage_used_by ON qr_code_usage(used_by);
CREATE INDEX idx_qr_usage_used_at ON qr_code_usage(used_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_class_sessions_updated_at
  BEFORE UPDATE ON class_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_usage ENABLE ROW LEVEL SECURITY;

-- User profiles policies
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Courses policies
CREATE POLICY "Professors can view their own courses" ON courses
  FOR SELECT USING (auth.uid() = professor_id);

CREATE POLICY "Professors can create courses" ON courses
  FOR INSERT WITH CHECK (auth.uid() = professor_id);

CREATE POLICY "Professors can update their own courses" ON courses
  FOR UPDATE USING (auth.uid() = professor_id);

CREATE POLICY "Professors can delete their own courses" ON courses
  FOR DELETE USING (auth.uid() = professor_id);

-- Class sessions policies
CREATE POLICY "Professors can view sessions for their courses" ON class_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = class_sessions.course_id 
      AND courses.professor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can create sessions for their courses" ON class_sessions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = class_sessions.course_id 
      AND courses.professor_id = auth.uid()
    )
  );

CREATE POLICY "Professors can update sessions for their courses" ON class_sessions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM courses 
      WHERE courses.id = class_sessions.course_id 
      AND courses.professor_id = auth.uid()
    )
  );

-- Attendance records policies
CREATE POLICY "Professors can view attendance for their courses" ON attendance_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_sessions cs
      JOIN courses c ON c.id = cs.course_id
      WHERE cs.id = attendance_records.session_id
      AND c.professor_id = auth.uid()
    )
  );

CREATE POLICY "Students can view their own attendance" ON attendance_records
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can create their own attendance records" ON attendance_records
  FOR INSERT WITH CHECK (auth.uid() = student_id);

-- QR code usage policies
CREATE POLICY "Professors can view QR usage for their courses" ON qr_code_usage
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM class_sessions cs
      JOIN courses c ON c.id = cs.course_id
      WHERE cs.id = qr_code_usage.session_id
      AND c.professor_id = auth.uid()
    )
  );

CREATE POLICY "Students can create QR usage records" ON qr_code_usage
  FOR INSERT WITH CHECK (auth.uid() = used_by);

-- Create views for analytics
CREATE VIEW attendance_analytics AS
SELECT 
  c.id as course_id,
  c.course_code,
  c.course_name,
  cs.id as session_id,
  cs.session_date,
  cs.start_time,
  cs.end_time,
  COUNT(ar.id) as total_attendance_records,
  COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
  COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
  ROUND(
    COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::numeric / 
    NULLIF(COUNT(ar.id), 0) * 100, 2
  ) as attendance_rate
FROM courses c
LEFT JOIN class_sessions cs ON c.id = cs.course_id
LEFT JOIN attendance_records ar ON cs.id = ar.session_id
GROUP BY c.id, c.course_code, c.course_name, cs.id, cs.session_date, cs.start_time, cs.end_time;

-- Create function to get student attendance summary
CREATE OR REPLACE FUNCTION get_student_attendance_summary(
  p_student_id UUID,
  p_course_id UUID DEFAULT NULL
)
RETURNS TABLE (
  course_id UUID,
  course_code VARCHAR,
  course_name VARCHAR,
  total_sessions BIGINT,
  present_count BIGINT,
  late_count BIGINT,
  absent_count BIGINT,
  attendance_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as course_id,
    c.course_code,
    c.course_name,
    COUNT(cs.id) as total_sessions,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
    ROUND(
      COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::numeric / 
      NULLIF(COUNT(cs.id), 0) * 100, 2
    ) as attendance_rate
  FROM courses c
  LEFT JOIN class_sessions cs ON c.id = cs.course_id
  LEFT JOIN attendance_records ar ON cs.id = ar.session_id AND ar.student_id = p_student_id
  WHERE (p_course_id IS NULL OR c.id = p_course_id)
  GROUP BY c.id, c.course_code, c.course_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE class_sessions 
  SET is_active = false 
  WHERE qr_code_expires_at < NOW() AND is_active = true;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate attendance report
CREATE OR REPLACE FUNCTION generate_attendance_report(
  p_course_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  student_id UUID,
  student_name VARCHAR,
  student_email VARCHAR,
  total_sessions BIGINT,
  present_count BIGINT,
  late_count BIGINT,
  absent_count BIGINT,
  attendance_rate NUMERIC,
  last_attended TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.id as student_id,
    CONCAT(up.first_name, ' ', up.last_name) as student_name,
    up.email as student_email,
    COUNT(cs.id) as total_sessions,
    COUNT(CASE WHEN ar.status = 'present' THEN 1 END) as present_count,
    COUNT(CASE WHEN ar.status = 'late' THEN 1 END) as late_count,
    COUNT(CASE WHEN ar.status = 'absent' THEN 1 END) as absent_count,
    ROUND(
      COUNT(CASE WHEN ar.status IN ('present', 'late') THEN 1 END)::numeric / 
      NULLIF(COUNT(cs.id), 0) * 100, 2
    ) as attendance_rate,
    MAX(ar.scanned_at) as last_attended
  FROM courses c
  JOIN class_sessions cs ON c.id = cs.course_id
  LEFT JOIN attendance_records ar ON cs.id = ar.session_id
  LEFT JOIN user_profiles up ON ar.student_id = up.id
  WHERE c.id = p_course_id
    AND (p_start_date IS NULL OR cs.session_date >= p_start_date)
    AND (p_end_date IS NULL OR cs.session_date <= p_end_date)
  GROUP BY up.id, up.first_name, up.last_name, up.email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Sample data will be created through the application interface
-- after users are properly authenticated through Supabase Auth
