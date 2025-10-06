# Network Troubleshooting Guide

## Current Setup
- **Next.js Server**: Running on `10.102.42.149:3000`
- **Backend Server**: Running on `10.102.42.149:3001`
- **Test Server**: Running on `10.102.42.149:8080`

## Step-by-Step Testing

### 1. **Test Basic Connectivity**
On your phone, try opening these URLs in your browser:

1. `http://10.102.42.149:8080` (Simple test server)
2. `http://10.102.42.149:3000` (Next.js frontend)
3. `http://10.102.42.149:3001` (Backend API)

### 2. **Check Network Connection**
Make sure your phone and computer are on the same WiFi network:
- Computer: Check WiFi network name
- Phone: Check WiFi network name
- They should be identical

### 3. **Alternative IP Addresses**
If `10.102.42.149` doesn't work, try:
- `http://156.143.93.115:3000` (External IP)
- Check your router's admin panel for the computer's IP

### 4. **QR Code Testing**
If the browser test works, try scanning this test QR code:
```
http://10.102.42.149:3000/student/scan
```

### 5. **Common Issues & Solutions**

**Issue: "This site can't be reached"**
- Solution: Check firewall settings
- Solution: Try different IP address
- Solution: Restart WiFi on both devices

**Issue: "Connection timeout"**
- Solution: Check if ports are blocked
- Solution: Try mobile hotspot instead of WiFi

**Issue: "Page loads but QR scan doesn't work"**
- Solution: Check if backend API is accessible
- Solution: Check browser console for errors

## Quick Fixes to Try

1. **Restart Next.js with explicit host binding:**
   ```bash
   npx next dev -p 3000 -H 0.0.0.0
   ```

2. **Check if your phone's browser allows HTTP (not HTTPS)**
   - Some phones block HTTP connections
   - Try using Chrome or Safari

3. **Test with a different device**
   - Try another phone or tablet
   - Try a different computer

## Debug Information
- **Computer IP**: 10.102.42.149
- **External IP**: 156.143.93.115
- **Next.js Port**: 3000
- **Backend Port**: 3001
- **Test Port**: 8080

Try the test server first (`http://10.102.42.149:8080`) - if that works, then the network is fine and it's a Next.js configuration issue.
