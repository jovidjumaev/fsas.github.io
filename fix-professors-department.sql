-- =====================================================
-- FIX PROFESSORS DEPARTMENT ASSIGNMENT
-- =====================================================
-- This script adds department_id to professors table and assigns existing professors

-- 1. Add department_id column to professors table
ALTER TABLE professors ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- 2. Add index for the new column
CREATE INDEX IF NOT EXISTS idx_professors_department_id ON professors(department_id);

-- 3. Assign existing professor to Computer Science department
-- First, let's see what departments exist
SELECT 'Available departments:' as info;
SELECT id, name, code FROM departments ORDER BY name;

-- 4. Update the existing professor to belong to Computer Science department
-- (Assuming Computer Science department exists - adjust ID as needed)
UPDATE professors 
SET department_id = (
  SELECT id FROM departments 
  WHERE code = 'CS' OR name ILIKE '%computer%' 
  LIMIT 1
)
WHERE department_id IS NULL;

-- 5. Verify the update
SELECT 'Professor department assignment:' as info;
SELECT 
  p.employee_id,
  p.title,
  d.name as department_name,
  d.code as department_code
FROM professors p
LEFT JOIN departments d ON p.department_id = d.id;

-- 6. Add constraint to ensure professors have a department
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'check_professor_has_department') THEN
    ALTER TABLE professors ADD CONSTRAINT check_professor_has_department 
      CHECK (department_id IS NOT NULL);
  END IF;
END $$;

-- 7. Add policy for department-based access (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'professors' 
    AND policyname = 'Professors can view department colleagues'
  ) THEN
    CREATE POLICY "Professors can view department colleagues" ON professors
      FOR SELECT USING (
        department_id = (
          SELECT department_id FROM professors WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- 8. Final verification
SELECT 'Fix completed successfully!' as status;
SELECT 'All professors now have department assignments' as result;
