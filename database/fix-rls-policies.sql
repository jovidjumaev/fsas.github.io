-- =====================================================
-- FIX RLS POLICIES FOR SIGN-IN
-- =====================================================
-- This script fixes RLS policies that are blocking sign-in
-- Run this in Supabase SQL Editor if sign-in is hanging
-- =====================================================

-- First, let's check current policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Drop existing problematic policies on users table
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;

-- Create new, permissive policies for users table

-- Policy 1: Users can view their own profile
CREATE POLICY "users_select_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Service role can do anything (for admin operations)
CREATE POLICY "service_role_all"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Policy 3: Allow users to update their own profile
CREATE POLICY "users_update_own"
ON users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Check the new policies
SELECT 
    policyname,
    cmd,
    roles
FROM pg_policies 
WHERE tablename = 'users'
ORDER BY policyname;

-- Test query (replace with your user ID)
-- SELECT * FROM users WHERE id = auth.uid();

COMMENT ON TABLE users IS 'User profiles with RLS policies allowing users to view/update own profile and service role full access';

