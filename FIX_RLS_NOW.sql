-- =====================================================
-- RLS FIX FOR SIGN-IN - RUN THIS IN SUPABASE NOW!
-- =====================================================

-- Step 1: Drop ALL existing policies on users table
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "service_role_all" ON users;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON users;
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "users_can_read_own" ON users;
DROP POLICY IF EXISTS "service_role_full_access" ON users;

-- Step 2: Create NEW simple policy for authenticated users
CREATE POLICY "users_can_read_own"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Step 3: Create policy for service role
CREATE POLICY "service_role_full_access"
ON users FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Step 4: Ensure RLS is enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 5: Verify policies
SELECT 
    policyname,
    cmd,
    roles,
    qual
FROM pg_policies 
WHERE tablename = 'users';

