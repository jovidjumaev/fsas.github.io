-- =====================================================
-- NOTIFICATIONS SYSTEM FOR FSAS
-- =====================================================
-- This schema creates a comprehensive notification system
-- for students and professors
-- =====================================================

-- Create notification types enum
DO $$ BEGIN
    CREATE TYPE notification_type AS ENUM (
        'attendance_reminder',
        'attendance_marked',
        'class_cancelled',
        'class_rescheduled',
        'grade_posted',
        'assignment_due',
        'announcement',
        'system'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create notification priority enum
DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM (
        'low',
        'medium',
        'high',
        'urgent'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type notification_type NOT NULL,
    priority notification_priority DEFAULT 'medium',
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500), -- Optional link to related resource
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Related entities (optional, for context)
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
    
    -- Metadata
    metadata JSONB DEFAULT '{}', -- Store additional data
    expires_at TIMESTAMP WITH TIME ZONE, -- Auto-delete after this date
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Auto-update timestamp
CREATE OR REPLACE FUNCTION update_notifications_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF NEW.is_read = true AND OLD.is_read = false THEN
        NEW.read_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS notifications_updated_at ON notifications;

CREATE TRIGGER notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_notifications_timestamp();

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_type notification_type,
    p_title VARCHAR(255),
    p_message TEXT,
    p_priority notification_priority DEFAULT 'medium',
    p_link VARCHAR(500) DEFAULT NULL,
    p_class_id UUID DEFAULT NULL,
    p_session_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO notifications (
        user_id, type, title, message, priority, link, 
        class_id, session_id, metadata
    ) VALUES (
        p_user_id, p_type, p_title, p_message, p_priority, p_link,
        p_class_id, p_session_id, p_metadata
    ) RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notification as read
CREATE OR REPLACE FUNCTION mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE notifications 
    SET is_read = true, read_at = NOW() 
    WHERE id = p_notification_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to mark all notifications as read for a user
CREATE OR REPLACE FUNCTION mark_all_notifications_read(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notifications 
    SET is_read = true, read_at = NOW() 
    WHERE user_id = p_user_id AND is_read = false;
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM notifications
    WHERE user_id = p_user_id AND is_read = false;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired notifications (run periodically)
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE expires_at IS NOT NULL AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old read notifications (run periodically)
-- Keeps only last 30 days of read notifications
CREATE OR REPLACE FUNCTION cleanup_old_read_notifications()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE is_read = true 
    AND read_at < NOW() - INTERVAL '30 days';
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATIC NOTIFICATIONS
-- =====================================================

-- Notify student when attendance is marked
CREATE OR REPLACE FUNCTION notify_attendance_marked()
RETURNS TRIGGER AS $$
DECLARE
    v_class_name VARCHAR(255);
    v_session_date DATE;
    v_user_id UUID;
BEGIN
    -- Get class and session info
    SELECT c.class_name, s.date, st.user_id
    INTO v_class_name, v_session_date, v_user_id
    FROM sessions s
    JOIN classes c ON s.class_id = c.id
    JOIN students st ON st.user_id = NEW.student_id
    WHERE s.id = NEW.session_id;
    
    -- Create notification
    PERFORM create_notification(
        v_user_id,
        'attendance_marked',
        'Attendance Recorded',
        format('Your attendance for %s on %s has been marked as %s.', 
               v_class_name, v_session_date::text, NEW.status),
        CASE 
            WHEN NEW.status = 'absent' THEN 'high'
            WHEN NEW.status = 'late' THEN 'medium'
            ELSE 'low'
        END,
        '/student/attendance',
        NULL,
        NEW.session_id,
        jsonb_build_object('status', NEW.status, 'scanned_at', NEW.scanned_at)
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS attendance_marked_notification ON attendance;

CREATE TRIGGER attendance_marked_notification
    AFTER INSERT ON attendance
    FOR EACH ROW
    EXECUTE FUNCTION notify_attendance_marked();

-- Notify students when a class session becomes active (QR code available)
CREATE OR REPLACE FUNCTION notify_session_active()
RETURNS TRIGGER AS $$
DECLARE
    v_class_name VARCHAR(255);
    v_student RECORD;
BEGIN
    -- Only notify when session becomes active
    IF NEW.is_active = true AND (OLD.is_active = false OR OLD.is_active IS NULL) THEN
        -- Get class name
        SELECT class_name INTO v_class_name
        FROM classes
        WHERE id = NEW.class_id;
        
        -- Notify all enrolled students
        FOR v_student IN
            SELECT e.student_id, s.user_id
            FROM enrollments e
            JOIN students s ON e.student_id = s.user_id
            WHERE e.class_id = NEW.class_id
        LOOP
            PERFORM create_notification(
                v_student.user_id,
                'attendance_reminder',
                'Class is Now Active!',
                format('QR code is now available for %s. Scan to mark your attendance.', v_class_name),
                'high',
                '/student/scan-qr',
                NEW.class_id,
                NEW.id,
                jsonb_build_object('session_date', NEW.date, 'room', NEW.room_location)
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists, then create it
DROP TRIGGER IF EXISTS session_active_notification ON sessions;

CREATE TRIGGER session_active_notification
    AFTER UPDATE ON sessions
    FOR EACH ROW
    WHEN (NEW.is_active IS DISTINCT FROM OLD.is_active)
    EXECUTE FUNCTION notify_session_active();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Users can only see their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

-- System can insert notifications (service role)
CREATE POLICY "Service role can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- =====================================================
-- SAMPLE NOTIFICATIONS (for testing)
-- =====================================================

COMMENT ON TABLE notifications IS 'Stores all user notifications with read status and metadata';
COMMENT ON FUNCTION create_notification IS 'Helper function to create a new notification';
COMMENT ON FUNCTION mark_notification_read IS 'Mark a single notification as read';
COMMENT ON FUNCTION mark_all_notifications_read IS 'Mark all notifications as read for a user';
COMMENT ON FUNCTION get_unread_notification_count IS 'Get count of unread notifications for a user';
COMMENT ON FUNCTION cleanup_expired_notifications IS 'Remove expired notifications (should be run periodically)';
COMMENT ON FUNCTION cleanup_old_read_notifications IS 'Remove old read notifications (keeps last 30 days)';

