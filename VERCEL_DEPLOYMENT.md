# 🚀 Vercel Deployment & Environment Configuration Guide

Complete guide for deploying your enterprise platform to Vercel with proper environment variable management.

---

## ✅ Current Status

### **Auth System: READY** ✓
- ✅ Supabase Auth integrated
- ✅ Role-based access control (Admin/Member)
- ✅ Admin login page (`/admin/login`)
- ✅ Protected admin routes
- ✅ User profile management

### **Admin Dashboard: READY** ✓
- ✅ API Key management in admin panel
- ✅ All third-party API keys stored securely in Supabase Vault
- ✅ Test connection functionality
- ✅ Service status monitoring

### **LLM Configuration: IN ADMIN PANEL** ✓
- ✅ OpenAI API key managed in Admin → API Keys
- ✅ All AI services configured through admin UI
- ✅ No need to redeploy when changing API keys
- ✅ Keys encrypted in Supabase Vault

---

## 🌐 Vercel Deployment Setup

### **Option 1: Quick Deploy (Recommended)**

1. **Push to GitHub** (Already done! ✓)
   - Your code is on: `claude/google-maps-property-reports-01DhUPdqpSpqaYrDDt5CY73s`

2. **Connect to Vercel:**
   ```bash
   # Install Vercel CLI (optional)
   npm i -g vercel

   # Or just use the Vercel Dashboard
   https://vercel.com/new
   ```

3. **Import Your Repository:**
   - Go to https://vercel.com/new
   - Select "Import Git Repository"
   - Choose your tx-deed repo
   - Select branch: `claude/google-maps-property-reports-01DhUPdqpSpqaYrDDt5CY73s`

4. **Configure Project:**
   - Framework Preset: **Vite**
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

---

## 🔐 Environment Variables for Vercel

### **Where to Add Them:**
1. Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add each variable for Production, Preview, and Development

### **Frontend Environment Variables (VITE_*):**

These go in **Vercel Dashboard**:

```bash
# Supabase (Frontend)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Google Maps (Optional)
VITE_GOOGLE_MAPS_API_KEY=AIzaSyC...

# Stripe (Optional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...

# Scraper API URL (Points to your backend)
VITE_SCRAPER_API_URL=https://your-backend-url.com
```

### **Backend Environment Variables (Server):**

Your autonomous agents backend needs separate deployment. See below.

---

## 🏗️ Architecture: Frontend + Backend

### **Frontend (Vercel):**
- React app with admin dashboard
- Deployed to Vercel
- Uses frontend environment variables (VITE_*)
- Connects to Supabase for auth & data
- Makes API calls to autonomous backend

