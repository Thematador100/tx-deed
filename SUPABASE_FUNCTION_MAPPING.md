# Complete Frontend Tool → Supabase Function Mapping

This shows EXACTLY which Supabase edge function each frontend feature needs.

---

## 🗺️ Your Supabase Project

**Project ID:** `aedapqfuegbqztuetkxd`
**Project URL:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd

---

## 📊 Frontend Feature → Backend Function Map

### 1. **Librarian AI Chat** (Green chat bubble)
**Frontend File:** `src/components/LibrarianChat.jsx`
**Supabase Function:** `librarian-chat`
**Function Location:** `supabase/functions/librarian-chat/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ GEMINI_API_KEY secret
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Test:** Click green chat bubble, type "What is a tax deed?"

---

### 2. **County Scraper**
**Frontend File:** `src/pages/CountyScraper.jsx`
**Supabase Function:** `scrape-county`
**Function Location:** `supabase/functions/scrape-county/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Test:** Go to /county-scraper, select county, click "Start Scraper"

---

### 3. **Buyer Match Graph**
**Frontend File:** `src/pages/BuyerMatchGraph.jsx`
**Supabase Function:** `buyer-match`
**Function Location:** `supabase/functions/buyer-match/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ OPENAI_API_KEY secret (optional, enhances results)
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `buyer_profiles`
- `buyer_purchases`
- `buyer_match_history`

**Test:** Go to /buyer-match, search for a property

---

### 4. **Property Upload**
**Frontend File:** `src/pages/LeadUpload.jsx`
**Supabase Function:** `process-property-upload`
**Function Location:** `supabase/functions/process-property-upload/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `lead_uploads`
- `properties`

**Test:** Go to /lead-upload, drag and drop a CSV file

---

### 5. **Document Library (OCR)**
**Frontend File:** `src/pages/admin/AdminLibrary.jsx`
**Supabase Function:** `process-document-ocr`
**Function Location:** `supabase/functions/process-document-ocr/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `library_items`
- `document_library`

**Test:** Go to /admin/library, drag and drop a PDF

---

### 6. **Deal Dossier (Due Diligence)**
**Frontend File:** `src/pages/DealDossier.jsx`
**Supabase Function:** `deal-dossier`
**Function Location:** `supabase/functions/deal-dossier/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `deal_dossiers`
- `property_transactions`
- `lien_records`
- `court_records`

**Test:** Go to /deal-dossier, enter an address

---

### 7. **Deal Rescue**
**Frontend File:** `src/pages/DealRescue.jsx`
**Supabase Function:** `deal-rescue`
**Function Location:** `supabase/functions/deal-rescue/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `rescue_campaigns`

**Test:** Go to /deal-rescue, click "Rescue Your Deal"

---

### 8. **Dispo Copilot**
**Frontend File:** `src/pages/DispoCopilot.jsx`
**Supabase Function:** `dispo-copilot`
**Function Location:** `supabase/functions/dispo-copilot/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `deal_microsites`

**Test:** Go to /dispo-copilot, search for a property

---

### 9. **Redeemable Deeds**
**Frontend File:** `src/pages/RedeemableDeeds.jsx`
**Supabase Function:** `get-redeemable-deeds`
**Function Location:** `supabase/functions/get-redeemable-deeds/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `redeemable_deeds`

**Test:** Go to /redeemable-deeds, should see list of properties

---

### 10. **Tax Delinquent Leads**
**Frontend File:** `src/pages/TaxDelinquentLeads.jsx`
**Supabase Function:** `get-tax-delinquent-leads`
**Function Location:** `supabase/functions/get-tax-delinquent-leads/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `tax_delinquent_leads`

**Test:** Go to /tax-delinquent-leads, should see list of properties

---

### 11. **Properties List**
**Frontend File:** `src/pages/Properties.jsx`
**Supabase Function:** `get-properties`
**Function Location:** `supabase/functions/get-properties/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `properties`

**Test:** Go to /properties, should see list of properties

---

### 12. **Membership Checkout**
**Frontend File:** `src/pages/Checkout.jsx`
**Supabase Function:** `create-checkout-session`
**Function Location:** `supabase/functions/create-checkout-session/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ STRIPE_SECRET_KEY secret
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Database Tables Needed:**
- `transactions`
- `profiles`

**Test:** Go to /membership, click upgrade, should redirect to Stripe

---

### 13. **Stripe Webhooks**
**Frontend:** N/A (Stripe calls this)
**Supabase Function:** `stripe-webhook`
**Function Location:** `supabase/functions/stripe-webhook/index.ts`
**Deploy Link:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**Requires:**
- ✅ STRIPE_SECRET_KEY secret
- ✅ STRIPE_WEBHOOK_SECRET secret
- ✅ SUPABASE_URL secret
- ✅ SUPABASE_SERVICE_ROLE_KEY secret

