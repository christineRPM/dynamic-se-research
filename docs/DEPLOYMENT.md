# Deployment Guide - HTTPS Without Tunneling

## 🎯 Overview

This guide covers deploying your Dynamic SDK app to production with automatic HTTPS.

---

## ⚡ Quick Deploy (Vercel - Recommended)

Vercel is the easiest option for Next.js apps and provides:
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Zero configuration
- ✅ Free tier available

### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

### Step 2: Login
```bash
vercel login
```

### Step 3: Deploy
```bash
vercel
```

Follow the prompts:
- **Set up and deploy?** → Yes
- **Which scope?** → Your account
- **Link to existing project?** → No (first time)
- **Project name?** → dynamic-interview-demo (or your choice)
- **In which directory is your code located?** → ./
- **Want to override settings?** → No

### Step 4: Set Environment Variables

In the Vercel dashboard or via CLI:

```bash
vercel env add NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID
```

Paste your Dynamic environment ID when prompted.

### Step 5: Deploy to Production
```bash
vercel --prod
```

**Done!** Your app is now live at `https://your-app.vercel.app` 🎉

---

## 🔧 Alternative Deployment Options

### Option 2: Netlify

1. **Install Netlify CLI**:
   ```bash
   npm install -g netlify-cli
   ```

2. **Login**:
   ```bash
   netlify login
   ```

3. **Deploy**:
   ```bash
   netlify deploy --prod
   ```

4. **Set environment variables** in Netlify dashboard:
   - Go to Site settings → Build & deploy → Environment
   - Add `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`

**URL**: `https://your-app.netlify.app`

---

### Option 3: Docker + AWS/GCP/Azure

1. **Create Dockerfile** (already provided, see below)

2. **Build image**:
   ```bash
   docker build -t dynamic-app .
   ```

3. **Deploy to your cloud provider**:
   - AWS ECS/Fargate
   - Google Cloud Run
   - Azure Container Apps

4. **Set up HTTPS** with:
   - AWS Certificate Manager
   - Google Cloud Load Balancer
   - Azure Application Gateway

---

### Option 4: GitHub Pages (Static Export)

**Note**: Dynamic SDK requires server-side features, so this is **not recommended** unless you only need static pages.

---

## 📦 Pre-Deployment Checklist

Before deploying, make sure:

- [ ] ✅ All environment variables are set
- [ ] ✅ Build succeeds locally (`npm run build`)
- [ ] ✅ No console errors in production build
- [ ] ✅ Dynamic SDK environment ID is correct
- [ ] ✅ All secrets are in environment variables (not hardcoded)
- [ ] ✅ CORS settings are configured in Dynamic dashboard
- [ ] ✅ Allowed origins are set in Dynamic dashboard

---

## 🔐 Environment Variables Setup

### Required Variables:

Create these in your hosting platform:

```bash
NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID=your-environment-id-here
```

### For Vercel:
```bash
# Add via CLI
vercel env add NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID production

# Or in dashboard
# Settings → Environment Variables → Add
```

### For Netlify:
```bash
# In dashboard
# Site settings → Build & deploy → Environment variables
```

---

## 🚀 Deployment Commands Reference

### Vercel
```bash
# Preview deployment
vercel

# Production deployment
vercel --prod

# View logs
vercel logs

# List deployments
vercel ls

# Remove deployment
vercel rm [deployment-url]
```

### Netlify
```bash
# Preview deployment
netlify deploy

# Production deployment
netlify deploy --prod

# View logs
netlify logs

# Open in browser
netlify open
```

---

## 🧪 Testing Your Deployment

After deployment:

1. **Visit your HTTPS URL** (e.g., `https://your-app.vercel.app`)

2. **Check crypto API availability**:
   - Open browser console
   - Should see: `Crypto available: true`

3. **Test wallet connection**:
   - Click connect wallet
   - Should work without crypto errors

4. **Test on mobile**:
   - Open the HTTPS URL on your phone
   - Should work without needing ngrok

5. **Check console logs**:
   - Should only see ERROR level logs (if any)

---

## 📱 Mobile Testing After Deployment

