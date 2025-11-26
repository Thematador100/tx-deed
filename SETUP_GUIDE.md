# Win With Deeds - Setup Guide

## 🚨 CRITICAL: Fix "Failed to Fetch" Error on Signup

The signup "failed to fetch" error has been fixed! Follow these steps:

### 1. Get Your Supabase Credentials

1. Go to your Supabase project: https://app.supabase.com/project/aedapqfuegbqztuetkxd/settings/api
2. Copy your **Project URL** (should be: `https://aedapqfuegbqztuetkxd.supabase.co`)
3. Copy your **anon/public key** (starts with `eyJ...`)

### 2. Update .env.local File

Open `/home/user/tx-deed/.env.local` and replace:
```bash
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here
```

With your actual Supabase anon key.

### 3. Set Up Supabase Backend Functions

These environment variables need to be set in your Supabase project dashboard:
https://app.supabase.com/project/aedapqfuegbqztuetkxd/settings/vault

#### Required Secrets for Supabase Functions:

| Secret Name | Description | Where to Get It |
|------------|-------------|-----------------|
| `SUPABASE_URL` | Your Supabase project URL | Same as step 1 above |
| `SUPABASE_ANON_KEY` | Your Supabase anon key | Same as step 1 above |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (admin access) | https://app.supabase.com/project/aedapqfuegbqztuetkxd/settings/api |
| `STRIPE_SECRET_KEY` | Stripe secret key | https://dashboard.stripe.com/apikeys |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key | https://dashboard.stripe.com/apikeys |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | https://dashboard.stripe.com/webhooks |
| `SENDGRID_API_KEY` | SendGrid API key for emails | https://app.sendgrid.com/settings/api_keys |
| `TELNYX_API_KEY` | Telnyx API key for SMS | https://portal.telnyx.com/#/app/api-keys |
| `TELNYX_PHONE_NUMBER` | Your Telnyx phone number | Format: +1234567890 |
| `BRIGHT_DATA_PROXY_URL` | Bright Data proxy endpoint | Your Bright Data account |
| `BRIGHT_DATA_USERNAME` | Bright Data username | Your Bright Data account |
| `BRIGHT_DATA_PASSWORD` | Your Bright Data password | Your Bright Data account |

#### Optional Secrets:

| Secret Name | Description | Where to Get It |
|------------|-------------|-----------------|
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | https://console.cloud.google.com/apis/credentials |
| `OPENAI_API_KEY` | OpenAI API key | https://platform.openai.com/api-keys |
| `SMARTY_AUTH_ID` | SmartyStreets Auth ID | https://www.smarty.com/account/keys |
| `SMARTY_AUTH_TOKEN` | SmartyStreets Auth Token | https://www.smarty.com/account/keys |

## 🎯 Frontend Setup (Quick Start)

1. **Update .env.local** with your Supabase credentials (see above)
2. **Update VITE_STRIPE_PUBLISHABLE_KEY** with your Stripe publishable key
3. **Run the development server:**
   ```bash
   npm install
   npm run dev
   ```
4. **Visit:** http://localhost:3000

## 📧 Email Setup (SendGrid)

1. Create account at https://sendgrid.com
2. Create an API key with "Mail Send" permissions
3. Add `SENDGRID_API_KEY` to Supabase secrets
4. Verify your sender domain/email in SendGrid dashboard

## 📱 SMS Setup (Telnyx)

1. Create account at https://telnyx.com
2. Purchase a phone number in your Telnyx dashboard
3. Generate an API key: https://portal.telnyx.com/#/app/api-keys
4. Add these to Supabase secrets:
   - `TELNYX_API_KEY`
   - `TELNYX_PHONE_NUMBER` (format: +1234567890)

## 🌐 Web Scraping Setup (Bright Data)

Your Bright Data API key is already configured: `0facf31d33d8788b0d9f98308a49ee7b6f7fba93b5b35f9d733e5332a2da7917`

To configure proxy settings in Supabase:
1. Get your proxy endpoint from Bright Data dashboard
2. Add these secrets to Supabase:
   - `BRIGHT_DATA_PROXY_URL`
   - `BRIGHT_DATA_USERNAME`
   - `BRIGHT_DATA_PASSWORD`

## 💳 Stripe Setup

1. Go to https://dashboard.stripe.com/apikeys
2. Copy your **Publishable key** → Add to `.env.local` as `VITE_STRIPE_PUBLISHABLE_KEY`
3. Copy your **Secret key** → Add to Supabase secrets as `STRIPE_SECRET_KEY`
4. Set up webhooks:
   - Go to https://dashboard.stripe.com/webhooks
   - Add endpoint: `https://aedapqfuegbqztuetkxd.supabase.co/functions/v1/stripe-webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook secret → Add to Supabase as `STRIPE_WEBHOOK_SECRET`

## 🗄️ Database Setup

The database schema is already configured in Supabase migrations. To apply:

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Link to your project
supabase link --project-ref aedapqfuegbqztuetkxd

# Push migrations
supabase db push
```

## 🧪 Testing the Platform

### Test Authentication:
1. Go to http://localhost:3000/register
2. Sign up with a test email
3. Check your email for confirmation link
4. Log in with your credentials

### Test Property Search:
1. Log in to the platform
2. Navigate to Properties page
3. Search for properties by location
4. Save properties to your favorites

### Test Premium Features:
1. Navigate to Membership page
2. Select a premium plan
3. Complete Stripe checkout (use test card: 4242 4242 4242 4242)
4. Verify premium features are unlocked

### Test Admin Panel:
1. First user created becomes admin (or manually set role in Supabase)
2. Navigate to /admin/dashboard
3. Configure API keys
4. Test county scrapers

## 🚀 Deployment

### Vercel (Recommended):
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard
# Copy all VITE_* variables from .env.local
```

### Netlify:
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Build
npm run build

# Deploy
netlify deploy --prod --dir=dist
```

## 📋 Troubleshooting

### "Failed to Fetch" on Signup
- ✅ **FIXED**: Updated `customSupabaseClient.js` to use correct env variable
- Ensure `VITE_SUPABASE_ANON_KEY` is set in `.env.local`
- Restart dev server after updating `.env.local`

### Properties Not Loading
- Check Supabase RLS policies are configured correctly
- Verify user is authenticated
- Check browser console for errors

### Stripe Payment Not Working
- Verify `VITE_STRIPE_PUBLISHABLE_KEY` is set in `.env.local`
- Check `STRIPE_SECRET_KEY` is set in Supabase secrets
- Ensure webhook is configured correctly

### Scrapers Not Working
- Verify Bright Data credentials in Supabase secrets
- Check scraper logs in Admin > Dashboard
- Ensure Supabase service role key is set correctly

## 🎉 You're All Set!

Your platform should now be fully functional with:
- ✅ Working authentication (signup/login)
- ✅ Property listings and search
- ✅ Membership tiers and payments
- ✅ Email notifications
- ✅ SMS notifications (Telnyx)
- ✅ County property scrapers
- ✅ Admin dashboard

For additional help, check the code comments or contact support.
