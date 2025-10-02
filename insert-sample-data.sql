-- Sample data for FSAS (Furman Smart Attendance System)
-- This SQL will create realistic sample data for testing

-- First, we need to create users in auth.users table
-- Since we can't directly insert into auth.users via SQL, we'll create user_profiles
-- that reference UUIDs that would exist in auth.users

-- Insert sample professor
INSERT INTO user_profiles (id, student_id, first_name, last_name, email, role) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'PROF001', 'Dr. Sarah', 'Johnson', 'sarah.johnson@furman.edu', 'professor');

-- Insert sample students
INSERT INTO user_profiles (id, student_id, first_name, last_name, email, role) VALUES
('550e8400-e29b-41d4-a716-446655440002', 'STU001', 'John', 'Smith', 'john.smith@furman.edu', 'student'),
('550e8400-e29b-41d4-a716-446655440003', 'STU002', 'Emily', 'Davis', 'emily.davis@furman.edu', 'student'),
('550e8400-e29b-41d4-a716-446655440004', 'STU003', 'Michael', 'Brown', 'michael.brown@furman.edu', 'student'),
('550e8400-e29b-41d4-a716-446655440005', 'STU004', 'Sarah', 'Wilson', 'sarah.wilson@furman.edu', 'student'),
('550e8400-e29b-41d4-a716-446655440006', 'STU005', 'David', 'Garcia', 'david.garcia@furman.edu', 'student');

-- Insert sample courses
INSERT INTO courses (id, course_code, course_name, professor_id, semester, year) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'CSC-475', 'Seminar in Computer Science', '550e8400-e29b-41d4-a716-446655440001', 'Fall', 2024),
('660e8400-e29b-41d4-a716-446655440002', 'CSC-301', 'Data Structures and Algorithms', '550e8400-e29b-41d4-a716-446655440001', 'Fall', 2024),
('660e8400-e29b-41d4-a716-446655440003', 'CSC-201', 'Introduction to Programming', '550e8400-e29b-41d4-a716-446655440001', 'Fall', 2024);

-- Insert sample class sessions
INSERT INTO class_sessions (id, course_id, session_date, start_time, end_time, qr_code_secret, qr_code_expires_at, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '2024-10-01', '09:00', '10:30', 'session-1-secret-20241001', '2024-10-01 10:30:00+00', false),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440001', '2024-10-03', '09:00', '10:30', 'session-2-secret-20241003', '2024-10-03 10:30:00+00', false),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440001', '2024-10-08', '09:00', '10:30', 'session-3-secret-20241008', '2024-10-08 10:30:00+00', true),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440002', '2024-10-02', '11:00', '12:30', 'session-4-secret-20241002', '2024-10-02 12:30:00+00', false),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440002', '2024-10-04', '11:00', '12:30', 'session-5-secret-20241004', '2024-10-04 12:30:00+00', false);

-- Insert sample attendance records
INSERT INTO attendance_records (id, session_id, student_id, scanned_at, status, device_fingerprint, ip_address) VALUES
-- Session 1 (CSC-475, 2024-10-01)
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', '2024-10-01 09:05:00+00', 'present', 'device-fingerprint-001', '192.168.1.101'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440003', '2024-10-01 09:12:00+00', 'late', 'device-fingerprint-002', '192.168.1.102'),
('880e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440004', '2024-10-01 09:03:00+00', 'present', 'device-fingerprint-003', '192.168.1.103'),
('880e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440005', '2024-10-01 09:08:00+00', 'present', 'device-fingerprint-004', '192.168.1.104'),
('880e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440006', '2024-10-01 09:15:00+00', 'late', 'device-fingerprint-005', '192.168.1.105'),

