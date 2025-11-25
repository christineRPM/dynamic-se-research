# Mobile Crypto API Issue - generateKey Error

## 🐛 The Problem

**Error**: `TypeError: Cannot read properties of undefined (reading 'generateKey')`

**Location**: Dynamic SDK's `keyService.js` 

**Cause**: The Web Crypto API (`crypto.subtle`) is not available on mobile browsers in your current setup.

---

## 🔍 Why This Happens

The Web Crypto API (`window.crypto.subtle`) is **only available in secure contexts**:

### ✅ Secure Contexts (Crypto API Available):
- `https://` URLs (production)
- `https://localhost` (desktop only)
- `https://127.0.0.1` (desktop only)
- Mobile browsers **ONLY with HTTPS**

### ❌ Insecure Contexts (Crypto API NOT Available):
- `http://` URLs (except localhost on desktop)
- `http://192.168.x.x` (your local IP on mobile)
- Mobile browsers accessing local dev server via HTTP

**Mobile browsers are STRICT**: Even `http://localhost` on mobile won't work if accessed via IP address.

---

## 🚀 Quick Fix (2 minutes)

### Step 1: Start dev server
```bash
npm run dev
```

### Step 2: In a new terminal, run ngrok
```bash
npm run dev-mobile
```

### Step 3: Use the HTTPS URL
Look for output like:
```
Forwarding: https://abc123.ngrok-free.app -> http://localhost:3000
```

### Step 4: Open on mobile
Open `https://abc123.ngrok-free.app` in your mobile browser

✅ **Done!** Web Crypto API will now work.

---

## 🛠️ Detailed Solutions

### Solution 1: Using ngrok (Recommended)

#### Option A: Quick Command (Already Set Up)

```bash
# Terminal 1: Start dev server
npm run dev

# Terminal 2: Start ngrok tunnel
npm run dev-mobile
```

#### Option B: Manual Setup

1. **Install ngrok** (if not already):
   ```bash
   npm install -g ngrok
   # or
   brew install ngrok
   ```

2. **Start your dev server**:
   ```bash
   npm run dev
   ```

3. **In another terminal, start ngrok**:
   ```bash
   npx ngrok http 3000
   ```

4. **Use the HTTPS URL** ngrok provides:
   ```
   Forwarding: https://abc123.ngrok-free.app -> http://localhost:3000
   ```

5. **Open on mobile**: Use the `https://` URL

✅ **Pros**:
- Full HTTPS support
- Easy setup (2 commands)
- Works on any mobile device
- Free tier available
- No certificate trust issues

❌ **Cons**:
- Requires internet connection
- URL changes each restart (unless paid plan)
- Third-party service

---

### Solution 2: Using Local Tunnel

1. **Start dev with tunnel**:
   ```bash
   npm run dev-tunnel
   ```

2. **Use the HTTPS URL** provided in the output

✅ **Pros**:
- One command to start
- Free and open source

❌ **Cons**:
- Sometimes slower than ngrok
- Occasional connection issues

---

### Solution 3: Self-Signed Certificate (Advanced)

1. **Install mkcert**:
   ```bash
   # macOS
   brew install mkcert
   brew install nss # for Firefox
   
   # Install local CA
   mkcert -install
   ```

2. **Generate certificates**:
   ```bash
   cd /Users/christine/dev/dynamic-interview-demo
   mkdir -p .certs
   mkcert -key-file .certs/key.pem -cert-file .certs/cert.pem localhost 127.0.0.1 192.168.1.x ::1
   ```

3. **Create server.js** (Next.js HTTPS dev server):
   ```javascript
   const { createServer } = require('https');
   const { parse } = require('url');
   const next = require('next');
   const fs = require('fs');

   const dev = process.env.NODE_ENV !== 'production';
   const hostname = 'localhost';
   const port = 3000;

   const app = next({ dev, hostname, port });
   const handle = app.getRequestHandler();

   const httpsOptions = {
     key: fs.readFileSync('./.certs/key.pem'),
     cert: fs.readFileSync('./.certs/cert.pem'),
   };

   app.prepare().then(() => {
     createServer(httpsOptions, async (req, res) => {
       const parsedUrl = parse(req.url, true);
       await handle(req, res, parsedUrl);
     }).listen(port, (err) => {
       if (err) throw err;
       console.log(`> Ready on https://${hostname}:${port}`);
     });
   });
   ```

4. **Update package.json**:
   ```json
   {
     "scripts": {
       "dev-https": "node server.js"
     }
   }
   ```

5. **Run with HTTPS**:
   ```bash
   npm run dev-https
   ```

6. **On mobile**:
   - Find your local IP: `ipconfig getifaddr en0` (macOS)
   - Visit `https://192.168.1.x:3000` on mobile
   - Accept security warning (self-signed cert)

