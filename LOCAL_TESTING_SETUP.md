# Local Testing Setup

## Issue
QR code scanning doesn't work when testing locally with a phone because:
1. Next.js server only binds to localhost by default
2. Phone can't access localhost from the computer

## Solution

### 1. **Updated Next.js Configuration**
**File:** `package.json`

**Before:**
```json
"dev:frontend": "next dev -p 3000"
```

**After:**
```json
"dev:frontend": "next dev -p 3000 -H 0.0.0.0"
```

The `-H 0.0.0.0` flag makes Next.js bind to all network interfaces, making it accessible from other devices on the same network.

### 2. **QR Code Uses Correct IP**
**File:** `backend/qr-code-generator.js`

QR codes now point to: `http://10.102.42.149:3000`

## Testing Steps

1. **Restart your development server:**
   ```bash
   npm run dev
   ```

2. **Verify Next.js is accessible:**
   - Open `http://10.102.42.149:3000` in your computer's browser
   - Should show the same as `http://localhost:3000`

3. **Test from your phone:**
   - Connect phone to same WiFi network
   - Open `http://10.102.42.149:3000` in phone's browser
   - Should load the FSAS application

4. **Test QR code scanning:**
   - Start a session from professor dashboard
   - Scan QR code with phone
   - Should redirect to student scan page

## Network Requirements

- **Computer and phone must be on same WiFi network**
- **Firewall should allow connections on port 3000**
- **IP address 10.102.42.149 should be accessible**

## Troubleshooting

If it still doesn't work:

1. **Check firewall settings** - Allow port 3000
2. **Verify IP address** - Run `ifconfig` to get current IP
3. **Test network connectivity** - Ping from phone to computer
4. **Check Next.js logs** - Look for connection attempts

The setup should now work for local testing with your phone!
