# 🔐 Environment Variables Reference

Complete reference for all environment variables needed for deployment.

---

## 📋 Frontend (Vercel)

Add these in **Vercel Dashboard → Settings → Environment Variables**

### **Required Variables**

```bash
# Supabase (Frontend)
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGFwcWZ1ZWdicXp0dWV0a3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTY4NTEsImV4cCI6MjA3NDQ5Mjg1MX0.mWkZO0jU64_U6JUug7IOhdQmRpiRunahy-QFTLfQCWY

# Backend API URL (update after deploying backend)
VITE_SCRAPER_API_URL=https://your-backend.railway.app
```

### **Optional Variables**

```bash
# Google Maps Platform
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Stripe Payments
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key_here

# Smarty Address Validation
VITE_SMARTY_KEY=your_smarty_key_here

# OpenAI (Note: This is managed in Admin Panel, not env var)
# Don't add VITE_OPENAI_API_KEY - use admin panel instead
```

---

## 🖥️ Backend (Railway/Render/VPS)

Add these in **Railway/Render Dashboard → Environment Variables**

### **Required Variables**

```bash
# Supabase (Backend) - USE SERVICE ROLE KEY, NOT ANON!
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# Server Configuration
PORT=3001

# Autonomous Agent Configuration
AUTO_START_SCHEDULER=true
AUTO_RESTART=true
```

### **Optional Configuration**

