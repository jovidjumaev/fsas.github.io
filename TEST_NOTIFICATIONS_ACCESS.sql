-- =====================================================
-- TEST NOTIFICATIONS ACCESS
-- =====================================================
-- Run this in Supabase SQL Editor to diagnose the issue
-- =====================================================

-- 1. Check your current auth user ID
SELECT auth.uid() as my_auth_id;

-- 2. Check if notifications table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
) as table_exists;

-- 3. Check RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'notifications';

-- 4. Count total notifications (bypass RLS as superuser)
SELECT COUNT(*) as total_notifications FROM notifications;

-- 5. Check if there are notifications for your specific user
-- Replace 'YOUR_USER_ID' with your actual user ID: 03cfe76e-57d1-41dc-89ee-079a69750f1e
SELECT 
    id, 
    user_id, 
    title, 
    message,
    is_read, 
    created_at 
FROM notifications 
WHERE user_id = '03cfe76e-57d1-41dc-89ee-079a69750f1e'
ORDER BY created_at DESC;

-- 6. Check current policies
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual as policy_condition
FROM pg_policies 
WHERE tablename = 'notifications';

-- 7. Test if you can insert a test notification
INSERT INTO notifications (user_id, type, priority, title, message)
VALUES (
    '03cfe76e-57d1-41dc-89ee-079a69750f1e',
    'system',
    'low',
    'Test Notification',
    'If you can see this, the insert worked!'
)
RETURNING id, title, created_at;


