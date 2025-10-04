-- =====================================================
-- RESTORE NOTIFICATIONS RLS
-- =====================================================
-- This restores proper RLS policies for notifications
-- =====================================================

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies first (including any duplicates)
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
DROP POLICY IF EXISTS "Anyone can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Authenticated can insert notifications" ON notifications;

-- Create SELECT policy - users can view their own notifications
CREATE POLICY "Users can view own notifications"
    ON notifications
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Create UPDATE policy - users can update their own notifications
CREATE POLICY "Users can update own notifications"
    ON notifications
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Create DELETE policy - users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
    ON notifications
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create INSERT policy - service role can insert for any user
CREATE POLICY "Service role can insert notifications"
    ON notifications
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Also allow authenticated users to insert (for testing)
CREATE POLICY "Authenticated can insert notifications"
    ON notifications
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, UPDATE, DELETE ON notifications TO authenticated;
GRANT ALL ON notifications TO service_role;

-- Verify policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd as operation,
    qual as using_clause,
    with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'notifications'
ORDER BY cmd, policyname;

