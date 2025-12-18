# Using ngrok for HTTPS (Required for Passkeys/WebAuthn)

Passkeys and WebAuthn require HTTPS. Use ngrok to create an HTTPS tunnel to your local development server.

## Quick Start

1. **Start dev server with ngrok:**
   ```bash
   npm run dev-ngrok
   ```

2. **Or run separately:**
   ```bash
   # Terminal 1: Start Next.js dev server
   npm run dev

   # Terminal 2: Start ngrok tunnel
   npm run tunnel-ngrok
   ```

3. **Copy the HTTPS URL from ngrok** (e.g., `https://abc123.ngrok-free.app`)

4. **Bypass ngrok warning page:**
   - ngrok free tier shows a warning page
   - Click "Visit Site" button on the warning page
   - Or add `?ngrok-skip-browser-warning` to the URL
   - Or use ngrok with `--host-header` flag to avoid the warning

5. **Use the ngrok URL** instead of `http://localhost:3000`

## Bypassing ngrok Warning Page

The free ngrok tier shows an interstitial warning page. To bypass it:

**Option 1: Add query parameter**
```
https://your-domain.ngrok-free.app?ngrok-skip-browser-warning=true
```

**Option 2: Use ngrok with host header**
```bash
ngrok http 3000 --host-header="localhost:3000"
```

**Option 3: Click through the warning page**
Just click "Visit Site" button on the ngrok warning page

## Important Notes

- **ngrok URL changes each time** (unless you have a paid plan with a static domain)
- **Update Clerk configuration** if you have localhost URLs configured
- **Dynamic MFA/Passkeys will work** with the HTTPS ngrok URL
- **CSP has been updated** to allow fonts and resources from ngrok domains
- The ngrok URL will be displayed in the terminal when you run the command

## Example ngrok Output

```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3000
```

Use `https://abc123.ngrok-free.app?ngrok-skip-browser-warning=true` in your browser

