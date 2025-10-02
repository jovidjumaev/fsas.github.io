-- =====================================================
-- CLEANUP SCRIPT: Remove Duplicate Tables
-- =====================================================
-- This script safely removes the old schema tables
-- while keeping the new simplified schema tables
-- =====================================================

-- First, let's verify both schemas exist and have data
-- (This is just for verification - you can run this separately)

-- Check old schema tables
SELECT 'OLD SCHEMA TABLES' as info;
SELECT 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles
UNION ALL
SELECT 'courses' as table_name, COUNT(*) as record_count FROM courses
UNION ALL
SELECT 'class_sessions' as table_name, COUNT(*) as record_count FROM class_sessions
UNION ALL
SELECT 'attendance_records' as table_name, COUNT(*) as record_count FROM attendance_records
UNION ALL
SELECT 'qr_code_usage' as table_name, COUNT(*) as record_count FROM qr_code_usage;

-- Check new schema tables
SELECT 'NEW SCHEMA TABLES' as info;
SELECT 'users' as table_name, COUNT(*) as record_count FROM users
UNION ALL
SELECT 'classes' as table_name, COUNT(*) as record_count FROM classes
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as record_count FROM sessions
UNION ALL
SELECT 'attendance' as table_name, COUNT(*) as record_count FROM attendance
UNION ALL
SELECT 'qr_usage' as table_name, COUNT(*) as record_count FROM qr_usage;

-- =====================================================
-- STEP 1: Disable RLS on old tables (if enabled)
-- =====================================================
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;
ALTER TABLE class_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records DISABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_usage DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 2: Drop RLS policies on old tables
-- =====================================================
DROP POLICY IF EXISTS "Allow public read access to user_profiles" ON user_profiles;
DROP POLICY IF EXISTS "Allow public read access to courses" ON courses;
DROP POLICY IF EXISTS "Allow public read access to class_sessions" ON class_sessions;
DROP POLICY IF EXISTS "Allow public read access to attendance_records" ON attendance_records;
DROP POLICY IF EXISTS "Allow public read access to qr_code_usage" ON qr_code_usage;

-- Drop role-based policies
DROP POLICY IF EXISTS "Professors can manage their own courses" ON courses;
DROP POLICY IF EXISTS "Professors can manage sessions for their courses" ON class_sessions;
DROP POLICY IF EXISTS "Professors can view all attendance for their courses" ON attendance_records;
DROP POLICY IF EXISTS "Professors can view QR usage for their courses" ON qr_code_usage;
DROP POLICY IF EXISTS "Students can view their own attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Students can insert their own attendance records" ON attendance_records;
DROP POLICY IF EXISTS "Students can view their own qr_code_usage" ON qr_code_usage;
DROP POLICY IF EXISTS "Students can insert their own qr_code_usage" ON qr_code_usage;

-- =====================================================
-- STEP 3: Drop foreign key constraints (in correct order)
-- =====================================================
-- Drop constraints that reference the tables we're about to delete
ALTER TABLE class_sessions DROP CONSTRAINT IF EXISTS class_sessions_course_id_fkey;
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_session_id_fkey;
ALTER TABLE attendance_records DROP CONSTRAINT IF EXISTS attendance_records_student_id_fkey;
ALTER TABLE qr_code_usage DROP CONSTRAINT IF EXISTS qr_code_usage_session_id_fkey;
ALTER TABLE qr_code_usage DROP CONSTRAINT IF EXISTS qr_code_usage_used_by_fkey;
ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_professor_id_fkey;

-- =====================================================
-- STEP 4: Drop old schema tables
-- =====================================================
-- Drop in reverse dependency order
DROP TABLE IF EXISTS qr_code_usage CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS class_sessions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- =====================================================
-- STEP 5: Verify cleanup
-- =====================================================
-- Check that old tables are gone
SELECT 'VERIFICATION: Old tables should be gone' as info;
SELECT 'user_profiles' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
            THEN 'STILL EXISTS' 
            ELSE 'SUCCESSFULLY DROPPED' 
       END as status;

-- Check that new tables still exist
SELECT 'VERIFICATION: New tables should still exist' as info;
SELECT 'users' as table_name, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
            THEN 'EXISTS' 
            ELSE 'MISSING' 
       END as status;

-- =====================================================
-- STEP 6: Final verification - show remaining tables
-- =====================================================
SELECT 'FINAL TABLE COUNT' as info;
SELECT table_name, 
       CASE 
         WHEN table_name IN ('users', 'classes', 'sessions', 'attendance', 'qr_usage') 
         THEN '✅ NEW SCHEMA'
         ELSE '❓ OTHER'
       END as schema_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- =====================================================
-- CLEANUP COMPLETE!
-- =====================================================
-- You should now have only the new simplified schema:
-- - users (instead of user_profiles)
-- - classes (instead of courses)  
-- - sessions (instead of class_sessions)
-- - attendance (instead of attendance_records)
-- - qr_usage (instead of qr_code_usage)
-- =====================================================
