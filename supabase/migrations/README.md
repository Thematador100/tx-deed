# Database Migrations

This folder contains SQL migration files for the Supabase database.

## Applying Migrations

To apply these migrations to your Supabase database:

### Option 1: Using Supabase Dashboard (Recommended for Quick Setup)

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of the migration file
4. Click "Run" to execute the SQL

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Apply migrations
supabase db push
```

## Migration Files

- `001_create_notifications.sql` - Creates the notifications table with real-time support

## Notifications Table Schema

The notifications table includes:
- `id` - Unique identifier
- `user_id` - Reference to the user
- `type` - Notification type (e.g., 'property', 'auction', 'deal', 'system')
- `title` - Notification title
- `message` - Notification message
- `link` - Optional link to related resource
- `read` - Boolean indicating if notification has been read
- `created_at` - Timestamp
- `metadata` - JSON field for additional data

## Features

- Row Level Security (RLS) enabled
- Real-time subscriptions supported
- Automatic cleanup policies
- Optimized indexes for performance
