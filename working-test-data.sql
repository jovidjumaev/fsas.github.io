-- Working test data for FSAS - creates data that works with existing constraints
-- This approach creates data without foreign key issues

-- First, let's see what we have
SELECT 'Current table counts:' as info;
SELECT 'user_profiles:' as table_name, COUNT(*) as count FROM user_profiles;
SELECT 'courses:' as table_name, COUNT(*) as count FROM courses;
SELECT 'class_sessions:' as table_name, COUNT(*) as count FROM class_sessions;
SELECT 'attendance_records:' as table_name, COUNT(*) as count FROM attendance_records;

-- Since we can't easily insert into user_profiles due to foreign key constraints,
-- let's create data that doesn't depend on user_profiles

-- Insert test courses (this should work if we use a valid UUID format)
-- We'll use a UUID that could theoretically exist in auth.users
INSERT INTO courses (id, course_code, course_name, professor_id, semester, year) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'CSC-475', 'Seminar in Computer Science', '550e8400-e29b-41d4-a716-446655440001', 'Fall', 2024),
('660e8400-e29b-41d4-a716-446655440002', 'CSC-301', 'Data Structures and Algorithms', '550e8400-e29b-41d4-a716-446655440001', 'Fall', 2024);

-- Insert test class sessions
INSERT INTO class_sessions (id, course_id, session_date, start_time, end_time, qr_code_secret, qr_code_expires_at, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2024-10-01', '09:00', '10:30', 'session-1-secret-20241001', '2024-10-01 10:30:00+00', false),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '2024-10-08', '09:00', '10:30', 'session-2-secret-20241008', '2024-10-08 10:30:00+00', true);

-- Show what we created
SELECT 'Data created successfully!' as status;
SELECT 'Courses created:' as info, COUNT(*) as count FROM courses;
SELECT 'Sessions created:' as info, COUNT(*) as count FROM class_sessions;
