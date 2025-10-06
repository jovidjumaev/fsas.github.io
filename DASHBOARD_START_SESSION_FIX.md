# Dashboard Start Session Button Fix

## Issue
The "Start Session" button in the "Today's Classes" section was linking to `/professor/sessions/new?classId=${classId}`, which resulted in a 404 error.

## Root Cause
- The dashboard was only receiving class instance IDs, not session IDs
- There was no route at `/professor/sessions/new`
- The button couldn't actually start a session without the session ID

## Solution

### Backend Changes (`backend/optimized-server.js`)

Added session IDs to the dashboard API response:

```javascript
// Find today's session if this is a today class
const todaySession = isToday ? allSessions.find(s => 
  s.class_instance_id === instance.id && 
  s.date === today &&
  s.status === 'scheduled'
) : null;

const activeSession = classActiveSessions.length > 0 ? classActiveSessions[0] : null;

return {
  // ... existing fields ...
  today_session_id: todaySession?.id || null, // Session ID for today's session
  active_session_id: activeSession?.id || null // Active session ID if active
};
```

### Frontend Changes (`src/app/professor/dashboard/page.tsx`)

1. **Updated ClassData Interface**:
   ```typescript
   interface ClassData {
     // ... existing fields ...
     today_session_id?: string | null;
     active_session_id?: string | null;
   }
   ```

2. **Added startSession Function**:
   ```typescript
   const startSession = async (sessionId: string) => {
     const response = await fetch(`/api/sessions/${sessionId}/activate`, {
       method: 'POST',
       headers: { 'Content-Type': 'application/json' }
     });
     
     if (response.ok) {
       await fetchDashboardData();
       window.location.href = `/professor/sessions/active/${sessionId}`;
     }
   };
   ```

3. **Updated Buttons**:
   - **Start Button** (for upcoming classes): Now calls `startSession()` with the session ID
   - **View Button** (for active classes): Now links to the active session page with the correct session ID

## Result

✅ **Start Button**: Properly activates today's session and redirects to the active session page
✅ **View Button**: Links to the correct active session page
✅ **No More 404**: All buttons now use valid routes and session IDs
✅ **Better UX**: Immediate feedback when starting a session

## Testing

To test:
1. Navigate to professor dashboard
2. Find a class in "Today's Classes" with status "upcoming"
3. Click "Start" button
4. Should start the session and redirect to active session page
5. For active sessions, "View" button should link to the active session page

## Notes

- The session must exist for today for the button to appear
- Only scheduled sessions can be started
- Active sessions show a "View" button instead of "Start"

