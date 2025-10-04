# 🔔 Notifications System Setup Guide

## Overview
The FSAS notification system provides real-time notifications for students about attendance, class updates, announcements, and more.

---

## ✅ What's Been Implemented

### 1. Database Schema
- ✅ **Notifications table** with comprehensive fields
- ✅ **Notification types**: attendance_reminder, attendance_marked, class_cancelled, class_rescheduled, grade_posted, assignment_due, announcement, system
- ✅ **Priority levels**: low, medium, high, urgent
- ✅ **Automatic triggers** for attendance events
- ✅ **RLS policies** for security
- ✅ **Helper functions** for CRUD operations

### 2. Backend Service (`src/lib/notifications.ts`)
- ✅ Get user notifications
- ✅ Get unread count
- ✅ Mark as read (single/multiple/all)
- ✅ Delete notifications
- ✅ Real-time subscription support
- ✅ Helper functions for formatting

### 3. UI Components (`src/components/notifications/notification-panel.tsx`)
- ✅ Bell icon with unread badge
- ✅ Dropdown notification panel
- ✅ All/Unread tabs
- ✅ Mark as read functionality
- ✅ Delete notifications
- ✅ Real-time updates
- ✅ Browser notifications support
- ✅ Dark mode support
- ✅ Responsive design

---

## 📋 Setup Instructions

### Step 1: Create Database Tables

1. Open **Supabase SQL Editor**
2. Run the following SQL file: `database/notifications-schema.sql`

```bash
# Or copy the contents and paste into SQL Editor
cat database/notifications-schema.sql
```

This will create:
- `notifications` table
- Notification type and priority enums
- Indexes for performance
- Helper functions
- Automatic triggers
- RLS policies

### Step 2: Verify Table Creation

Run this query in Supabase SQL Editor:

```sql
-- Check if notifications table exists
SELECT * FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'notifications';

-- Check notification types
SELECT enum_range(NULL::notification_type);

-- Check priorities
SELECT enum_range(NULL::notification_priority);
```

### Step 3: Create Sample Notifications (Optional)

For testing purposes, run: `database/sample-notifications.sql`

Then create sample notifications:

```sql
-- First, get your student user ID
SELECT id, email, first_name, last_name 
FROM users 
WHERE role = 'student';

-- Then create sample notifications (replace YOUR-USER-ID)
SELECT create_sample_notifications_for_student('YOUR-USER-ID-HERE');
```

### Step 4: Enable Browser Notifications

The system will automatically request browser notification permission when a user first visits the dashboard. Users can allow or deny this permission.

---

## 🎯 Features

### Notification Types

| Type | Icon | Description | Example |
|------|------|-------------|---------|
| `attendance_reminder` | 📅 | Class starting soon | "Class starts in 15 min" |
| `attendance_marked` | ✓ | Attendance recorded | "Attendance marked as present" |
| `class_cancelled` | ❌ | Class cancelled | "CSC-475 cancelled today" |
| `class_rescheduled` | 🔄 | Class time changed | "Class moved to Oct 5" |
| `grade_posted` | 📝 | Grade available | "Grade posted for Assignment 1" |
| `assignment_due` | ⏰ | Assignment deadline | "Project due tomorrow" |
| `announcement` | 📢 | General announcement | "Office hours extended" |
| `system` | ⚙️ | System messages | "Welcome to FSAS" |

### Priority Levels

| Priority | Color | When to Use |
|----------|-------|-------------|
| `low` | Gray | Routine updates |
| `medium` | Blue | Standard notifications |
| `high` | Orange | Important updates |
| `urgent` | Red | Critical actions required |

### Automatic Triggers

The system automatically creates notifications for:

1. **Attendance Marked** - When a student's attendance is recorded
2. **Session Active** - When a QR code becomes available for scanning

---

## 🔧 Usage Examples

### Creating Notifications (Backend/Admin)

```typescript
import { NotificationService } from '@/lib/notifications';

// Create a notification
await NotificationService.createNotification({
  userId: 'student-user-id',
  type: 'attendance_reminder',
  title: 'Class Starting Soon',
  message: 'CSC-475 starts in 15 minutes',
  priority: 'high',
  link: '/student/scan-qr',
  classId: 'class-uuid',
  sessionId: 'session-uuid',
  metadata: { class_code: 'CSC-475' }
});
```

### Using in React Components

```typescript
import { NotificationPanel } from '@/components/notifications/notification-panel';

// Simply add to your component
<NotificationPanel />
```

