-- =====================================================
-- ADD SAMPLE STUDENTS AND ENROLLMENTS
-- =====================================================
-- This script adds sample students and enrollments for testing

-- 1. First, let's see what we have
SELECT 'Current data before adding students:' as info;
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Students:', COUNT(*) FROM students
UNION ALL
SELECT 'Classes:', COUNT(*) FROM classes
UNION ALL
SELECT 'Sessions:', COUNT(*) FROM sessions
UNION ALL
SELECT 'Enrollments:', COUNT(*) FROM enrollments;

-- 2. Add sample students (we'll create them as users first, then as students)
-- Note: In a real system, these would be created through Supabase Auth
-- For testing, we'll create them directly

-- Add sample users (students)
INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'john.doe@student.furman.edu', 'John', 'Doe', 'student', NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'jane.smith@student.furman.edu', 'Jane', 'Smith', 'student', NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'mike.johnson@student.furman.edu', 'Mike', 'Johnson', 'student', NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'sarah.wilson@student.furman.edu', 'Sarah', 'Wilson', 'student', NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'alex.brown@student.furman.edu', 'Alex', 'Brown', 'student', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Add student profiles
INSERT INTO students (user_id, student_id, enrollment_year, major, gpa, created_at, updated_at) VALUES
('11111111-1111-1111-1111-111111111111', 'STU001', 2024, 'Computer Science', 3.75, NOW(), NOW()),
('22222222-2222-2222-2222-222222222222', 'STU002', 2024, 'Computer Science', 3.60, NOW(), NOW()),
('33333333-3333-3333-3333-333333333333', 'STU003', 2023, 'Mathematics', 3.85, NOW(), NOW()),
('44444444-4444-4444-4444-444444444444', 'STU004', 2024, 'Computer Science', 3.45, NOW(), NOW()),
('55555555-5555-5555-5555-555555555555', 'STU005', 2025, 'Computer Science', 3.90, NOW(), NOW())
ON CONFLICT (user_id) DO NOTHING;

-- 3. Get the class IDs for enrollment
SELECT 'Available classes for enrollment:' as info;
SELECT id, code, name, max_students FROM classes WHERE is_active = true;

-- 4. Add enrollments
-- First, let's get the academic period ID
SELECT 'Available academic periods:' as info;
SELECT id, name, year, semester FROM academic_periods;

-- Add enrollments (students enrolled in classes)
-- We'll enroll students in both classes for the current academic period
INSERT INTO enrollments (id, student_id, class_id, academic_period_id, enrolled_by, enrollment_date, status, created_at) VALUES
-- John Doe enrolled in both classes
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 
 (SELECT id FROM classes WHERE code = 'CSC-475' LIMIT 1),
 (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', '2024-09-01', 'active', NOW()),

(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 
 (SELECT id FROM classes WHERE code = 'CSC-301' LIMIT 1),
 (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', '2024-09-01', 'active', NOW()),

-- Jane Smith enrolled in both classes
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 
 (SELECT id FROM classes WHERE code = 'CSC-475' LIMIT 1),
 (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', '2024-09-01', 'active', NOW()),

(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 
 (SELECT id FROM classes WHERE code = 'CSC-301' LIMIT 1),
 (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', '2024-09-01', 'active', NOW()),

-- Mike Johnson enrolled in CSC-301 only
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 
 (SELECT id FROM classes WHERE code = 'CSC-301' LIMIT 1),
 (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', '2024-09-01', 'active', NOW()),

-- Sarah Wilson enrolled in CSC-475 only
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 
 (SELECT id FROM classes WHERE code = 'CSC-475' LIMIT 1),
 (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', '2024-09-01', 'active', NOW()),

-- Alex Brown enrolled in both classes
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 
 (SELECT id FROM classes WHERE code = 'CSC-475' LIMIT 1),
 (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', '2024-09-01', 'active', NOW()),

(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 
 (SELECT id FROM classes WHERE code = 'CSC-301' LIMIT 1),
 (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', '2024-09-01', 'active', NOW());

-- 5. Add some sample attendance records for testing
-- Let's add attendance for some of the recent sessions
INSERT INTO attendance (id, student_id, session_id, status, device_fingerprint, scanned_at, created_at) VALUES
-- John Doe attended some sessions
(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '10:00:00' LIMIT 1),
 'present', 'device_fingerprint_john_001', NOW() - INTERVAL '2 days', NOW()),

(gen_random_uuid(), '11111111-1111-1111-1111-111111111111', 
 (SELECT id FROM sessions WHERE date = '2024-10-05' AND start_time = '10:00:00' LIMIT 1),
 'present', 'device_fingerprint_john_001', NOW() - INTERVAL '1 day', NOW()),

-- Jane Smith attended some sessions
(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '10:00:00' LIMIT 1),
 'late', 'device_fingerprint_jane_002', NOW() - INTERVAL '2 days', NOW()),

(gen_random_uuid(), '22222222-2222-2222-2222-222222222222', 
 (SELECT id FROM sessions WHERE date = '2024-10-05' AND start_time = '10:00:00' LIMIT 1),
 'present', 'device_fingerprint_jane_002', NOW() - INTERVAL '1 day', NOW()),

-- Mike Johnson attended CSC-301 sessions
(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '14:00:00' LIMIT 1),
 'present', 'device_fingerprint_mike_003', NOW() - INTERVAL '2 days', NOW()),

(gen_random_uuid(), '33333333-3333-3333-3333-333333333333', 
 (SELECT id FROM sessions WHERE date = '2024-10-05' AND start_time = '14:00:00' LIMIT 1),
 'present', 'device_fingerprint_mike_003', NOW() - INTERVAL '1 day', NOW()),

-- Sarah Wilson attended CSC-475 sessions
(gen_random_uuid(), '44444444-4444-4444-4444-444444444444', 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '10:00:00' LIMIT 1),
 'present', 'device_fingerprint_sarah_004', NOW() - INTERVAL '2 days', NOW()),

-- Alex Brown attended some sessions
(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '10:00:00' LIMIT 1),
 'present', 'device_fingerprint_alex_005', NOW() - INTERVAL '2 days', NOW()),

(gen_random_uuid(), '55555555-5555-5555-5555-555555555555', 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '14:00:00' LIMIT 1),
 'present', 'device_fingerprint_alex_005', NOW() - INTERVAL '2 days', NOW());

-- 6. Add some QR usage records
INSERT INTO qr_usage (id, session_id, qr_code_secret, used_by, used_at, device_fingerprint) VALUES
(gen_random_uuid(), 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '10:00:00' LIMIT 1),
 'qr_secret_20241003_1000', '11111111-1111-1111-1111-111111111111', NOW() - INTERVAL '2 days', 'device_fingerprint_john_001'),

(gen_random_uuid(), 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '10:00:00' LIMIT 1),
 'qr_secret_20241003_1000', '22222222-2222-2222-2222-222222222222', NOW() - INTERVAL '2 days', 'device_fingerprint_jane_002'),

(gen_random_uuid(), 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '14:00:00' LIMIT 1),
 'qr_secret_20241003_1400', '33333333-3333-3333-3333-333333333333', NOW() - INTERVAL '2 days', 'device_fingerprint_mike_003');

-- 7. Final verification
SELECT 'Data after adding students and enrollments:' as info;
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Students:', COUNT(*) FROM students
UNION ALL
SELECT 'Classes:', COUNT(*) FROM classes
UNION ALL
SELECT 'Sessions:', COUNT(*) FROM sessions
UNION ALL
SELECT 'Enrollments:', COUNT(*) FROM enrollments
UNION ALL
SELECT 'Attendance:', COUNT(*) FROM attendance
UNION ALL
SELECT 'QR Usage:', COUNT(*) FROM qr_usage;

-- 8. Show sample data
SELECT 'Sample students added:' as info;
SELECT s.student_id, u.first_name, u.last_name, u.email, s.major, s.enrollment_year, s.gpa
FROM students s
JOIN users u ON s.user_id = u.id
ORDER BY s.student_id;

SELECT 'Sample enrollments created:' as info;
SELECT e.id, u.first_name, u.last_name, c.code as class_code, c.name as class_name, e.status
FROM enrollments e
JOIN users u ON e.student_id = u.id
JOIN classes c ON e.class_id = c.id
ORDER BY u.first_name, c.code;

SELECT 'Sample attendance records:' as info;
SELECT a.id, u.first_name, u.last_name, c.code as class_code, s.date, s.start_time, a.status, a.scanned_at
FROM attendance a
JOIN users u ON a.student_id = u.id
JOIN sessions s ON a.session_id = s.id
JOIN classes c ON s.class_id = c.id
ORDER BY s.date, s.start_time, u.first_name;

-- 9. Success message
SELECT 'Sample data added successfully!' as status;
SELECT 'System is now ready for full testing!' as result;
