# 🚀 Supabase Setup Guide for FSAS

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up/Login to your account
3. Click "New Project"
4. Fill in project details:
   - **Name**: `fsas-attendance-system`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose closest to your location
5. Click "Create new project"
6. Wait for the project to be created (2-3 minutes)

## Step 2: Get Your Credentials

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy these values:
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **Anon/Public Key** (starts with `eyJ...`)
   - **Service Role Key** (starts with `eyJ...`)

## Step 3: Set Up Database Schema

1. Go to **SQL Editor** in your Supabase dashboard
2. Click "New Query"
3. Copy and paste the entire content from `database/schema.sql`
4. Click "Run" to execute the schema
5. You should see "Success. No rows returned" message

## Step 4: Create Environment File

Create a file called `.env.local` in your project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001

# Security (generate random strings)
JWT_SECRET=your-random-jwt-secret-here
QR_SECRET=your-random-qr-secret-here

# Database Configuration
DATABASE_URL=postgresql://postgres:your-db-password@db.your-project-id.supabase.co:5432/postgres

# Geofencing Configuration (Furman University coordinates)
DEFAULT_LATITUDE=34.9208
DEFAULT_LONGITUDE=-82.4278
GEOFENCE_RADIUS=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Step 5: Test the Setup

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000
3. You should see the login form
4. Try creating a new account or logging in

## Step 6: Create Test Users

### Option A: Use Supabase Auth UI
1. Go to **Authentication** → **Users** in Supabase dashboard
2. Click "Add user"
3. Create test users with these emails:
   - `professor@furman.edu` (role: professor)
   - `student@furman.edu` (role: student)

### Option B: Use the App Registration
1. Use the signup form in the app
2. The app will automatically create user profiles

## Step 7: Verify Database

1. Go to **Table Editor** in Supabase dashboard
2. Check these tables:
   - `user_profiles` - Should have your test users
   - `courses` - Should have sample courses
   - `class_sessions` - Should be empty initially
   - `attendance_records` - Should be empty initially

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error**:
   - Check your `.env.local` file has correct Supabase URL and keys
   - Make sure there are no extra spaces or quotes

2. **"User not found" error**:
   - Check if user exists in `auth.users` table
   - Check if user profile exists in `user_profiles` table

3. **Database connection issues**:
   - Verify your `DATABASE_URL` is correct
   - Check if your database password is correct

4. **RLS (Row Level Security) issues**:
   - Make sure you're logged in
   - Check if RLS policies are correctly set up

### Testing the Full Flow:

1. **Professor Flow**:
   - Login as professor
   - Create a course
   - Create a class session
   - Generate QR code
   - View attendance analytics

2. **Student Flow**:
   - Login as student
   - Scan QR code
   - View attendance history

## Next Steps

Once everything is working:
1. Add more test data
2. Test all features
3. Deploy to production
4. Set up email authentication
5. Configure real-time subscriptions

## Support

If you encounter issues:
1. Check the Supabase logs in the dashboard
2. Check the browser console for errors
3. Verify all environment variables are set correctly
4. Make sure the database schema was applied successfully