The component handles everything automatically:
- Fetches notifications
- Shows unread count badge
- Real-time updates
- Mark as read/delete
- Browser notifications

---

## 📊 Database Functions

### Helper Functions Available

```sql
-- Create a notification
SELECT create_notification(
  user_id UUID,
  type notification_type,
  title VARCHAR,
  message TEXT,
  priority notification_priority DEFAULT 'medium',
  link VARCHAR DEFAULT NULL,
  class_id UUID DEFAULT NULL,
  session_id UUID DEFAULT NULL,
  metadata JSONB DEFAULT '{}'
);

-- Mark notification as read
SELECT mark_notification_read(notification_id UUID);

-- Mark all as read for a user
SELECT mark_all_notifications_read(user_id UUID);

-- Get unread count
SELECT get_unread_notification_count(user_id UUID);

-- Cleanup functions (run periodically)
SELECT cleanup_expired_notifications(); -- Delete expired
SELECT cleanup_old_read_notifications(); -- Delete old read (30+ days)
```

---

## 🔐 Security (RLS Policies)

The following Row Level Security policies are in place:

- ✅ Users can **only see their own** notifications
- ✅ Users can **update** their own notifications (mark as read)
- ✅ Users can **delete** their own notifications
- ✅ Only **service role** can create notifications (system/admin)

---

## 🎨 UI Features

### Bell Icon
- Shows unread count badge (animated pulse)
- Changes color when unread notifications exist
- Click to open dropdown panel

### Notification Panel
- **Tabs**: All / Unread
- **Actions**: Mark all read, Clear all
- **Per Notification**: Mark read, View, Delete
- **Real-time**: Auto-updates when new notifications arrive
- **Formatting**: Relative time (e.g., "2h ago")
- **Links**: Click to navigate to related content
- **Empty States**: Friendly messages when no notifications

### Dark Mode
Fully supports dark mode with appropriate color schemes.

### Responsive
Works perfectly on mobile, tablet, and desktop.

---

## 🧪 Testing

### Test Notification Flow

1. **Sign in as a student**
2. **Check the bell icon** - should show in header
3. **Click bell** - notification panel opens
4. **Run sample notifications SQL** to create test data
5. **Verify notifications appear** in the panel
6. **Test mark as read** - click "Mark read" on a notification
7. **Test delete** - click "Delete" on a notification
8. **Test mark all read** - click "Mark all read" button
9. **Test tabs** - switch between "All" and "Unread"

### Test Real-time Updates

1. Open dashboard in one browser window
2. Open Supabase SQL Editor in another
3. Run: 
   ```sql
   SELECT create_notification(
     (SELECT id FROM users WHERE role = 'student' LIMIT 1),
     'system',
     'Test Notification',
     'This is a real-time test',
     'medium'
   );
   ```
4. Notification should appear instantly in the dashboard

### Test Browser Notifications

1. Allow browser notifications when prompted
2. Create a new notification via SQL
3. Browser notification should appear (even if tab is inactive)

---

## 🔄 Future Enhancements

Potential improvements (not yet implemented):

- [ ] Notification preferences/settings page
- [ ] Email digest for important notifications
- [ ] Push notifications for mobile PWA
- [ ] Notification grouping (e.g., "3 new attendance records")
- [ ] Rich notifications with images/buttons
- [ ] Notification scheduling
- [ ] User notification muting/snoozing
- [ ] Notification categories/filters
- [ ] Export notification history

---

## 🐛 Troubleshooting

### Notifications Not Showing

1. **Check if table exists**:
   ```sql
   SELECT * FROM notifications LIMIT 1;
   ```

2. **Check RLS policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'notifications';
   ```

3. **Verify user authentication**:
   - Make sure user is signed in
   - Check `user.id` matches notifications `user_id`

### Real-time Not Working

1. **Check Supabase Realtime** is enabled for `notifications` table
2. **Verify subscription** in browser console
3. **Check network tab** for websocket connection

### Browser Notifications Not Appearing

1. **Check browser permission**: Settings → Site Settings → Notifications
2. **Verify `Notification.permission`** in browser console
3. Some browsers block notifications in incognito/private mode

---

## 📚 Resources

- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/triggers.html)

---

## ✨ Summary

The notification system is now **fully functional** with:

✅ Complete database schema with triggers  
✅ Comprehensive TypeScript service layer  
✅ Beautiful UI component with real-time updates  
✅ Integrated into student dashboard  
✅ Security via RLS policies  
✅ Browser notification support  
✅ Dark mode support  
✅ Responsive design  

**Next Step**: Run the SQL schema in Supabase to activate the system!

