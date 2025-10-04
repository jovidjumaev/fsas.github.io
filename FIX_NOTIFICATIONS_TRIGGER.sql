-- =====================================================
-- FIX NOTIFICATIONS TRIGGER ERROR
-- =====================================================
-- Run this if you get: trigger "notifications_updated_at" already exists
-- This will safely drop and recreate all triggers
-- =====================================================

-- Drop all existing triggers
DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;
DROP TRIGGER IF EXISTS attendance_marked_notification ON attendance_records;
DROP TRIGGER IF EXISTS session_active_notification ON class_sessions;

-- Recreate notifications_updated_at trigger
CREATE TRIGGER notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_timestamp();

-- Recreate attendance_marked_notification trigger (if attendance_records table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'attendance_records') THEN
        CREATE TRIGGER attendance_marked_notification
            AFTER INSERT ON attendance_records
            FOR EACH ROW
            EXECUTE FUNCTION notify_attendance_marked();
    END IF;
END $$;

-- Recreate session_active_notification trigger (if class_sessions table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'class_sessions') THEN
        CREATE TRIGGER session_active_notification
            AFTER UPDATE ON class_sessions
            FOR EACH ROW
            WHEN (NEW.is_active IS DISTINCT FROM OLD.is_active)
            EXECUTE FUNCTION notify_session_active();
    END IF;
END $$;

-- Verify triggers were created
SELECT 
    trigger_name,
    event_object_table,
    event_manipulation,
    action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
    AND trigger_name IN (
        'notifications_updated_at',
        'attendance_marked_notification',
        'session_active_notification'
    )
ORDER BY event_object_table, trigger_name;

