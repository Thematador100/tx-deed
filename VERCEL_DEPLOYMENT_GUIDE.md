# 🚀 Vercel Deployment Guide - Step by Step

**Branch to Deploy:** `claude/google-maps-property-reports-01DhUPdqpSpqaYrDDt5CY73s`
**Repository:** `Thematador100/tx-deed`

---

## 1️⃣ Git Commands (Already Done! ✅)

Your code is already pushed to GitHub:

```bash
# Current status
✅ Branch: claude/google-maps-property-reports-01DhUPdqpSpqaYrDDt5CY73s
✅ Latest commit: 898a61b (Security fixes)
✅ All changes pushed to GitHub
✅ Working tree clean
```

**If you need to push to main branch later:**
```bash
# Switch to main branch
git checkout main

# Merge your feature branch
git merge claude/google-maps-property-reports-01DhUPdqpSpqaYrDDt5CY73s

# Push to main
git push origin main
```

---

## 2️⃣ Vercel Build Configuration

### **Build Command:**
```bash
node tools/generate-llms.js || true && vite build
```

### **Output Directory:**
```bash
dist
```

### **Install Command:**
```bash
npm install
```

### **Framework Preset:**
```
Vite
```

---

## 3️⃣ Environment Variables for Vercel Dashboard

Go to: **Vercel Dashboard → Your Project → Settings → Environment Variables**

### **REQUIRED Variables (Add These First):**

#### 1. **VITE_SUPABASE_URL**
```
https://aedapqfuegbqztuetkxd.supabase.co
```
- **Description:** Supabase project URL
- **Environment:** Production, Preview, Development (all)
- **Required:** ✅ YES

---

#### 2. **VITE_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGFwcWZ1ZWdicXp0dWV0a3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTY4NTEsImV4cCI6MjA3NDQ5Mjg1MX0.mWkZO0jU64_U6JUug7IOhdQmRpiRunahy-QFTLfQCWY
```
- **Description:** Supabase public anonymous key (safe to expose)
- **Environment:** Production, Preview, Development (all)
- **Required:** ✅ YES

---

#### 3. **VITE_SCRAPER_API_URL**
```
https://your-backend.railway.app
```
- **Description:** Backend API URL for autonomous agents
- **Environment:** Production, Preview, Development (all)
- **Required:** ✅ YES (add placeholder now, update after backend deployment)
- **Temporary Value:** `https://placeholder-backend.com` (update later)

---

### **OPTIONAL Variables (Add When You Have Them):**

#### 4. **VITE_STRIPE_PUBLISHABLE_KEY**
```
pk_live_XXXXXXXXXXXXXXXXXXXX
```
- **Description:** Stripe publishable key for payments
- **Example:** `pk_live_51O...` (live) or `pk_test_51O...` (test)
- **Environment:** Production, Preview, Development
- **Required:** ❌ No (needed for payment features)
- **Get it at:** https://dashboard.stripe.com/apikeys

---

#### 5. **VITE_GOOGLE_MAPS_API_KEY**
```
AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- **Description:** Google Maps Platform API key
- **Environment:** Production, Preview, Development
- **Required:** ❌ No (needed for map features)
- **Get it at:** https://console.cloud.google.com/google/maps-apis
- **Required APIs:**
  - Maps JavaScript API
  - Places API
  - Street View Static API
  - Maps Static API

---

#### 6. **VITE_SMARTY_KEY**
```
your_smarty_api_key_here
```
- **Description:** Smarty address validation API key
- **Environment:** Production, Preview, Development
- **Required:** ❌ No (needed for address validation)
- **Get it at:** https://www.smarty.com/pricing

---

#### 7. **VITE_OPENAI_API_KEY**
```
sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
```
- **Description:** OpenAI API key for AI features
- **Environment:** Production, Preview, Development
- **Required:** ❌ No (needed for AI chat features)
- **Get it at:** https://platform.openai.com/api-keys
- **Note:** Consider managing via Admin Panel instead

---

## 4️⃣ Copy-Paste Ready for Vercel

Here's the exact format for Vercel's environment variable interface:

### **Minimum Required (to get started):**

| Name | Value | All Environments |
|------|-------|------------------|
| `VITE_SUPABASE_URL` | `https://aedapqfuegbqztuetkxd.supabase.co` | ✓ |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGFwcWZ1ZWdicXp0dWV0a3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTY4NTEsImV4cCI6MjA3NDQ5Mjg1MX0.mWkZO0jU64_U6JUug7IOhdQmRpiRunahy-QFTLfQCWY` | ✓ |
| `VITE_SCRAPER_API_URL` | `https://placeholder-backend.com` | ✓ |

---

## 5️⃣ Vercel Deployment Steps

### **Step 1: Go to Vercel**
1. Visit https://vercel.com/new
2. Sign in with GitHub (if not already)

### **Step 2: Import Repository**
1. Click "Import Git Repository"
2. Search for: `Thematador100/tx-deed`
3. Click "Import"

### **Step 3: Configure Project**
```
Project Name: win-with-deeds (or your choice)
Framework Preset: Vite
Root Directory: ./
Build Command: node tools/generate-llms.js || true && vite build
Output Directory: dist
Install Command: npm install
```

### **Step 4: Select Branch**
```
Production Branch: claude/google-maps-property-reports-01DhUPdqpSpqaYrDDt5CY73s
```
(You can change this to `main` later after merging)

### **Step 5: Add Environment Variables**

Click "Add Environment Variables" and add the 3 required ones:

