# 👥 How to Add Real Students to FSAS

## 🚨 **Important Note**
The `users` table has a foreign key constraint that requires users to exist in Supabase's `auth.users` table first. You cannot create users directly in the `users` table.

## 🔧 **Two Approaches:**

### **Approach 1: Simplified Testing (Current)**
Use the `add-sample-students-simple.sql` script which:
- ✅ Creates sample attendance records using the existing professor
- ✅ Creates sample QR usage records
- ✅ Tests the system functionality
- ❌ No real students (uses professor ID for testing)

### **Approach 2: Real Students (Production)**
To add real students, you need to:

#### **Step 1: Create Students in Supabase Auth**
1. Go to your Supabase Dashboard
2. Navigate to **Authentication** → **Users**
3. Click **"Add User"**
4. Create users with:
   - Email: `student@furman.edu`
   - Password: (temporary password)
   - Email Confirmed: ✅

#### **Step 2: Add Student Profiles**
After creating users in Auth, run this SQL:

```sql
-- Get the user ID from auth.users (replace with actual ID)
INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at) 
VALUES (
  'USER_ID_FROM_AUTH', 
  'student@furman.edu', 
  'Student', 
  'Name', 
  'student', 
  NOW(), 
  NOW()
);

-- Add student profile
INSERT INTO students (user_id, student_id, enrollment_year, major, gpa, created_at, updated_at)
VALUES (
  'USER_ID_FROM_AUTH',
  'STU001',
  2024,
  'Computer Science',
  3.75,
  NOW(),
  NOW()
);
```

#### **Step 3: Create Enrollments**
```sql
-- Enroll student in classes
INSERT INTO enrollments (id, student_id, class_id, academic_period_id, enrolled_by, enrollment_date, status, created_at)
VALUES (
  gen_random_uuid(),
  'USER_ID_FROM_AUTH',
  (SELECT id FROM classes WHERE code = 'CSC-475' LIMIT 1),
  (SELECT id FROM academic_periods WHERE name = 'Fall 2024' LIMIT 1),
  'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb',
  '2024-09-01',
  'active',
  NOW()
);
```

## 🎯 **Recommended for Testing:**

For now, use **Approach 1** (`add-sample-students-simple.sql`) because:
- ✅ Quick and easy
- ✅ Tests all functionality
- ✅ No auth setup required
- ✅ Perfect for development/testing

## 🚀 **Next Steps:**

1. **Run the simplified script** to get sample data
2. **Test the attendance system** with the sample data
3. **When ready for production**, use Approach 2 to add real students

The simplified approach will give you everything you need to test the system! 🎉
