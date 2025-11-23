# Quick Setup Guide - TX-Deed Database

## ✅ What Was Created

Three files have been added to your repository:

1. **`supabase/migrations/20250101000000_initial_schema.sql`**
   - Complete database schema with 9 tables
   - Row Level Security (RLS) policies
   - Indexes and triggers
   - Ready to deploy to your Supabase project

2. **`supabase/README.md`**
   - Comprehensive documentation
   - Table descriptions and relationships
   - Security policies explanation
   - Development notes

3. **`supabase/seed.sql`**
   - Optional seed data for testing
   - Sample properties and library items
   - Development/testing only (don't use in production)

## 🚀 Deploying to Your Supabase Database

### Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase dashboard: https://app.supabase.com
2. Select your `supabase-teal-ball` project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20250101000000_initial_schema.sql`
6. Paste into the SQL Editor
7. Click **Run** (bottom right corner)
8. Wait for "Success" message
9. Verify tables by going to **Table Editor**

### Option 2: Using Supabase CLI

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Login to Supabase
supabase login

# 3. Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# 4. Push the migration
supabase db push

# 5. Verify tables were created
supabase db remote
```

## 📋 Post-Deployment Checklist

### 1. Create Your First Admin User

After running the migration:

1. Sign up through your app at http://localhost:5173 (or your deployed URL)
2. Go to Supabase Dashboard → **Authentication** → **Users**
3. Find your user and copy the User ID
4. Go to **Table Editor** → **profiles** table
5. Find your profile row (matching the User ID)
6. Edit the `role` column from `member` to `admin`
7. Save changes
8. Sign out and sign back in

### 2. Verify Tables Were Created

Go to **Table Editor** and confirm these 9 tables exist:
- ✅ profiles
- ✅ properties
- ✅ transactions
- ✅ partner_applications
- ✅ library_items
- ✅ scout_agents
- ✅ lead_uploads
- ✅ invoices
- ✅ leads

### 3. Test the Application

1. Log in as admin
2. Visit `/admin/dashboard`
3. Try these pages:
   - **AI Workforce** - Should load without errors
   - **Manage Users** - Should show your profile
   - **Resource Library** - Should be empty (ready for content)
   - **API Keys** - Should show available services
   - **Properties** - Should be empty (ready for data)

### 4. Add Sample Data (Optional)

If you want sample data for testing:

1. Go to **SQL Editor** in Supabase
2. Open the `supabase/seed.sql` file
3. Copy and paste the contents
4. Click **Run**
5. Verify sample properties and library items appear

## 🔐 Important Security Notes

1. **Never commit your `.env` file** - It contains sensitive API keys
2. **Keep your Supabase keys private** - Don't share them publicly
3. **The first admin user must be set manually** - This is intentional for security
4. **RLS policies are active** - Regular users can't access admin data

## 🧪 Testing the Schema

Try these queries in the SQL Editor to verify everything works:

```sql
-- Check profiles
SELECT * FROM public.profiles LIMIT 5;

-- Check properties (will be empty initially)
SELECT * FROM public.properties LIMIT 5;

-- Test RLS is working
SELECT * FROM public.transactions; -- Should only return your own

-- Check library items (if you ran seed.sql)
SELECT * FROM public.library_items;
```

## 📊 Database Tables Overview

| Table | Purpose | Key Columns |
|-------|---------|-------------|
| `profiles` | User accounts | id, full_name, role |
| `properties` | Tax deed listings | address, price, estimated_value |
| `transactions` | Payments | user_id, amount, status |
| `partner_applications` | Affiliates | name, email, status |
| `library_items` | Education | title, item_type, url |
| `scout_agents` | AI tracking | last_run_at, status |
| `lead_uploads` | File uploads | file_name, user_id |
| `invoices` | Billing | user_id, amount, status |
| `leads` | Contact forms | name, email, message |

## 🆘 Troubleshooting

### Error: "permission denied for schema public"
**Solution**: Make sure you're logged in as the database owner

### Error: "relation already exists"
**Solution**: Tables already exist. This is fine - migration completed previously

### Admin pages show "No data"
**Solution**: This is normal! Add data through the admin interface or run seed.sql

### Can't access admin pages
**Solution**: Make sure your user role is set to `admin` in the profiles table

### API Keys page shows errors
**Solution**: The RPC function needs Supabase Vault setup. This is expected for now.

## 🎉 You're All Set!

Your database is now ready. You can:
- ✅ Add properties through `/admin/properties`
- ✅ Upload educational content to `/admin/library`
- ✅ Manage users through `/admin/users`
- ✅ Track transactions at `/admin/transactions`
- ✅ Review affiliate applications at `/admin/affiliates`
- ✅ Monitor AI agents at `/admin/ai-workforce`

## 📚 Next Steps

1. Configure API keys for AI features (Smarty, OpenAI, Google AI)
2. Add your first tax deed properties
3. Upload educational content to the library
4. Test the Scout Agent to find properties
5. Set up payment processing (Stripe/PayPal)

## 🔗 Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Dashboard](https://app.supabase.com)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Questions?** Check the main README.md or create an issue on GitHub.