**Before deployment** (development):
```bash
# Needed ngrok/tunnel for HTTPS
npm run dev-mobile
# Use: https://abc123.ngrok.app
```

**After deployment** (production):
```bash
# Just use your production URL
https://your-app.vercel.app
# Works on mobile directly! ✅
```

No more tunneling needed! 🎉

---

## 🔄 Continuous Deployment

### Vercel (Automatic)

1. **Connect GitHub**:
   - Go to Vercel dashboard
   - Import your Git repository
   - Every push to `main` auto-deploys

2. **Preview deployments**:
   - Every PR gets a preview URL
   - Test before merging

### Netlify (Automatic)

1. **Connect GitHub**:
   - Go to Netlify dashboard
   - "New site from Git"
   - Connect repository

2. **Configure build**:
   - Build command: `npm run build`
   - Publish directory: `.next`

---

## 🌍 Custom Domain

### Add your own domain:

#### Vercel:
1. Go to project settings → Domains
2. Add your domain (e.g., `app.yourdomain.com`)
3. Update DNS records as shown
4. HTTPS is automatic

#### Netlify:
1. Go to Domain settings
2. Add custom domain
3. Update DNS
4. HTTPS via Let's Encrypt (automatic)

---

## 🔍 Troubleshooting

### Issue: Build fails
**Check**:
- Run `npm run build` locally
- Check build logs on platform
- Verify all dependencies are in `package.json`

### Issue: Environment variables not working
**Check**:
- Variable name has `NEXT_PUBLIC_` prefix
- Redeploy after adding variables
- Check syntax (no quotes needed)

### Issue: Dynamic SDK errors in production
**Check**:
- Environment ID is correct for production
- Allowed origins configured in Dynamic dashboard
- Add your production URL to Dynamic allowed origins

### Issue: CORS errors
**Solution**:
1. Go to Dynamic dashboard
2. Settings → Security
3. Add your production domain to allowed origins
   - Example: `https://your-app.vercel.app`

---

## 📊 Performance Optimization

After deployment, consider:

1. **Enable caching** (Vercel/Netlify do this automatically)
2. **Image optimization** (Next.js automatic)
3. **Code splitting** (Next.js automatic)
4. **CDN distribution** (Vercel/Netlify automatic)

---

## 🔐 Security Checklist

Before going live:

- [ ] Remove any hardcoded API keys
- [ ] Use environment variables for all secrets
- [ ] Enable HTTPS only (no HTTP fallback)
- [ ] Configure CSP headers (already in `next.config.ts`)
- [ ] Set up proper CORS in Dynamic dashboard
- [ ] Review Dynamic SDK security settings
- [ ] Enable rate limiting if needed

---

## 💰 Cost Considerations

### Vercel
- **Hobby (Free)**:
  - 100 GB bandwidth/month
  - Unlimited websites
  - Perfect for demos/testing

- **Pro ($20/month)**:
  - 1 TB bandwidth
  - Team collaboration
  - Analytics

### Netlify
- **Starter (Free)**:
  - 100 GB bandwidth/month
  - 300 build minutes/month

- **Pro ($19/month)**:
  - 1 TB bandwidth
  - More build minutes

**For your use case**: Free tier is perfect! ✅

---

## 📈 Monitoring

After deployment:

1. **Vercel Analytics** (free):
   - Enable in project settings
   - Track performance automatically

2. **Error tracking**:
   - Already have error boundary in place
   - Consider adding Sentry for production

3. **Dynamic SDK logs**:
   - Set `logLevel: 'ERROR'` in production ✅ (already set)
   - Monitor Dynamic dashboard for auth metrics

---

## 🎉 Quick Start Summary

**Fastest way to deploy with HTTPS**:

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Add environment variable
vercel env add NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID production

# 5. Redeploy
vercel --prod
```

**That's it!** Your app is live with HTTPS. 🚀

---

## 📚 Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Documentation](https://docs.netlify.com/)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Dynamic SDK Production Setup](https://docs.dynamic.xyz/)

---

## 🆘 Support

If you encounter issues:
1. Check platform status pages (vercel.com/status, netlifystatus.com)
2. Review deployment logs in dashboard
3. Test locally with production build: `npm run build && npm start`
4. Check Dynamic dashboard for API errors

