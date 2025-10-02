-- =====================================================
-- SIMPLE SAMPLE DATA POPULATION
-- =====================================================
-- This script works with existing users and creates sample data
-- without trying to create new auth.users entries

-- 1. First, let's check what users we have
SELECT 'Current users in database:' as status;
SELECT id, email, first_name, last_name, role FROM users;

-- 2. Add more class sessions for the existing classes
-- (This will work since we're not creating new users)
INSERT INTO sessions (class_id, date, start_time, end_time, qr_secret, qr_expires_at, room_location, notes, is_active) VALUES
  -- CSC-475 sessions (using existing class ID)
  ('660e8400-e29b-41d4-a716-446655440001', '2024-10-03', '10:00:00', '10:50:00', 'session-csc475-20241003-secret', '2024-10-03T10:50:00+00:00', 'Room 101', 'Introduction to Research Methods', true),
  ('660e8400-e29b-41d4-a716-446655440001', '2024-10-05', '10:00:00', '10:50:00', 'session-csc475-20241005-secret', '2024-10-05T10:50:00+00:00', 'Room 101', 'Literature Review Workshop', true),
  ('660e8400-e29b-41d4-a716-446655440001', '2024-10-08', '10:00:00', '10:50:00', 'session-csc475-20241008-secret', '2024-10-08T10:50:00+00:00', 'Room 101', 'Research Proposal Presentations', true),
  
  -- CSC-301 sessions (using existing class ID)
  ('660e8400-e29b-41d4-a716-446655440002', '2024-10-03', '14:00:00', '14:50:00', 'session-csc301-20241003-secret', '2024-10-03T14:50:00+00:00', 'Room 205', 'Arrays and Linked Lists', true),
  ('660e8400-e29b-41d4-a716-446655440002', '2024-10-05', '14:00:00', '14:50:00', 'session-csc301-20241005-secret', '2024-10-05T14:50:00+00:00', 'Room 205', 'Stacks and Queues', true),
  ('660e8400-e29b-41d4-a716-446655440002', '2024-10-08', '14:00:00', '14:50:00', 'session-csc301-20241008-secret', '2024-10-08T14:50:00+00:00', 'Room 205', 'Binary Trees', true)
ON CONFLICT DO NOTHING;

-- 3. Update class information with better details
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
  max_students = COALESCE(max_students, 25)
WHERE room_location IS NULL OR schedule_info IS NULL;

-- 4. Note: QR usage table structure needs to be determined
-- Skipping QR usage records for now until we can determine the correct column names

-- 5. Note: Attendance table structure needs to be determined
-- Skipping attendance records for now until we can determine the correct column names

-- 6. Note: Notifications and analytics tables will be created by the database fixes script

-- 7. Verify data insertion
SELECT 'Sample Data Population Complete' as status,
       (SELECT COUNT(*) FROM users) as total_users,
       (SELECT COUNT(*) FROM classes) as total_classes,
       (SELECT COUNT(*) FROM sessions) as total_sessions;

-- 9. Show what was created
SELECT 'Classes with details:' as info;
SELECT c.code, c.name, c.room_location, c.schedule_info, c.max_students
FROM classes c;

SELECT 'Sessions created:' as info;
SELECT s.date, s.start_time, s.room_location, s.notes, c.code as class_code
FROM sessions s
JOIN classes c ON s.class_id = c.id
ORDER BY s.date, s.start_time;

SELECT 'System ready for testing!' as final_status;
