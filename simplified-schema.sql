-- Simplified, Human-Friendly Database Schema
-- Clean, short, easy-to-understand table names

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE user_role AS ENUM ('student', 'professor', 'admin');
CREATE TYPE attendance_status AS ENUM ('present', 'late', 'absent');

-- ==============================================
-- SIMPLIFIED TABLES (Human-Friendly Names)
-- ==============================================

-- Users table (simplified from user_profiles)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Classes table (simplified from courses)
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL,  -- e.g., "CSC-475"
  name VARCHAR(200) NOT NULL, -- e.g., "Data Structures"
  professor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semester VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique class per professor per semester
  UNIQUE(professor_id, code, semester, year)
);

-- Sessions table (simplified from class_sessions)
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  qr_secret VARCHAR(255) NOT NULL,
  qr_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance table (simplified from attendance_records)
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status attendance_status NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one attendance record per student per session
  UNIQUE(session_id, student_id)
);

-- QR Usage table (simplified from qr_code_usage)
CREATE TABLE qr_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  qr_secret VARCHAR(255) NOT NULL,
  used_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  
  -- Ensure QR code can only be used once per student
  UNIQUE(session_id, qr_secret, used_by)
);

-- ==============================================
-- INDEXES FOR PERFORMANCE
-- ==============================================

-- Users indexes
CREATE INDEX idx_users_student_id ON users(student_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);

-- Classes indexes
CREATE INDEX idx_classes_professor ON classes(professor_id);
CREATE INDEX idx_classes_code ON classes(code);
CREATE INDEX idx_classes_semester_year ON classes(semester, year);

-- Sessions indexes
CREATE INDEX idx_sessions_class ON sessions(class_id);
CREATE INDEX idx_sessions_date ON sessions(date);
CREATE INDEX idx_sessions_active ON sessions(is_active);

-- Attendance indexes
CREATE INDEX idx_attendance_session ON attendance(session_id);
CREATE INDEX idx_attendance_student ON attendance(student_id);
CREATE INDEX idx_attendance_date ON attendance(scanned_at);

-- QR Usage indexes
CREATE INDEX idx_qr_usage_session ON qr_usage(session_id);
CREATE INDEX idx_qr_usage_user ON qr_usage(used_by);

-- ==============================================
-- TRIGGERS FOR UPDATED_AT
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_usage ENABLE ROW LEVEL SECURITY;

-- Public read access for development
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public read access to qr_usage" ON qr_usage FOR SELECT USING (true);

-- Insert/Update policies for authenticated users
CREATE POLICY "Allow users to insert their own profile" ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Allow users to update their own profile" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow professors to insert classes" ON classes FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'professor')
);

CREATE POLICY "Allow professors to insert sessions" ON sessions FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'professor')
);

CREATE POLICY "Allow students to insert attendance" ON attendance FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'student')
);

CREATE POLICY "Allow users to insert qr_usage" ON qr_usage FOR INSERT WITH CHECK (auth.uid() = used_by);

-- ==============================================
-- SAMPLE DATA
-- ==============================================

-- Insert sample professor
INSERT INTO users (id, student_id, first_name, last_name, email, role) VALUES
('ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'PROF001', 'Dr. Sarah', 'Johnson', 'sarah.johnson@furman.edu', 'professor');

-- Insert sample classes
INSERT INTO classes (id, code, name, professor_id, semester, year) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'CSC-475', 'Data Structures', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'Fall', 2024),
('550e8400-e29b-41d4-a716-446655440002', 'CSC-301', 'Algorithms', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'Fall', 2024);

-- Insert sample session
INSERT INTO sessions (id, class_id, date, start_time, end_time, qr_secret, qr_expires_at, is_active) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '2024-10-02', '09:00', '10:30', 'sample-qr-secret-123', NOW() + INTERVAL '30 seconds', true);
