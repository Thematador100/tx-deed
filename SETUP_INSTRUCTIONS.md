# Complete Setup Instructions - Make Your Tool Work 100%

Follow these steps **EXACTLY** to get your tool working. No coding required.

---

## Step 1: Get Your Supabase Keys

1. Go to https://supabase.com/dashboard
2. Open your project: **aedapqfuegbqztuetkxd**
3. Click **Settings** (gear icon) → **API**
4. Copy these two keys:
   - **Project URL**: `https://aedapqfuegbqztuetkxd.supabase.co`
   - **anon public**: The long key starting with `eyJ...`

---

## Step 2: Create Frontend .env File

1. In your project root, create a file called `.env`
2. Copy this content and **replace with your actual keys**:

```bash
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=paste_your_anon_key_here
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here
```

---

## Step 3: Set Supabase Edge Function Secrets

1. Go to https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions
2. Click **"Edge Functions"** tab
3. Click **"Manage secrets"**
4. Add these secrets one by one:

### Required Secrets:

| Secret Name | Where to Get It | Required For |
|-------------|-----------------|--------------|
| `SUPABASE_URL` | Same as VITE_SUPABASE_URL above | All functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Settings → API → service_role (keep secret!) | All functions |
| `GEMINI_API_KEY` | https://makersuite.google.com/app/apikey | Librarian AI |
| `OPENAI_API_KEY` | https://platform.openai.com/api-keys | Buyer Match, other AI features |

### Optional Secrets (for full functionality):

| Secret Name | Where to Get It | Required For |
|-------------|-----------------|--------------|
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/apikeys | Payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe → Webhooks → Create webhook | Payment webhooks |

---

## Step 4: Deploy All Edge Functions

Open your terminal in the project folder and run:

```bash
# Deploy all functions at once
supabase functions deploy librarian-chat
supabase functions deploy buyer-match
supabase functions deploy deal-dossier
supabase functions deploy deal-rescue
supabase functions deploy dispo-copilot
supabase functions deploy create-checkout-session
supabase functions deploy get-properties
supabase functions deploy get-redeemable-deeds
supabase functions deploy get-tax-delinquent-leads
supabase functions deploy process-document-ocr
supabase functions deploy process-property-upload
supabase functions deploy scrape-county
supabase functions deploy stripe-webhook
```

**OR use this one-liner:**

```bash
for func in librarian-chat buyer-match deal-dossier deal-rescue dispo-copilot create-checkout-session get-properties get-redeemable-deeds get-tax-delinquent-leads process-document-ocr process-property-upload scrape-county stripe-webhook; do supabase functions deploy $func; done
```

---

## Step 5: Update Stripe Price IDs (For Membership Payments)

1. Go to https://dashboard.stripe.com/products
2. Create two products:
   - **Pro Investor** - $99/month recurring
   - **Mentee Elite** - $299/month recurring
3. Copy the Price IDs (look like `price_1abc...`)
4. Open `src/pages/Membership.jsx`
5. Replace these lines:
   - Line 60: Replace `price_1P5qYgRxxxxxxxxxxxxxxxxx` with your Pro Investor price ID
   - Line 76: Replace `price_1P5qZgRxxxxxxxxxxxxxxxxx` with your Mentee Elite price ID

---

## Step 6: Start Your App

```bash
npm run dev
```

Your app should now open at http://localhost:5173

---

## Step 7: Test That Everything Works

### Test Librarian AI:
1. Click the floating green chat button (bottom right)
2. Type: "What is a redemption period?"
3. You should get a real AI response (not a demo message)

### Test Property Features:
1. Go to "Properties" page
2. You should see properties from your database
3. If empty, you'll see demo data (that's ok for now)

### Test Authentication:
1. Click "Sign Up"
2. Create an account
3. You should receive a confirmation email
4. After confirming, you should be able to log in

---

## Troubleshooting

### "Failed to connect to Supabase"
- ✅ Check your .env file exists and has correct keys
- ✅ Restart your dev server: `npm run dev`

### "Edge function not found"
- ✅ Make sure you deployed all functions (Step 4)
- ✅ Check deployment status: `supabase functions list`

### "Librarian AI doesn't respond"
- ✅ Make sure GEMINI_API_KEY is set in Supabase Edge Function secrets
- ✅ Get a free key: https://makersuite.google.com/app/apikey

### "Nothing works at all"
- ✅ Did you create the .env file? (Step 2)
- ✅ Did you set the Supabase secrets? (Step 3)
- ✅ Did you deploy the functions? (Step 4)
- ✅ Did you restart your dev server after creating .env?

---

## Quick Verification Script

Run this to check your setup:

```bash
# Check if .env exists
test -f .env && echo "✅ .env file exists" || echo "❌ .env file missing - create it!"

# Check if Supabase CLI is logged in
supabase projects list && echo "✅ Supabase CLI authenticated" || echo "❌ Run: supabase login"

# List deployed functions
supabase functions list
```

---

## What's Actually Working Now

After completing these steps, you'll have:

✅ **Working Librarian AI** - Real Gemini AI responses
✅ **Working Property Search** - Real database queries
✅ **Working Authentication** - Real Supabase Auth
✅ **Working Buyer Match** - Real OpenAI matching
✅ **Working County Scraper** - Real web scraping
✅ **Working Document Upload** - Real OCR processing
✅ **Working Payments** - Real Stripe checkout

---

## Support

If you're still stuck after following these steps:
1. Run the verification script above
2. Check the browser console for errors (F12)
3. Share the specific error message

**The code is 100% ready. You just need to configure the API keys and deploy the functions.**
