# Supabase Setup for Win With Deeds

This directory contains the complete Supabase infrastructure for the Win With Deeds platform, including database schema, Edge Functions, and location-agnostic property scrapers.

## Features

- **Location-Agnostic Scrapers**: Automatically discover and scrape tax deed, tax delinquent, and redeemable deed properties from ANY US county
- **Comprehensive Database**: PostgreSQL schema with properties, tax delinquent leads, redeemable deeds, and more
- **Edge Functions**: Serverless functions for scraping, property lookup, and data retrieval
- **Row Level Security**: Built-in security policies to protect user data
- **Scalable Architecture**: Designed to handle properties from all 3,000+ US counties

## Directory Structure

```
supabase/
├── config.toml                 # Supabase configuration
├── migrations/                 # Database migrations
│   └── 20250101000000_initial_schema.sql
├── functions/                  # Edge Functions
│   ├── _shared/               # Shared utilities
│   │   ├── county-finder.ts   # County discovery system
│   │   └── universal-scraper.ts # Universal web scraper
│   ├── scrape-county/         # Scrape a single county
│   ├── batch-scrape/          # Scrape multiple counties
│   ├── property-lookup/       # Look up a specific property
│   ├── get-properties/        # Get properties list
│   ├── get-tax-delinquent-leads/ # Get tax delinquent leads
│   ├── get-redeemable-deeds/  # Get redeemable deeds
│   └── smarty-autocomplete/   # Address autocomplete
└── seed/                      # Seed data
    └── initial_scraper_configs.sql
```

## Database Schema

### Main Tables

1. **profiles** - User profiles extending auth.users
2. **properties** - Main property listings (auctions, marketplace)
3. **tax_delinquent_leads** - Tax delinquent properties
4. **redeemable_deeds** - Properties in redemption period
5. **scraper_configs** - Configuration for county scrapers
6. **scraper_logs** - Logs of scraping operations
7. **user_saved_properties** - User bookmarks
8. **leads** - User lead management

## Setup Instructions

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to Your Project

```bash
supabase link --project-ref aedapqfuegbqztuetkxd
```

### 4. Run Migrations

```bash
supabase db push
```

### 5. Seed Initial Data

```bash
supabase db execute -f supabase/seed/initial_scraper_configs.sql
```

### 6. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy

# Or deploy individually
supabase functions deploy scrape-county
supabase functions deploy batch-scrape
supabase functions deploy property-lookup
supabase functions deploy get-properties
supabase functions deploy get-tax-delinquent-leads
supabase functions deploy get-redeemable-deeds
supabase functions deploy smarty-autocomplete
```

### 7. Set Environment Variables

Set these secrets for your Edge Functions:

```bash
supabase secrets set SMARTY_AUTH_ID=your_smarty_auth_id
supabase secrets set SMARTY_AUTH_TOKEN=your_smarty_auth_token
```

## Using the Scrapers

### Scrape a Single County

```bash
curl -X POST https://aedapqfuegbqztuetkxd.supabase.co/functions/v1/scrape-county \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"county": "Harris", "state": "TX", "type": "tax_deed"}'
```

**Parameters:**
- `county` (required): County name (e.g., "Harris", "Fulton", "Miami-Dade")
- `state` (required): State name or abbreviation (e.g., "Texas", "TX")
- `type` (optional): "tax_deed", "tax_delinquent", or "redeemable" (default: "tax_deed")
- `force` (optional): Force rescrape even if recently scraped (default: false)

### Batch Scrape Multiple Counties

```bash
curl -X POST https://aedapqfuegbqztuetkxd.supabase.co/functions/v1/batch-scrape \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "counties": [
      {"county": "Harris", "state": "TX"},
      {"county": "Travis", "state": "TX"}
    ],
    "type": "tax_deed"
  }'
