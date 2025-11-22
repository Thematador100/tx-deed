# Complete Supabase Setup Guide

This guide will help you get the Win With Deeds platform fully operational with Supabase, including the location-agnostic property scrapers.

## Overview

The platform now features:
- ✅ Complete Supabase database schema
- ✅ Location-agnostic property scrapers (works for ANY US county)
- ✅ Edge Functions for data retrieval and scraping
- ✅ Row-level security policies
- ✅ API endpoints for all features
- ✅ Support for 50+ pre-configured counties across all major states

## Prerequisites

1. Node.js 18+ installed
2. Supabase account (already configured at: aedapqfuegbqztuetkxd.supabase.co)
3. Supabase CLI installed

## Quick Start

### 1. Install Supabase CLI

```bash
npm install -g supabase
```

### 2. Login to Supabase

```bash
supabase login
```

### 3. Link to Project

```bash
supabase link --project-ref aedapqfuegbqztuetkxd
```

### 4. Push Database Schema

```bash
supabase db push
```

This will create all tables:
- profiles
- properties
- tax_delinquent_leads
- redeemable_deeds
- scraper_configs
- scraper_logs
- user_saved_properties
- leads

### 5. Seed Initial Data

```bash
supabase db execute -f supabase/seed/initial_scraper_configs.sql
```

This loads 50+ pre-configured county scrapers for major markets.

### 6. Deploy Edge Functions

```bash
supabase functions deploy
```

Or deploy individually:
```bash
supabase functions deploy scrape-county
supabase functions deploy batch-scrape
supabase functions deploy property-lookup
supabase functions deploy get-properties
supabase functions deploy get-tax-delinquent-leads
supabase functions deploy get-redeemable-deeds
supabase functions deploy smarty-autocomplete
```

### 7. Set Environment Secrets (Optional)

For address autocomplete with SmartyStreets:
```bash
supabase secrets set SMARTY_AUTH_ID=your_auth_id
supabase secrets set SMARTY_AUTH_TOKEN=your_auth_token
```

## Using the Scrapers

### Scrape Any County in the US

The scraper is **location-agnostic** and can handle any US county:

```javascript
import { scrapeCounty } from '@/lib/supabaseAPI';

// Scrape Harris County, Texas
const result = await scrapeCounty('Harris', 'TX', 'tax_deed');

// Scrape Fulton County, Georgia
const result = await scrapeCounty('Fulton', 'GA', 'tax_delinquent');

// Scrape ANY county - even if not pre-configured
const result = await scrapeCounty('Cook', 'IL', 'tax_deed');
```

**How it works:**
1. Checks if county is in the database
2. If not found, auto-discovers the county website
3. Attempts to scrape using multiple strategies
4. Saves results to appropriate table
5. Logs the operation for review

### Batch Scrape Multiple Counties

```javascript
import { batchScrape } from '@/lib/supabaseAPI';

// Scrape specific counties
await batchScrape({
  counties: [
    { county: 'Harris', state: 'TX' },
    { county: 'Travis', state: 'TX' },
    { county: 'Bexar', state: 'TX' }
  ],
  type: 'tax_deed'
});

// Scrape all known counties in Texas
await batchScrape({
  states: ['TX'],
  type: 'tax_deed'
});

// Scrape all known counties nationwide
await batchScrape({ type: 'tax_deed' });
```

### Fetch Properties in Your Frontend

```javascript
import { getProperties, getTaxDelinquentLeads, getRedeemableDeeds } from '@/lib/supabaseAPI';

// Get all properties
const properties = await getProperties();

// Get properties in Texas
const txProperties = await getProperties({ state: 'TX' });

// Get auction properties under $100k
const affordableAuctions = await getProperties({
  type: 'auction',
  maxPrice: 100000
});

// Get tax delinquent leads in Georgia
const gaLeads = await getTaxDelinquentLeads({ state: 'GA' });

// Get redeemable deeds
const deeds = await getRedeemableDeeds({ state: 'CT' });
```

## Pre-Configured Counties

The system comes with scrapers for 50+ major counties:

### Texas
Harris, Travis, Bexar, Dallas, Tarrant

### Georgia
Fulton, DeKalb, Chatham, Gwinnett, Cobb

### Florida
Miami-Dade, Orange, Hillsborough, Broward

### California
Los Angeles, San Diego, Orange, Riverside

### Arizona
Maricopa, Pima

### Nevada
Clark, Washoe

### Illinois
Cook

### Michigan
Wayne

### Ohio
Cuyahoga, Franklin

### Pennsylvania
Philadelphia

### New York
Kings

### North Carolina
Mecklenburg, Wake

**And many more!**

## Frontend Integration

### Update Pages to Use Real Data

