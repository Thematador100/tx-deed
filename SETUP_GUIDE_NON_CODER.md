# 🚀 Complete Setup Guide for Non-Coders
## Win With Deeds - Tax Deed Scraper Platform

This guide will walk you through setting up your complete tax deed scraper platform from scratch. **No coding experience needed!**

---

## 📋 What You'll Set Up:
1. ✅ Supabase (Database + Backend)
2. ✅ API Keys (Google Maps, Smarty Streets)
3. ✅ GitHub Repository (Already done!)
4. ✅ Vercel Deployment (Your live website)

**Time needed:** 45-60 minutes

---

## Part 1: Supabase Setup (Database & Backend)

### Step 1.1: Get Your Supabase Credentials

1. **Go to:** https://supabase.com/dashboard
2. **Log in** or **create account** (free tier is fine)
3. **Click your project** (or create new one if needed)
4. **Click the Settings icon** (⚙️) on left sidebar
5. **Click "API"** in the Settings menu
6. **Copy these TWO things:**
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon/public key** (long string of letters/numbers)
7. **Save them in a notepad** - you'll need these!

### Step 1.2: Set Up Database Tables

1. **In Supabase Dashboard**, click **"SQL Editor"** (left sidebar)
2. **Click "+ New query"**
3. **Open this file on your computer:** `/supabase/migrations/20250101000000_initial_schema.sql`
4. **Copy ALL the text** from that file
5. **Paste it** into the SQL Editor
6. **Click "Run"** (bottom right)
7. ✅ You should see: "Success. No rows returned"

**What this did:** Created all your database tables (properties, users, scrapers, etc.)

### Step 1.3: Add Starting Data (Seed Data)

1. **Still in SQL Editor**, click **"+ New query"** again
2. **Open this file:** `/supabase/seed/initial_scraper_configs.sql`
3. **Copy and paste** all the text
4. **Click "Run"**
5. ✅ You should see: "Success. X rows returned"

**What this did:** Added configuration for county scrapers (Texas counties)

### Step 1.4: Deploy Supabase Functions (Backend)

**IMPORTANT:** This is the trickiest part. You have 2 options:

#### Option A: Use Supabase CLI (Recommended but needs terminal)

1. **Install Supabase CLI:**
   - **Mac:** Open Terminal, type: `brew install supabase/tap/supabase`
   - **Windows:** Download from: https://github.com/supabase/cli/releases

2. **Login to Supabase:**
   ```bash
   supabase login
   ```
   (This will open browser to authenticate)

3. **Link your project:**
   ```bash
   cd /home/user/tx-deed
   supabase link --project-ref YOUR_PROJECT_ID
   ```
   (Replace YOUR_PROJECT_ID - find it in Supabase dashboard URL)

4. **Deploy all functions:**
   ```bash
   supabase functions deploy scrape-county
   supabase functions deploy batch-scrape
   supabase functions deploy get-properties
   supabase functions deploy get-tax-delinquent-leads
   supabase functions deploy get-redeemable-deeds
   supabase functions deploy property-lookup
   supabase functions deploy hillsborough-scraper
   supabase functions deploy property-analysis
   supabase functions deploy smarty-autocomplete
   ```

#### Option B: Manual Upload (Easier but slower)

1. **In Supabase Dashboard**, click **"Edge Functions"** (left sidebar)
2. **For EACH folder** in `/supabase/functions/` (except `_shared`):
   - Click **"Create Function"**
   - Name it (e.g., `scrape-county`)
   - Copy/paste the code from `index.ts` in that folder
   - Click **"Deploy"**
3. **Repeat for all 9 functions**

**Functions to deploy:**
- `scrape-county`
- `batch-scrape`
- `get-properties`
- `get-tax-delinquent-leads`
- `get-redeemable-deeds`
- `property-lookup`
- `hillsborough-scraper`
- `property-analysis`
- `smarty-autocomplete`

---

## Part 2: Get API Keys

### Step 2.1: Google Maps API Key

