# 🚀 Step-by-Step Database Fixes & Sample Data

## **Current Issue:**
The `populate-sample-data.sql` script is trying to insert into columns that don't exist yet (like `phone`, `is_active`).

## **Solution: Execute in the correct order**

### **Step 1: Apply Database Fixes First**
Run this in Supabase Dashboard → SQL Editor:

```sql
-- Copy and paste the ENTIRE contents of fix-database-issues-safe.sql
```

This will:
- ✅ Fix schema inconsistencies
- ✅ Add missing columns (phone, is_active, etc.)
- ✅ Create performance indexes
- ✅ Add useful views

### **Step 2: Populate Sample Data**
After Step 1 completes successfully, run this in Supabase Dashboard → SQL Editor:

```sql
-- Copy and paste the ENTIRE contents of populate-sample-data.sql
```

This will:
- ✅ Add 5 sample students
- ✅ Create 7 enrollments
- ✅ Add more class sessions
- ✅ Create attendance records
- ✅ Add notifications

### **Step 3: Verify Results**
Run this to check everything worked:

```sql
-- Check data counts
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'enrollments', COUNT(*) FROM enrollments
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'attendance', COUNT(*) FROM attendance
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications;
```

### **Expected Results After Both Steps:**
- Users: 6 (1 professor + 5 students)
- Students: 5
- Enrollments: 7
- Sessions: 8 (2 original + 6 new)
- Attendance: 7 records
- Notifications: 7

## **Why This Order Matters:**
1. **Database fixes** add the missing columns
2. **Sample data** uses those columns
3. **Verification** confirms everything works

## **If You Get Errors:**
- Make sure Step 1 completed successfully first
- Check that all columns exist before running Step 2
- Use the verification query to see what data exists

**Ready to proceed? Start with Step 1!** 🚀
