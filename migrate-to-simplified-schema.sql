-- Migration Script: Convert to Simplified Schema
-- This script safely migrates from the original schema to simplified table names

-- ==============================================
-- STEP 1: BACKUP EXISTING DATA
-- ==============================================

-- Create backup tables with current data
CREATE TABLE IF NOT EXISTS user_profiles_backup AS SELECT * FROM user_profiles;
CREATE TABLE IF NOT EXISTS courses_backup AS SELECT * FROM courses;
CREATE TABLE IF NOT EXISTS class_sessions_backup AS SELECT * FROM class_sessions;
CREATE TABLE IF NOT EXISTS attendance_records_backup AS SELECT * FROM attendance_records;
CREATE TABLE IF NOT EXISTS qr_code_usage_backup AS SELECT * FROM qr_code_usage;

-- ==============================================
-- STEP 2: CREATE SIMPLIFIED TABLES
-- ==============================================

-- Create simplified users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id VARCHAR(20) UNIQUE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create simplified classes table (if not exists)
CREATE TABLE IF NOT EXISTS classes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(20) NOT NULL,
  name VARCHAR(200) NOT NULL,
  professor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  semester VARCHAR(20) NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(professor_id, code, semester, year)
);

-- Create simplified sessions table (if not exists)
CREATE TABLE IF NOT EXISTS sessions (
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

-- Create simplified attendance table (if not exists)
CREATE TABLE IF NOT EXISTS attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scanned_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status attendance_status NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, student_id)
);

-- Create simplified qr_usage table (if not exists)
CREATE TABLE IF NOT EXISTS qr_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  qr_secret VARCHAR(255) NOT NULL,
  used_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  used_at TIMESTAMP WITH TIME ZONE NOT NULL,
  device_fingerprint VARCHAR(255) NOT NULL,
  UNIQUE(session_id, qr_secret, used_by)
);

-- ==============================================
-- STEP 3: MIGRATE DATA FROM OLD TO NEW TABLES
-- ==============================================

-- Migrate user_profiles to users
INSERT INTO users (id, student_id, first_name, last_name, email, role, created_at, updated_at)
SELECT id, student_id, first_name, last_name, email, role, created_at, updated_at
FROM user_profiles_backup
ON CONFLICT (id) DO NOTHING;

-- Migrate courses to classes
INSERT INTO classes (id, code, name, professor_id, semester, year, created_at, updated_at)
SELECT id, course_code, course_name, professor_id, semester, year, created_at, updated_at
FROM courses_backup
ON CONFLICT (id) DO NOTHING;

-- Migrate class_sessions to sessions
INSERT INTO sessions (id, class_id, date, start_time, end_time, qr_secret, qr_expires_at, is_active, created_at, updated_at)
SELECT id, course_id, session_date, start_time, end_time, qr_code_secret, qr_code_expires_at, is_active, created_at, updated_at
FROM class_sessions_backup
ON CONFLICT (id) DO NOTHING;

-- Migrate attendance_records to attendance
INSERT INTO attendance (id, session_id, student_id, scanned_at, status, device_fingerprint, ip_address, created_at)
SELECT id, session_id, student_id, scanned_at, status, device_fingerprint, ip_address, created_at
FROM attendance_records_backup
ON CONFLICT (id) DO NOTHING;

-- Migrate qr_code_usage to qr_usage
INSERT INTO qr_usage (id, session_id, qr_secret, used_by, used_at, device_fingerprint)
SELECT id, session_id, qr_code_secret, used_by, used_at, device_fingerprint
FROM qr_code_usage_backup
ON CONFLICT (id) DO NOTHING;

-- ==============================================
-- STEP 4: CREATE INDEXES FOR PERFORMANCE
-- ==============================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_student_id ON users(student_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Classes indexes
CREATE INDEX IF NOT EXISTS idx_classes_professor ON classes(professor_id);
CREATE INDEX IF NOT EXISTS idx_classes_code ON classes(code);
CREATE INDEX IF NOT EXISTS idx_classes_semester_year ON classes(semester, year);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_class ON sessions(class_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON sessions(date);
CREATE INDEX IF NOT EXISTS idx_sessions_active ON sessions(is_active);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_session ON attendance(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(scanned_at);

-- QR Usage indexes
CREATE INDEX IF NOT EXISTS idx_qr_usage_session ON qr_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_qr_usage_user ON qr_usage(used_by);

-- ==============================================
-- STEP 5: CREATE TRIGGERS FOR UPDATED_AT
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
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_classes_updated_at ON classes;
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sessions_updated_at ON sessions;
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- STEP 6: SET UP ROW LEVEL SECURITY
-- ==============================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to users" ON users;
DROP POLICY IF EXISTS "Allow public read access to classes" ON classes;
DROP POLICY IF EXISTS "Allow public read access to sessions" ON sessions;
DROP POLICY IF EXISTS "Allow public read access to attendance" ON attendance;
DROP POLICY IF EXISTS "Allow public read access to qr_usage" ON qr_usage;

-- Create new policies for public read access (for development)
CREATE POLICY "Allow public read access to users" ON users FOR SELECT USING (true);
CREATE POLICY "Allow public read access to classes" ON classes FOR SELECT USING (true);
CREATE POLICY "Allow public read access to sessions" ON sessions FOR SELECT USING (true);
CREATE POLICY "Allow public read access to attendance" ON attendance FOR SELECT USING (true);
CREATE POLICY "Allow public read access to qr_usage" ON qr_usage FOR SELECT USING (true);

-- Create policies for authenticated users
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
-- STEP 7: VERIFY MIGRATION
-- ==============================================

-- Check data counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'classes', COUNT(*) FROM classes
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'qr_usage', COUNT(*) FROM qr_usage;

-- ==============================================
-- STEP 8: CLEANUP (OPTIONAL - COMMENT OUT IF YOU WANT TO KEEP BACKUPS)
-- ==============================================

-- Uncomment these lines if you want to remove the old tables after successful migration
-- DROP TABLE IF EXISTS qr_code_usage CASCADE;
-- DROP TABLE IF EXISTS attendance_records CASCADE;
-- DROP TABLE IF EXISTS class_sessions CASCADE;
-- DROP TABLE IF EXISTS courses CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- Uncomment these lines if you want to remove backup tables
-- DROP TABLE IF EXISTS qr_code_usage_backup;
-- DROP TABLE IF EXISTS attendance_records_backup;
-- DROP TABLE IF EXISTS class_sessions_backup;
-- DROP TABLE IF EXISTS courses_backup;
-- DROP TABLE IF EXISTS user_profiles_backup;
