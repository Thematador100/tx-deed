# Supabase Database Setup

This directory contains the production-ready database schema for Win With Deeds.

## Quick Setup

### 1. Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Wait for the project to be provisioned

### 2. Run the Schema

1. Open your Supabase project dashboard
2. Navigate to the **SQL Editor** (in the left sidebar)
3. Click **New Query**
4. Copy and paste the entire contents of `schema.sql`
5. Click **Run** or press `Cmd/Ctrl + Enter`

The schema will create all necessary tables, policies, and functions.

### 3. Update Environment Variables

Your Supabase credentials are already configured in `/src/lib/customSupabaseClient.js`:

```javascript
const supabaseUrl = 'YOUR_SUPABASE_URL';
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY';
```

Make sure these match your project's credentials (found in **Project Settings** > **API**).

### 4. Configure API Keys

1. Login as an admin user
2. Navigate to **Admin Panel** > **API Key Vault**
3. Add your API keys for:
   - **OpenAI**: For AI analysis features
   - **Google AI**: For alternative LLM analysis
   - **Google Document AI**: For OCR document processing
   - **Smarty**: For address validation
   - **Stripe**: For payment processing

### 5. Add Initial Data

The admin panel is ready to accept real data. You can:

- **Import Properties**: Use the admin panel to add properties individually or via bulk import
- **Add Tax Delinquent Leads**: Import CSV files through the lead upload feature
- **Add Redeemable Deeds**: Create entries through the admin interface
- **Upload Library Content**: Add educational resources and course materials

## Database Tables

The schema creates the following tables:

### Core Tables
- **profiles** - User profiles with role-based access
- **properties** - Property listings (all types)
- **transactions** - Payment and subscription tracking
- **saved_properties** - User bookmarks

### Lead Management
- **tax_delinquent_leads** - Tax delinquent property leads
- **redeemable_deeds** - Redeemable deed opportunities
- **lead_uploads** - File upload tracking

### Content & Resources
- **library_items** - Educational content and courses

### AI & Automation
- **scout_agents** - AI property scout configurations
- **pipeline_stages** - Deal pipeline tracking
- **notifications** - User notifications
- **api_keys** - Encrypted API key storage

### Business
- **partner_applications** - Affiliate program applications
- **funding_submissions** - Funding request tracking

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies:

- **Users** can only view/edit their own data
- **Admins** have full access to all data
- **Public** endpoints (like partner applications) allow inserts

## Functions & Triggers

### Automatic Profile Creation
When a user signs up, a profile is automatically created via the `handle_new_user()` trigger.

### Updated Timestamps
All tables automatically update their `updated_at` field on modification.

### API Key Status
Use `get_api_key_status()` to check which API keys are configured (used by the AI Workforce dashboard).

## Security Best Practices

1. **Never commit real API keys** to version control
2. **Use environment variables** for sensitive data
3. **Rotate API keys** regularly
4. **Monitor RLS policies** to ensure data isolation
5. **Review admin actions** in the audit log

## Troubleshooting

### "relation already exists" errors
Some tables may already exist. You can:
- Drop tables individually: `DROP TABLE IF EXISTS table_name CASCADE;`
- Or modify the schema to use `CREATE TABLE IF NOT EXISTS`

### RLS policy errors
Make sure you're logged in as an admin user. Check your profile role:
```sql
SELECT id, full_name, role FROM profiles WHERE id = auth.uid();
```

### Function permission errors
Functions use `SECURITY DEFINER` to bypass RLS. Ensure they're owned by the postgres user.

## Edge Functions

The following Supabase Edge Functions should be deployed:

- `run-scout-agent` - Executes property scouting
- `generate-dossier` - Creates property analysis
- `analyze-document-ocr` - OCR processing
- `smarty-autocomplete` - Address autocomplete
- `property-lookup` - Property enrichment
- `create-checkout-session` - Stripe payments
- `manage-api-key` - API key CRUD
- `test-api-key` - API key validation

Refer to `/supabase/functions/` for implementation details.

## Next Steps

Once your database is set up:

1. ✅ Create an admin user (first user or use the force-admin-setup function)
2. ✅ Configure API keys in the Admin Panel
3. ✅ Import your first properties or leads
4. ✅ Set up Scout Agents for automated lead discovery
5. ✅ Customize the platform for your needs

## Support

For issues or questions:
- Check the Supabase documentation: https://supabase.com/docs
- Review the codebase README
- Contact the development team
