-- Cleanup Old Database Tables
-- This script removes the old schema tables that are no longer needed
-- All old tables are empty, so this is safe to execute

-- Drop old tables in reverse dependency order
DROP TABLE IF EXISTS qr_code_usage CASCADE;
DROP TABLE IF EXISTS attendance_records CASCADE;
DROP TABLE IF EXISTS class_sessions CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Verify cleanup by checking remaining tables
-- The following tables should remain:
-- - users (new optimized schema)
-- - students (new optimized schema)
-- - professors (new optimized schema)
-- - classes (new optimized schema)
-- - sessions (new optimized schema)
-- - attendance (new optimized schema)
-- - qr_usage (new optimized schema)
-- - departments (new optimized schema)
-- - academic_periods (new optimized schema)
-- - enrollments (new optimized schema)

-- Optional: Drop old custom types if they're no longer used
-- (Only do this if you're sure they're not referenced anywhere)
-- DROP TYPE IF EXISTS user_role CASCADE;
-- DROP TYPE IF EXISTS attendance_status CASCADE;

-- Note: We keep the custom types as they might be used by the new schema