### **Backend (Separate Server):**
Your autonomous agents need 24/7 server (Vercel doesn't support long-running processes).

**Best Options:**

#### **Option A: Railway.app (Easiest)** ⭐
```bash
# 1. Install Railway CLI
npm i -g @railway/cli

# 2. Login
railway login

# 3. Initialize project
railway init

# 4. Add environment variables
railway variables set SUPABASE_URL=https://...
railway variables set SUPABASE_SERVICE_KEY=eyJ...
railway variables set PORT=3001
railway variables set AUTO_START_SCHEDULER=true

# 5. Deploy
railway up
```

**Cost:** $5-20/month
**Pros:** Easy, auto-deploys, 24/7 uptime, great for autonomous agents

#### **Option B: Render.com**
1. Create new Web Service
2. Connect GitHub repo
3. Set Start Command: `node server/index.js`
4. Add environment variables in dashboard

**Cost:** $7-25/month
**Pros:** Good UI, auto-deploys, SSL included

#### **Option C: DigitalOcean App Platform**
1. Create new App
2. Connect GitHub repo
3. Set build/run commands
4. Add environment variables

**Cost:** $5-12/month
**Pros:** Scalable, predictable pricing

#### **Option D: VPS (Advanced)**
- DigitalOcean Droplet ($6/month)
- AWS EC2, Linode, Vultr
- Install Node.js, PM2, Nginx
- Full control but more setup

---

## 📋 Complete Environment Variable List

### **For Vercel (Frontend):**

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | ✅ Yes | Supabase anon/public key |
| `VITE_GOOGLE_MAPS_API_KEY` | ⚠️ Optional | For map features |
| `VITE_STRIPE_PUBLISHABLE_KEY` | ⚠️ Optional | For payments |
| `VITE_SCRAPER_API_URL` | ✅ Yes | URL of your backend server |

### **For Backend Server (Railway/Render/etc):**

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ Yes | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | ✅ Yes | Service role key (NOT anon) |
| `PORT` | ✅ Yes | Server port (3001 or auto) |
| `AUTO_START_SCHEDULER` | ✅ Yes | `true` for autonomous mode |
| `AUTO_RESTART` | ✅ Yes | `true` for auto-recovery |
| `MAX_CONCURRENT_SCRAPERS` | ⚠️ Optional | Default: 3 |
| `SCRAPER_SCHEDULE` | ⚠️ Optional | Default: `0 2 * * *` (2 AM) |

---

## 🔑 API Keys Management (LLMs & Third-Party Services)

### **Where API Keys Live:**

✅ **ALL in Supabase** (Not in environment variables!)

Your admin panel has an **API Key Vault** where you manage:
- OpenAI API keys (for LLMs)
- Smarty address validation
- Any third-party service

**Why this is better:**
- ✅ No redeployment needed to change keys
- ✅ Encrypted in Supabase Vault
- ✅ Test connections from admin UI
- ✅ Update keys anytime without touching code
- ✅ Audit trail of key usage

**How to add API keys:**
1. Login to admin panel: `/admin/login`
2. Navigate to: **Admin** → **API Keys**
3. Click: **Add/Update Key**
4. Enter service name (e.g., "openai", "smarty")
5. Paste API key
6. Save to vault
7. Test connection

**Supported services:**
- `openai` - OpenAI API (GPT-4, etc.)
- `smarty` - Address validation
- `stripe_secret` - Stripe secret key
- Custom services - Add any API key

---

## 🚀 Step-by-Step Deployment

### **Step 1: Deploy Frontend to Vercel**

```bash
# 1. Go to Vercel Dashboard
https://vercel.com/new

# 2. Import tx-deed repository

# 3. Configure build settings:
Framework: Vite
Build Command: npm run build
Output Directory: dist
Install Command: npm install

# 4. Add environment variables (see list above)

# 5. Deploy!
```

**Result:** Your admin panel is live at `https://your-project.vercel.app`

### **Step 2: Deploy Backend to Railway**

```bash
# 1. Create railway.toml config
railway init

# 2. Add to project root:
```

Create `railway.toml`:
```toml
[build]
builder = "NIXPACKS"

[deploy]
startCommand = "node server/index.js"
healthcheckPath = "/health"
healthcheckTimeout = 100
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

```bash
# 3. Set environment variables
railway variables set SUPABASE_URL=https://your-project.supabase.co
railway variables set SUPABASE_SERVICE_KEY=your-service-key
railway variables set PORT=3001
railway variables set AUTO_START_SCHEDULER=true
railway variables set AUTO_RESTART=true

# 4. Deploy
railway up

# 5. Get your backend URL
railway open
# Copy URL: https://your-app.railway.app
```

### **Step 3: Connect Frontend to Backend**

Back in Vercel, update environment variable:
```bash
VITE_SCRAPER_API_URL=https://your-app.railway.app
```

Redeploy frontend (or it auto-redeploys).

### **Step 4: Configure Supabase**

1. Run SQL migrations (if not done):
   - Go to Supabase Dashboard → SQL Editor
   - Run `supabase-migrations.sql`
   - Run `supabase-enterprise-migrations.sql`

2. Create first admin user:
```sql
-- Run in Supabase SQL Editor
INSERT INTO profiles (id, email, role)
VALUES (
  auth.uid(), -- Will auto-populate when user signs up
  'your-email@example.com',
  'admin'
);
```

Or sign up via UI and then update:
```sql
UPDATE profiles
SET role = 'admin'
WHERE email = 'your-email@example.com';
```

### **Step 5: Test Everything**

1. **Frontend:** Visit `https://your-project.vercel.app`
2. **Admin Login:** Go to `/admin/login`
3. **Backend Status:** `https://your-backend.railway.app/api/status`
4. **Upload Test:** Upload a PropertyRadar CSV
5. **View Decisions:** Check ML recommendations

---

## 🔒 Security Checklist

- [x] Use Service Role key for backend (NOT anon key)
- [x] Use Anon key for frontend
- [x] All API keys in Supabase Vault (not env vars)
- [x] RLS policies enabled on all tables
- [x] Admin role check on protected routes
- [x] HTTPS everywhere (Vercel + Railway auto-provide)
- [x] Environment variables marked as "secret" in Vercel
- [x] No API keys committed to git

---

## 📊 Monitoring & Logs

### **Frontend (Vercel):**
- Vercel Dashboard → Your Project → Deployments
- View build logs, runtime logs
- Monitor performance

### **Backend (Railway):**
```bash
# View logs
railway logs

# Monitor status
railway status

# Open dashboard
railway open
```

### **Database (Supabase):**
- Supabase Dashboard → Database → Query logs
- Monitor active queries
- Check table sizes
- Review RLS policy hits

### **Autonomous Agents:**
```bash
# Check status via API
curl https://your-backend.railway.app/api/status

# View agent statistics
curl https://your-backend.railway.app/api/analytics/system
```

---

## 🎯 Post-Deployment

### **Immediate:**
1. ✅ Test admin login
2. ✅ Add API keys in admin panel
3. ✅ Upload test CSV file
4. ✅ Verify agents are running
5. ✅ Check database is populating

### **First Week:**
1. Configure target counties for scraping
2. Set up prospecting campaigns
3. Review ML decision recommendations
4. Monitor system analytics
5. Adjust agent intervals if needed

### **Ongoing:**
1. Monitor database growth
2. Review agent performance
3. Update API keys as needed
4. Scale backend if processing more data
5. Review security logs

---

## 🆘 Troubleshooting

### **"Environment variable not defined"**
- Check it's added in Vercel/Railway dashboard
- Verify spelling exactly matches code
- Restart deployment after adding vars

### **"Backend not responding"**
- Check Railway logs: `railway logs`
- Verify SUPABASE_SERVICE_KEY is set
- Check health endpoint: `/health`

### **"Auth not working"**
- Verify VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- Check Supabase auth is enabled
- Verify user has `profiles` entry

### **"API keys not loading"**
- Check Supabase Vault function is deployed
- Verify user has admin role
- Check browser console for errors

---

## 💡 Pro Tips

1. **Use Railway for Backend:** Easiest 24/7 deployment for autonomous agents
2. **Monitor Costs:** Railway/Render have usage-based pricing - monitor in first month
3. **Enable Auto-Deploy:** Push to GitHub → Auto-deploys to Vercel + Railway
4. **Use Preview Deployments:** Vercel creates preview URL for each branch
5. **Backup Strategy:** Supabase auto-backs up database daily
6. **Scale When Needed:** Start small, scale backend when processing >1000 properties/day

---

## ✅ Summary: Where Everything Goes

### **Vercel (Frontend):**
- ✅ React admin dashboard
- ✅ User authentication UI
- ✅ Property browsing/search
- ✅ Member portal
- ✅ Public marketing pages

**Env Vars:** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SCRAPER_API_URL`

### **Railway/Render (Backend):**
- ✅ 7 autonomous agents
- ✅ Web scrapers
- ✅ ML decision engine
- ✅ Prospecting agent
- ✅ API server

**Env Vars:** `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `PORT`, `AUTO_START_SCHEDULER`

### **Supabase (Database + Auth):**
- ✅ All data storage (21 tables)
- ✅ User authentication
- ✅ API key vault
- ✅ Row level security
- ✅ Real-time subscriptions

**Setup:** Run SQL migrations, create admin user

### **Admin Panel (In Your App):**
- ✅ API key management
- ✅ Agent monitoring
- ✅ Analytics dashboards
- ✅ User management
- ✅ System configuration

**Location:** `/admin` after login

---

## 🎉 You're Ready to Deploy!

Your platform is production-ready:
- ✅ Frontend ready for Vercel
- ✅ Backend ready for Railway/Render
- ✅ Database migrations prepared
- ✅ Auth system configured
- ✅ Admin panel with API key management
- ✅ All documentation complete

**Deploy now and start processing properties autonomously!** 🚀
