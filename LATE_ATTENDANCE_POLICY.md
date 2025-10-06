# Late Attendance Policy

## Updated: October 6, 2025

### Threshold: 5 Minutes

Students are classified as **LATE** when they scan the QR code **more than 5 minutes** after the **scheduled class start time**.

### How It Works

1. **Reference Point**: The scheduled class start time (from `class_sessions.start_time`)
   - NOT when the professor starts the session
   - Professors can start sessions early without affecting late classification

2. **Classification Rules**:
   - ✅ **PRESENT**: Scan within 0-5 minutes of class start time
   - ❌ **LATE**: Scan 6+ minutes after class start time

3. **Examples** (Class starts at 3:00 PM):
   - 3:00 PM → Present
   - 3:03 PM → Present  
   - 3:05 PM → Present (exactly 5 minutes)
   - 3:06 PM → Late (6 minutes after start)
   - 3:10 PM → Late
   - 3:15 PM → Late

### Implementation Details

The late classification is calculated in three API endpoints:

1. **`POST /api/attendance/scan`** (`backend/attendance-api.js`)
   - Used by student QR scanning
   - Threshold: > 5 minutes = late

2. **`POST /api/sessions/:sessionId/attendance`** (`backend/optimized-class-management-api.js`)
   - Alternative attendance recording endpoint
   - Threshold: > 5 minutes = late

3. **`POST /api/sessions/:sessionId/attendance`** (`backend/final-class-management-api.js`)
   - Final implementation endpoint
   - Threshold: > 5 minutes = late

### Code Logic

```javascript
const sessionStart = new Date(`${session.date}T${session.start_time}`);
const now = new Date();
const minutesLate = Math.floor((now - sessionStart) / (1000 * 60));

let status = 'present';
if (minutesLate > 5) {
  status = 'late';
}
```

### Notes

- The `minutes_late` field in attendance records stores the actual number of minutes after class start
- Students receive a message indicating how many minutes late they are
- The professor starting the session early does not affect this calculation

