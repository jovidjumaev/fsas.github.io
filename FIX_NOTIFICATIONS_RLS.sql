-- =====================================================
-- FIX NOTIFICATIONS RLS POLICIES
-- =====================================================
-- This fixes the RLS policies to allow users to access their notifications
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, let's check what auth.uid() returns for debugging
SELECT 
    auth.uid() as current_auth_uid,
    current_user,
    session_user;

-- Drop all existing policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Service role can insert notifications" ON notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

-- Disable RLS temporarily to test
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Let's verify the table exists and has data
SELECT COUNT(*) as total_notifications FROM notifications;

-- Check if there are any notifications for your user
SELECT 
    id, 
    user_id, 
    title, 
    is_read, 
    created_at 
FROM notifications 
LIMIT 5;

-- Now re-enable RLS with fixed policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create new policies with proper auth check
CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications"
    ON notifications FOR DELETE
    USING (auth.uid() = user_id);

-- Allow service role to insert (for system notifications)
CREATE POLICY "Service role can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Grant necessary permissions
GRANT SELECT, UPDATE, DELETE ON notifications TO authenticated;
GRANT INSERT ON notifications TO service_role;

-- Verify policies are created
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename = 'notifications';