```bash
# Scraper Configuration
MAX_CONCURRENT_SCRAPERS=3
SCRAPER_SCHEDULE=0 2 * * *
RUN_INITIAL_SCRAPE=false

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## 🔑 How to Get Each API Key

### **Supabase Keys**

**Where to find:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click **Settings** (gear icon)
4. Click **API**
5. Copy keys:
   - **Project URL** → Use for `SUPABASE_URL` and `VITE_SUPABASE_URL`
   - **anon/public key** → Use for `VITE_SUPABASE_ANON_KEY`
   - **service_role key** → Use for `SUPABASE_SERVICE_KEY` (BACKEND ONLY!)

**Security Note:**
- ⚠️ **NEVER** use service_role key in frontend
- ⚠️ **NEVER** commit service_role key to git
- ✅ Use anon key for frontend
- ✅ Use service_role for backend only

---

### **Google Maps API Key**

**Where to get:**
1. Go to https://console.cloud.google.com/
2. Create new project or select existing
3. Enable these APIs:
   - Maps JavaScript API
   - Places API
   - Street View Static API
   - Maps Static API
   - Geocoding API
4. Create credentials → API Key
5. Restrict API key (recommended):
   - Application restrictions → HTTP referrers
   - Add your domain: `*.vercel.app/*`
   - API restrictions → Select enabled APIs only

**Cost:** Free tier includes $200/month credit

---

### **Stripe API Keys**

**Where to get:**
1. Go to https://dashboard.stripe.com/
2. Sign up or login
3. Click **Developers** → **API Keys**
4. Copy:
   - **Publishable key** → Use for `VITE_STRIPE_PUBLISHABLE_KEY`
   - **Secret key** → Add via Admin Panel (not env var)

**Important:**
- Use **Test Mode** keys during development
- Use **Live Mode** keys for production
- Secret key goes in Admin Panel, not env vars

---

### **Smarty Address Validation**

**Where to get:**
1. Go to https://www.smarty.com/
2. Sign up for account
3. Dashboard → API Keys
4. Create new key
5. Copy **Auth ID** and **Auth Token**

**Configuration:**
- Add via Admin Panel (not env var)
- Free tier: 250 lookups/month
- Paid: $0.60-2.00 per 1000 lookups

---

### **OpenAI API Key**

**Where to get:**
1. Go to https://platform.openai.com/
2. Sign up or login
3. Click profile → **View API Keys**
4. Create new secret key
5. Copy key immediately (only shown once)

**Configuration:**
- ✅ Add via **Admin Panel** (Admin → API Keys)
- ❌ DON'T add as environment variable
- Test connection from admin UI

**Cost:** Pay-as-you-go
- GPT-4: ~$0.03 per 1K tokens
- GPT-3.5: ~$0.002 per 1K tokens

---

## 📝 Environment Variable Template

### **For Vercel (.env.production)**

Copy this template:

```bash
# ============================================
# VERCEL PRODUCTION ENVIRONMENT VARIABLES
# ============================================
# Add these in Vercel Dashboard → Settings → Environment Variables
# Check all three: Production, Preview, Development

# SUPABASE (REQUIRED)
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGFwcWZ1ZWdicXp0dWV0a3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTY4NTEsImV4cCI6MjA3NDQ5Mjg1MX0.mWkZO0jU64_U6JUug7IOhdQmRpiRunahy-QFTLfQCWY

# BACKEND API URL (REQUIRED - update after backend deploy)
VITE_SCRAPER_API_URL=https://your-backend.railway.app

# OPTIONAL SERVICES
VITE_GOOGLE_MAPS_API_KEY=
VITE_STRIPE_PUBLISHABLE_KEY=
VITE_SMARTY_KEY=
```

### **For Railway/Render (.env.backend)**

Copy this template:

```bash
# ============================================
# BACKEND ENVIRONMENT VARIABLES
# ============================================
# Add these in Railway/Render Dashboard

# SUPABASE (REQUIRED - SERVICE ROLE KEY!)
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here

# SERVER CONFIG (REQUIRED)
PORT=3001
AUTO_START_SCHEDULER=true
AUTO_RESTART=true

# SCRAPER CONFIG (OPTIONAL)
MAX_CONCURRENT_SCRAPERS=3
SCRAPER_SCHEDULE=0 2 * * *
RUN_INITIAL_SCRAPE=false
```

---

## ✅ Verification Checklist

### **Before Deploying:**
- [ ] All VITE_* variables ready for Vercel
- [ ] Backend variables ready for Railway/Render
- [ ] Service role key is different from anon key
- [ ] No secrets committed to git
- [ ] .env file in .gitignore

### **After Deploying:**
- [ ] Test all features work with production variables
- [ ] Check browser console for env var errors
- [ ] Verify API calls reach correct backend
- [ ] Test auth with production Supabase
- [ ] Confirm all optional features work if keys added

---

## 🔒 Security Best Practices

### **DO:**
✅ Use environment variables for all secrets
✅ Use different keys for dev/staging/prod
✅ Rotate keys periodically
✅ Restrict API keys by domain/IP
✅ Use service role key only on backend
✅ Add env vars through dashboard UI
✅ Enable rate limiting on APIs

### **DON'T:**
❌ Commit .env files to git
❌ Share keys in Slack/email
❌ Use production keys in development
❌ Use service role key in frontend
❌ Hardcode keys in source code
❌ Use same keys across all environments
❌ Leave unrestricted API keys

---

## 🆘 Troubleshooting

### **"Environment variable is undefined"**
- Check variable name matches exactly (case-sensitive)
- Verify added to correct environment (Production/Preview/Dev)
- Redeploy after adding variables
- Check for typos in variable names

### **"Invalid API key"**
- Verify key was copied completely
- Check for extra spaces/newlines
- Ensure using correct environment (test vs live)
- Verify API restrictions aren't blocking requests

### **"CORS errors with backend"**
- Check VITE_SCRAPER_API_URL is correct
- Ensure backend has CORS enabled
- Verify backend is actually running
- Check backend logs for errors

---

## 📚 Additional Resources

- [Vercel Environment Variables Guide](https://vercel.com/docs/concepts/projects/environment-variables)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Supabase API Keys](https://supabase.com/docs/guides/api)
- [Securing Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables#securing-environment-variables)

---

**Need help?** Check the main deployment guide: `DEPLOYMENT_CHECKLIST.md`
