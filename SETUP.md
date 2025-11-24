# Win With Deeds - Setup Guide

This guide will help you get your Win With Deeds application up and running. Follow these steps carefully to ensure everything works correctly.

## Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn
- A Supabase account
- A Stripe account (for payments)

## Step 1: Clone and Install

```bash
git clone <your-repo-url>
cd tx-deed
npm install
```

## Step 2: Environment Variables Setup

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Configure Supabase:**
   - Go to [Supabase Dashboard](https://supabase.com/dashboard)
   - Create a new project or select your existing project
   - Go to Settings > API
   - Copy the following values to your `.env` file:
     - `VITE_SUPABASE_URL`: Your project URL (e.g., `https://xxxxx.supabase.co`)
     - `VITE_PUBLIC_SUPABASE_ANON_KEY`: Your anon/public key

3. **Configure Stripe:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/apikeys)
   - Copy your publishable key to your `.env` file:
     - For development: Use a test key (starts with `pk_test_`)
     - For production: Use a live key (starts with `pk_live_`)
   - Set `VITE_STRIPE_PUBLISHABLE_KEY` in your `.env` file

4. **Optional Template Configuration:**
   - If you're using Horizons.ai template features, set:
     - `TEMPLATE_BANNER_SCRIPT_URL`
     - `TEMPLATE_REDIRECT_URL`
   - Otherwise, leave these commented out

## Step 3: Supabase Database Setup

Your Supabase project needs the following tables. You can create them via the Supabase SQL Editor:

### Required Tables:
- `properties` - Stores property listings
- `lead_uploads` - Tracks uploaded lead files
- `api_keys` - Stores encrypted API keys for external services
- `profiles` - User profile information (auto-created if using Supabase Auth)

### Required Supabase Edge Functions:
The application expects these Edge Functions to be deployed in your Supabase project:
- `generate-dossier` - AI-powered due diligence reports
- `analyze-document-ocr` - Document analysis using Google Document AI
- `property-lookup` - Property search and lookup
- `smarty-autocomplete` - Address autocomplete using SmartyStreets

**Note:** These Edge Functions are not included in this repository. You'll need to deploy them separately to your Supabase project.

### Storage Buckets:
- `lead-uploads` - For storing uploaded documents (must have RLS policies configured)

## Step 4: Verify Installation

1. **Run the development server:**
   ```bash
   npm run dev
   ```
   The server should start at `http://localhost:3000`

2. **Check for errors:**
   - Open your browser console (F12)
   - Look for any error messages
   - If you see "Missing Supabase environment variables", check your `.env` file

3. **Test the build:**
   ```bash
   npm run build
   ```
   This should complete without errors

## Step 5: Initial Configuration

1. **Create an Admin Account:**
   - Navigate to `/setupadmin` (one-time setup)
   - Follow the prompts to create your admin account

2. **Configure API Keys (Admin Only):**
   - Navigate to the Admin section
   - Go to API Vault
   - Add your external API keys:
     - OpenAI API key (for AI features)
     - SmartyStreets API key (for address validation)
     - Google Document AI key (for OCR features)

## Common Issues and Solutions

### Issue: "Missing Supabase environment variables" in console

**Solution:** Check that your `.env` file exists and contains valid values for `VITE_SUPABASE_URL` and `VITE_PUBLIC_SUPABASE_ANON_KEY`.

### Issue: Build fails with "vite: not found"

**Solution:** Run `npm install` to install all dependencies.

### Issue: Can't log in / Auth not working

**Solution:**
- Verify your Supabase project has Email Auth enabled
- Check that your redirect URLs are configured in Supabase (Settings > Authentication > URL Configuration)

### Issue: AI features not working

**Solution:**
- Ensure you've deployed the required Supabase Edge Functions
- Verify API keys are configured in the Admin API Vault
- Check browser console for specific error messages

### Issue: Payment/Checkout not working

**Solution:**
- Verify your Stripe publishable key is correct
- Ensure you're using a test key for development
- Check that Stripe is properly initialized by looking at the browser console

## Deployment

### Vercel Deployment (Recommended)

1. **Connect your repository to Vercel:**
   - Go to [Vercel](https://vercel.com)
   - Import your repository
   - Configure environment variables in Vercel dashboard (same as your `.env`)

2. **Configure Build Settings:**
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **The `vercel.json` file is already configured for URL rewrites**

### Other Platforms

The app can be deployed to any static hosting service that supports:
- Node.js build process
- Environment variables
- SPA routing (URL rewrites)

## Security Best Practices

1. **Never commit your `.env` file** - It's already in `.gitignore`
2. **Use different API keys for development and production**
3. **Regularly rotate your Supabase keys** if they're exposed
4. **Enable Row Level Security (RLS)** on all Supabase tables
5. **Configure proper CORS settings** in Supabase

## Getting Help

If you encounter issues:
1. Check the browser console for error messages
2. Check the Supabase logs (Dashboard > Logs)
3. Verify all environment variables are set correctly
4. Ensure all required Edge Functions are deployed

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Next Steps

Once everything is set up:
1. Configure your admin account via `/setupadmin`
2. Add API keys in the Admin section
3. Upload property listings
4. Test the AI features
5. Configure your membership tiers
6. Set up Stripe products for payments

---

**Need help?** Check the browser console and Supabase logs for detailed error messages.
