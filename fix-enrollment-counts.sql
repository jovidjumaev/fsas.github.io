-- Fix enrollment counts to match actual enrollments
-- This script will update the current_enrollment field to match the actual count of active enrollments

-- First, let's see the current state
SELECT '=== CURRENT ENROLLMENT STATE ===' as section;

SELECT 
    ci.id,
    ci.class_code,
    ci.current_enrollment as stored_count,
    COUNT(e.id) as actual_count,
    CASE 
        WHEN ci.current_enrollment = COUNT(e.id) THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM class_instances ci
LEFT JOIN enrollments e ON ci.id = e.class_instance_id AND e.status = 'active'
GROUP BY ci.id, ci.class_code, ci.current_enrollment
ORDER BY ci.class_code;

-- Update all enrollment counts to match actual enrollments
UPDATE class_instances 
SET current_enrollment = (
    SELECT COUNT(*) 
    FROM enrollments 
    WHERE class_instance_id = class_instances.id 
    AND status = 'active'
);

-- Verify the fix
SELECT '=== AFTER FIX ===' as section;

SELECT 
    ci.id,
    ci.class_code,
    ci.current_enrollment as stored_count,
    COUNT(e.id) as actual_count,
    CASE 
        WHEN ci.current_enrollment = COUNT(e.id) THEN '✅ Match'
        ELSE '❌ Mismatch'
    END as status
FROM class_instances ci
LEFT JOIN enrollments e ON ci.id = e.class_instance_id AND e.status = 'active'
GROUP BY ci.id, ci.class_code, ci.current_enrollment
ORDER BY ci.class_code;

-- Check if triggers exist
SELECT '=== TRIGGER STATUS ===' as section;

SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_name LIKE '%enrollment%'
ORDER BY event_object_table, trigger_name;

-- If triggers don't exist, create them
CREATE OR REPLACE FUNCTION update_enrollment_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        UPDATE class_instances 
        SET current_enrollment = (
            SELECT COUNT(*) 
            FROM enrollments 
            WHERE class_instance_id = NEW.class_instance_id 
            AND status = 'active'
        )
        WHERE id = NEW.class_instance_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE class_instances 
        SET current_enrollment = (
            SELECT COUNT(*) 
            FROM enrollments 
            WHERE class_instance_id = OLD.class_instance_id 
            AND status = 'active'
        )
        WHERE id = OLD.class_instance_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trigger_update_enrollment_count ON enrollments;
CREATE TRIGGER trigger_update_enrollment_count
    AFTER INSERT OR UPDATE OR DELETE ON enrollments
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_count();

SELECT '✅ Enrollment counts fixed and triggers created!' as status;
