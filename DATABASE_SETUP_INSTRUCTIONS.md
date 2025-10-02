# 🗄️ Database Setup Instructions

## ✅ **Connection Status: WORKING!**

Your Supabase project is now **successfully connected** with the new API keys! 🎉

## 📋 **Next Step: Apply Database Schema**

The connection is working, but the database tables need to be created. Here's how to do it:

### **Method 1: Using Supabase Dashboard (Recommended)**

1. **Go to your Supabase Dashboard**
   - URL: https://supabase.com/dashboard/project/zdtxqzpgggolbebrsymp

2. **Navigate to SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New Query"

3. **Apply the Database Schema**
   - Copy the entire content from `database/schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the schema

4. **Verify Tables Were Created**
   - Go to "Table Editor" in the left sidebar
   - You should see these tables:
     - `user_profiles`
     - `courses`
     - `class_sessions`
     - `attendance_records`
     - `qr_code_usage`

### **Method 2: Using psql (Advanced)**

If you prefer command line:

```bash
# Get your database connection string from Supabase Dashboard
# Go to Settings → Database → Connection string
psql "postgresql://postgres:[YOUR-PASSWORD]@db.zdtxqzpgggolbebrsymp.supabase.co:5432/postgres" -f database/schema.sql
```

## 🧪 **Test the Setup**

After applying the schema, run this test:

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function test() {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .limit(1);
  
  if (error) {
    console.log('❌ Error:', error.message);
  } else {
    console.log('✅ Success! Tables are working.');
  }
}

test();
"
```

## 📊 **Current Status**

| Component | Status | Notes |
|-----------|--------|-------|
| Supabase Project | ✅ | Active and accessible |
| API Keys | ✅ | New format working |
| Connection | ✅ | Successfully connected |
| Database Schema | ⏳ | Needs to be applied |
| Tables | ⏳ | Will be created after schema |

## 🎯 **After Schema is Applied**

Once you've applied the database schema:

1. **Test the connection** with the command above
2. **Start your application**: `npm run dev`
3. **Create test users** through the app interface
4. **Test all features** (QR code generation, attendance tracking, etc.)

## 🔧 **Troubleshooting**

If you encounter any issues:

1. **Check the SQL Editor logs** for any error messages
2. **Verify all tables were created** in the Table Editor
3. **Check Row Level Security (RLS)** is enabled for all tables
4. **Ensure the schema was applied completely** (all statements executed)

## 🎉 **You're Almost There!**

Your Supabase project is connected and working perfectly. Just apply the database schema and you'll be ready to go!