**Setup:** Configure in Stripe dashboard to point to your function URL

---

## 📋 All Edge Functions List

Here are ALL 22 edge functions that exist in your project:

1. ✅ `librarian-chat` - AI chat
2. ✅ `buyer-match` - Buyer matching
3. ✅ `deal-dossier` - Due diligence
4. ✅ `deal-rescue` - Deal rescue
5. ✅ `dispo-copilot` - Disposition tools
6. ✅ `create-checkout-session` - Stripe checkout
7. ✅ `stripe-webhook` - Stripe webhooks
8. ✅ `get-properties` - Property list
9. ✅ `get-redeemable-deeds` - Redeemable deeds
10. ✅ `get-tax-delinquent-leads` - Tax leads
11. ✅ `process-document-ocr` - Document OCR
12. ✅ `process-property-upload` - File upload
13. ✅ `scrape-county` - County scraper
14. ✅ `batch-scrape` - Batch scraping
15. ✅ `hillsborough-scraper` - Hillsborough specific
16. ✅ `marketplace-purchase` - Marketplace buying
17. ✅ `property-analysis` - Property analysis
18. ✅ `property-lookup` - Property search
19. ✅ `scout-agent-monitor` - Scout monitoring
20. ✅ `send-notification` - Notifications
21. ✅ `smarty-autocomplete` - Address autocomplete
22. ✅ `_shared` - Shared utilities

---

## 🔑 Required Secrets (Minimum to Work)

Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions

Add these 4 secrets:

| Secret Name | Value | Used By |
|-------------|-------|---------|
| `SUPABASE_URL` | `https://aedapqfuegbqztuetkxd.supabase.co` | ALL functions |
| `SUPABASE_SERVICE_ROLE_KEY` | Get from API settings | ALL functions |
| `SUPABASE_ANON_KEY` | Get from API settings | Some functions |
| `GEMINI_API_KEY` | Get from Google AI | Librarian chat |

### Optional (for full features):
| Secret Name | Value | Used By |
|-------------|-------|---------|
| `OPENAI_API_KEY` | Get from OpenAI | Buyer match, enhanced features |
| `STRIPE_SECRET_KEY` | Get from Stripe | Payments |
| `STRIPE_WEBHOOK_SECRET` | Get from Stripe | Payment webhooks |

---

## 📊 Required Database Tables

Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/editor

Run `COMPLETE_DATABASE_SETUP.sql` to create ALL these tables:

### Core Tables:
- `profiles` - User accounts
- `properties` - Property listings
- `tax_delinquent_leads` - Tax delinquent properties
- `redeemable_deeds` - Redeemable properties

### Feature Tables:
- `buyer_profiles` - Buyer data
- `buyer_purchases` - Purchase history
- `buyer_match_history` - Match tracking
- `deal_dossiers` - Due diligence reports
- `property_transactions` - Transaction history
- `lien_records` - Lien information
- `court_records` - Court cases
- `library_items` - Training content
- `document_library` - OCR documents
- `lead_uploads` - File uploads
- `transactions` - Payment records
- `deal_microsites` - Property microsites
- `rescue_campaigns` - Deal rescue campaigns

...and 15+ more tables for full functionality

---

## ✅ Deployment Checklist

Use this to verify everything is set up:

### 1. Database Tables Created?
**Check:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/editor
- [ ] Click "Tables" on left sidebar
- [ ] Should see 30+ tables listed
- [ ] If not: Run `COMPLETE_DATABASE_SETUP.sql` in SQL editor

### 2. Edge Functions Deployed?
**Check:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
- [ ] Should see 20+ functions with "deployed" status
- [ ] If not: Connect GitHub or deploy manually

### 3. Secrets Configured?
**Check:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions
- [ ] Should see 4 secrets minimum (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, GEMINI_API_KEY)
- [ ] If not: Click "Add new secret" and add them

### 4. Frontend .env Created?
**Check:** Look in project root folder
- [ ] File named `.env` exists
- [ ] Contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
- [ ] If not: Create it following INSTANT_SETUP.md

---

## 🆘 Quick Troubleshooting

### "Function not found" error:
**Problem:** Edge function not deployed
**Fix:** Deploy it at https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions

### "Table does not exist" error:
**Problem:** Database not set up
**Fix:** Run COMPLETE_DATABASE_SETUP.sql in SQL editor

### "Invalid API key" error:
**Problem:** Secrets not configured
**Fix:** Add secrets at https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions

### "Cannot connect" error:
**Problem:** Frontend .env file missing or wrong
**Fix:** Create .env file with correct keys, restart dev server

---

## 📞 Direct Links Summary

**All Functions:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/functions
**All Secrets:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/functions
**All Tables:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/editor
**API Keys:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/api
**SQL Editor:** https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/sql/new

**Everything is in your Supabase project: aedapqfuegbqztuetkxd**
