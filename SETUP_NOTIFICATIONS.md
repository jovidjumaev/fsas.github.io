# Setting Up Notifications

## What I Fixed

✅ **Enabled the NotificationPanel** component in the student dashboard header  
✅ **Removed duplicate notification buttons** from:
  - Sidebar navigation
  - Profile dropdown menu  

✅ **Updated notifications database schema** to match your actual table names:
  - `users` → `user_profiles`
  - `classes` → `courses`
  - `sessions` → `class_sessions`

## How to Set Up the Database

To make notifications work, you need to create the `notifications` table in your Supabase database:

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Click on **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of `/database/notifications-schema.sql`
5. Paste it into the SQL editor
6. Click **Run** to execute

### Option 2: Using the Setup Script

```bash
cd /Users/jovidjumaev/Downloads/fsas
node setup-database.js
```

## What You Get

### Single Notification Location
- **Bell icon** in the top-right header (next to dark mode toggle)
- Shows **unread count badge** with red notification bubble
- Dropdown panel with:
  - All/Unread tabs
  - Mark as read functionality
  - Delete notifications
  - Real-time updates
  - Links to related content

### Features
- ✅ Real-time notification delivery
- ✅ Browser notifications (with permission)
- ✅ Unread count badge
- ✅ Mark as read/unread
- ✅ Delete individual or all notifications
- ✅ Filter by all/unread
- ✅ Relative timestamps ("2m ago", "1h ago", etc.)
- ✅ Priority indicators (low, medium, high, urgent)
- ✅ Notification types (attendance, announcements, etc.)

## Testing Notifications

You can test by running the sample notifications SQL:

```bash
# In Supabase SQL Editor, run:
/database/sample-notifications.sql
```

This will create test notifications for your user account.

## Troubleshooting

### If you get "trigger already exists" error:
**Error:** `ERROR: 42710: trigger "notifications_updated_at" for relation "notifications" already exists`

**Solution:** Run this SQL file to fix it:
```bash
# In Supabase SQL Editor, run:
/FIX_NOTIFICATIONS_TRIGGER.sql
```

This will safely drop and recreate all triggers without errors.

### If notifications don't show:
1. Check browser console for errors
2. Verify the `notifications` table exists in Supabase
3. Check that Row Level Security (RLS) is properly configured
4. Make sure your user ID matches the `user_id` in notifications table

### If you get "table does not exist" error:
Run the notifications schema SQL file in Supabase SQL Editor.

### If real-time doesn't work:
1. Go to Supabase Dashboard → Database → Replication
2. Enable replication for the `notifications` table
3. Make sure realtime is enabled in your Supabase project settings

## Next Steps

Once you've run the SQL schema, refresh your student dashboard and you should see:
- A working notification bell icon in the header
- No duplicate notification buttons elsewhere
- Ability to receive and manage notifications

Enjoy your streamlined notification system! 🔔

