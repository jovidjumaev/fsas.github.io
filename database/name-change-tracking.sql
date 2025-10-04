-- Name Change Tracking System
-- This table tracks name changes to enforce monthly limits

CREATE TABLE IF NOT EXISTS name_change_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    old_first_name TEXT,
    old_last_name TEXT,
    new_first_name TEXT NOT NULL,
    new_last_name TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_name_change_history_user_id ON name_change_history(user_id);
CREATE INDEX IF NOT EXISTS idx_name_change_history_changed_at ON name_change_history(changed_at);

-- Function to check if user can change name (max 2 times per month)
CREATE OR REPLACE FUNCTION can_change_name(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
    change_count INTEGER;
    current_month_start DATE;
BEGIN
    -- Get the start of current month
    current_month_start := DATE_TRUNC('month', CURRENT_DATE);
    
    -- Count name changes in current month
    SELECT COUNT(*)
    INTO change_count
    FROM name_change_history
    WHERE user_id = user_uuid
    AND changed_at >= current_month_start;
    
    -- Return true if less than 2 changes this month
    RETURN change_count < 2;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get remaining name changes for user
CREATE OR REPLACE FUNCTION get_remaining_name_changes(user_uuid UUID)
RETURNS INTEGER AS $$
DECLARE
    change_count INTEGER;
    current_month_start DATE;
BEGIN
    -- Get the start of current month
    current_month_start := DATE_TRUNC('month', CURRENT_DATE);
    
    -- Count name changes in current month
    SELECT COUNT(*)
    INTO change_count
    FROM name_change_history
    WHERE user_id = user_uuid
    AND changed_at >= current_month_start;
    
    -- Return remaining changes (2 - current count)
    RETURN GREATEST(0, 2 - change_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record name change
CREATE OR REPLACE FUNCTION record_name_change(
    user_uuid UUID,
    old_first_name TEXT,
    old_last_name TEXT,
    new_first_name TEXT,
    new_last_name TEXT,
    change_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    can_change BOOLEAN;
BEGIN
    -- Check if user can change name
    SELECT can_change_name(user_uuid) INTO can_change;
    
    IF NOT can_change THEN
        RETURN FALSE;
    END IF;
    
    -- Record the name change
    INSERT INTO name_change_history (
        user_id,
        old_first_name,
        old_last_name,
        new_first_name,
        new_last_name,
        reason
    ) VALUES (
        user_uuid,
        old_first_name,
        old_last_name,
        new_first_name,
        new_last_name,
        change_reason
    );
    
    -- Update user profile
    UPDATE user_profiles
    SET 
        first_name = new_first_name,
        last_name = new_last_name,
        updated_at = NOW()
    WHERE id = user_uuid;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies
ALTER TABLE name_change_history ENABLE ROW LEVEL SECURITY;

-- Users can only see their own name change history
CREATE POLICY "Users can view own name change history" ON name_change_history
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own name changes (through the function)
CREATE POLICY "Users can insert own name changes" ON name_change_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT ON name_change_history TO authenticated;
GRANT EXECUTE ON FUNCTION can_change_name(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_remaining_name_changes(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION record_name_change(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
