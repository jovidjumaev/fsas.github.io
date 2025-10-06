# Session Expiration Fix

## Issue
Sessions were closing immediately after opening, showing "session expired and now is completed" message.

## Root Cause
The QR code expiration time was set to only **30 seconds**, which is way too short for a class session. This caused:

1. QR codes to expire almost immediately
2. Students couldn't scan the QR code in time
3. Session appeared to be "expired" right after starting

## Solution

### 1. Increased QR Code Expiration Time
**File:** `backend/qr-code-generator.js`

**Before:**
```javascript
static get QR_EXPIRY_SECONDS() {
  return 30; // 30 seconds - TOO SHORT!
}
```

**After:**
```javascript
static get QR_EXPIRY_SECONDS() {
  return 300; // 5 minutes - reasonable time for students to scan
}
```

### 2. Adjusted QR Code Rotation Interval
**File:** `backend/session-management-api.js`

**Before:**
```javascript
}, 30000); // 30 seconds - rotating too frequently
```

**After:**
```javascript
}, 240000); // 4 minutes - rotate before QR expires (5 minutes)
```

## How It Works Now

1. **QR Code Duration**: 5 minutes (300 seconds)
2. **Rotation Interval**: Every 4 minutes
3. **Session Duration**: 1 hour (unchanged)
4. **Student Scanning Window**: 5 minutes per QR code

## Timeline Example

- **0:00** - Session starts, QR code generated (expires at 5:00)
- **4:00** - QR code rotates, new QR generated (expires at 9:00)
- **8:00** - QR code rotates again (expires at 13:00)
- **...continues every 4 minutes...**
- **60:00** - Session automatically completes after 1 hour

## Benefits

✅ **Students have 5 minutes** to scan each QR code  
✅ **QR codes rotate** every 4 minutes for security  
✅ **Sessions last 1 hour** as intended  
✅ **No more immediate expiration** messages  
✅ **Better user experience** for both professors and students  

## Testing

To test the fix:
1. Start a new session from the dashboard
2. QR code should be valid for 5 minutes
3. Session should remain active for the full hour
4. QR codes should rotate every 4 minutes automatically