✅ **Pros**:
- Real HTTPS locally
- No third-party service
- Faster than tunnels (local network)

❌ **Cons**:
- More setup required
- Need to trust certificate on each mobile device
- Need to update IP if it changes
- Security warning on mobile

---

## 📊 Comparison Table

| Method | Setup Time | Pros | Cons | Best For |
|--------|-----------|------|------|----------|
| **ngrok** | 2 min | ✅ Easy<br>✅ HTTPS<br>✅ No cert issues | ⚠️ Internet required<br>⚠️ URL changes | **Mobile testing** |
| **localtunnel** | 1 min | ✅ Very easy<br>✅ One command | ⚠️ Slower<br>⚠️ Less reliable | Quick tests |
| **mkcert** | 10 min | ✅ Fast<br>✅ Local network<br>✅ No internet | ❌ Complex setup<br>⚠️ Cert warnings | Frequent mobile dev |

---

## 🧪 Testing the Fix

After setting up HTTPS, verify it works:

1. **Open mobile browser devtools** (if available)
2. **Run this in console**:
   ```javascript
   console.log('Crypto available:', !!window.crypto.subtle);
   ```

3. **Should see**: `Crypto available: true`

4. **Try connecting a wallet** - should work without errors

---

## 🚨 Common Issues

### Issue 1: "ERR_CERT_AUTHORITY_INVALID" on mobile
**Solution**: You're using self-signed cert. Click "Advanced" → "Proceed" (for testing only)

### Issue 2: ngrok URL keeps changing
**Solution**: 
- Use ngrok paid plan for static domains
- Or use localtunnel with `--subdomain` flag
- Or use mkcert for local HTTPS

### Issue 3: Still seeing crypto errors with HTTPS
**Check**:
1. Verify URL starts with `https://` (not `http://`)
2. Clear browser cache and reload
3. Try incognito/private mode
4. Check browser console for other errors

### Issue 4: ngrok "Too Many Connections"
**Solution**:
- Free tier has limits
- Wait a few minutes
- Or upgrade to paid plan
- Or use localtunnel

---

## 📱 Browser-Specific Notes

### iOS Safari
- ✅ Supports Web Crypto API with HTTPS
- ⚠️ Very strict about HTTP
- ⚠️ May need to clear cache after switching HTTP→HTTPS

### Android Chrome
- ✅ Supports Web Crypto API with HTTPS
- ⚠️ Shows security warnings for self-signed certs
- ℹ️ DevTools available via USB debugging

### Mobile Firefox
- ✅ Supports Web Crypto API with HTTPS
- ⚠️ May have stricter CSP requirements

---

## ✅ Applied Fixes

The following have been added to the codebase:

1. ✅ **Crypto API Check** in `DynamicProvider.tsx`
   - Logs helpful error messages if crypto.subtle is unavailable
   - Shows current URL for debugging

2. ✅ **Quick Start Script** in `package.json`
   - `npm run dev-mobile` - One command to start ngrok

3. ✅ **Documentation** in `MOBILE_CRYPTO_ISSUE.md` (this file)

---

## 🎯 Recommended Workflow

### For Daily Development:
```bash
# Terminal 1
npm run dev

# Desktop testing
open http://localhost:3000
```

### For Mobile Testing:
```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev-mobile

# Use the ngrok HTTPS URL on mobile
```

### For Production:
Deploy to Vercel/Netlify/etc. - they provide HTTPS automatically.

---

## 📚 Resources

- [MDN: Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)
- [MDN: Secure Contexts](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts)
- [ngrok Documentation](https://ngrok.com/docs)
- [mkcert GitHub](https://github.com/FiloSottile/mkcert)
- [Dynamic SDK Mobile Testing](https://docs.dynamic.xyz/)

---

## 💡 Pro Tips

1. **Save ngrok URL**: Bookmark the ngrok URL for quick testing (valid until you restart ngrok)
2. **Use QR codes**: Generate QR code of ngrok URL for quick mobile access
3. **Test early**: Always test mobile before deploying
4. **Check console**: Mobile browser console shows crypto.subtle availability
5. **Production ready**: This only affects development - production with HTTPS works fine