1. **Go to:** https://console.cloud.google.com/
2. **Create new project** (or select existing)
3. **Click "APIs & Services"** → **"Enable APIs and Services"**
4. **Search for and enable:**
   - Maps JavaScript API
   - Places API
   - Geocoding API
5. **Click "Credentials"** (left sidebar)
6. **Click "+ CREATE CREDENTIALS"** → **"API Key"**
7. **Copy the API key** - save it!
8. **Click "Restrict Key"**:
   - Under "API restrictions", select "Restrict key"
   - Check: Maps JavaScript API, Places API, Geocoding API
   - Click **"Save"**

**Free tier:** 200-300 free requests per day

### Step 2.2: Smarty Streets API Key (Optional - for address autocomplete)

1. **Go to:** https://www.smarty.com/pricing/us-autocomplete-pro-api
2. **Sign up** for free trial (250 free lookups)
3. **Get your API keys:**
   - Auth ID
   - Auth Token
4. **Save these!**

**Note:** This is optional - autocomplete will still work without it (just slower)

---

## Part 3: Configure Environment Variables

You need to create a **`.env`** file with all your API keys.

### Step 3.1: Create .env File

1. **In your project folder**, create file named **`.env`** (exactly, with the dot)
2. **Copy this template:**

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here

# Smarty Streets (Optional)
VITE_SMARTY_AUTH_ID=your_smarty_auth_id
VITE_SMARTY_AUTH_TOKEN=your_smarty_auth_token
```

3. **Replace the placeholders:**
   - Put your Supabase URL from Step 1.1
   - Put your Supabase anon key from Step 1.1
   - Put your Google Maps key from Step 2.1
   - Put Smarty keys from Step 2.2 (or leave blank)

4. **Save the file**

### Step 3.2: Add .env to .gitignore

**IMPORTANT:** Don't push API keys to GitHub!

1. **Open `.gitignore` file**
2. **Make sure it has this line:**
   ```
   .env
   ```
3. **Save**

---

## Part 4: Push to GitHub (Connect Everything)

### Step 4.1: Commit Your Changes

1. **Open Terminal** (or Git Bash on Windows)
2. **Navigate to your project:**
   ```bash
   cd /home/user/tx-deed
   ```
3. **Check what's changed:**
   ```bash
   git status
   ```
4. **Add all files:**
   ```bash
   git add .
   ```
5. **Commit:**
   ```bash
   git commit -m "Complete setup with all scrapers and configurations"
   ```
6. **Push to GitHub:**
   ```bash
   git push origin claude/merge-scraper-branches-01K6c1rXWPw6CakAjpffsLxX
   ```

### Step 4.2: Merge to Main Branch

1. **Go to GitHub:** https://github.com/Thematador100/tx-deed
2. **Click "Pull requests"** tab
3. **Click "New pull request"** (green button)
4. **Set:**
   - Base: `main`
   - Compare: `claude/merge-scraper-branches-01K6c1rXWPw6CakAjpffsLxX`
5. **Click "Create pull request"**
6. **Add title:** "Complete scraper platform with all features"
7. **Click "Create pull request"**
8. **Click "Merge pull request"**
9. **Click "Confirm merge"**

✅ **Your main branch now has ALL the scraper code!**

---

## Part 5: Deploy to Vercel (Make It Live!)

### Step 5.1: Connect GitHub to Vercel

1. **Go to:** https://vercel.com
2. **Sign up / Log in** (use GitHub to sign in - easiest)
3. **Click "Add New Project"**
4. **Find your repository:** `tx-deed`
5. **Click "Import"**

### Step 5.2: Configure Vercel Project

1. **Project Name:** `win-with-deeds` (or whatever you want)
2. **Framework Preset:** Vite (should auto-detect)
3. **Root Directory:** `./` (leave as is)
4. **Build Command:** `npm run build`
5. **Output Directory:** `dist`

### Step 5.3: Add Environment Variables in Vercel

**IMPORTANT:** Add your API keys to Vercel!

1. **Scroll to "Environment Variables"** section
2. **Add each variable:**
   - **Name:** `VITE_SUPABASE_URL`
     **Value:** (your Supabase URL)

   - **Name:** `VITE_PUBLIC_SUPABASE_ANON_KEY`
     **Value:** (your Supabase anon key)

   - **Name:** `VITE_GOOGLE_MAPS_API_KEY`
     **Value:** (your Google Maps key)

   - **Name:** `VITE_SMARTY_AUTH_ID`
     **Value:** (your Smarty auth ID - optional)

   - **Name:** `VITE_SMARTY_AUTH_TOKEN`
     **Value:** (your Smarty auth token - optional)

3. **Click "Deploy"**

### Step 5.4: Wait for Deployment

- Vercel will build and deploy your site
- This takes 2-5 minutes
- You'll see a **"Visit"** button when done
- Click it to see your live site! 🎉

---

## Part 6: Test Everything

### Test 1: Check if Site Loads
1. Visit your Vercel URL (e.g., `win-with-deeds.vercel.app`)
2. Should see your landing page
3. ✅ Site loads!

### Test 2: Test Login/Registration
1. Click "Register" or "Sign Up"
2. Create test account
3. Check if you can log in
4. ✅ Auth works!

### Test 3: Test County Scraper
1. Log in to your site
2. Go to **Lead Generation** → **County Scraper**
3. Select a state (e.g., Texas)
4. Enter a county (e.g., Harris)
5. Click "Scrape County"
6. ✅ Should see scraping in progress!

### Test 4: Test Property Search
1. Go to **Lead Generation** → **Property Lookup**
2. Enter an address
3. Click "Search"
4. ✅ Should see property details!

---

## 🎯 You're Done!

### What You Now Have:

✅ **Live Website** on Vercel
✅ **Supabase Backend** with database
✅ **County Scrapers** for multiple states
✅ **Property Search** functionality
✅ **User Authentication** (login/register)
✅ **Admin Panel** for managing scrapers
✅ **Google Maps Integration**
✅ **Tax Delinquent Leads** database
✅ **Redeemable Deeds** tracking

---

## 🆘 Troubleshooting

### Problem: "Supabase connection failed"
**Fix:**
- Check environment variables in Vercel
- Make sure URL and anon key are correct
- Redeploy: Vercel Dashboard → Deployments → "Redeploy"

### Problem: "Google Maps not loading"
**Fix:**
- Check Google Maps API key in Vercel
- Make sure Maps APIs are enabled in Google Cloud Console
- Check billing is enabled (even for free tier)

### Problem: "Scrapers not working"
**Fix:**
- Check if Supabase functions are deployed
- Go to Supabase → Edge Functions → verify all 9 are there
- Check function logs for errors

### Problem: "Build failed on Vercel"
**Fix:**
- Check Vercel build logs
- Common issue: missing dependencies
- Try: Vercel Dashboard → Settings → General → "Node.js Version" → set to 18.x

### Problem: "Can't log in"
**Fix:**
- Go to Supabase Dashboard → Authentication → Settings
- Add your Vercel URL to "Redirect URLs"
- Format: `https://your-site.vercel.app/**`

---

## 📞 Next Steps

After everything works:
1. **Set up custom domain** (optional) in Vercel
2. **Configure email templates** in Supabase
3. **Test each county scraper** individually
4. **Add more counties** as needed
5. **Set up scheduled scraping** (cron jobs)

---

## 📚 Important Files Reference

- **`.env`** - Your API keys (NEVER commit to GitHub!)
- **`/supabase/functions/`** - Backend scraper code
- **`/src/pages/`** - Frontend UI pages
- **`/supabase/migrations/`** - Database setup
- **`PR_DESCRIPTION.md`** - Summary of all changes

---

**🎉 Congratulations! You've deployed a complete tax deed scraper platform!**

Need help with a specific step? Just describe what you see on screen and where you're stuck!
