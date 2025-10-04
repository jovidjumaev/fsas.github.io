-- Add status column to class_instances table
ALTER TABLE class_instances 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed'));

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_class_instances_status ON class_instances(status);

-- Update existing records to have 'active' status
UPDATE class_instances 
SET status = 'active' 
WHERE status IS NULL;