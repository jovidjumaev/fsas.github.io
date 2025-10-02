-- Simple connection test for FSAS
-- This just verifies the database is working without trying to insert data

-- Test 1: Check if tables exist and are accessible
SELECT 'Database Connection Test' as test_name;
SELECT 'user_profiles table:' as table_name, COUNT(*) as record_count FROM user_profiles;
SELECT 'courses table:' as table_name, COUNT(*) as record_count FROM courses;
SELECT 'class_sessions table:' as table_name, COUNT(*) as record_count FROM class_sessions;
SELECT 'attendance_records table:' as table_name, COUNT(*) as record_count FROM attendance_records;
SELECT 'qr_code_usage table:' as table_name, COUNT(*) as record_count FROM qr_code_usage;

-- Test 2: Show table structure
SELECT 'Table structure check:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position;

-- Test 3: Show that we can query the tables
SELECT 'Query test successful!' as status;
SELECT 'All tables are accessible and ready for data' as message;