```env
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGFwcWZ1ZWdicXp0dWV0a3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTY4NTEsImV4cCI6MjA3NDQ5Mjg1MX0.mWkZO0jU64_U6JUug7IOhdQmRpiRunahy-QFTLfQCWY
VITE_SCRAPER_API_URL=https://placeholder-backend.com
```

**Make sure to check "Production", "Preview", and "Development" for all!**

### **Step 6: Deploy**
1. Click "Deploy"
2. Wait 2-3 minutes for build to complete
3. You'll get a URL like: `https://win-with-deeds.vercel.app`

---

## 6️⃣ After Deployment

### **Immediate Testing:**

1. **Visit your deployment URL**
   - Should see the landing page
   - Check browser console for errors

2. **Test Authentication**
   - Try to login/register
   - Should connect to Supabase

3. **Check for Missing Variables**
   - Open browser DevTools → Console
   - Look for: "Missing Supabase environment variables"
   - Should NOT see this error

### **Update Backend URL (After Backend Deployment):**

Once you deploy your backend to Railway/Render:

1. Go to Vercel Dashboard → Settings → Environment Variables
2. Find `VITE_SCRAPER_API_URL`
3. Update value to: `https://your-actual-backend.railway.app`
4. Click "Save"
5. Redeploy: Deployments → ⋯ → Redeploy

---

## 7️⃣ Troubleshooting

### **Build Fails with "Missing Environment Variables"**
**Solution:** Make sure all 3 required env vars are added in Vercel dashboard

### **App Loads but Shows Errors in Console**
**Solution:** Check that env var names match exactly (case-sensitive!)
- ✅ `VITE_SUPABASE_URL` (correct)
- ❌ `VITE_SUPABASE_url` (wrong)

### **Authentication Not Working**
**Possible causes:**
1. Supabase anon key incorrect → Check Supabase dashboard
2. Supabase URL incorrect → Verify URL matches exactly
3. Supabase RLS policies not set → Run migrations first

**Fix:**
```bash
# Run Supabase migrations
npm run setup:supabase
npm run verify:supabase
```

### **Maps/Stripe Not Working**
**Solution:** Add optional environment variables when ready:
- `VITE_GOOGLE_MAPS_API_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

### **Backend API Not Responding**
**Solution:**
1. Check `VITE_SCRAPER_API_URL` points to correct backend URL
2. Make sure backend is deployed and running
3. Test backend directly: `curl https://your-backend.railway.app/health`

---

## 8️⃣ Custom Domain (Optional)

### **Add Your Domain:**

1. Go to Vercel Dashboard → Settings → Domains
2. Click "Add Domain"
3. Enter your domain: `winwithdeeds.com` (example)
4. Follow DNS configuration instructions
5. Wait for DNS propagation (5-60 minutes)

### **Recommended DNS Settings:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: A
Name: @
Value: 76.76.21.21
```

---

## 9️⃣ Environment Variable Quick Reference

**Copy this checklist:**

```bash
# ✅ REQUIRED - Add these immediately
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SCRAPER_API_URL=https://placeholder-backend.com

# ⏳ UPDATE LATER - After backend deployment
VITE_SCRAPER_API_URL=https://your-backend.railway.app

# 🎯 OPTIONAL - Add when you get API keys
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GOOGLE_MAPS_API_KEY=AIza...
VITE_SMARTY_KEY=...
VITE_OPENAI_API_KEY=sk-...
```

---

## 🔟 Post-Deployment Checklist

After deploying to Vercel:

- [ ] Frontend deployed and accessible
- [ ] Homepage loads without errors
- [ ] Browser console has no critical errors
- [ ] Authentication redirects work
- [ ] Environment variables verified in Vercel dashboard
- [ ] Deploy backend to Railway/Render (see DEPLOYMENT_CHECKLIST.md)
- [ ] Update `VITE_SCRAPER_API_URL` with real backend URL
- [ ] Run Supabase migrations (`npm run setup:supabase`)
- [ ] Create admin user in Supabase
- [ ] Test login/register flow
- [ ] Test admin panel access
- [ ] Add remaining API keys via Admin Panel
- [ ] Test core features (properties, leads, AI agents)
- [ ] Set up custom domain (optional)
- [ ] Configure analytics (optional)

---

## 📊 Expected Build Output

When deployment succeeds, you should see:

```
✓ Building for production...
✓ ✓ 1234 modules transformed.
✓ dist/index.html                    4.12 kB │ gzip:  2.05 kB
✓ dist/assets/index-abc123.css     123.45 kB │ gzip: 23.45 kB
✓ dist/assets/index-xyz789.js      567.89 kB │ gzip: 123.45 kB
✓ built in 15.67s

✓ Deployment ready
```

---

## 🎉 Success Criteria

Your deployment is successful when:

✅ Build completes without errors
✅ Site loads at Vercel URL
✅ Landing page displays correctly
✅ No errors in browser console
✅ Login/Register forms appear
✅ Supabase connection works
✅ Navigation between pages works
✅ Admin login redirects properly

---

## 🆘 Need Help?

- **Vercel Docs:** https://vercel.com/docs
- **Vite Docs:** https://vitejs.dev/guide/
- **Supabase Docs:** https://supabase.com/docs

**Common Issues:**
1. Check DEPLOYMENT_CHECKLIST.md
2. Check SECURITY_SETUP.md
3. Check ENVIRONMENT_VARIABLES.md

---

**Ready to Deploy!** 🚀

Your code is secure, tested, and ready for production. Just follow steps 1-6 above!
