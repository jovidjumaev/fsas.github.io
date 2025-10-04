-- =====================================================
-- PASSWORD UNIQUENESS TRACKING SYSTEM
-- =====================================================
-- This system tracks password hashes to prevent duplicate passwords
-- across all users in the system

-- Create password tracking table
CREATE TABLE IF NOT EXISTS password_tracking (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index on password hash to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_password_tracking_hash ON password_tracking(password_hash);

-- Create index on user_id for quick lookups
CREATE INDEX IF NOT EXISTS idx_password_tracking_user_id ON password_tracking(user_id);

-- Enable RLS
ALTER TABLE password_tracking ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can do everything (for admin operations)
CREATE POLICY "service_role_all" ON password_tracking
    FOR ALL TO service_role
    USING (true) WITH CHECK (true);

-- Users can only see their own password records
CREATE POLICY "users_select_own" ON password_tracking
    FOR SELECT TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own password records
CREATE POLICY "users_insert_own" ON password_tracking
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own password records
CREATE POLICY "users_update_own" ON password_tracking
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Function to check if password hash already exists
CREATE OR REPLACE FUNCTION password_hash_exists(password_hash_to_check VARCHAR(255))
RETURNS BOOLEAN AS $$
DECLARE
    hash_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO hash_count
    FROM password_tracking
    WHERE password_hash = password_hash_to_check;
    
    RETURN hash_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record password hash
CREATE OR REPLACE FUNCTION record_password_hash(
    user_uuid UUID,
    password_hash_to_record VARCHAR(255)
)
RETURNS BOOLEAN AS $$
BEGIN
    -- Check if password already exists
    IF password_hash_exists(password_hash_to_record) THEN
        RETURN FALSE;
    END IF;
    
    -- Insert or update password hash for user
    INSERT INTO password_tracking (user_id, password_hash)
    VALUES (user_uuid, password_hash_to_record)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        password_hash = password_hash_to_record,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON password_tracking TO authenticated;
GRANT EXECUTE ON FUNCTION password_hash_exists(VARCHAR(255)) TO authenticated;
GRANT EXECUTE ON FUNCTION record_password_hash(UUID, VARCHAR(255)) TO authenticated;

-- Grant service role permissions
GRANT ALL ON password_tracking TO service_role;
GRANT EXECUTE ON FUNCTION password_hash_exists(VARCHAR(255)) TO service_role;
GRANT EXECUTE ON FUNCTION record_password_hash(UUID, VARCHAR(255)) TO service_role;