```

Or scrape all counties in specific states:

```bash
curl -X POST https://aedapqfuegbqztuetkxd.supabase.co/functions/v1/batch-scrape \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"states": ["TX", "GA", "FL"], "type": "tax_deed"}'
```

### Property Lookup

```bash
curl -X POST https://aedapqfuegbqztuetkxd.supabase.co/functions/v1/property-lookup \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"address": "123 Main St, Houston, TX 77002"}'
```

Returns AI-powered analysis of the property.

### Get Properties

```bash
# Get all properties
curl "https://aedapqfuegbqztuetkxd.supabase.co/functions/v1/get-properties" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Filter by state and type
curl "https://aedapqfuegbqztuetkxd.supabase.co/functions/v1/get-properties?state=TX&type=auction&limit=20" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

**Query Parameters:**
- `type`: all, auction, marketplace, tax_deed
- `state`: State abbreviation (TX, CA, etc.)
- `county`: County name
- `minPrice`: Minimum price
- `maxPrice`: Maximum price
- `limit`: Results per page (default: 50)
- `offset`: Pagination offset (default: 0)

## Location-Agnostic Scraping

The scraper system is designed to work with ANY US county:

### Known Counties

The system includes pre-configured scrapers for 50+ major counties across:
- Texas (Harris, Travis, Bexar, Dallas, etc.)
- Georgia (Fulton, DeKalb, Chatham, etc.)
- Florida (Miami-Dade, Orange, Hillsborough, etc.)
- California (Los Angeles, San Diego, etc.)
- Arizona, Nevada, Illinois, Michigan, Ohio, and more

### Auto-Discovery

For counties not in the database, the system will:
1. Generate common URL patterns for that county
2. Attempt to discover the tax deed website
3. Save the configuration for future use
4. Log the discovery for manual verification

### Adding New Counties

You can add new counties via:

1. **Database Insert:**
```sql
INSERT INTO scraper_configs (county, state, scraper_type, website_url, scraper_method)
VALUES ('NewCounty', 'ST', 'tax_deed', 'https://county-website.gov/tax-sales', 'web_scrape');
```

2. **API Call:**
The scraper will automatically add newly discovered counties to the database.

## Frontend Integration

Update your frontend components to use real data:

```javascript
import { supabase } from '@/lib/customSupabaseClient';

// Fetch properties
const { data: properties } = await supabase.functions.invoke('get-properties', {
  body: { state: 'TX', type: 'auction', limit: 20 }
});

// Fetch tax delinquent leads
const { data: leads } = await supabase.functions.invoke('get-tax-delinquent-leads', {
  body: { state: 'GA', county: 'Fulton' }
});

// Property lookup
const { data: result } = await supabase.functions.invoke('property-lookup', {
  body: { address: '123 Main St, Austin, TX 78701' }
});
```

## Maintenance

### View Scraper Logs

```sql
SELECT * FROM scraper_logs
ORDER BY created_at DESC
LIMIT 20;
```

### Check Scraper Configs

```sql
SELECT county, state, scraper_type, website_url, last_scraped_at
FROM scraper_configs
ORDER BY state, county;
```

### Update Scraper Configuration

```sql
UPDATE scraper_configs
SET website_url = 'https://new-url.gov',
    notes = 'Updated URL'
WHERE county = 'Harris' AND state = 'TX';
```

## Troubleshooting

### Edge Function Errors

View logs:
```bash
supabase functions logs scrape-county
```

### Database Connection Issues

Test connection:
```bash
supabase db ping
```

### Scraper Not Finding Properties

1. Check the website URL in scraper_configs
2. Review scraper_logs for error messages
3. Manually test the website URL in a browser
4. Update selectors in scraper_configs.selector_config if needed

## Future Enhancements

- **Machine Learning**: Automatically learn scraping patterns from new county websites
- **Scheduled Scraping**: Cron jobs to automatically refresh data daily
- **Webhook Notifications**: Alert users when new properties match their criteria
- **Advanced Filtering**: Property characteristics, ROI calculations, etc.
- **Export Data**: CSV/Excel exports for offline analysis

## Support

For issues or questions about the Supabase infrastructure, check:
- Supabase Dashboard: https://app.supabase.com/project/aedapqfuegbqztuetkxd
- Edge Functions Logs
- Database Logs
