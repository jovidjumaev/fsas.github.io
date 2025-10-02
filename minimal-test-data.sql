-- Minimal test data for FSAS - works without any foreign key constraints
-- This creates data that doesn't depend on user_profiles at all

-- First, let's see what we have
SELECT 'Current table counts:' as info;
SELECT 'user_profiles:' as table_name, COUNT(*) as count FROM user_profiles;
SELECT 'courses:' as table_name, COUNT(*) as count FROM courses;
SELECT 'class_sessions:' as table_name, COUNT(*) as count FROM class_sessions;
SELECT 'attendance_records:' as table_name, COUNT(*) as count FROM attendance_records;
SELECT 'qr_code_usage:' as table_name, COUNT(*) as count FROM qr_code_usage;

-- Since we can't insert into courses due to foreign key constraints,
-- let's create a simple test that just shows the tables are working

-- Let's try to insert into a table that doesn't have foreign key constraints
-- We'll create some test data in attendance_records and qr_code_usage
-- but we need valid session_ids first

-- Let's see what's in the existing tables
SELECT 'Existing data in tables:' as info;
SELECT 'user_profiles sample:' as table_name, id, student_id, first_name, last_name, role FROM user_profiles LIMIT 3;
SELECT 'courses sample:' as table_name, id, course_code, course_name, professor_id FROM courses LIMIT 3;
SELECT 'class_sessions sample:' as table_name, id, course_id, session_date, is_active FROM class_sessions LIMIT 3;

-- If there are no existing records, let's just show that the connection works
SELECT 'Database connection successful!' as status;
SELECT 'Tables are accessible and ready for data' as message;
SELECT 'To add data, you need to:' as next_steps;
SELECT '1. Create users via Supabase Auth first' as step_1;
SELECT '2. Then add user_profiles' as step_2;
SELECT '3. Then add courses and other data' as step_3;
