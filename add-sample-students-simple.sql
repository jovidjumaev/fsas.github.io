-- =====================================================
-- ADD SAMPLE STUDENTS - SIMPLIFIED APPROACH
-- =====================================================
-- This script adds sample students without creating auth.users entries
-- We'll work with the existing professor user and create sample data

-- 1. First, let's see what we have
SELECT 'Current data before adding sample data:' as info;
SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Students:', COUNT(*) FROM students
UNION ALL
SELECT 'Classes:', COUNT(*) FROM classes
UNION ALL
SELECT 'Sessions:', COUNT(*) FROM sessions
UNION ALL
SELECT 'Enrollments:', COUNT(*) FROM enrollments;

-- 2. Since we can't create new users without auth.users entries,
-- let's create sample attendance data using the existing professor
-- and create some sample QR usage records

-- First, let's see what sessions we have
SELECT 'Available sessions for sample data:' as info;
SELECT s.id, s.date, s.start_time, s.end_time, c.code as class_code, c.name as class_name
FROM sessions s
JOIN classes c ON s.class_id = c.id
WHERE s.is_active = true
ORDER BY s.date, s.start_time;

-- 3. Create sample attendance records using the professor's ID
-- (In a real system, these would be student IDs, but for testing we'll use the professor)
INSERT INTO attendance (id, student_id, session_id, status, device_fingerprint, scanned_at, created_at) VALUES
-- Professor "attending" some sessions (for testing purposes)
(gen_random_uuid(), 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '10:00:00' LIMIT 1),
 'present', 'device_fingerprint_prof_001', NOW() - INTERVAL '2 days', NOW()),

(gen_random_uuid(), 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 
 (SELECT id FROM sessions WHERE date = '2024-10-05' AND start_time = '10:00:00' LIMIT 1),
 'present', 'device_fingerprint_prof_001', NOW() - INTERVAL '1 day', NOW()),

(gen_random_uuid(), 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 
 (SELECT id FROM sessions WHERE date = '2024-10-08' AND start_time = '10:00:00' LIMIT 1),
 'present', 'device_fingerprint_prof_001', NOW() - INTERVAL '1 hour', NOW()),

(gen_random_uuid(), 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '14:00:00' LIMIT 1),
 'present', 'device_fingerprint_prof_001', NOW() - INTERVAL '2 days', NOW()),

(gen_random_uuid(), 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 
 (SELECT id FROM sessions WHERE date = '2024-10-05' AND start_time = '14:00:00' LIMIT 1),
 'late', 'device_fingerprint_prof_001', NOW() - INTERVAL '1 day', NOW());

-- 4. Create sample QR usage records
INSERT INTO qr_usage (id, session_id, qr_code_secret, used_by, used_at, device_fingerprint) VALUES
(gen_random_uuid(), 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '10:00:00' LIMIT 1),
 'qr_secret_20241003_1000', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', NOW() - INTERVAL '2 days', 'device_fingerprint_prof_001'),

(gen_random_uuid(), 
 (SELECT id FROM sessions WHERE date = '2024-10-05' AND start_time = '10:00:00' LIMIT 1),
 'qr_secret_20241005_1000', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', NOW() - INTERVAL '1 day', 'device_fingerprint_prof_001'),

(gen_random_uuid(), 
 (SELECT id FROM sessions WHERE date = '2024-10-08' AND start_time = '10:00:00' LIMIT 1),
 'qr_secret_20241008_1000', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', NOW() - INTERVAL '1 hour', 'device_fingerprint_prof_001'),

(gen_random_uuid(), 
 (SELECT id FROM sessions WHERE date = '2024-10-03' AND start_time = '14:00:00' LIMIT 1),
 'qr_secret_20241003_1400', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', NOW() - INTERVAL '2 days', 'device_fingerprint_prof_001'),

(gen_random_uuid(), 
 (SELECT id FROM sessions WHERE date = '2024-10-05' AND start_time = '14:00:00' LIMIT 1),
 'qr_secret_20241005_1400', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', NOW() - INTERVAL '1 day', 'device_fingerprint_prof_001');

-- 5. Create some sample notifications (if the table exists)
-- Let's check if notifications table exists first
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications' AND table_schema = 'public') THEN
    INSERT INTO notifications (id, user_id, title, message, type, is_read, created_at) VALUES
    (gen_random_uuid(), 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'Attendance Recorded', 'Your attendance has been recorded for CSC-475 session.', 'attendance', false, NOW() - INTERVAL '2 days'),
    (gen_random_uuid(), 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'QR Code Used', 'QR code was successfully scanned for CSC-301 session.', 'qr_usage', false, NOW() - INTERVAL '1 day'),
    (gen_random_uuid(), 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'Session Reminder', 'CSC-475 session starts in 30 minutes.', 'reminder', false, NOW() - INTERVAL '1 hour');
  END IF;
END $$;

-- 6. Final verification
SELECT 'Data after adding sample records:' as info;
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

-- 7. Show sample attendance data
SELECT 'Sample attendance records created:' as info;
SELECT a.id, u.first_name, u.last_name, c.code as class_code, s.date, s.start_time, a.status, a.scanned_at
FROM attendance a
JOIN users u ON a.student_id = u.id
JOIN sessions s ON a.session_id = s.id
JOIN classes c ON s.class_id = c.id
ORDER BY s.date, s.start_time;

-- 8. Show sample QR usage data
SELECT 'Sample QR usage records created:' as info;
SELECT q.id, u.first_name, u.last_name, c.code as class_code, s.date, s.start_time, q.used_at
FROM qr_usage q
JOIN users u ON q.used_by = u.id
JOIN sessions s ON q.session_id = s.id
JOIN classes c ON s.class_id = c.id
ORDER BY q.used_at;

-- 9. Success message
SELECT 'Sample data added successfully!' as status;
SELECT 'System now has attendance and QR usage data for testing!' as result;
SELECT 'Note: To add real students, create them through Supabase Auth first' as note;
