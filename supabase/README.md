# Supabase Backend Setup

This directory contains the database schema, RLS policies, and migration files for the Win With Deeds platform.

## Overview

The backend uses Supabase (PostgreSQL) for:
- User authentication and authorization
- Data storage and retrieval
- Real-time subscriptions
- File storage
- Row Level Security (RLS) for data protection

## Database Structure

### Core Tables

1. **profiles** - User profiles and subscription data
2. **properties** - Tax deed property listings
3. **saved_properties** - User favorites/bookmarks
4. **transactions** - Payment and subscription records
5. **leads** - Lead management system
6. **lead_uploads** - Bulk lead import tracking
7. **lead_sources** - Lead source configuration
8. **marketplace_leads** - Lead marketplace listings
9. **invoices** - Invoice records
10. **library_items** - Educational resources and courses
11. **notifications** - User notifications
12. **partner_applications** - Affiliate program applications
13. **pipeline_stages** - Deal pipeline customization
14. **scout_agents** - AI agent configurations
15. **upcoming_sales** - Auction calendar
16. **funding_submissions** - Funding portal requests

## Setup Instructions

### 1. Initial Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Update the `.env` file with your credentials:

```env
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### 2. Run Database Schema

Execute the SQL files in the Supabase SQL Editor in this order:

1. **schema.sql** - Creates all tables, indexes, and triggers
2. **rls_policies.sql** - Sets up Row Level Security policies

#### Using Supabase Dashboard:
1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql`
3. Paste and run the SQL
4. Repeat for `rls_policies.sql`

### 3. Storage Buckets

Create the following storage buckets in Supabase Storage:

- **avatars** - User profile pictures (Public)
- **property-images** - Property photos (Public)
- **property-documents** - Property documents (Private)
- **lead-uploads** - CSV/Excel lead imports (Private)
- **library-files** - Educational resources (Private with RLS)

### 4. Edge Functions

Deploy the Edge Functions for:
- `create-checkout-session` - Stripe payment processing
- `run-scout-agent` - AI agent execution
- `system-health-check` - System monitoring

## Using the Supabase Client

### Basic Usage

```javascript
import { supabase } from './lib/customSupabaseClient';

// Query data
const { data, error } = await supabase
  .from('properties')
  .select('*')
  .eq('state', 'TX')
  .limit(10);
```

### Using Helper Functions

We provide helper functions for common operations:

```javascript
import {
  getProperties,
  saveProperty,
  getNotifications
} from './lib/supabaseHelpers';

// Get filtered properties
const properties = await getProperties({
  state: 'TX',
  minScore: 70,
  limit: 20
});

// Save a property
await saveProperty(userId, propertyId, {
  notes: 'Great investment opportunity',
  tags: ['residential', 'high-roi']
});

// Get user notifications
const notifications = await getNotifications(userId, true);
```

## Row Level Security (RLS)

All tables have RLS enabled to protect user data:

- **Users** can only access their own data (profiles, saved properties, notifications, etc.)
- **Admins** have elevated access to manage platform data
- **Public data** (properties, library items) is accessible based on subscription tier
- **Transactions** are restricted to the owning user and admins

### Testing RLS Policies

```sql
-- Test as a specific user
SET request.jwt.claims.sub = 'user-id-here';

-- Try to query data
SELECT * FROM saved_properties;

-- Should only return that user's saved properties
```

## Real-time Subscriptions

Subscribe to database changes in real-time:

```javascript
import { subscribeToNotifications } from './lib/supabaseHelpers';

// Subscribe to new notifications
const subscription = subscribeToNotifications(userId, (payload) => {
  console.log('New notification:', payload.new);
  // Update UI with new notification
});

// Unsubscribe when component unmounts
subscription.unsubscribe();
```

## File Uploads

Upload files to Supabase Storage:

```javascript
import { uploadFile, deleteFile } from './lib/supabaseHelpers';

// Upload a file
const result = await uploadFile(
  'property-images',
  `${propertyId}/main.jpg`,
  imageFile
);

console.log('Public URL:', result.publicUrl);

// Delete a file
await deleteFile('property-images', `${propertyId}/main.jpg`);
```

## Environment Variables

Required environment variables (in `.env`):

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

## Database Migrations

When making schema changes:

1. Create a new migration file in `supabase/migrations/`
2. Name it with a timestamp: `YYYYMMDDHHMMSS_description.sql`
3. Document the changes in the migration file
4. Test the migration in a development environment
5. Apply to production via Supabase dashboard

Example migration:

```sql
-- Migration: Add new field to properties table
-- Date: 2025-11-21

ALTER TABLE properties
ADD COLUMN IF NOT EXISTS zoning_type TEXT;

CREATE INDEX IF NOT EXISTS idx_properties_zoning
ON properties(zoning_type);
```

## Best Practices

1. **Always use RLS policies** - Never bypass RLS in production
2. **Use helper functions** - Abstract database operations for consistency
3. **Handle errors gracefully** - Use `getErrorMessage()` for user-friendly errors
4. **Validate input** - Check data before inserting/updating
5. **Use transactions** - For operations that modify multiple tables
6. **Index frequently queried columns** - Optimize query performance
7. **Monitor query performance** - Use Supabase dashboard insights
8. **Keep credentials secure** - Never commit `.env` files

## Troubleshooting

### Common Issues

**Error: "Missing environment variables"**
- Check that `.env` file exists and contains valid Supabase credentials
- Restart the dev server after adding environment variables

**Error: "JWT expired"**
- User session has expired
- Implement session refresh or redirect to login

**Error: "Row level security policy violated"**
- User doesn't have permission to access the data
- Check RLS policies in `rls_policies.sql`
- Verify user role and subscription tier

**Slow queries**
- Check if appropriate indexes exist
- Use `.explain()` to analyze query performance
- Consider adding indexes to frequently filtered columns

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Edge Functions Guide](https://supabase.com/docs/guides/functions)
