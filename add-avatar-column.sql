-- =====================================================
-- ADD AVATAR_URL COLUMN TO USERS TABLE
-- =====================================================
-- This script adds the missing avatar_url column to the users table
-- to support profile picture uploads

-- Add avatar_url column to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment to document the column
COMMENT ON COLUMN users.avatar_url IS 'URL of the user profile picture stored in Supabase Storage';

-- Update the updated_at timestamp when avatar_url changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at when avatar_url changes
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
