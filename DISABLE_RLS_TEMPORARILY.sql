-- =====================================================
-- DISABLE RLS TEMPORARILY FOR TESTING
-- =====================================================
-- This will disable RLS to test if that's the issue
-- WARNING: This removes security temporarily!
-- =====================================================

-- Completely disable RLS
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'notifications';

-- Test query - should work now
SELECT 
    id,
    user_id,
    title,
    message,
    is_read,
    created_at
FROM notifications
ORDER BY created_at DESC
LIMIT 5;

-- Show message
DO $$
BEGIN
    RAISE NOTICE 'RLS is now DISABLED for notifications table';
    RAISE NOTICE 'Refresh your dashboard - notifications should now load';
    RAISE NOTICE 'After testing, run RESTORE_NOTIFICATIONS_RLS.sql to re-enable security';
END $$;


