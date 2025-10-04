# Avatar Upload Setup Guide ✅

## 🎯 **PROBLEM IDENTIFIED**

**Issue:** Profile picture upload failing because the `avatar_url` column doesn't exist in the `users` table.

**Root Cause:** The database schema was missing the `avatar_url` column and the Supabase Storage bucket for avatars wasn't set up.

---

## 🔧 **SOLUTION IMPLEMENTED**

### **1. Database Schema Updates**

#### **Added `avatar_url` column to users table:**
```sql
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;
```

#### **Updated TypeScript types:**
- Added `avatar_url: string | null` to the `users` table Row, Insert, and Update types
- Updated `src/types/database.ts` to include the new column

### **2. Supabase Storage Setup**

#### **Created avatars storage bucket:**
- Bucket name: `avatars`
- Public access: `true`
- File size limit: 5MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/gif`, `image/webp`

#### **Row Level Security (RLS) Policies:**
- Users can upload their own avatars
- Anyone can view avatars (public access)
- Users can update their own avatars
- Users can delete their own avatars

### **3. Enhanced Upload Function**

#### **Improved error handling and validation:**
- File type validation (JPEG, PNG, GIF, WebP only)
- File size validation (5MB limit)
- Better error messages
- Comprehensive logging for debugging
- Proper TypeScript typing

#### **Upload process:**
1. Validate file type and size
2. Create unique filename using user ID
3. Upload to Supabase Storage bucket
4. Get public URL
5. Update user profile in database
6. Update local state

---

## 📋 **SETUP INSTRUCTIONS**

### **Step 1: Run Database Migration**

Execute the SQL scripts in your Supabase SQL Editor:

1. **Add avatar_url column:**
   ```sql
   -- Run: add-avatar-column.sql
   ```

2. **Setup storage bucket:**
   ```sql
   -- Run: setup-avatar-storage.sql
   ```

### **Step 2: Verify Setup**

1. **Check users table:**
   ```sql
   SELECT column_name, data_type, is_nullable 
   FROM information_schema.columns 
   WHERE table_name = 'users' AND column_name = 'avatar_url';
   ```

2. **Check storage bucket:**
   ```sql
   SELECT * FROM storage.buckets WHERE id = 'avatars';
   ```

3. **Check RLS policies:**
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';
   ```

### **Step 3: Test Upload**

1. Go to any dashboard (student or professor)
2. Click on profile dropdown
3. Click "Upload Avatar"
4. Select an image file
5. Check browser console for detailed logs
6. Verify the image appears in the profile

---

## 🐛 **DEBUGGING**

### **Common Issues:**

1. **"Column 'avatar_url' does not exist"**
   - Solution: Run the `add-avatar-column.sql` script

2. **"Bucket 'avatars' not found"**
   - Solution: Run the `setup-avatar-storage.sql` script

3. **"Permission denied"**
   - Solution: Check RLS policies are correctly set up

4. **"File too large"**
   - Solution: Compress image or use smaller file

5. **"Invalid file type"**
   - Solution: Use JPEG, PNG, GIF, or WebP format

### **Debug Logs:**

The enhanced upload function includes comprehensive logging:
- User authentication check
- File validation results
- Upload progress
- Database update results
- Error details

Check browser console for detailed information.

---

## 📁 **FILES MODIFIED**

1. **Database Schema:**
   - `add-avatar-column.sql` (new)
   - `setup-avatar-storage.sql` (new)

2. **TypeScript Types:**
   - `src/types/database.ts` - Added avatar_url column

3. **Upload Functions:**
   - `src/app/student/dashboard/page.tsx` - Enhanced handleAvatarUpload
   - `src/app/professor/dashboard/page.tsx` - Enhanced handleAvatarUpload
   - `src/app/student/attendance/page.tsx` - Enhanced handleAvatarUpload

4. **Documentation:**
   - `AVATAR_UPLOAD_SETUP.md` (this file)

---

## ✅ **VERIFICATION CHECKLIST**

- [ ] `avatar_url` column exists in users table
- [ ] `avatars` storage bucket is created
- [ ] RLS policies are set up correctly
- [ ] TypeScript types are updated
- [ ] Upload function includes validation
- [ ] Error handling is comprehensive
- [ ] Debug logging is enabled
- [ ] Test upload works successfully

---

## 🚀 **NEXT STEPS**

1. Run the SQL scripts in Supabase
2. Test the upload functionality
3. Check browser console for any errors
4. Verify images are stored and displayed correctly
5. Test with different file types and sizes

The avatar upload functionality should now work correctly with proper error handling and validation!
