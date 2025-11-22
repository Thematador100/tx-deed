# 🚀 Vercel Deployment Checklist

Complete pre-deployment checklist to ensure your enterprise platform deploys successfully.

---

## ✅ Step 1: Local Testing (COMPLETE)

### **Dev Server Status:**
- ✅ Frontend running on http://localhost:3000
- ✅ React app loads successfully
- ✅ Vite hot-reload working

### **Test Core Features:**

#### **1. Homepage & Public Pages**
- [ ] Visit http://localhost:3000
- [ ] Check homepage loads
- [ ] Test navigation between pages
- [ ] Verify all links work

#### **2. Authentication**
- [ ] Go to `/admin/login`
- [ ] Login page displays correctly
- [ ] Form validation works
- [ ] Error messages display properly
- [ ] (Requires Supabase to be fully configured for actual login)

#### **3. Admin Dashboard**
- [ ] Access `/admin` (after login)
- [ ] Dashboard loads without errors
- [ ] Navigation menu works
- [ ] Admin routes are protected

#### **4. Check Browser Console**
- [ ] Open DevTools (F12)
- [ ] Check Console tab for errors
- [ ] Look for any red errors or warnings
- [ ] Verify no 404s for assets

---

## 📋 Step 2: Environment Variables Checklist

### **Required for Production (Vercel):**

#### **✅ Supabase (Required)**
```bash
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```
**Status:** ✅ Already configured from your existing Supabase project

#### **⚠️ Backend API URL (Required)**
```bash
VITE_SCRAPER_API_URL=https://your-backend.railway.app
```
**Status:** ⚠️ Update after deploying backend
**Default:** http://localhost:3001 (for local dev)

#### **Optional Services:**

```bash
# Google Maps (for property maps/street view)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...

# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Smarty (address validation)
VITE_SMARTY_KEY=...

# OpenAI (managed in admin panel, not env var)
```

---

## 🔐 Step 3: Supabase Configuration

### **Database Setup:**
- [ ] Login to Supabase Dashboard
- [ ] Go to SQL Editor
- [ ] Run `supabase-migrations.sql`
- [ ] Run `supabase-enterprise-migrations.sql`
- [ ] Verify tables: `npm run verify:supabase` (should show 21/21)

### **Authentication Setup:**
- [ ] Supabase → Authentication → Settings
- [ ] Enable Email auth provider
- [ ] Set Site URL to your Vercel domain
- [ ] Add Redirect URLs (Vercel preview URLs)

### **Create Admin User:**
```sql
-- Option 1: Sign up via app first, then run:
UPDATE profiles SET role = 'admin'
WHERE email = 'your-email@example.com';

-- Option 2: Direct insert (after creating auth user):
INSERT INTO profiles (id, email, full_name, role)
VALUES (
  'user-id-from-auth',
  'admin@example.com',
  'Admin Name',
  'admin'
);
```

---

## 🚀 Step 4: Deploy to Vercel

### **A. Connect Repository**

1. **Go to Vercel Dashboard:**
   - Visit: https://vercel.com/new
   - Click "Import Project"

2. **Import Git Repository:**
   - Select your GitHub account
   - Find `tx-deed` repository
   - Click "Import"

3. **Select Branch:**
   - Choose: `claude/google-maps-property-reports-01DhUPdqpSpqaYrDDt5CY73s`
   - Or merge to `main` first

### **B. Configure Build Settings**

```
Framework Preset: Vite
Root Directory: ./
Build Command: npm run build
Output Directory: dist
Install Command: npm install
Node Version: 18.x
```

### **C. Add Environment Variables**

Click "Environment Variables" and add:

**Required:**
```
Name: VITE_SUPABASE_URL
Value: https://aedapqfuegbqztuetkxd.supabase.co
Environments: ✓ Production ✓ Preview ✓ Development

Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGFwcWZ1ZWdicXp0dWV0a3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTY4NTEsImV4cCI6MjA3NDQ5Mjg1MX0.mWkZO0jU64_U6JUug7IOhdQmRpiRunahy-QFTLfQCWY
Environments: ✓ Production ✓ Preview ✓ Development

Name: VITE_SCRAPER_API_URL
Value: http://localhost:3001 (temporarily, update after backend deploy)
Environments: ✓ Production ✓ Preview ✓ Development
```

**Optional (add if you have keys):**
```
VITE_GOOGLE_MAPS_API_KEY
VITE_STRIPE_PUBLISHABLE_KEY
VITE_SMARTY_KEY
```

### **D. Deploy**

1. Click "Deploy"
2. Wait 2-3 minutes for build
3. Get your deployment URL: `https://your-project.vercel.app`

---

## 🖥️ Step 5: Deploy Backend (Autonomous Agents)

Your autonomous agents need a separate 24/7 server.

### **Option A: Railway.app (Recommended)**

```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add environment variables
railway variables set SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
railway variables set SUPABASE_SERVICE_KEY=your-service-role-key-here
railway variables set PORT=3001
railway variables set AUTO_START_SCHEDULER=true
railway variables set AUTO_RESTART=true
railway variables set MAX_CONCURRENT_SCRAPERS=3
railway variables set SCRAPER_SCHEDULE="0 2 * * *"

# 5. Deploy
railway up

# 6. Get your backend URL
railway open
# Copy URL: https://your-app.up.railway.app
```

### **Option B: Render.com**

1. Go to https://render.com
2. Click "New Web Service"
3. Connect GitHub repo
4. Configure:
   - Name: tx-deed-backend
   - Environment: Node
   - Build Command: `npm install`
   - Start Command: `node server/index.js`
   - Instance Type: Starter ($7/month)

