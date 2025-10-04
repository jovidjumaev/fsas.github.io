# Add Status Column to Class Instances

## Database Schema Update Required

The class management features require a `status` column in the `class_instances` table. Please run the following SQL in your Supabase SQL editor:

```sql
-- Add status column to class_instances table
ALTER TABLE class_instances 
ADD COLUMN status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed'));

-- Add an index for better performance when filtering by status
CREATE INDEX IF NOT EXISTS idx_class_instances_status ON class_instances(status);

-- Update existing records to have 'active' status
UPDATE class_instances 
SET status = 'active' 
WHERE status IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN class_instances.status IS 'Class status: active (default), inactive, or completed';
```

## What This Enables

After adding this column, the following features will work:

1. **Delete Class Option**: Three-dot menu in classes page will have a "Delete Class" option
2. **Status Management**: Manage page will have status buttons (Active/Inactive/Complete)
3. **API Endpoints**: 
   - `DELETE /api/class-instances/:id` - Delete a class instance
   - `PATCH /api/class-instances/:id/status` - Update class status

## Status Values

- `active`: Class is currently active and accepting enrollments
- `inactive`: Class is temporarily disabled
- `completed`: Class has finished and is archived

## Steps to Apply

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Paste and run the SQL above
4. Verify the column was added successfully
5. Test the new features in the application

## Verification

After running the SQL, you can verify it worked by checking:
- The `class_instances` table should have a `status` column
- All existing records should have `status = 'active'`
- The new API endpoints should work without errors
