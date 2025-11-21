# Admin Panel Guide - Win With Deeds

This guide will help you get your production-ready admin panel up and running with real data.

## Table of Contents

1. [Initial Setup](#initial-setup)
2. [Database Configuration](#database-configuration)
3. [Adding Data](#adding-data)
4. [AI Agent Configuration](#ai-agent-configuration)
5. [Admin Panel Features](#admin-panel-features)
6. [Troubleshooting](#troubleshooting)

---

## Initial Setup

### 1. Set Up Supabase Database

Your Supabase database needs to be configured with the production schema.

**Steps:**
1. Log in to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to the **SQL Editor**
3. Open `supabase/schema.sql` from this repository
4. Copy and paste the entire file into the SQL Editor
5. Click **Run** (or press Cmd/Ctrl + Enter)
6. Wait for completion (you should see success messages)

This will create all necessary tables, indexes, Row Level Security policies, and functions.

### 2. Verify Database Setup

After running the schema, verify these tables exist:
- ✅ profiles
- ✅ properties
- ✅ tax_delinquent_leads
- ✅ redeemable_deeds
- ✅ saved_properties
- ✅ transactions
- ✅ library_items
- ✅ lead_uploads
- ✅ scout_agents
- ✅ pipeline_stages
- ✅ notifications
- ✅ partner_applications
- ✅ funding_submissions
- ✅ api_keys

You can check by running:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

### 3. Create Your Admin Account

**Option A: First User is Auto-Admin**
- Simply register the first user account
- That account will have admin privileges

**Option B: Use Setup Script**
- Navigate to `/setup-admin` in your browser
- Follow the on-screen instructions
- This will create an admin user or promote an existing user

**Option C: Manually Set Admin Role**
```sql
UPDATE profiles
SET role = 'admin'
WHERE id = 'YOUR_USER_ID';
```

---

## Database Configuration

### Row Level Security (RLS)

All tables have RLS enabled with policies that:
- Allow users to view/edit only their own data
- Allow admins to view/edit all data
- Prevent unauthorized access

### API Keys Table

The `api_keys` table stores encrypted API credentials for third-party services. Only admins can access this table.

---

## Adding Data

### Via Admin Panel

Once logged in as admin, navigate to the Admin Dashboard at `/admin`

#### 1. Add Properties (`/admin/properties`)

- Click **"+ Add Property"** (future enhancement)
- Or edit existing properties by clicking "Edit"
- Required fields: Address
- Recommended fields: Price, Estimated Value, Property Type, Opportunity Score

#### 2. Add Tax Delinquent Leads (`/admin/tax-leads`)

- Click **"Add Lead"**
- Fill in the form:
  - **Required:** Address
  - **Recommended:** Parcel ID, Delinquent Amount, Status, Owner Name
- Click **"Save Lead"**

**Bulk Import (Coming Soon):**
- Click "Import CSV"
- Upload a CSV with columns matching the database schema
- Review and import

#### 3. Add Redeemable Deeds (`/admin/redeemable-deeds`)

- Click **"Add Deed"**
- Fill in the form:
  - **Required:** Address, Redemption Date
  - **Recommended:** Sale Price, New Owner, State
  - **Optional:** Interest Rate (defaults to 20% for GA)
- Click **"Save Deed"**

#### 4. Manage Users (`/admin/users`)

- View all registered users
- Edit user details (name, phone, company)
- Change user roles:
  - `user` - Basic access
  - `Mentee Elite` - Advanced features + Scout Agent
  - `admin` - Full admin access
- Delete users (with confirmation)

#### 5. Manage Library Content (`/admin/library`)

- Upload educational PDFs and documents
- AI-powered OCR extracts text automatically (requires Google Document AI API key)
- Organize by categories

---

## AI Agent Configuration

### 1. Configure API Keys (`/admin/api-keys`)

Navigate to **Admin > API Key Vault** and add your keys:

**Required for AI Features:**
- **OpenAI** - For AI property analysis and enrichment
- **Google AI** - Alternative LLM for analysis
- **Google Document AI** - For OCR and document processing
- **Smarty** - For address validation and autocomplete
- **Stripe** - For payment processing

**How to Add API Keys:**
1. Click the service name
2. Enter your API key
3. Click "Save"
4. Test the connection

### 2. Monitor AI Workforce (`/admin/ai-workforce`)

View real-time status of all AI agents:

- **Supervisor Agent** - System monitor (always live)
- **Scout Agents** - Property discovery (requires Smarty API)
- **OpenAI Analyst** - Property enrichment (requires OpenAI API)
- **Google AI Analyst** - Alternative analysis (requires Google AI API)
- **OCR Ingestor** - Document processing (requires Google Doc AI)
- **Librarian Agent** - User co-pilot chatbot (always live)

**Running the Scout Agent:**
1. Users configure Scout Agents at `/scout-agent` (Mentee Elite only)
2. Agents run automatically based on schedule
3. Admins can manually trigger via "Run Now" button
4. Results appear in the activity log

### 3. Agent Activity Log

The Admin AI Workforce page shows:
- Latest agent runs
- Properties added
- Files processed
- Library items indexed

All in real-time using Supabase realtime subscriptions.

---

## Admin Panel Features

### Dashboard (`/admin`)

**Overview Statistics:**
- Total Users count
- Total Revenue (from completed transactions)
- Active Subscriptions count

**Quick Links:**
- Direct access to all admin sections
- Icon-based navigation

### Properties Management (`/admin/properties`)

**Features:**
- Search properties by address
- Edit property details (price, description, scores, etc.)
- Update property status
- View property type and opportunity scores

**Editing:**
- Click "Edit" on any property
- Modal dialog with all fields
- Save changes instantly
- Updates reflected immediately

### Tax Leads Management (`/admin/tax-leads`)

**Features:**
- Full CRUD operations (Create, Read, Update, Delete)
- Search by address, owner, or parcel ID
- Status badges (Initial Notice, Final Notice, Lien Filed, etc.)
- Bulk import ready (CSV upload coming soon)

**Fields:**
- Owner name, address, parcel ID
- Delinquent amount and years delinquent
- Contact information (phone, email)
- Property details and notes

### Redeemable Deeds Management (`/admin/redeemable-deeds`)

**Features:**
- Full CRUD operations
- Search by address or owner
- Automatic redemption amount calculation
- Status tracking (Redeemable, Redeemed, Expired)

**Calculations:**
- Interest rate (default 20% for Georgia)
- Penalty rates
- Total redemption amount
- Days until redemption

### Transactions (`/admin/transactions`)

**View:**
- All completed transactions
- Revenue breakdown
- Subscription tracking
- Payment methods

### Library (`/admin/library`)

**Document Management:**
- Upload PDFs and documents
- AI-powered text extraction via OCR
- Categorization and tagging
- Make resources premium or free

**Intelligent Document Ingestor:**
- Automatically processes uploaded files
- Extracts text using Google Document AI
- Indexes content for the Librarian chatbot

### Affiliates (`/admin/affiliates`)

**Partner Program Management:**
- View affiliate applications
- Approve or reject applications
- Track partner status
- Add admin notes

---

## User-Facing Features (No Mock Data)

All user-facing pages now pull from Supabase:

### Properties Page (`/properties`)
- Real-time property listings from database
- Advanced filtering (type, stage, score)
- Sorting options
- Empty state when no properties exist

### Tax Delinquent Leads (`/tax-delinquent-leads`)
- Fetches from `tax_delinquent_leads` table
- Panel and table views
- Status badges
- Empty state with call-to-action

### Redeemable Deeds (`/redeemable-deeds`)
- Fetches from `redeemable_deeds` table
- Automatic redemption calculations
- Days until redemption countdown
- AI Valuation and Skip Trace placeholders

### Dashboard (`/dashboard`)
- Featured properties from database
- User's saved properties
- Empty states when no data

---

## Troubleshooting

### No Data Showing

**Problem:** Admin panel or user pages show empty states

**Solutions:**
1. Check database connection:
   ```javascript
   // In browser console:
   console.log(supabase.auth.getSession());
   ```

2. Verify RLS policies are active:
   ```sql
   SELECT * FROM profiles WHERE id = auth.uid();
   ```

3. Ensure you're logged in as admin:
   ```sql
   SELECT role FROM profiles WHERE id = auth.uid();
   ```

### Can't Edit/Delete

**Problem:** Edit or delete buttons don't work

**Solutions:**
1. Verify admin role:
   - Go to `/admin/users`
   - Check your role is `admin`

2. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'properties';
   ```

3. Browser console errors:
   - Open Dev Tools (F12)
   - Check Console tab for errors

### API Keys Not Working

**Problem:** AI agents show as "Inactive"

**Solutions:**
1. Navigate to `/admin/api-keys`
2. Re-enter the API key
3. Click "Test Connection"
4. Check API key permissions in provider dashboard

### Scout Agent Not Finding Leads

**Problem:** Scout Agent runs but finds no properties

**Solutions:**
1. Verify Smarty API key is configured
2. Check Scout Agent criteria (counties, min score)
3. Ensure properties exist in those counties
4. Check Edge Function logs in Supabase

### Database Permission Errors

**Problem:** `permission denied for table...`

**Solutions:**
1. Re-run the schema.sql file
2. Verify RLS policies exist:
   ```sql
   SELECT * FROM pg_policies;
   ```

3. Check user role:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your@email.com';
   ```

---

## Next Steps

1. ✅ Set up Supabase database with schema
2. ✅ Create admin account
3. ✅ Configure API keys for AI features
4. ✅ Add initial properties via admin panel
5. ✅ Add tax delinquent leads
6. ✅ Add redeemable deeds
7. ✅ Test all admin CRUD operations
8. ✅ Configure Scout Agents for users
9. ✅ Monitor AI Workforce activity
10. ✅ Launch to production

---

## Security Best Practices

1. **Never commit API keys** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** regularly (every 90 days)
4. **Monitor admin actions** via activity logs
5. **Limit admin accounts** to trusted personnel only
6. **Enable 2FA** on your Supabase account
7. **Regular database backups** via Supabase dashboard
8. **Review RLS policies** periodically

---

## Support

For issues or questions:
- **Supabase Docs:** https://supabase.com/docs
- **Project README:** See main README.md
- **Database Schema:** See supabase/README.md

---

## Production Checklist

Before launching to users:

- [ ] Database schema deployed
- [ ] Admin account created
- [ ] API keys configured
- [ ] At least 10 properties added
- [ ] Tax leads populated (if applicable)
- [ ] Redeemable deeds added (if applicable)
- [ ] Library content uploaded
- [ ] AI agents tested and working
- [ ] All admin CRUD operations verified
- [ ] User registration tested
- [ ] Payment flow tested (Stripe)
- [ ] Email notifications working
- [ ] Mobile responsiveness checked
- [ ] Security review completed
- [ ] Backups configured

**Congratulations! Your admin panel is production-ready and waiting for real data. No more mock files!** 🎉