5. Add environment variables (same as Railway)
6. Click "Create Web Service"

### **Update Frontend Environment Variable:**

After backend is deployed, update Vercel:
```bash
VITE_SCRAPER_API_URL=https://your-backend.railway.app
```

Redeploy frontend or wait for auto-deploy.

---

## 🔗 Step 6: Connect Everything

### **Update Supabase Auth URLs:**

1. Supabase Dashboard → Authentication → URL Configuration
2. Set Site URL: `https://your-project.vercel.app`
3. Add Redirect URLs:
   ```
   https://your-project.vercel.app/*
   https://your-project.vercel.app/auth/callback
   https://*.vercel.app/* (for preview deployments)
   ```

### **Test Backend Connection:**

```bash
# Check backend status
curl https://your-backend.railway.app/api/status

# Should return JSON with agent status
```

### **Test Full Flow:**

1. Visit your Vercel URL
2. Go to `/admin/login`
3. Login with admin credentials
4. Check Dashboard loads
5. Go to Admin → API Keys
6. Add OpenAI key (test connection)
7. Upload test CSV if you have PropertyRadar data

---

## ✅ Step 7: Post-Deployment Verification

### **Frontend Checks:**
- [ ] Visit production URL
- [ ] Homepage loads correctly
- [ ] No console errors (F12 → Console)
- [ ] Images/assets load
- [ ] Navigation works
- [ ] Mobile responsive (test on phone or DevTools)

### **Authentication Checks:**
- [ ] Can access `/admin/login`
- [ ] Login form works
- [ ] Admin login succeeds
- [ ] Protected routes work
- [ ] Can logout

### **Admin Panel Checks:**
- [ ] Dashboard displays data
- [ ] All admin pages accessible
- [ ] API key management works
- [ ] No JavaScript errors

### **Backend Checks:**
- [ ] `curl https://backend/api/status` returns JSON
- [ ] Agents show as running
- [ ] Database connection working
- [ ] Health check passes

### **Database Checks:**
- [ ] All 21 tables exist
- [ ] Profiles table has admin user
- [ ] RLS policies active
- [ ] Sample data queries work

---

## 🎯 Step 8: Optional Enhancements

### **Custom Domain:**
1. Vercel → Settings → Domains
2. Add your custom domain
3. Update DNS records
4. SSL auto-configured

### **Performance Monitoring:**
1. Vercel → Analytics (enable)
2. Monitor Core Web Vitals
3. Track page views

### **Error Tracking:**
1. Add Sentry for error tracking
2. Monitor production errors
3. Get alerts

### **Continuous Deployment:**
- ✅ Auto-deploys on push to branch
- ✅ Preview deployments for PRs
- ✅ Automatic production deploys from main

---

## 🆘 Troubleshooting Common Issues

### **"Build Failed" on Vercel:**
- Check build logs in Vercel dashboard
- Verify all dependencies in package.json
- Ensure Node version compatibility (18.x)
- Check for TypeScript errors if any

### **"Environment variable undefined":**
- Verify spelling matches exactly (case-sensitive)
- Ensure added to all environments (Production/Preview/Dev)
- Redeploy after adding variables

### **"Auth not working":**
- Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Verify Supabase auth is enabled
- Check Site URL in Supabase settings
- Verify user exists in profiles table with role

### **"Backend not responding":**
- Check Railway/Render logs
- Verify SUPABASE_SERVICE_KEY is set
- Test health endpoint: `/health`
- Check environment variables

### **"Database errors":**
- Verify SQL migrations ran successfully
- Check all 21 tables exist
- Verify RLS policies are configured
- Test connection from Supabase dashboard

---

## 📊 Deployment Cost Estimate

### **Free Tier (Great for Testing):**
- Vercel: Free (Hobby plan)
- Supabase: Free (up to 500MB database)
- **Total: $0/month**
- **Limitation:** Backend agents won't run 24/7

### **Production Setup:**
- Vercel: Free (frontend)
- Railway: $5-20/month (backend)
- Supabase: Free-$25/month (depends on usage)
- **Total: $5-45/month**
- **Capability:** Full autonomous 24/7 operation

### **Enterprise Scale:**
- Vercel Pro: $20/month (team features)
- Railway Pro: $20-100/month (more resources)
- Supabase Pro: $25-100/month (more database)
- **Total: $65-220/month**
- **Capability:** High volume, multiple team members

---

## ✅ Final Checklist Before Going Live

- [ ] Frontend deployed to Vercel successfully
- [ ] Backend deployed to Railway/Render
- [ ] All environment variables configured
- [ ] Supabase migrations run (21/21 tables)
- [ ] Admin user created and can login
- [ ] Backend API URL updated in Vercel
- [ ] Supabase auth URLs updated
- [ ] All features tested in production
- [ ] No console errors in production
- [ ] API keys added via admin panel
- [ ] Documentation reviewed
- [ ] Backup strategy confirmed (Supabase auto-backups)
- [ ] Monitoring enabled
- [ ] Custom domain configured (optional)

---

## 🎉 You're Live!

Once all checks pass, your enterprise autonomous property investment platform is:

✅ **Live on the internet**
✅ **Processing properties autonomously**
✅ **Making ML-powered decisions**
✅ **Generating leads automatically**
✅ **Running 24/7 without you**

### **Next Steps:**
1. Upload your first PropertyRadar CSV
2. Review ML recommendations
3. Configure prospecting campaigns
4. Monitor system analytics
5. Scale as needed

### **Support Resources:**
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Supabase Docs: https://supabase.com/docs
- Your Documentation: Check all .md files in repo

---

**Ready to deploy? Start with Step 4 above!** 🚀
