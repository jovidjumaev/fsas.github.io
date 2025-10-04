-- =====================================================
-- PROFESSOR NOTIFICATION TRIGGERS
-- =====================================================
-- This script adds notification triggers specifically for professors
-- to receive alerts about their classes and students
-- =====================================================

-- Add new notification types for professors
DO $$ BEGIN
    -- Check if the enum type exists and add new values
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notification_type') THEN
        -- Add new notification types for professors
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'student_scanned';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'low_attendance_alert';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'session_reminder';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_enrollment';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'weekly_summary';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'session_expired';
        ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'attendance_milestone';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not add notification types: %', SQLERRM;
END $$;

-- =====================================================
-- PROFESSOR NOTIFICATION FUNCTIONS
-- =====================================================

-- Function to notify professor when a student scans QR code
CREATE OR REPLACE FUNCTION notify_professor_student_scan()
RETURNS TRIGGER AS $$
DECLARE
    v_professor_id UUID;
    v_class_name VARCHAR(255);
    v_student_name VARCHAR(255);
    v_session_date DATE;
BEGIN
    -- Get professor, class, and student info
    SELECT 
        c.professor_id,
        c.name,
        CONCAT(u.first_name, ' ', u.last_name),
        s.date
    INTO 
        v_professor_id,
        v_class_name,
        v_student_name,
        v_session_date
    FROM sessions s
    JOIN classes c ON s.class_id = c.id
    JOIN users u ON NEW.student_id = u.id
    WHERE s.id = NEW.session_id;
    
    -- Create notification for professor
    PERFORM create_notification(
        v_professor_id,
        'student_scanned',
        'Student Checked In',
        format('%s just scanned for %s on %s at %s', 
               v_student_name, 
               v_class_name, 
               v_session_date::text,
               NEW.scanned_at::time::text),
        'low',
        format('/professor/sessions/active/%s', NEW.session_id),
        NULL,
        NEW.session_id,
        jsonb_build_object(
            'student_name', v_student_name,
            'status', NEW.status,
            'scanned_at', NEW.scanned_at
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check attendance rates and alert professors
CREATE OR REPLACE FUNCTION check_low_attendance()
RETURNS void AS $$
DECLARE
    v_session RECORD;
    v_professor_id UUID;
    v_attendance_rate NUMERIC;
    v_total_enrolled INTEGER;
    v_present_count INTEGER;
BEGIN
    -- Check sessions from the last 24 hours
    FOR v_session IN
        SELECT 
            s.id,
            s.class_id,
            s.date,
            c.name as class_name,
            c.code as class_code,
            c.professor_id
        FROM sessions s
        JOIN classes c ON s.class_id = c.id
        WHERE s.date >= CURRENT_DATE - INTERVAL '1 day'
        AND s.is_active = false -- Only completed sessions
    LOOP
        -- Get enrollment count
        SELECT COUNT(*) INTO v_total_enrolled
        FROM enrollments e
        WHERE e.class_id = v_session.class_id
        AND e.status = 'active';
        
        -- Get attendance count
        SELECT COUNT(*) INTO v_present_count
        FROM attendance a
        WHERE a.session_id = v_session.id
        AND a.status IN ('present', 'late');
        
        -- Calculate attendance rate
        IF v_total_enrolled > 0 THEN
            v_attendance_rate := (v_present_count::NUMERIC / v_total_enrolled::NUMERIC) * 100;
            
            -- Alert if attendance is below 70%
            IF v_attendance_rate < 70 THEN
                PERFORM create_notification(
                    v_session.professor_id,
                    'low_attendance_alert',
                    'Low Attendance Alert',
                    format('Class %s had only %s%% attendance (%s/%s students) on %s', 
                           v_session.class_code,
                           ROUND(v_attendance_rate, 1),
                           v_present_count,
                           v_total_enrolled,
                           v_session.date::text),
                    'high',
                    format('/professor/analytics?class=%s', v_session.class_id),
                    v_session.class_id,
                    v_session.id,
                    jsonb_build_object(
                        'attendance_rate', v_attendance_rate,
                        'present_count', v_present_count,
                        'total_enrolled', v_total_enrolled
                    )
                );
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to notify professor about new enrollments
CREATE OR REPLACE FUNCTION notify_professor_new_enrollment()
RETURNS TRIGGER AS $$
DECLARE
    v_professor_id UUID;
    v_class_name VARCHAR(255);
    v_class_code VARCHAR(20);
    v_student_name VARCHAR(255);
BEGIN
    -- Get professor, class, and student info
    SELECT 
        c.professor_id,
        c.name,
        c.code,
        CONCAT(u.first_name, ' ', u.last_name)
    INTO 
        v_professor_id,
        v_class_name,
        v_class_code,
        v_student_name
    FROM classes c
    JOIN users u ON NEW.student_id = u.id
    WHERE c.id = NEW.class_id;
    
    -- Create notification for professor
    PERFORM create_notification(
        v_professor_id,
        'new_enrollment',
        'New Student Enrollment',
        format('%s has been enrolled in %s (%s)', 
               v_student_name, 
               v_class_name,
               v_class_code),
        'medium',
        format('/professor/students?class=%s', NEW.class_id),
        NEW.class_id,
        NULL,
        jsonb_build_object(
            'student_name', v_student_name,
            'enrollment_date', NEW.enrollment_date
        )
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to remind professor about upcoming sessions
CREATE OR REPLACE FUNCTION remind_professor_upcoming_sessions()
RETURNS void AS $$
DECLARE
    v_session RECORD;
BEGIN
    -- Find sessions starting in the next 30 minutes
    FOR v_session IN
        SELECT 
            s.id,
            s.class_id,
            s.date,
            s.start_time,
            s.room_location,
            c.name as class_name,
            c.code as class_code,
            c.professor_id
        FROM sessions s
        JOIN classes c ON s.class_id = c.id
        WHERE s.date = CURRENT_DATE
        AND s.start_time BETWEEN 
            (CURRENT_TIME + INTERVAL '25 minutes') AND 
            (CURRENT_TIME + INTERVAL '35 minutes')
        AND s.is_active = false
    LOOP
        PERFORM create_notification(
            v_session.professor_id,
            'session_reminder',
            'Class Starting Soon',
            format('%s (%s) starts in 30 minutes at %s in %s', 
                   v_session.class_name,
                   v_session.class_code,
                   v_session.start_time::text,
                   v_session.room_location),
            'high',
            format('/professor/sessions?class=%s', v_session.class_id),
            v_session.class_id,
            v_session.id,
            jsonb_build_object(
                'session_time', v_session.start_time,
                'room', v_session.room_location
            )
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to notify when QR code expires without stopping session
CREATE OR REPLACE FUNCTION notify_session_expired()
RETURNS void AS $$
DECLARE
    v_session RECORD;
BEGIN
    -- Find sessions where QR code has expired but session is still active
    FOR v_session IN
        SELECT 
            s.id,
            s.class_id,
            c.name as class_name,
            c.code as class_code,
            c.professor_id
        FROM sessions s
        JOIN classes c ON s.class_id = c.id
        WHERE s.is_active = true
        AND s.qr_code_expires_at < NOW()
    LOOP
        PERFORM create_notification(
            v_session.professor_id,
            'session_expired',
            'Session QR Code Expired',
            format('QR code for %s (%s) has expired but session is still active. Please stop the session or refresh the QR code.', 
                   v_session.class_name,
                   v_session.class_code),
            'urgent',
            format('/professor/sessions/active/%s', v_session.id),
            v_session.class_id,
            v_session.id,
            jsonb_build_object('expired_at', NOW())
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to generate weekly attendance summary for professors
CREATE OR REPLACE FUNCTION generate_weekly_summary()
RETURNS void AS $$
DECLARE
    v_professor RECORD;
    v_total_sessions INTEGER;
    v_avg_attendance NUMERIC;
    v_top_class VARCHAR(255);
    v_low_class VARCHAR(255);
BEGIN
    -- Generate summary for each professor
    FOR v_professor IN
        SELECT DISTINCT p.user_id as professor_id, u.first_name
        FROM professors p
        JOIN users u ON p.user_id = u.id
        WHERE u.is_active = true
    LOOP
        -- Get weekly stats
        SELECT 
            COUNT(DISTINCT s.id),
            ROUND(AVG(
                CASE 
                    WHEN enrolled.total > 0 THEN 
                        (attended.count::NUMERIC / enrolled.total::NUMERIC) * 100 
                    ELSE 0 
                END
            ), 1)
        INTO v_total_sessions, v_avg_attendance
        FROM sessions s
        JOIN classes c ON s.class_id = c.id
        LEFT JOIN (
            SELECT s.id as session_id, COUNT(*) as count
            FROM sessions s
            JOIN attendance a ON s.id = a.session_id
            WHERE a.status IN ('present', 'late')
            GROUP BY s.id
        ) attended ON s.id = attended.session_id
        LEFT JOIN (
            SELECT c.id as class_id, COUNT(*) as total
            FROM classes c
            JOIN enrollments e ON c.id = e.class_id
            WHERE e.status = 'active'
            GROUP BY c.id
        ) enrolled ON c.id = enrolled.class_id
        WHERE c.professor_id = v_professor.professor_id
        AND s.date >= CURRENT_DATE - INTERVAL '7 days'
        AND s.date < CURRENT_DATE;
        
        -- Only send if there were sessions this week
        IF v_total_sessions > 0 THEN
            PERFORM create_notification(
                v_professor.professor_id,
                'weekly_summary',
                'Weekly Attendance Summary',
                format('This week: %s sessions with %s%% average attendance. Check your analytics for detailed insights.',
                       v_total_sessions,
                       COALESCE(v_avg_attendance, 0)),
                'medium',
                '/professor/analytics',
                NULL,
                NULL,
                jsonb_build_object(
                    'total_sessions', v_total_sessions,
                    'avg_attendance', v_avg_attendance,
                    'week_start', (CURRENT_DATE - INTERVAL '7 days')::text,
                    'week_end', (CURRENT_DATE - INTERVAL '1 day')::text
                )
            );
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- CREATE TRIGGERS
-- =====================================================

-- Trigger for student scan notifications
DROP TRIGGER IF EXISTS professor_student_scan_notification ON attendance;
CREATE TRIGGER professor_student_scan_notification
    AFTER INSERT ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION notify_professor_student_scan();

-- Trigger for new enrollment notifications
DROP TRIGGER IF EXISTS professor_new_enrollment_notification ON enrollments;
CREATE TRIGGER professor_new_enrollment_notification
    AFTER INSERT ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION notify_professor_new_enrollment();

-- =====================================================
-- SCHEDULED FUNCTIONS (Run via cron or scheduled jobs)
-- =====================================================

-- These functions should be called periodically:
-- 1. check_low_attendance() - Run daily at end of day
-- 2. remind_professor_upcoming_sessions() - Run every 15 minutes during class hours
-- 3. notify_session_expired() - Run every 5 minutes
-- 4. generate_weekly_summary() - Run weekly on Sunday nights

-- Example cron schedule (to be set up in your deployment):
-- # Check low attendance daily at 11 PM
-- 0 23 * * * psql -d your_db -c "SELECT check_low_attendance();"
-- 
-- # Remind about upcoming sessions every 15 minutes from 7 AM to 6 PM
-- */15 7-18 * * 1-5 psql -d your_db -c "SELECT remind_professor_upcoming_sessions();"
-- 
-- # Check for expired sessions every 5 minutes during class hours
-- */5 7-18 * * 1-5 psql -d your_db -c "SELECT notify_session_expired();"
-- 
-- # Generate weekly summary every Sunday at 9 PM
-- 0 21 * * 0 psql -d your_db -c "SELECT generate_weekly_summary();"

-- =====================================================
-- HELPER FUNCTIONS FOR MANUAL TESTING
-- =====================================================

-- Function to manually trigger low attendance check
CREATE OR REPLACE FUNCTION test_low_attendance_notification()
RETURNS void AS $$
BEGIN
    PERFORM check_low_attendance();
    RAISE NOTICE 'Low attendance check completed';
END;
$$ LANGUAGE plpgsql;

-- Function to manually trigger upcoming session reminders
CREATE OR REPLACE FUNCTION test_session_reminders()
RETURNS void AS $$
BEGIN
    PERFORM remind_professor_upcoming_sessions();
    RAISE NOTICE 'Session reminders sent';
END;
$$ LANGUAGE plpgsql;

-- Function to manually generate weekly summary
CREATE OR REPLACE FUNCTION test_weekly_summary()
RETURNS void AS $$
BEGIN
    PERFORM generate_weekly_summary();
    RAISE NOTICE 'Weekly summary generated';
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON FUNCTION notify_professor_student_scan() IS 'Notifies professor when a student scans QR code for attendance';
COMMENT ON FUNCTION check_low_attendance() IS 'Checks for low attendance rates and alerts professors';
COMMENT ON FUNCTION notify_professor_new_enrollment() IS 'Notifies professor when a new student enrolls in their class';
COMMENT ON FUNCTION remind_professor_upcoming_sessions() IS 'Reminds professors about sessions starting in 30 minutes';
COMMENT ON FUNCTION notify_session_expired() IS 'Alerts professors when QR codes expire but sessions are still active';
COMMENT ON FUNCTION generate_weekly_summary() IS 'Generates weekly attendance summary for professors';

-- =====================================================
-- SAMPLE TEST DATA INSERTION (for testing purposes)
-- =====================================================

-- Uncomment to create sample notifications for testing:
/*
-- Create a sample notification for testing
DO $$
DECLARE
    v_professor_id UUID;
BEGIN
    -- Get a professor ID (replace with actual professor ID)
    SELECT user_id INTO v_professor_id FROM professors LIMIT 1;
    
    IF v_professor_id IS NOT NULL THEN
        -- Create sample notifications
        PERFORM create_notification(
            v_professor_id,
            'student_scanned',
            'Test: Student Scanned',
            'John Doe just scanned for CSC-475 on 2024-10-03 at 10:05 AM',
            'low',
            '/professor/sessions/active/test-session',
            NULL,
            NULL,
            '{"test": true}'::jsonb
        );
        
        PERFORM create_notification(
            v_professor_id,
            'low_attendance_alert',
            'Test: Low Attendance Alert',
            'Class CSC-150 had only 65% attendance (13/20 students) on 2024-10-03',
            'high',
            '/professor/analytics',
            NULL,
            NULL,
            '{"test": true}'::jsonb
        );
        
        RAISE NOTICE 'Sample professor notifications created for professor: %', v_professor_id;
    ELSE
        RAISE NOTICE 'No professors found in database';
    END IF;
END $$;
*/