1. **Properties Page** - Update `src/pages/Properties.jsx`:
```javascript
import { getProperties } from '@/lib/supabaseAPI';

const [properties, setProperties] = useState([]);

useEffect(() => {
  async function loadProperties() {
    const data = await getProperties({ type: 'auction', limit: 50 });
    setProperties(data);
  }
  loadProperties();
}, []);
```

2. **Tax Delinquent Leads** - Update `src/pages/TaxDelinquentLeads.jsx`:
```javascript
import { getTaxDelinquentLeads } from '@/lib/supabaseAPI';

const [leads, setLeads] = useState([]);

useEffect(() => {
  async function loadLeads() {
    const data = await getTaxDelinquentLeads({ limit: 50 });
    setLeads(data);
  }
  loadLeads();
}, []);
```

3. **Redeemable Deeds** - Create similar integration

## Admin Features

### View Scraper Status

In the admin panel, you can:
- View all configured scrapers
- See last scrape timestamps
- Monitor scraper logs
- Trigger manual scrapes
- Add new county configurations

### Scraper Management API

```javascript
import { getScraperConfigs, getScraperLogs } from '@/lib/supabaseAPI';

// View all scraper configurations
const configs = await getScraperConfigs();

// View recent scraper logs
const logs = await getScraperLogs(100);
```

## Testing

### Test Property Lookup

```javascript
import { lookupProperty } from '@/lib/supabaseAPI';

const result = await lookupProperty('123 Main St, Houston, TX 77002');
console.log(result.aiAnalysis); // AI-generated property analysis
```

### Test Address Autocomplete

```javascript
import { getAddressSuggestions } from '@/lib/supabaseAPI';

const suggestions = await getAddressSuggestions('123 Main');
// Returns array of matching addresses
```

## Maintenance

### View Database Contents

```bash
# Check how many properties we have
supabase db execute -c "SELECT COUNT(*) FROM properties;"

# Check recent scrapes
supabase db execute -c "SELECT * FROM scraper_logs ORDER BY created_at DESC LIMIT 10;"

# Check properties by state
supabase db execute -c "SELECT state, COUNT(*) as count FROM properties GROUP BY state ORDER BY count DESC;"
```

### Monitor Edge Functions

```bash
# View function logs
supabase functions logs scrape-county

# View all function logs
supabase functions logs
```

## Adding New Counties

### Method 1: Let the System Auto-Discover

Just call scrapeCounty with any county:
```javascript
await scrapeCounty('NewCounty', 'ST', 'tax_deed');
```

The system will:
1. Generate likely URL patterns
2. Attempt to scrape
3. Save the configuration
4. Log for manual review

### Method 2: Manual Configuration

Add to database:
```sql
INSERT INTO scraper_configs (
  county, state, scraper_type, website_url, scraper_method, notes
) VALUES (
  'YourCounty', 'ST', 'tax_deed',
  'https://county-website.gov/tax-sales',
  'web_scrape',
  'Manually configured'
);
```

## Troubleshooting

### Scrapers Not Finding Properties

1. **Check the website URL**:
```sql
SELECT * FROM scraper_configs WHERE county = 'YourCounty';
```

2. **Check logs**:
```sql
SELECT * FROM scraper_logs WHERE county = 'YourCounty' ORDER BY created_at DESC;
```

3. **Test manually**: Visit the county website in a browser

4. **Update configuration**: If the URL changed, update it in scraper_configs

### Edge Functions Not Working

1. Ensure you're logged in: `supabase login`
2. Check project link: `supabase link --project-ref aedapqfuegbqztuetkxd`
3. Redeploy functions: `supabase functions deploy`
4. Check function logs: `supabase functions logs scrape-county`

### Database Connection Issues

```bash
# Test connection
supabase db ping

# Reset local database (if needed)
supabase db reset
```

## Production Deployment

### Environment Variables

Ensure these are set in your hosting platform (Vercel, Netlify, etc.):

```bash
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Scheduled Scraping (Optional)

Set up a cron job to scrape counties regularly:

```bash
# Using GitHub Actions, Vercel Cron, or similar
# Run daily at 2 AM
0 2 * * * curl -X POST https://aedapqfuegbqztuetkxd.supabase.co/functions/v1/batch-scrape \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"type": "tax_deed"}'
```

## Next Steps

1. ✅ Database and Edge Functions are set up
2. ⏳ Update frontend pages to use real data (currently using mock data)
3. ⏳ Test scraping for your target counties
4. ⏳ Set up scheduled scraping
5. ⏳ Add more county configurations as needed
6. ⏳ Implement advanced filtering and search
7. ⏳ Add user notifications for new properties

## Support

For questions or issues:
- Check Supabase Dashboard: https://app.supabase.com/project/aedapqfuegbqztuetkxd
- Review Edge Function logs
- Check scraper_logs table
- See supabase/README.md for more details
