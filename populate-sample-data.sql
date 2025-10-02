-- =====================================================
-- POPULATE SAMPLE DATA FOR TESTING
-- =====================================================
-- This script adds sample students and enrollments to test the system

-- 1. Add sample students (assuming we have a professor user)
-- First, let's get the existing professor ID
-- Note: Replace 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb' with actual professor ID

-- Add sample students (basic fields only - new fields will be added by fix script)
INSERT INTO users (id, email, first_name, last_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john.doe@student.furman.edu', 'John', 'Doe', 'student'),
  ('22222222-2222-2222-2222-222222222222', 'jane.smith@student.furman.edu', 'Jane', 'Smith', 'student'),
  ('33333333-3333-3333-3333-333333333333', 'mike.johnson@student.furman.edu', 'Mike', 'Johnson', 'student'),
  ('44444444-4444-4444-4444-444444444444', 'sarah.wilson@student.furman.edu', 'Sarah', 'Wilson', 'student'),
  ('55555555-5555-5555-5555-555555555555', 'alex.brown@student.furman.edu', 'Alex', 'Brown', 'student')
ON CONFLICT (id) DO NOTHING;

-- Add student profiles (basic fields only)
INSERT INTO students (user_id, student_id, enrollment_year, major, gpa) VALUES
  ('11111111-1111-1111-1111-111111111111', 'STU001', 2024, 'Computer Science', 3.75),
  ('22222222-2222-2222-2222-222222222222', 'STU002', 2024, 'Computer Science', 3.50),
  ('33333333-3333-3333-3333-333333333333', 'STU003', 2024, 'Mathematics', 3.25),
  ('44444444-4444-4444-4444-444444444444', 'STU004', 2024, 'Computer Science', 3.90),
  ('55555555-5555-5555-5555-555555555555', 'STU005', 2024, 'Physics', 3.60)
ON CONFLICT (user_id) DO NOTHING;

-- 2. Add enrollments (professor adds students to classes)
-- Get class IDs and professor ID
-- Assuming we have classes with IDs from the migration

INSERT INTO enrollments (student_id, class_id, enrolled_by, status, final_grade) VALUES
  -- CSC-475 enrollments
  ('11111111-1111-1111-1111-111111111111', '660e8400-e29b-41d4-a716-446655440001', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active', NULL),
  ('22222222-2222-2222-2222-222222222222', '660e8400-e29b-41d4-a716-446655440001', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active', NULL),
  ('44444444-4444-4444-4444-444444444444', '660e8400-e29b-41d4-a716-446655440001', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active', NULL),
  
  -- CSC-301 enrollments
  ('11111111-1111-1111-1111-111111111111', '660e8400-e29b-41d4-a716-446655440002', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active', NULL),
  ('22222222-2222-2222-2222-222222222222', '660e8400-e29b-41d4-a716-446655440002', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active', NULL),
  ('33333333-3333-3333-3333-333333333333', '660e8400-e29b-41d4-a716-446655440002', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active', NULL),
  ('55555555-5555-5555-5555-555555555555', '660e8400-e29b-41d4-a716-446655440002', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active', NULL)
ON CONFLICT (student_id, class_id) DO NOTHING;

-- 3. Add more class sessions for testing
INSERT INTO sessions (class_id, session_date, start_time, end_time, room_location, notes, is_active) VALUES
  -- CSC-475 sessions
  ('660e8400-e29b-41d4-a716-446655440001', '2024-10-03', '10:00:00', '10:50:00', 'Room 101', 'Introduction to Research Methods', true),
  ('660e8400-e29b-41d4-a716-446655440001', '2024-10-05', '10:00:00', '10:50:00', 'Room 101', 'Literature Review Workshop', true),
  ('660e8400-e29b-41d4-a716-446655440001', '2024-10-08', '10:00:00', '10:50:00', 'Room 101', 'Research Proposal Presentations', true),
  
  -- CSC-301 sessions
  ('660e8400-e29b-41d4-a716-446655440002', '2024-10-03', '14:00:00', '14:50:00', 'Room 205', 'Arrays and Linked Lists', true),
  ('660e8400-e29b-41d4-a716-446655440002', '2024-10-05', '14:00:00', '14:50:00', 'Room 205', 'Stacks and Queues', true),
  ('660e8400-e29b-41d4-a716-446655440002', '2024-10-08', '14:00:00', '14:50:00', 'Room 205', 'Binary Trees', true)
ON CONFLICT DO NOTHING;

-- 4. Add sample attendance records
-- Get session IDs (assuming they exist from above)
INSERT INTO attendance (student_id, session_id, status, device_fingerprint, location_lat, location_lng, notes) VALUES
  -- CSC-475 attendance
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM sessions WHERE class_id = '660e8400-e29b-41d4-a716-446655440001' AND session_date = '2024-10-03' LIMIT 1), 'present', 'device_fingerprint_001', 34.9207, -82.3431, 'On time'),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM sessions WHERE class_id = '660e8400-e29b-41d4-a716-446655440001' AND session_date = '2024-10-03' LIMIT 1), 'present', 'device_fingerprint_002', 34.9207, -82.3431, 'On time'),
  ('44444444-4444-4444-4444-444444444444', (SELECT id FROM sessions WHERE class_id = '660e8400-e29b-41d4-a716-446655440001' AND session_date = '2024-10-03' LIMIT 1), 'late', 'device_fingerprint_003', 34.9207, -82.3431, '5 minutes late'),
  
  -- CSC-301 attendance
  ('11111111-1111-1111-1111-111111111111', (SELECT id FROM sessions WHERE class_id = '660e8400-e29b-41d4-a716-446655440002' AND session_date = '2024-10-03' LIMIT 1), 'present', 'device_fingerprint_001', 34.9207, -82.3431, 'On time'),
  ('22222222-2222-2222-2222-222222222222', (SELECT id FROM sessions WHERE class_id = '660e8400-e29b-41d4-a716-446655440002' AND session_date = '2024-10-03' LIMIT 1), 'present', 'device_fingerprint_002', 34.9207, -82.3431, 'On time'),
  ('33333333-3333-3333-3333-333333333333', (SELECT id FROM sessions WHERE class_id = '660e8400-e29b-41d4-a716-446655440002' AND session_date = '2024-10-03' LIMIT 1), 'absent', 'device_fingerprint_004', 34.9207, -82.3431, 'Excused absence'),
  ('55555555-5555-5555-5555-555555555555', (SELECT id FROM sessions WHERE class_id = '660e8400-e29b-41d4-a716-446655440002' AND session_date = '2024-10-03' LIMIT 1), 'present', 'device_fingerprint_005', 34.9207, -82.3431, 'On time')
ON CONFLICT DO NOTHING;

-- 5. Add sample notifications
INSERT INTO notifications (user_id, title, message, type, is_read) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Welcome to CSC-475', 'You have been enrolled in Seminar in Computer Science', 'enrollment', false),
  ('22222222-2222-2222-2222-222222222222', 'Welcome to CSC-475', 'You have been enrolled in Seminar in Computer Science', 'enrollment', false),
  ('44444444-4444-4444-4444-444444444444', 'Welcome to CSC-475', 'You have been enrolled in Seminar in Computer Science', 'enrollment', false),
  ('11111111-1111-1111-1111-111111111111', 'Welcome to CSC-301', 'You have been enrolled in Data Structures and Algorithms', 'enrollment', false),
  ('22222222-2222-2222-2222-222222222222', 'Welcome to CSC-301', 'You have been enrolled in Data Structures and Algorithms', 'enrollment', false),
  ('33333333-3333-3333-3333-333333333333', 'Welcome to CSC-301', 'You have been enrolled in Data Structures and Algorithms', 'enrollment', false),
  ('55555555-5555-5555-5555-555555555555', 'Welcome to CSC-301', 'You have been enrolled in Data Structures and Algorithms', 'enrollment', false)
ON CONFLICT DO NOTHING;

-- 6. Calculate and insert attendance analytics
INSERT INTO attendance_analytics (class_id, session_id, total_students, present_count, absent_count, late_count, attendance_rate)
SELECT 
  s.class_id,
  s.id as session_id,
  COUNT(DISTINCT e.student_id) as total_students,
  COUNT(CASE WHEN a.status = 'present' THEN 1 END) as present_count,
  COUNT(CASE WHEN a.status = 'absent' THEN 1 END) as absent_count,
  COUNT(CASE WHEN a.status = 'late' THEN 1 END) as late_count,
  ROUND(
    (COUNT(CASE WHEN a.status IN ('present', 'late') THEN 1 END)::DECIMAL / 
     NULLIF(COUNT(DISTINCT e.student_id), 0)) * 100, 2
  ) as attendance_rate
FROM sessions s
LEFT JOIN enrollments e ON s.class_id = e.class_id AND e.deleted_at IS NULL
LEFT JOIN attendance a ON s.id = a.session_id
WHERE s.deleted_at IS NULL
GROUP BY s.class_id, s.id
ON CONFLICT DO NOTHING;

-- 7. Update class information with better details
UPDATE classes SET 
  room_location = CASE 
    WHEN code = 'CSC-475' THEN 'Room 101'
    WHEN code = 'CSC-301' THEN 'Room 205'
    ELSE room_location
  END,
  schedule_info = CASE 
    WHEN code = 'CSC-475' THEN 'MWF 10:00-10:50'
    WHEN code = 'CSC-301' THEN 'MWF 14:00-14:50'
    ELSE schedule_info
  END,
  max_students = 25
WHERE room_location IS NULL OR schedule_info IS NULL;

-- 8. Add some sample QR usage records
INSERT INTO qr_usage (session_id, qr_code_data, used_by, used_at, device_fingerprint, location_lat, location_lng)
SELECT 
  s.id as session_id,
  'sample_qr_data_' || s.id as qr_code_data,
  a.student_id as used_by,
  a.created_at as used_at,
  a.device_fingerprint,
  a.location_lat,
  a.location_lng
FROM sessions s
JOIN attendance a ON s.id = a.session_id
WHERE a.status = 'present'
ON CONFLICT DO NOTHING;

-- 9. Verify data insertion
SELECT 'Data Population Complete' as status,
       (SELECT COUNT(*) FROM users WHERE role = 'student') as students_added,
       (SELECT COUNT(*) FROM enrollments) as enrollments_created,
       (SELECT COUNT(*) FROM sessions) as sessions_created,
       (SELECT COUNT(*) FROM attendance) as attendance_records,
       (SELECT COUNT(*) FROM notifications) as notifications_sent;
