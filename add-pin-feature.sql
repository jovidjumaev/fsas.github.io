-- Add pin functionality to class instances
-- This allows professors to pin important classes to the top of their list

-- Add is_pinned column to class_instances table
ALTER TABLE class_instances 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE;

-- Create index for better performance when sorting by pinned status
CREATE INDEX IF NOT EXISTS idx_class_instances_pinned 
ON class_instances(professor_id, is_pinned, created_at DESC);

-- Update the class instances view to include pinned status
CREATE OR REPLACE VIEW class_instances_with_details AS
SELECT 
    ci.*,
    c.code as course_code,
    c.name as course_name,
    c.description as course_description,
    c.credits,
    d.name as department_name,
    d.code as department_code,
    ap.name as academic_period_name,
    ap.year,
    ap.semester,
    ROUND((ci.current_enrollment::DECIMAL / ci.max_students) * 100, 1) as capacity_percentage
FROM class_instances ci
JOIN courses c ON ci.course_id = c.id
JOIN departments d ON c.department_id = d.id
JOIN academic_periods ap ON ci.academic_period_id = ap.id;

-- Add a function to toggle pin status
CREATE OR REPLACE FUNCTION toggle_class_pin(p_class_instance_id UUID, p_professor_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    current_pin_status BOOLEAN;
    new_pin_status BOOLEAN;
BEGIN
    -- Get current pin status
    SELECT is_pinned INTO current_pin_status
    FROM class_instances
    WHERE id = p_class_instance_id 
    AND professor_id = p_professor_id;
    
    -- If class not found or doesn't belong to professor, return false
    IF current_pin_status IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Toggle the pin status
    new_pin_status := NOT current_pin_status;
    
    -- Update the pin status
    UPDATE class_instances
    SET is_pinned = new_pin_status,
        updated_at = NOW()
    WHERE id = p_class_instance_id 
    AND professor_id = p_professor_id;
    
    RETURN new_pin_status;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policy for pin functionality
CREATE POLICY "Users can update pin status of their own classes" ON class_instances
    FOR UPDATE USING (
        professor_id IN (
            SELECT user_id FROM professors 
            WHERE user_id = auth.uid()
        )
    );

-- Verify the changes
SELECT 'Pin feature added successfully!' as status;
SELECT 'is_pinned column added to class_instances' as change;
SELECT 'toggle_class_pin function created' as change;
SELECT 'Index created for better performance' as change;
