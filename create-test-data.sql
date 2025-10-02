-- Test Data Creation Script for FSAS
-- Run this AFTER setting up users through Supabase Auth

-- First, create test users in Supabase Auth (do this through the dashboard or auth API)
-- Then run this script to create their profiles and sample data

-- Note: Replace these UUIDs with actual user IDs from auth.users table
-- You can get these from the Supabase Auth dashboard or by querying auth.users

-- Example: Create user profiles (replace UUIDs with real ones from auth.users)
/*
INSERT INTO user_profiles (id, student_id, first_name, last_name, email, role) VALUES
  ('REPLACE_WITH_REAL_PROFESSOR_UUID', 'PROF001', 'John', 'Smith', 'john.smith@furman.edu', 'professor'),
  ('REPLACE_WITH_REAL_STUDENT_UUID_1', 'STU001', 'Alice', 'Johnson', 'alice.johnson@furman.edu', 'student'),
  ('REPLACE_WITH_REAL_STUDENT_UUID_2', 'STU002', 'Bob', 'Wilson', 'bob.wilson@furman.edu', 'student'),
  ('REPLACE_WITH_REAL_STUDENT_UUID_3', 'STU003', 'Carol', 'Davis', 'carol.davis@furman.edu', 'student');

-- Create sample courses (replace professor_id with real professor UUID)
INSERT INTO courses (id, course_code, course_name, professor_id, semester, year) VALUES
  ('10000000-0000-0000-0000-000000000001', 'CSC-475', 'Seminar in Computer Science', 'REPLACE_WITH_REAL_PROFESSOR_UUID', 'Fall', 2024),
  ('10000000-0000-0000-0000-000000000002', 'CSC-101', 'Introduction to Computer Science', 'REPLACE_WITH_REAL_PROFESSOR_UUID', 'Fall', 2024);
*/

-- Instructions for creating test data:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Create test users with these emails:
--    - professor@furman.edu (role: professor)
--    - student1@furman.edu (role: student)
--    - student2@furman.edu (role: student)
--    - student3@furman.edu (role: student)
-- 3. Copy their UUIDs from the auth.users table
-- 4. Replace the UUIDs in the commented INSERT statements above
-- 5. Uncomment and run the INSERT statements
-- 6. Or use the application interface to create users and courses
