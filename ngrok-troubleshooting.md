# ngrok Troubleshooting Guide

## Quick Diagnosis

Run this command to check if ngrok is working:
```bash
npm run get-ngrok-url
```

Or manually check:
```bash
curl -s http://localhost:4040/api/tunnels | python3 -m json.tool
```

## Common Issues & Solutions

### 1. **ngrok Warning Page**
**Symptom:** You see an ngrok warning/interstitial page when accessing the URL.

**Solution:** 
- Use the updated scripts which include `--host-header` flag
- Or add `?ngrok-skip-browser-warning=true` to your URL
- Or click "Visit Site" button on the warning page

### 2. **Clerk OAuth Callbacks Not Working**
**Symptom:** OAuth redirects fail or return to localhost instead of ngrok URL.

**Solution:**
1. Get your ngrok URL: `npm run get-ngrok-url`
2. Go to [Clerk Dashboard](https://dashboard.clerk.com)
3. Navigate to your application → **Paths**
4. Update these URLs with your ngrok URL:
   - **Frontend API**: `https://your-ngrok-url.ngrok-free.app`
   - **Allowed redirect URLs**: Add `https://your-ngrok-url.ngrok-free.app/**`
5. Save changes

### 3. **Dynamic.xyz Configuration**
**Symptom:** Passkeys/WebAuthn not working.

**Solution:**
1. Get your ngrok URL: `npm run get-ngrok-url`
2. Go to [Dynamic Dashboard](https://app.dynamicauth.com)
3. Navigate to your environment → **Settings**
4. Update **Allowed Origins** to include your ngrok URL
5. Save changes

### 4. **ngrok URL Changes Every Time**
**Symptom:** The URL changes when you restart ngrok.

**Solution:**
- This is normal for free ngrok tier
- Update Clerk/Dynamic configurations each time
- Or upgrade to ngrok paid plan for static domain

### 5. **Port 3000 Not Running**
**Symptom:** ngrok starts but shows "502 Bad Gateway" or connection errors.

**Solution:**
```bash
# Check if Next.js is running
lsof -ti:3000

# If not, start it:
npm run dev
```

### 6. **ngrok Not Starting**
**Symptom:** `ngrok: command not found` or authentication errors.

**Solution:**
```bash
# Check if ngrok is installed
which ngrok
ngrok version

# If not installed:
brew install ngrok/ngrok/ngrok  # macOS
# or download from https://ngrok.com/download

# If authentication error:
ngrok config add-authtoken YOUR_AUTH_TOKEN
# Get token from https://dashboard.ngrok.com/get-started/your-authtoken
```

## Testing Your Setup

1. **Start ngrok:**
   ```bash
   npm run dev-ngrok
   ```

2. **Get the URL:**
   ```bash
   npm run get-ngrok-url
   ```

3. **Test the URL:**
   - Open the ngrok URL in your browser
   - You should see your Next.js app
   - If you see ngrok warning, add `?ngrok-skip-browser-warning=true`

4. **Check ngrok dashboard:**
   - Open http://localhost:4040 in your browser
   - You'll see all requests and the tunnel status

## Current ngrok Status

To check if ngrok is currently running:
```bash
ps aux | grep ngrok | grep -v grep
```

To get the current tunnel URL:
```bash
npm run get-ngrok-url
```


