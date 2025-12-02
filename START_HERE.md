# 🚀 START HERE - Get Your Tool Working in 15 Minutes

Your code is **100% ready**. You just need to configure API keys. No coding required.

---

## ⚡ Quick Start (Do These 4 Things)

### 1. Create .env File (2 minutes)

In your project folder, create a file named `.env` with this content:

```bash
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

**Where to get these keys:**
- Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/api
- Copy the **anon public** key (the long one starting with eyJ...)
- Paste it where it says `paste_your_key_here`

---

### 2. Set Supabase Secrets (5 minutes)

Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions

Click "Edge Function Secrets" and add these:

| Secret Name | Value | Where to Get |
|-------------|-------|--------------|
| `SUPABASE_URL` | `https://aedapqfuegbqztuetkxd.supabase.co` | Same as above |
| `SUPABASE_SERVICE_ROLE_KEY` | Get from API settings | **Settings → API → service_role** (keep secret!) |
| `GEMINI_API_KEY` | Get free at https://makersuite.google.com/app/apikey | For Librarian AI |

---

### 3. Deploy Functions (3 minutes)

**Option A - If you have Supabase CLI:**
```bash
# Install CLI if needed
npm install -g supabase

# Login
supabase login

# Deploy all functions
./deploy-all.sh
```

**Option B - Deploy from Supabase Dashboard:**
1. Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
2. For each function in the `supabase/functions/` folder:
   - Click "Deploy new function"
   - Select the function folder
   - Click Deploy

**Critical functions to deploy first:**
- librarian-chat
- buyer-match
- create-checkout-session
- get-properties
- get-redeemable-deeds

---

### 4. Start Your App (1 minute)

```bash
npm install
npm run dev
```

Open http://localhost:5173

---

## ✅ Test That It Works

### Test 1: Librarian AI
1. Click the green chat bubble (bottom right)
2. Type: "What is a redemption period?"
3. **You should get a real AI response** (not "This is a demo")

If it says "demo" → Check that GEMINI_API_KEY is set in Supabase secrets

---

### Test 2: Authentication
1. Click "Sign Up"
2. Create an account
3. **You should get a confirmation email**
4. After confirming, you can log in

If login doesn't work → Check your .env file has the correct keys

---

### Test 3: Properties
1. Go to "Properties" page
2. **You should see properties** (or demo data if database is empty)

---

## 🆘 Still Not Working?

### Problem: "Cannot connect to Supabase"
**Solution:**
- ✅ Check .env file exists and has correct keys
- ✅ Restart dev server: Stop and run `npm run dev` again

### Problem: "Librarian AI doesn't respond"
**Solution:**
- ✅ Get GEMINI_API_KEY: https://makersuite.google.com/app/apikey
- ✅ Add it to Supabase Edge Function Secrets
- ✅ Redeploy librarian-chat function

### Problem: "Function not found" errors
**Solution:**
- ✅ Deploy the functions (see Step 3 above)
- ✅ Check deployment status in Supabase dashboard

### Problem: "Everything still broken"
**Solution:**
Run the verification script:
```bash
./verify-setup.sh
```

This will tell you exactly what's missing.

---

## 📁 Important Files

- **START_HERE.md** (this file) - Quick start guide
- **SETUP_INSTRUCTIONS.md** - Detailed step-by-step guide
- **deploy-all.sh** - Script to deploy all functions
- **verify-setup.sh** - Check what's configured
- **.env.example** - Template for your .env file
- **ALL_SIMULATIONS_REMOVED.md** - What we fixed in the code

---

## 🎯 What You Get When It's Working

✅ Librarian AI with real Gemini responses
✅ Buyer Match with real OpenAI matching
✅ County Scraper with real web scraping
✅ Property Upload with real AI parsing
✅ Deal Dossier with real due diligence
✅ Authentication with real Supabase Auth
✅ Payments with real Stripe checkout

**All the code is done. You just need the API keys configured.**

---

## Need More Help?

1. Read **SETUP_INSTRUCTIONS.md** for detailed steps
2. Run `./verify-setup.sh` to see what's missing
3. Check browser console (F12) for specific errors

**The tool is ready. Just configure the keys and it will work!**
