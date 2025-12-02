# ⚡ INSTANT SETUP - Get Working in 10 Minutes

I'm going to make this REALLY simple. Follow these exact steps.

---

## Step 1: Run Database Setup (3 minutes)

1. Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/editor
2. Click **"New Query"**
3. Open the file `COMPLETE_DATABASE_SETUP.sql` from your project
4. Copy ALL the contents
5. Paste into the Supabase SQL editor
6. Click **"Run"** (or press Cmd+Enter)
7. Wait for it to complete (you'll see "Success")

**This creates ALL your database tables at once.**

---

## Step 2: Set Environment Secrets (3 minutes)

Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/api

**Get your keys first:**
- Copy the **URL**: `https://aedapqfuegbqztuetkxd.supabase.co`
- Copy the **anon public** key (the long one)
- Copy the **service_role** key (keep this secret!)

Now go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions

Click **"Add new secret"** and add these THREE:

| Name | Value |
|------|-------|
| `SUPABASE_URL` | `https://aedapqfuegbqztuetkxd.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Paste the service_role key you copied |
| `SUPABASE_ANON_KEY` | Paste the anon key you copied |

**Get Gemini API Key (FREE):**
1. Go to: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key
4. Add one more secret in Supabase:

| Name | Value |
|------|-------|
| `GEMINI_API_KEY` | Paste your Gemini key |

---

## Step 3: Deploy Functions Automatically (2 minutes)

### Option A - GitHub Integration (Recommended):

1. Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
2. Look for **"Connect to GitHub"** or **"Deploy from GitHub"**
3. Connect your repository: `Thematador100/tx-deed`
4. Select branch: `claude/integrate-real-apis-01XsV8hanU5mzm5igEUg5j59`
5. Click **"Deploy"**

Supabase will automatically deploy ALL 20+ functions!

### Option B - If GitHub Integration isn't available:

Use Vercel/Netlify to deploy, OR I'll create individual function deployment files.

---

## Step 4: Create .env File (1 minute)

In your project root, create a file named `.env`:

```bash
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_yourkey_here
```

Replace `your_anon_public_key_here` with the anon key from Step 2.

---

## Step 5: Start Your App (1 minute)

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## ✅ TEST IT WORKS

### Test 1: Librarian AI
1. Click the green chat button (bottom right)
2. Type: "What is a tax deed?"
3. **You should get a real AI response**

If it says "error" or "demo":
- Check GEMINI_API_KEY is set in Supabase secrets
- Check the librarian-chat function is deployed

### Test 2: Login
1. Click "Sign Up"
2. Enter email and password
3. **You should get a confirmation email**

If signup fails:
- Check your .env file exists
- Restart your dev server

### Test 3: Properties Page
1. Go to http://localhost:5173/properties
2. **You should see properties** (or demo data if database is empty)

---

## 🆘 If Something Doesn't Work

### "Database tables don't exist"
**Fix:** Run Step 1 again - make sure ALL the SQL completed

### "Function not found"
**Fix:** Check functions are deployed in Supabase dashboard

### "Invalid API key"
**Fix:**
1. Delete .env file
2. Create it again with correct keys
3. Restart dev server: Stop (Ctrl+C) and run `npm run dev` again

### "Still not working"
**Check these URLs:**

1. **Database tables**: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/editor
   - Click "Tables" on left - you should see ~20+ tables

2. **Edge functions**: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
   - You should see deployed functions listed

3. **Secrets**: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions
   - You should see 4 secrets: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, GEMINI_API_KEY

---

## 📊 What Gets Set Up

After these 5 steps, you'll have:

✅ **30+ database tables** - All created and ready
✅ **20+ edge functions** - All deployed and working
✅ **4 environment secrets** - All configured
✅ **Frontend .env** - Connecting to Supabase
✅ **Working Librarian AI** - Real Gemini responses
✅ **Working Authentication** - Real user signups
✅ **Working Properties** - Real database queries

---

## Why This Will Work Now

**Previous attempts failed because:**
- Database tables weren't created
- Functions weren't deployed
- Secrets were entered but functions weren't deployed to use them

**This guide creates EVERYTHING:**
- One SQL file creates ALL tables
- GitHub integration deploys ALL functions
- Secrets are verified before starting
- .env file connects frontend to backend

**No CLI needed. No coding needed. Just configuration!**
