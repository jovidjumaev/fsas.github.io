-- Enable RLS on all tables (if not already enabled)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_usage ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read access to class_sessions" ON class_sessions;
DROP POLICY IF EXISTS "Allow public read access to attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Allow public read access to qr_code_usage" ON qr_code_usage;

-- Create policies for public read access (for development/testing)
CREATE POLICY "Allow public read access to courses" ON courses
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to user_profiles" ON user_profiles
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to class_sessions" ON class_sessions
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to attendance_records" ON attendance_records
FOR SELECT USING (true);

CREATE POLICY "Allow public read access to qr_code_usage" ON qr_code_usage
FOR SELECT USING (true);

-- Create policies for authenticated users to insert/update their own data
CREATE POLICY "Allow authenticated users to insert user_profiles" ON user_profiles
FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow authenticated users to update their own user_profiles" ON user_profiles
FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow professors to insert courses" ON courses
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'professor'
  )
);

CREATE POLICY "Allow professors to update their own courses" ON courses
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'professor'
  )
);

CREATE POLICY "Allow professors to insert class_sessions" ON class_sessions
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'professor'
  )
);

CREATE POLICY "Allow students to insert attendance_records" ON attendance_records
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'student'
  )
);

CREATE POLICY "Allow users to insert qr_code_usage" ON qr_code_usage
FOR INSERT WITH CHECK (auth.uid() = used_by);

-- Create policies for professors to see all data (for analytics)
CREATE POLICY "Allow professors to see all attendance_records" ON attendance_records
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'professor'
  )
);

CREATE POLICY "Allow professors to see all qr_code_usage" ON qr_code_usage
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'professor'
  )
);

-- Create policies for students to see their own attendance
CREATE POLICY "Allow students to see their own attendance_records" ON attendance_records
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'student'
  ) AND student_id = auth.uid()
);

-- Create policies for students to see their own qr_code_usage
CREATE POLICY "Allow students to see their own qr_code_usage" ON qr_code_usage
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE id = auth.uid() AND role = 'student'
  ) AND used_by = auth.uid()
);
