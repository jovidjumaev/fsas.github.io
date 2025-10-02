-- Simple test data for FSAS - bypasses foreign key constraints
-- This will create basic data to test the frontend

-- Temporarily disable foreign key constraints
ALTER TABLE user_profiles DISABLE TRIGGER ALL;

-- Insert test users
INSERT INTO user_profiles (id, student_id, first_name, last_name, email, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'PROF001', 'Dr. Sarah', 'Johnson', 'sarah.johnson@furman.edu', 'professor'),
('550e8400-e29b-41d4-a716-446655440002', 'STU001', 'John', 'Smith', 'john.smith@furman.edu', 'student'),
('550e8400-e29b-41d4-a716-446655440003', 'STU002', 'Emily', 'Davis', 'emily.davis@furman.edu', 'student');

-- Re-enable foreign key constraints
ALTER TABLE user_profiles ENABLE TRIGGER ALL;

-- Insert test courses
INSERT INTO courses (id, course_code, course_name, professor_id, semester, year) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'CSC-475', 'Seminar in Computer Science', '550e8400-e29b-41d4-a716-446655440001', 'Fall', 2024),
('660e8400-e29b-41d4-a716-446655440002', 'CSC-301', 'Data Structures and Algorithms', '550e8400-e29b-41d4-a716-446655440001', 'Fall', 2024);

-- Insert test class sessions
INSERT INTO class_sessions (id, course_id, session_date, start_time, end_time, qr_code_secret, qr_code_expires_at, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2024-10-01', '09:00', '10:30', 'session-1-secret-20241001', '2024-10-01 10:30:00+00', false),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '2024-10-08', '09:00', '10:30', 'session-2-secret-20241008', '2024-10-08 10:30:00+00', true);

-- Insert test attendance records
INSERT INTO attendance_records (id, session_id, student_id, scanned_at, status, device_fingerprint, ip_address) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '2024-10-01 09:05:00+00', 'present', 'device-fingerprint-001', '192.168.1.101'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '2024-10-01 09:12:00+00', 'late', 'device-fingerprint-002', '192.168.1.102'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2024-10-08 09:01:00+00', 'present', 'device-fingerprint-003', '192.168.1.101'),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '2024-10-08 09:02:00+00', 'present', 'device-fingerprint-004', '192.168.1.102');

-- Insert test QR usage records
INSERT INTO qr_code_usage (id, session_id, qr_code_secret, used_by, used_at, device_fingerprint) VALUES
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'session-1-secret-20241001', '550e8400-e29b-41d4-a716-446655440002', '2024-10-01 09:05:00+00', 'device-fingerprint-001'),
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'session-1-secret-20241001', '550e8400-e29b-41d4-a716-446655440003', '2024-10-01 09:12:00+00', 'device-fingerprint-002');

-- Show summary
SELECT 'Test data created successfully!' as status;
SELECT 'Users: 3 (1 professor, 2 students)' as summary;
SELECT 'Courses: 2' as summary;
SELECT 'Sessions: 2' as summary;
SELECT 'Attendance Records: 4' as summary;
SELECT 'QR Usage Records: 2' as summary;
