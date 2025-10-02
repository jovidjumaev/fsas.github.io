# 🚀 Supabase Setup Guide for FSAS

## Step 1: Create a New Supabase Project

1. **Go to [Supabase Dashboard](https://supabase.com/dashboard)**
2. **Sign in** with your GitHub, Google, or email account
3. **Click "New Project"**
4. **Fill in the project details:**
   - **Name**: `fsas-attendance-system`
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Choose the closest to your location
   - **Pricing Plan**: Free tier is sufficient for development

5. **Click "Create new project"**
6. **Wait for the project to be created** (this takes 1-2 minutes)

## Step 2: Get Your Project Credentials

1. **Go to Settings → API** in your Supabase dashboard
2. **Copy the following values:**
   - **Project URL** (looks like: `https://your-project-id.supabase.co`)
   - **anon public key** (starts with `eyJ...`)
   - **service_role key** (starts with `eyJ...`)

## Step 3: Update Environment Variables

1. **Open your `.env.local` file** in the project root
2. **Replace the existing values** with your new credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
API_PORT=3001

# Security
JWT_SECRET=your_jwt_secret_key_here
QR_SECRET=your_qr_secret_key_here
ENCRYPTION_KEY=your_encryption_key_here

# Redis Configuration (optional)
REDIS_URL=redis://localhost:6379

# Geofencing (Furman University coordinates)
NEXT_PUBLIC_CLASSROOM_LAT=34.9224
NEXT_PUBLIC_CLASSROOM_LNG=-82.4365
NEXT_PUBLIC_GEOFENCE_RADIUS=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Development
NODE_ENV=development
```

## Step 4: Apply Database Schema

1. **Go to SQL Editor** in your Supabase dashboard
2. **Click "New Query"**
3. **Copy the entire content** from `database/schema.sql` file
4. **Paste it into the SQL Editor**
5. **Click "Run"** to execute the schema
6. **Verify the tables were created** by checking the Table Editor

## Step 5: Test the Connection

1. **Run the test script:**
   ```bash
   node test-supabase-connection.js
   ```

2. **If successful, start the application:**
   ```bash
   npm run dev
   ```

3. **Visit the debug page:**
   - Go to `http://localhost:3000/debug-page`
   - Check if Supabase shows as connected

## Step 6: Create Test Data (Optional)

1. **Go to Table Editor** in Supabase dashboard
2. **Create a test user profile:**
   - Table: `user_profiles`
   - Add a row with sample data

3. **Create a test course:**
   - Table: `courses`
   - Add a row with sample data

## Troubleshooting

### Common Issues:

1. **"Invalid API key" error:**
   - Double-check your API keys in `.env.local`
   - Make sure there are no extra spaces or quotes

2. **"Project not found" error:**
   - Verify your project URL is correct
   - Check if the project is still being created

3. **Database connection fails:**
   - Make sure you've applied the schema
   - Check if RLS policies are enabled

4. **Port 3001 already in use:**
   - Run: `lsof -ti:3001 | xargs kill -9`
   - Or change the port in `.env.local`

### Getting Help:

- Check the Supabase documentation: https://supabase.com/docs
- Visit the Supabase Discord: https://discord.supabase.com
- Check the project's `SUPABASE_STATUS_REPORT.md` for detailed status

## Success Indicators

✅ **Environment variables loaded**  
✅ **Supabase connected successfully**  
✅ **Database connection successful**  
✅ **Project is accessible**  
✅ **Frontend running on port 3000**  
✅ **Backend running on port 3001**  

Once all indicators are green, your FSAS system is ready to use!
