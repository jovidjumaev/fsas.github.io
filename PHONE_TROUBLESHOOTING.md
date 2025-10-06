# Phone Network Troubleshooting

## Current Status
- ✅ Next.js server running on port 3000
- ✅ Backend server running on port 3001  
- ✅ Both servers bound to 0.0.0.0 (all interfaces)
- ✅ Test server running on port 8080

## Step-by-Step Testing

### 1. **Test Basic Network Connectivity**
On your phone, try these URLs in order:

1. **Test Server**: `http://10.102.42.149:8080`
   - This is a simple test server
   - Should show "Network Test Successful!" message
   - If this works, network is fine

2. **Next.js Frontend**: `http://10.102.42.149:3000`
   - This is your main application
   - Should load the FSAS login page

3. **Backend API**: `http://10.102.42.149:3001/api/health`
   - This tests the backend server
   - Should return JSON health status

### 2. **Check Your Phone's Network**

**WiFi Settings:**
- Make sure phone is connected to the same WiFi as your computer
- Check WiFi network name matches your computer's network
- Try forgetting and reconnecting to WiFi

**Browser Settings:**
- Try different browsers (Chrome, Safari, Firefox)
- Some browsers block HTTP connections
- Check if "Private Browsing" is enabled (disable it)

### 3. **Alternative IP Addresses**

If `10.102.42.149` doesn't work, try:
- `http://156.143.93.115:8080` (external IP)
- Check your router's admin panel for the computer's IP
- Try `http://192.168.x.x:8080` (common home network range)

### 4. **Network Diagnostics**

**From your computer:**
```bash
# Check your computer's IP
ifconfig | grep "inet "

# Check what's listening
netstat -an | grep LISTEN | grep 8080
```

**From your phone:**
- Try pinging the computer's IP
- Check if you can access other devices on the network

### 5. **Common Issues & Solutions**

**Issue: "This site can't be reached"**
- Solution: Check firewall settings
- Solution: Try mobile hotspot instead of WiFi
- Solution: Restart both phone and computer WiFi

**Issue: "Connection timeout"**
- Solution: Check if ports are blocked by firewall
- Solution: Try different IP address
- Solution: Check router settings

**Issue: "Page loads but doesn't work properly"**
- Solution: Check browser console for errors
- Solution: Try different browser
- Solution: Clear browser cache

## Quick Fixes to Try

1. **Restart everything:**
   - Restart phone WiFi
   - Restart computer WiFi
   - Restart both servers

2. **Try mobile hotspot:**
   - Create hotspot on phone
   - Connect computer to phone's hotspot
   - Test with `http://10.102.42.149:8080`

3. **Check firewall:**
   - Allow ports 3000, 3001, 8080
   - Temporarily disable firewall for testing

## Debug Information
- **Computer IP**: 10.102.42.149
- **External IP**: 156.143.93.115
- **Test Server**: http://10.102.42.149:8080
- **Frontend**: http://10.102.42.149:3000
- **Backend**: http://10.102.42.149:3001

**Start with the test server** - if `http://10.102.42.149:8080` works on your phone, then the network is fine and it's a Next.js configuration issue.
