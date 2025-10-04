-- =====================================================
-- RESTORE RLS POLICIES ON USERS TABLE
-- =====================================================
-- Run this in Supabase SQL Editor to restore security
-- =====================================================

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Drop any old policies first
DROP POLICY IF EXISTS "users_can_read_own" ON users;
DROP POLICY IF EXISTS "service_role_full_access" ON users;
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "service_role_all" ON users;

-- Create policy for authenticated users to read their own row
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow authenticated users to update their own row
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Create policy for service role (full access)
CREATE POLICY "service_role_all"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verify policies
SELECT policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

