# 👥 How to Add Real Students to FSAS

## **The Issue:**
The `users` table has a foreign key constraint to `auth.users(id)`, which means we can't just insert arbitrary UUIDs. Students must be created through Supabase Auth first.

## **Solution: Two Approaches**

### **Approach 1: Use Simple Sample Data (Recommended for Testing)**
Run `populate-sample-data-simple.sql` which:
- ✅ Works with existing professor user
- ✅ Creates class sessions and attendance records
- ✅ Tests the system without creating new users
- ✅ Shows how the system works

### **Approach 2: Add Real Students (For Production)**

#### **Step 1: Create Students in Supabase Auth**
1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** or **"Invite User"**
3. Create students with these details:

**Student 1:**
- Email: `john.doe@student.furman.edu`
- Password: `password123`
- User ID: `11111111-1111-1111-1111-111111111111`

**Student 2:**
- Email: `jane.smith@student.furman.edu`
- Password: `password123`
- User ID: `22222222-2222-2222-2222-222222222222`

**Student 3:**
- Email: `mike.johnson@student.furman.edu`
- Password: `password123`
- User ID: `33333333-3333-3333-3333-333333333333`

#### **Step 2: Add Student Profiles**
After creating users in Auth, run this SQL:

```sql
-- Add student profiles (only after creating users in Supabase Auth)
INSERT INTO users (id, email, first_name, last_name, role) VALUES
  ('11111111-1111-1111-1111-111111111111', 'john.doe@student.furman.edu', 'John', 'Doe', 'student'),
  ('22222222-2222-2222-2222-222222222222', 'jane.smith@student.furman.edu', 'Jane', 'Smith', 'student'),
  ('33333333-3333-3333-3333-333333333333', 'mike.johnson@student.furman.edu', 'Mike', 'Johnson', 'student')
ON CONFLICT (id) DO NOTHING;

INSERT INTO students (user_id, student_id, enrollment_year, major, gpa) VALUES
  ('11111111-1111-1111-1111-111111111111', 'STU001', 2024, 'Computer Science', 3.75),
  ('22222222-2222-2222-2222-222222222222', 'STU002', 2024, 'Computer Science', 3.50),
  ('33333333-3333-3333-3333-333333333333', 'STU003', 2024, 'Mathematics', 3.25)
ON CONFLICT (user_id) DO NOTHING;

-- Add enrollments
INSERT INTO enrollments (student_id, class_id, enrolled_by, status) VALUES
  ('11111111-1111-1111-1111-111111111111', '660e8400-e29b-41d4-a716-446655440001', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active'),
  ('22222222-2222-2222-2222-222222222222', '660e8400-e29b-41d4-a716-446655440001', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active'),
  ('11111111-1111-1111-1111-111111111111', '660e8400-e29b-41d4-a716-446655440002', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active'),
  ('33333333-3333-3333-3333-333333333333', '660e8400-e29b-41d4-a716-446655440002', 'ab52f03d-fbe1-45f8-8bc6-71fe6d71fffb', 'active')
ON CONFLICT (student_id, class_id) DO NOTHING;
```

## **Recommended Next Steps:**

1. **First:** Run `populate-sample-data-simple.sql` to test the system
2. **Then:** Add real students through Supabase Auth if needed
3. **Finally:** Test the full enrollment and attendance system

## **Why This Approach?**
- **Testing:** Simple approach lets you test the system immediately
- **Production:** Real students through Auth for actual use
- **Flexibility:** You can choose which approach fits your needs

**Start with the simple approach to see the system working!** 🚀
