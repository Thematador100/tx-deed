# TX-Deed Supabase Database Schema

This directory contains the database schema and migrations for the TX-Deed tax deed investment platform.

## Overview

The database is built on Supabase (PostgreSQL) and includes comprehensive Row Level Security (RLS) policies to protect user data.

## Database Tables

### Core Tables

1. **profiles** - User profiles extending Supabase auth
   - Stores user information (full_name, role)
   - Linked to auth.users via foreign key
   - Roles: admin, member, user

2. **properties** - Tax deed property listings
   - Complete property information (address, price, beds/baths, etc.)
   - Opportunity scoring system
   - Admin-managed content

3. **transactions** - Payment and subscription tracking
   - Links to user profiles
   - Tracks subscription payments and one-time purchases
   - Status: pending, completed, failed

### Content & Resources

4. **library_items** - Educational content library
   - Videos, PDFs, and articles
   - Accessible to authenticated users
   - Admin-managed content

5. **lead_uploads** - User-uploaded lead files
   - Tracks uploaded property lead files
   - Links to user who uploaded
   - Status tracking for processing

### AI & Automation

6. **scout_agents** - AI property discovery tracking
   - Tracks when scout agents last ran
   - Records number of properties found
   - Status monitoring

### Business Operations

7. **partner_applications** - Affiliate program applications
   - Captures partner/affiliate requests
   - Status workflow: pending → approved/rejected
   - Email and website validation

8. **invoices** - Service invoicing
   - Used for Deal Rescue and other services
   - Links to user profiles
   - Status: pending, paid, cancelled

9. **leads** - Contact form submissions
   - Captures website contact form data
   - Admin-viewable only
   - Status tracking for follow-up

## Security

All tables implement Row Level Security (RLS) with the following principles:

- **Profiles**: Users can view all profiles, but only modify their own
- **Properties**: Authenticated users can view, only admins can modify
- **Transactions**: Users see only their own, admins see all
- **Library Items**: Authenticated users can view, admins manage
- **Invoices**: Users see only their own, admins manage all
- **Leads/Applications**: Public can submit, admins manage

## API Keys Management

The platform uses Supabase Vault for secure API key storage. The `get_api_key_status()` RPC function provides status for:
- Smarty (address verification)
- OpenAI (LLM intelligence)
- Google AI (LLM intelligence)
- Google Document AI (OCR processing)

## Running Migrations

### Using Supabase CLI

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Link to your project:
   ```bash
   supabase link --project-ref <your-project-ref>
   ```

3. Run migrations:
   ```bash
   supabase db push
   ```

### Manual Migration

1. Log into your Supabase dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `migrations/20250101000000_initial_schema.sql`
4. Execute the migration

## Environment Variables

Ensure these are set in your `.env` file:

```env
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Post-Migration Setup

After running the migration:

1. **Create Admin User**
   - Sign up through the app
   - Manually update the profile role to 'admin' in the database

2. **Configure API Keys**
   - Use the Admin API Keys page to add service keys
   - Keys are stored securely in Supabase Vault

3. **Add Initial Content**
   - Add properties to the properties table
   - Populate the library with educational content

## Indexes

The schema includes indexes on:
- Foreign keys (user_id references)
- Frequently queried columns (status, created_at)
- Search fields (address, email)

## Triggers

- `update_updated_at_column` - Automatically updates timestamps on profile and property changes

## Development Notes

- All timestamps use `TIMESTAMPTZ` for timezone awareness
- Numeric fields use `NUMERIC(12,2)` for currency precision
- UUIDs are generated using `uuid_generate_v4()`
- Check constraints enforce data integrity (status enums, roles, etc.)

## Backup and Recovery

Supabase automatically backs up your database. For manual backups:

```bash
supabase db dump -f backup.sql
```

## Support

For issues or questions:
- Check the Supabase documentation: https://supabase.com/docs
- Review the migration file for detailed comments
- Contact the development team

## Version History

- **20250101000000** - Initial schema with all core tables and RLS policies
