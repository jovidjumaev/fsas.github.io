-- =====================================================
-- ENABLE NOTIFICATIONS READ ACCESS
-- =====================================================
-- This will allow you to read notifications
-- =====================================================

-- Grant SELECT permission to authenticated users
GRANT SELECT ON notifications TO authenticated;
GRANT UPDATE ON notifications TO authenticated;
GRANT DELETE ON notifications TO authenticated;

-- Make sure the table can be accessed
GRANT USAGE ON SCHEMA public TO authenticated;

-- Verify the grants
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.table_privileges
WHERE table_name = 'notifications'
    AND grantee = 'authenticated';

-- Now test if you can select your notifications
-- This should return your test notification
SELECT 
    id, 
    title, 
    message,
    is_read,
    created_at
FROM notifications
WHERE user_id = '03cfe76e-57d1-41dc-89ee-079a69750f1e'
ORDER BY created_at DESC;


