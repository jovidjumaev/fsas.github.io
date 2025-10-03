# 🔑 How to Fix the "Invalid API Key" Error

## Problem
Your Supabase API keys are outdated or invalid, causing sign-in failures.

## Solution Steps

### 1. Get Your Current Supabase Keys

1. **Open your Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**: `zdtxqzpgggolbebrsymp`
3. **Go to**: Settings → API
4. **Copy these keys**:
   - `Project URL` (looks like: `https://xxxxx.supabase.co`)
   - `anon public` key (under "Project API keys")
   - `service_role` key (under "Project API keys")

### 2. Update Your .env.local File

Open `/Users/jovidjumaev/Downloads/fsas/.env.local` and update these lines:

```env
NEXT_PUBLIC_SUPABASE_URL=<your-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-public-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

### 3. Restart Your Development Servers

After updating the keys:

```bash
# Stop the current servers (Ctrl+C)
# Then restart:
npm run dev
```

### 4. Test Sign-In Again

Use these test credentials:
- **Email:** test.student@furman.edu
- **Password:** TestPass123!
- **URL:** http://localhost:3000/student/login

---

## Alternative: Run the Update Script

I've created a script that will help you update the keys:

```bash
node update-supabase-keys.js
```

Then follow the prompts to enter your new keys.

