# 🔐 Security Setup Guide

**Status:** ✅ Secured - All credentials moved to environment variables

---

## Security Fixes Applied

### ✅ 1. Removed Hardcoded Credentials

**Before (INSECURE):**
```javascript
// ❌ NEVER do this!
const supabaseUrl = 'https://aedapqfuegbqztuetkxd.supabase.co';
const supabaseAnonKey = 'eyJhbGc...'; // Hardcoded credential
```

**After (SECURE):**
```javascript
// ✅ Always use environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
```

### ✅ 2. Created .env.local for Local Development

The `.env.local` file contains your actual credentials for local development:
- ✅ File created with real Supabase credentials
- ✅ Already in `.gitignore` (will NOT be committed)
- ✅ Safe to use for local development only

### ✅ 3. Updated Code to Use Environment Variables

**Files Modified:**
- `src/lib/customSupabaseClient.js` - Now uses `import.meta.env` instead of hardcoded values

**Validation Added:**
```javascript
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Please check your .env.local file.');
}
```

### ✅ 4. Verified .gitignore Protection

```gitignore
# All .env files are protected
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
```

---

## Environment Variables You Need

### **For Local Development (.env.local)**

Your `.env.local` should contain:

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc... (your anon key)

# Scraper API URL
VITE_SCRAPER_API_URL=http://localhost:3001

# Optional: Add when you get these keys
# VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
# VITE_GOOGLE_MAPS_API_KEY=AIza...
# VITE_SMARTY_KEY=...
# VITE_OPENAI_API_KEY=sk-...
```

### **For Vercel Deployment (Production)**

Add these in Vercel Dashboard → Settings → Environment Variables:

```bash
# Required
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG... (your anon key)
VITE_SCRAPER_API_URL=https://your-backend.railway.app

# Optional (add when you have them)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GOOGLE_MAPS_API_KEY=AIza...
```

### **For Backend Server (Railway/Render)**

```bash
# Required
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY=eyJhbG... (your SERVICE ROLE key - keep secret!)

# Server Configuration
PORT=3001
AUTO_START_SCHEDULER=true
AUTO_RESTART=true
```

---

## Security Best Practices ✅

### 1. **Never Commit Credentials**
- ✅ All `.env*` files are in `.gitignore`
- ✅ No hardcoded credentials in source code
- ✅ Use environment variables for all secrets

### 2. **Different Keys for Different Environments**

| Key Type | Where to Use | Security Level |
|----------|--------------|----------------|
| **Anon Key** | Frontend (public) | ✅ Safe to expose |
| **Service Role Key** | Backend only | ⚠️ KEEP SECRET! |

**IMPORTANT:**
- ✅ Frontend uses `VITE_SUPABASE_ANON_KEY` (public, safe)
- ❌ Frontend should NEVER use `SUPABASE_SERVICE_KEY` (backend only!)
- ✅ Backend uses `SUPABASE_SERVICE_KEY` for database operations

### 3. **Environment Variable Naming**

**Vite (Frontend):**
- Must start with `VITE_` to be accessible in browser
- Example: `VITE_SUPABASE_URL`, `VITE_STRIPE_PUBLISHABLE_KEY`

**Node.js (Backend):**
- No prefix required
- Example: `SUPABASE_SERVICE_KEY`, `PORT`

### 4. **API Key Management**

Most API keys should be managed via the **Admin Panel**, NOT environment variables:

**Via Admin Panel** (Recommended):
- ✅ OpenAI API keys
- ✅ Smarty API keys
- ✅ Stripe Secret keys
- ✅ Other third-party API keys
- ✅ Stored encrypted in Supabase Vault
- ✅ Can be updated without redeploying

**Via Environment Variables** (Only these):
- ✅ Supabase credentials (URL + keys)
- ✅ Server configuration (PORT, etc.)
- ✅ Public keys (Stripe publishable, Google Maps)

---

## How to Get Your Keys

### **Supabase Keys**

1. Go to https://supabase.com/dashboard
2. Select your project: `aedapqfuegbqztuetkxd`
3. Go to **Settings** → **API**
4. Copy:
   - **URL**: `https://aedapqfuegbqztuetkxd.supabase.co`
   - **anon/public key**: For frontend (VITE_SUPABASE_ANON_KEY)
   - **service_role key**: For backend (SUPABASE_SERVICE_KEY) - **KEEP SECRET!**

### **Stripe Keys**

1. Go to https://dashboard.stripe.com/apikeys
2. Copy:
   - **Publishable key** (starts with `pk_`): For frontend
   - **Secret key** (starts with `sk_`): Add via Admin Panel, NOT env vars

### **Google Maps API Key**

1. Go to https://console.cloud.google.com/google/maps-apis
2. Create API key
3. Enable required APIs:
   - Maps JavaScript API
   - Places API
   - Street View Static API
   - Maps Static API
4. Copy key → Add to `VITE_GOOGLE_MAPS_API_KEY`

---

## Verification Checklist

Run these checks to verify security:

### ✅ Check 1: No Credentials in Source Code
```bash
# Should return no results (or only documentation files)
grep -r "eyJhbG" src/
```

### ✅ Check 2: .env.local Exists
```bash
ls -la .env.local
# Should show: -rw------- (permissions 600)
```

### ✅ Check 3: .env.local Not Tracked by Git
```bash
git status --ignored | grep .env.local
# Should show: .env.local (ignored)
```

### ✅ Check 4: App Runs with Environment Variables
```bash
npm run dev
# Should start without errors
# Check browser console for: "Missing Supabase environment variables"
# Should NOT see that error
```

---

## Emergency: If Credentials Were Committed

If you accidentally committed credentials to git, follow these steps:

### 1. **Rotate the Compromised Keys Immediately**

**For Supabase:**
1. Go to Supabase Dashboard → Settings → API
2. Click **Reset service_role key**
3. Update your `.env.local` with the new key
4. Update backend deployment (Railway/Render) with new key

**For Other Services:**
- Stripe: Regenerate API keys in Stripe Dashboard
- OpenAI: Rotate API key in OpenAI Dashboard
- Google Maps: Regenerate API key in Google Cloud Console

### 2. **Remove from Git History**

```bash
# Remove the file from git history (use with caution!)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

# Force push to remove from GitHub
git push origin --force --all
```

### 3. **Notify Your Team**
- Alert anyone with access that keys were rotated
- Update all deployments with new credentials

---

## Current Security Status

| Item | Status | Notes |
|------|--------|-------|
| Credentials in code | ✅ REMOVED | Moved to environment variables |
| .env.local created | ✅ CREATED | Contains real credentials for local dev |
| .gitignore configured | ✅ VERIFIED | All .env files ignored |
| App tested | ✅ WORKING | Runs successfully with env vars |
| Source code secure | ✅ SECURE | No hardcoded secrets |

---

## For Team Members

When cloning this repository, you need to:

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get credentials from team lead:**
   - Ask for Supabase URL and anon key
   - Ask for other API keys as needed

3. **Add to .env.local:**
   ```bash
   VITE_SUPABASE_URL=<provided-url>
   VITE_SUPABASE_ANON_KEY=<provided-key>
   ```

4. **Start development:**
   ```bash
   npm install
   npm run dev
   ```

**NEVER commit .env.local to git!**

---

## Additional Resources

- [Vite Environment Variables Documentation](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase API Keys Guide](https://supabase.com/docs/guides/api#api-keys)
- [OWASP Secrets Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**Security audit completed:** 2025-11-22
**Status:** ✅ Production-ready (secure)
**Next step:** Deploy to Vercel with confidence