-- Session 2 (CSC-475, 2024-10-03)
('880e8400-e29b-41d4-a716-446655440006', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', '2024-10-03 09:02:00+00', 'present', 'device-fingerprint-006', '192.168.1.101'),
('880e8400-e29b-41d4-a716-446655440007', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', '2024-10-03 09:01:00+00', 'present', 'device-fingerprint-007', '192.168.1.102'),
('880e8400-e29b-41d4-a716-446655440008', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440004', '2024-10-03 09:10:00+00', 'late', 'device-fingerprint-008', '192.168.1.103'),
('880e8400-e29b-41d4-a716-446655440009', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440005', '2024-10-03 09:05:00+00', 'present', 'device-fingerprint-009', '192.168.1.104'),
('880e8400-e29b-41d4-a716-446655440010', '770e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440006', '2024-10-03 09:03:00+00', 'present', 'device-fingerprint-010', '192.168.1.105'),

-- Session 3 (CSC-475, 2024-10-08) - Current active session
('880e8400-e29b-41d4-a716-446655440011', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', '2024-10-08 09:01:00+00', 'present', 'device-fingerprint-011', '192.168.1.101'),
('880e8400-e29b-41d4-a716-446655440012', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', '2024-10-08 09:02:00+00', 'present', 'device-fingerprint-012', '192.168.1.102'),
('880e8400-e29b-41d4-a716-446655440013', '770e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440004', '2024-10-08 09:00:00+00', 'present', 'device-fingerprint-013', '192.168.1.103'),

-- Session 4 (CSC-301, 2024-10-02)
('880e8400-e29b-41d4-a716-446655440014', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '2024-10-02 11:05:00+00', 'present', 'device-fingerprint-014', '192.168.1.101'),
('880e8400-e29b-41d4-a716-446655440015', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', '2024-10-02 11:10:00+00', 'late', 'device-fingerprint-015', '192.168.1.102'),
('880e8400-e29b-41d4-a716-446655440016', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', '2024-10-02 11:02:00+00', 'present', 'device-fingerprint-016', '192.168.1.103'),
('880e8400-e29b-41d4-a716-446655440017', '770e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', '2024-10-02 11:08:00+00', 'present', 'device-fingerprint-017', '192.168.1.104'),

-- Session 5 (CSC-301, 2024-10-04)
('880e8400-e29b-41d4-a716-446655440018', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440002', '2024-10-04 11:01:00+00', 'present', 'device-fingerprint-018', '192.168.1.101'),
('880e8400-e29b-41d4-a716-446655440019', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '2024-10-04 11:03:00+00', 'present', 'device-fingerprint-019', '192.168.1.102'),
('880e8400-e29b-41d4-a716-446655440020', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', '2024-10-04 11:05:00+00', 'present', 'device-fingerprint-020', '192.168.1.103'),
('880e8400-e29b-41d4-a716-446655440021', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', '2024-10-04 11:12:00+00', 'late', 'device-fingerprint-021', '192.168.1.104'),
('880e8400-e29b-41d4-a716-446655440022', '770e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', '2024-10-04 11:02:00+00', 'present', 'device-fingerprint-022', '192.168.1.105');

-- Insert sample QR code usage records
INSERT INTO qr_code_usage (id, session_id, qr_code_secret, used_by, used_at, device_fingerprint) VALUES
('990e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', 'session-1-secret-20241001', '550e8400-e29b-41d4-a716-446655440002', '2024-10-01 09:05:00+00', 'device-fingerprint-001'),
('990e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440001', 'session-1-secret-20241001', '550e8400-e29b-41d4-a716-446655440003', '2024-10-01 09:12:00+00', 'device-fingerprint-002'),
('990e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440001', 'session-1-secret-20241001', '550e8400-e29b-41d4-a716-446655440004', '2024-10-01 09:03:00+00', 'device-fingerprint-003'),
('990e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440001', 'session-1-secret-20241001', '550e8400-e29b-41d4-a716-446655440005', '2024-10-01 09:08:00+00', 'device-fingerprint-004'),
('990e8400-e29b-41d4-a716-446655440005', '770e8400-e29b-41d4-a716-446655440001', 'session-1-secret-20241001', '550e8400-e29b-41d4-a716-446655440006', '2024-10-01 09:15:00+00', 'device-fingerprint-005');

-- Display summary
SELECT 'Sample data insertion completed!' as status;
SELECT 'Users: 6 (1 professor, 5 students)' as summary;
SELECT 'Courses: 3' as summary;
SELECT 'Sessions: 5' as summary;
SELECT 'Attendance Records: 22' as summary;
SELECT 'QR Usage Records: 5' as summary;
