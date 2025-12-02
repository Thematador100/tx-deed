# Setup Without Command Line - Web Dashboard Only

If you're not comfortable with command line, you can do **EVERYTHING** from web dashboards. No terminal required.

---

## Step 1: Create .env File (Manual)

1. In your code editor, create a new file named `.env` in the project root
2. Copy and paste this:

```
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
```

3. Get your keys:
   - Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/api
   - Copy **anon public** key
   - Replace `your_key_here` with the copied key

---

## Step 2: Set Supabase Secrets (Web Dashboard)

1. Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions
2. Click **"Edge Function Secrets"** or **"Manage Secrets"**
3. Add these secrets one by one:

### CRITICAL - Add These First:

**Secret 1: SUPABASE_URL**
- Name: `SUPABASE_URL`
- Value: `https://aedapqfuegbqztuetkxd.supabase.co`
- Click "Add Secret"

**Secret 2: SUPABASE_SERVICE_ROLE_KEY**
- Name: `SUPABASE_SERVICE_ROLE_KEY`
- Value: Get from https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/api (under service_role key - the secret one!)
- Click "Add Secret"

**Secret 3: GEMINI_API_KEY**
- Name: `GEMINI_API_KEY`
- Value: Get from https://makersuite.google.com/app/apikey (it's FREE!)
- Click "Add Secret"

---

## Step 3: Deploy Functions (Web Dashboard)

### Method A - Supabase GitHub Integration (Easiest)

1. Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
2. Click **"Connect to GitHub"**
3. Select your repository: `Thematador100/tx-deed`
4. Select branch: `claude/integrate-real-apis-01XsV8hanU5mzm5igEUg5j59`
5. Click **"Deploy"**
6. Supabase will automatically deploy all functions from your repo!

### Method B - Manual Upload (If Method A doesn't work)

For each function folder in `supabase/functions/`:

1. Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
2. Click **"New Function"** or **"Deploy"**
3. Choose **"Upload"**
4. Select the function's `index.ts` file
5. Enter function name (e.g., `librarian-chat`)
6. Click **"Deploy"**

**Deploy these functions in this order:**
1. `librarian-chat` (for AI chat)
2. `get-properties` (for property listings)
3. `buyer-match` (for buyer matching)
4. `create-checkout-session` (for payments)
5. `get-redeemable-deeds` (for redeemable deeds)
6. `get-tax-delinquent-leads` (for tax leads)
7. `scrape-county` (for county scraping)
8. `process-property-upload` (for file uploads)
9. `process-document-ocr` (for document processing)
10. `deal-dossier` (for due diligence)
11. `deal-rescue` (for deal rescue)
12. `dispo-copilot` (for disposition tools)

The rest are optional for now.

---

## Step 4: Update Stripe Price IDs (Code Editor)

1. Go to: https://dashboard.stripe.com/products
2. Click **"Create Product"**
3. Create **Pro Investor**:
   - Name: Pro Investor
   - Price: $99/month, recurring
   - Click "Save"
   - Copy the Price ID (starts with `price_1...`)
4. Create **Mentee Elite**:
   - Name: Mentee Elite
   - Price: $299/month, recurring
   - Click "Save"
   - Copy the Price ID

5. In your code editor, open `src/pages/Membership.jsx`
6. Find line 60 and replace the price ID
7. Find line 76 and replace the price ID
8. Save the file

---

## Step 5: Start Your App

If using VS Code or similar:
1. Open the terminal in your editor
2. Type: `npm install` (press Enter)
3. Type: `npm run dev` (press Enter)
4. Open the URL it shows (usually http://localhost:5173)

If using online IDE (Replit, CodeSandbox, etc.):
1. Just click "Run" or "Start"
2. It should automatically start

---

## Verify It Works

### Test 1: Open the App
- Go to http://localhost:5173
- You should see the landing page

### Test 2: Test Librarian AI
- Click the green chat bubble (bottom right)
- Type anything: "What is a redemption period?"
- **If you get a real answer** → It's working!
- **If you get "demo" or error** → Check GEMINI_API_KEY in Supabase secrets

### Test 3: Sign Up
- Click "Sign Up"
- Create an account
- **If you get a confirmation email** → Auth is working!
- **If error** → Check your .env file

---

## Common Issues (No CLI Needed)

### Issue: "Cannot read .env file"
**Fix:**
- Make sure the file is named EXACTLY `.env` (with the dot at the start)
- Make sure it's in the root folder (same level as package.json)
- Restart your dev server

### Issue: "Librarian AI not responding"
**Fix:**
1. Get Gemini API key: https://makersuite.google.com/app/apikey
2. Add it to Supabase secrets: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions
3. Redeploy the `librarian-chat` function

### Issue: "Functions not found"
**Fix:**
- Make sure you deployed the functions (Step 3)
- Check they show up in: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions

---

## Important Links

**Your Supabase Project:**
https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd

**Supabase API Settings:**
https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/api

**Supabase Functions:**
https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions

**Supabase Edge Function Secrets:**
https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions

**Stripe Dashboard:**
https://dashboard.stripe.com

**Get Gemini API Key (FREE):**
https://makersuite.google.com/app/apikey

---

## Summary

To make your tool work:
1. ✅ Create .env file with your Supabase keys
2. ✅ Set 3 secrets in Supabase dashboard (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY)
3. ✅ Deploy functions from Supabase dashboard (connect GitHub or upload manually)
4. ✅ Update Stripe price IDs in code
5. ✅ Run the app: `npm run dev`

**No CLI needed. No coding needed. Just configuration!**
