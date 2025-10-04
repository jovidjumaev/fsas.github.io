-- =====================================================
-- SAMPLE NOTIFICATIONS FOR TESTING
-- =====================================================
-- This script creates sample notifications for testing
-- Run this AFTER running notifications-schema.sql
-- =====================================================

-- Note: Replace the user_id values with actual user IDs from your database
-- To find user IDs, run: SELECT id, email, first_name, last_name FROM users WHERE role = 'student';

-- Function to create sample notifications for a student
CREATE OR REPLACE FUNCTION create_sample_notifications_for_student(p_student_user_id UUID)
RETURNS void AS $$
BEGIN
    -- Welcome notification
    PERFORM create_notification(
        p_student_user_id,
        'system',
        'Welcome to FSAS! 🎉',
        'Your account has been successfully created. You can now scan QR codes to mark your attendance.',
        'medium',
        '/student/dashboard',
        NULL,
        NULL,
        '{"welcome": true}'::jsonb
    );

    -- Attendance reminder
    PERFORM create_notification(
        p_student_user_id,
        'attendance_reminder',
        'Class Starting Soon',
        'CSC-475 Seminar in Computer Science starts in 15 minutes. Don''t forget to scan the QR code!',
        'high',
        '/student/scan-qr',
        NULL,
        NULL,
        '{"class_code": "CSC-475", "time": "10:00 AM"}'::jsonb
    );

    -- Attendance marked
    PERFORM create_notification(
        p_student_user_id,
        'attendance_marked',
        'Attendance Recorded ✓',
        'Your attendance for CSC-301 Data Structures has been successfully recorded.',
        'low',
        '/student/attendance',
        NULL,
        NULL,
        '{"status": "present", "class_code": "CSC-301"}'::jsonb
    );

    -- Class announcement
    PERFORM create_notification(
        p_student_user_id,
        'announcement',
        'Important Announcement',
        'Office hours have been extended this week. Available Monday-Friday 2-4 PM.',
        'medium',
        NULL,
        NULL,
        NULL,
        '{"announcement_type": "office_hours"}'::jsonb
    );

    -- Assignment due
    PERFORM create_notification(
        p_student_user_id,
        'assignment_due',
        'Assignment Due Tomorrow ⏰',
        'Your project submission for CSC-475 is due tomorrow at 11:59 PM.',
        'urgent',
        NULL,
        NULL,
        NULL,
        '{"assignment_name": "Final Project", "due_date": "2025-10-05"}'::jsonb
    );

    -- Low attendance warning
    PERFORM create_notification(
        p_student_user_id,
        'system',
        'Attendance Below 80%',
        'Your attendance in CSC-301 has dropped to 75%. Consider attending more regularly to meet course requirements.',
        'high',
        '/student/attendance',
        NULL,
        NULL,
        '{"attendance_rate": 75, "threshold": 80}'::jsonb
    );

    -- Class rescheduled
    PERFORM create_notification(
        p_student_user_id,
        'class_rescheduled',
        'Class Rescheduled',
        'CSC-475 scheduled for Oct 4 has been moved to Oct 5 at the same time.',
        'medium',
        '/student/schedule',
        NULL,
        NULL,
        '{"original_date": "2025-10-04", "new_date": "2025-10-05"}'::jsonb
    );

    RAISE NOTICE 'Created 7 sample notifications for student %', p_student_user_id;
END;
$$ LANGUAGE plpgsql;

-- Example usage (uncomment and replace with actual user ID):
-- SELECT create_sample_notifications_for_student('YOUR-USER-ID-HERE');

-- To create notifications for all students:
-- DO $$
-- DECLARE
--     student_record RECORD;
-- BEGIN
--     FOR student_record IN 
--         SELECT u.id FROM users u 
--         JOIN students s ON u.id = s.user_id 
--         WHERE u.is_active = true
--     LOOP
--         PERFORM create_sample_notifications_for_student(student_record.id);
--     END LOOP;
-- END $$;

COMMENT ON FUNCTION create_sample_notifications_for_student IS 'Creates sample notifications for testing the notification system';

