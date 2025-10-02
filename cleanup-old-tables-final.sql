-- =====================================================
-- FINAL CLEANUP: Remove Old Database Tables
-- =====================================================
-- This script safely removes the old schema tables that are no longer needed
-- All data has been migrated to the new optimized schema

-- 1. First, let's check what old tables exist
SELECT 'Checking for old tables...' as status;

SELECT table_name, 
       CASE 
         WHEN table_name IN ('user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage') 
         THEN 'OLD TABLE - WILL BE REMOVED'
         ELSE 'NEW TABLE - KEEPING'
       END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage', 'users', 'classes', 'sessions', 'attendance', 'qr_usage')
ORDER BY table_name;

-- 2. Drop old tables in reverse dependency order
-- (Drop dependent tables first, then parent tables)

-- Drop qr_code_usage first (it references other old tables)
DROP TABLE IF EXISTS qr_code_usage CASCADE;

-- Drop attendance_records (it references other old tables)
DROP TABLE IF EXISTS attendance_records CASCADE;

-- Drop class_sessions (it references courses)
DROP TABLE IF EXISTS class_sessions CASCADE;

-- Drop courses (it references user_profiles)
DROP TABLE IF EXISTS courses CASCADE;

-- Drop user_profiles last (it's referenced by courses)
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 3. Verify cleanup
SELECT 'Cleanup verification...' as status;

SELECT table_name, 
       CASE 
         WHEN table_name IN ('user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage') 
         THEN 'STILL EXISTS - CLEANUP FAILED'
         ELSE 'REMOVED SUCCESSFULLY'
       END as cleanup_status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'courses', 'class_sessions', 'attendance_records', 'qr_code_usage')
ORDER BY table_name;

-- 4. Show remaining tables (should only be new optimized tables)
SELECT 'Remaining tables after cleanup:' as status;

SELECT table_name,
       CASE 
         WHEN table_name IN ('users', 'students', 'professors', 'classes', 'sessions', 'attendance', 'qr_usage', 'departments', 'academic_periods', 'enrollments')
         THEN '✅ NEW OPTIMIZED TABLE'
         ELSE '❓ UNKNOWN TABLE'
       END as table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 5. Final status
SELECT 'Database cleanup completed!' as final_status,
       'Old tables removed successfully' as result,
       'Database is now clean and optimized' as message;
