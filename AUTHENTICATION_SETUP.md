# 🔐 FSAS Authentication Setup Guide

This guide will help you set up the authentication system for the Furman Smart Attendance System (FSAS).

## 🚨 **CRITICAL ISSUES FIXED**

The original project had several authentication problems that have been resolved:

### **Problems Identified:**
1. ❌ **Database Schema Mismatch** - Auth context expected different table structures
2. ❌ **Missing User Role Enum** - Database didn't have the required user_role enum
3. ❌ **Broken Supabase Integration** - Auth context wasn't properly integrated with Supabase Auth
4. ❌ **Missing Database Tables** - Required authentication tables were missing

### **Solutions Implemented:**
1. ✅ **Fixed Database Schema** - Created proper user authentication tables
2. ✅ **Added User Role Enum** - Implemented user_role enum in database
3. ✅ **Fixed Auth Context** - Updated authentication context to work with database
4. ✅ **Created Setup Scripts** - Automated database setup process

## 🛠️ **Setup Instructions**

### **Step 1: Environment Configuration**

Make sure your `.env.local` file has the correct Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### **Step 2: Database Setup**

#### **Option A: Automated Setup (Recommended)**
```bash
npm run setup-db
```

#### **Option B: Manual Setup**
1. Open your Supabase dashboard
2. Go to SQL Editor
3. Copy the contents of `database/fixed-user-schema.sql`
4. Paste and execute the SQL script

### **Step 3: Verify Setup**

1. **Check Tables Created:**
   - `users` - Core user authentication data
   - `students` - Student-specific information
   - `professors` - Professor-specific information
   - `departments` - Department structure
   - `academic_periods` - Academic calendar
   - `classes` - Course management
   - `enrollments` - Student-course relationships
   - `sessions` - Class sessions
   - `attendance` - Attendance records
   - `qr_usage` - QR code tracking

2. **Check RLS Policies:**
   - Row Level Security is enabled on all tables
   - Users can only access their own data
   - Proper role-based access control

3. **Test Authentication:**
   - Try registering a new student account
   - Try registering a new professor account
   - Test login functionality

## 📊 **Database Schema Overview**

### **Core Authentication Tables:**

```sql
-- Users table (linked to Supabase Auth)
users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email VARCHAR(255) NOT NULL UNIQUE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL, -- 'student', 'professor', 'admin'
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)

-- Student-specific data
students (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  student_id VARCHAR(20) UNIQUE NOT NULL,
  enrollment_year INTEGER NOT NULL,
  major VARCHAR(100),
  gpa DECIMAL(3,2),
  graduation_date DATE
)

-- Professor-specific data
professors (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  employee_id VARCHAR(20) UNIQUE NOT NULL,
  title VARCHAR(100),
  office_location VARCHAR(100),
  phone VARCHAR(20)
)
```

### **User Role Enum:**
```sql
CREATE TYPE user_role AS ENUM ('student', 'professor', 'admin');
```

## 🔧 **Authentication Flow**

### **User Registration:**
1. User fills out registration form
2. Supabase Auth creates user account
3. Database trigger creates user profile
4. Role-specific profile is created (student/professor)
5. User is redirected to appropriate dashboard

### **User Login:**
1. User enters email/password and selects role
2. Supabase Auth validates credentials
3. System fetches user role from database
4. Role is verified against selected role
5. User is redirected to appropriate dashboard

### **Role-Based Access:**
- **Students:** Can view their own data, scan QR codes, view attendance
- **Professors:** Can manage courses, create sessions, view analytics
- **Admins:** Full system access (future implementation)

## 🛡️ **Security Features**

### **Row Level Security (RLS):**
- Users can only access their own data
- Students can only see their own enrollments and attendance
- Professors can only see their own courses and students
- Public read access for departments and academic periods

### **Data Validation:**
- Email format validation
- Password strength requirements
- Role-specific field validation
- Unique constraints on student/employee IDs

### **Supabase Integration:**
- Secure authentication handled by Supabase
- JWT tokens for session management
- Automatic user profile creation via triggers
- Real-time authentication state updates

## 🧪 **Testing the Authentication System**

### **Test Student Registration:**
1. Go to `/register`
2. Select "Student" role
3. Fill in required fields:
   - First Name: John
   - Last Name: Doe
   - Email: john.doe@furman.edu
   - Student Number: S2024001
   - Password: password123
4. Click "Create Account"
5. Should redirect to student dashboard

### **Test Professor Registration:**
1. Go to `/register`
2. Select "Professor" role
3. Fill in required fields:
   - First Name: Jane
   - Last Name: Smith
   - Email: jane.smith@furman.edu
   - Employee ID: EMP-001
   - Password: password123
4. Click "Create Account"
5. Should redirect to professor dashboard

### **Test Login:**
1. Go to `/` (login page)
2. Enter registered email and password
3. Select correct role
4. Click "Sign In"
5. Should redirect to appropriate dashboard

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **"User profile not found" error:**
   - Check if the database trigger is working
   - Verify the user was created in the `users` table
   - Check Supabase logs for errors

2. **"Role verification failed" error:**
   - Ensure the user has the correct role in the database
   - Check if the role-specific profile was created
   - Verify the role enum is properly defined

3. **Database connection errors:**
   - Verify Supabase credentials in `.env.local`
   - Check if the database is accessible
   - Ensure the service role key has proper permissions

4. **RLS policy errors:**
   - Check if RLS is enabled on all tables
   - Verify the policies are correctly defined
   - Test with different user roles

### **Debug Steps:**

1. **Check Database Tables:**
   ```sql
   SELECT * FROM users;
   SELECT * FROM students;
   SELECT * FROM professors;
   ```

2. **Check RLS Policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

3. **Test Authentication:**
   - Use browser dev tools to check network requests
   - Check Supabase dashboard for auth logs
   - Verify user creation in Supabase Auth

## 📝 **Next Steps**

After setting up authentication:

1. **Test the complete flow** - Registration, login, dashboard access
2. **Add sample data** - Create test courses, sessions, and enrollments
3. **Test QR code functionality** - Create sessions and test QR scanning
4. **Implement additional features** - Analytics, reporting, etc.

## 🆘 **Support**

If you encounter issues:

1. Check the browser console for errors
2. Check Supabase dashboard logs
3. Verify database schema is correct
4. Test with a fresh user account
5. Check environment variables

---

**✅ Authentication system is now fully functional and ready for use!**
