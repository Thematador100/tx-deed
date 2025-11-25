# Hillsborough County Scraper Setup Guide

This guide will help you set up and deploy the Hillsborough County tax deed scraper along with property analysis functionality.

## Prerequisites

1. **Supabase Project**: You need an active Supabase project
2. **Supabase CLI**: Install from https://supabase.com/docs/guides/cli
3. **Node.js**: Version 20.x (as specified in `.nvmrc`)
4. **API Keys**:
   - Google Maps API key (for geocoding)
   - OpenAI API key (optional, for AI analysis)

## Installation Steps

### 1. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- `papaparse` - CSV parsing
- `@googlemaps/js-api-loader` - Google Maps integration
- `axios` - HTTP requests

### 2. Deploy Supabase Edge Functions

#### Initialize Supabase (if not already done)

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
```

#### Deploy the Edge Functions

```bash
# Deploy Hillsborough scraper
supabase functions deploy hillsborough-scraper

# Deploy property analysis function
supabase functions deploy property-analysis
```

#### Set Environment Variables for Edge Functions

The Edge Functions need access to Supabase credentials:

```bash
supabase secrets set SUPABASE_URL=https://YOUR_PROJECT.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### 3. Configure API Keys in Admin Panel

1. Log in to your application as an admin
2. Navigate to **Admin > API Keys** (`/admin/api-keys`)
3. Add the following API keys:

   - **Service Name**: `google_maps`
     - **API Key**: Your Google Maps API key
     - Enable: Geocoding API, Places API

   - **Service Name**: `openai` (optional)
     - **API Key**: Your OpenAI API key
     - Used for: AI-powered property analysis

### 4. Database Setup

Ensure your Supabase database has the following tables:

#### `properties` table
```sql
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  parcel_id TEXT,
  owner TEXT,
  price NUMERIC,
  opening_bid NUMERIC,
  assessed_value NUMERIC,
  estimated_value NUMERIC,
  auction_date TEXT,
  county TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  latitude NUMERIC,
  longitude NUMERIC,
  bedrooms INTEGER,
  bathrooms NUMERIC,
  sqft INTEGER,
  year_built INTEGER,
  property_type TEXT,
  status TEXT,
  roi NUMERIC,
  risk_score NUMERIC,
  market_analysis TEXT,
  neighborhood_score NUMERIC,
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `scout_agents` table
```sql
CREATE TABLE IF NOT EXISTS scout_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  properties_found INTEGER,
  properties_inserted INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `api_keys` table
```sql
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT NOT NULL UNIQUE,
  encrypted_api_key TEXT NOT NULL,
  key_present BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### `lead_uploads` table
```sql
CREATE TABLE IF NOT EXISTS lead_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id),
  file_name TEXT NOT NULL,
  file_format TEXT NOT NULL,
  status TEXT NOT NULL,
  leads_found INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Usage

### Running the Hillsborough Scraper

#### From Admin Panel

1. Navigate to **Admin > Hillsborough Scraper** (`/admin/hillsborough-scraper`)
2. Click the **"Run Scraper"** button
3. The scraper will:
   - Fetch property listings from Hillsborough County
   - Geocode addresses using Google Maps
   - Calculate ROI and enrichment data
   - Store properties in the database
4. View results in the property map and table

#### Programmatically

```javascript
const { data, error } = await supabase.functions.invoke('hillsborough-scraper', {
  method: 'POST'
});

if (error) {
  console.error('Scraper error:', error);
} else {
  console.log(`Found ${data.properties_found} properties`);
  console.log(`Inserted ${data.properties_inserted} properties`);
}
```

### Uploading Properties

#### Via Web Interface

1. Navigate to **Lead Upload** (`/lead-upload`)
2. Drag and drop CSV files or click to select
3. CSV files should have columns like:
   - `address` or `property_address`
   - `price` or `opening_bid`
   - `assessed_value` or `market_value`
   - `city`, `state`, `zip`
   - `bedrooms`, `bathrooms`, `sqft`
   - `year_built`
4. Click **"Process with AI"**
5. Properties will be:
   - Parsed from CSV
   - Geocoded using Google Maps
   - Analyzed using AI (if OpenAI key configured)
   - Stored in database with enrichment

#### CSV Format Example

```csv
address,city,state,zip,price,assessed_value,bedrooms,bathrooms,sqft,year_built
"123 Main St",Tampa,FL,33602,75000,180000,3,2,1500,1975
"456 Oak Ave",Tampa,FL,33603,95000,220000,4,2.5,2100,1982
```

### Property Analysis API

The property analysis edge function can be called directly:

```javascript
const properties = [
  {
    address: "123 Main St, Tampa, FL 33602",
    price: 75000,
    assessed_value: 180000,
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500
  }
];

const { data, error } = await supabase.functions.invoke('property-analysis', {
  body: { properties }
});

if (!error) {
  console.log('Analyzed properties:', data.properties);
  // Each property now has:
  // - latitude/longitude (geocoded)
  // - roi (calculated)
  // - market_analysis (AI-generated)
  // - risk_score (AI-generated)
  // - neighborhood_score
}
```

## Customizing the Scraper

### Adjusting for Hillsborough County Website Changes

The scraper is located at `/supabase/functions/hillsborough-scraper/index.ts`.

If the Hillsborough County website structure changes:

1. Update the `TAX_DEED_SEARCH_URL` constant
2. Adjust CSS selectors in the property parsing section:

```typescript
// Find the correct selectors for the new page structure
const addressElement = row.querySelector('.your-new-address-selector')
const parcelElement = row.querySelector('.your-new-parcel-selector')
// ... etc
```

3. Redeploy:

```bash
supabase functions deploy hillsborough-scraper
```

### Adding More Counties

To add scrapers for other counties:

1. Copy the Hillsborough scraper template:

```bash
cp -r supabase/functions/hillsborough-scraper supabase/functions/your-county-scraper
```

2. Update the function code with the new county's URL and selectors
3. Deploy:

```bash
supabase functions deploy your-county-scraper
```

4. Add UI in admin panel (follow the pattern in `/src/pages/admin/HillsboroughScraper.jsx`)

## Scheduling Automated Runs

To run the scraper automatically on a schedule:

### Using Supabase Cron (Recommended)

Create a Supabase Edge Function that calls the scraper:

```sql
-- Run every day at 8 AM
SELECT cron.schedule(
  'hillsborough-scraper-daily',
  '0 8 * * *',
  $$
  SELECT net.http_post(
    url := 'https://YOUR_PROJECT.supabase.co/functions/v1/hillsborough-scraper',
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

### Using External Cron (Alternative)

Use a service like cron-job.org or your own server to hit the endpoint:

```bash
curl -X POST \
  https://YOUR_PROJECT.supabase.co/functions/v1/hillsborough-scraper \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring

### View Scraper Status

- **Admin Panel**: `/admin/hillsborough-scraper`
  - Shows last run time
  - Properties found/inserted counts
  - Recent properties table
  - Map visualization

### Check Edge Function Logs

```bash
supabase functions logs hillsborough-scraper
supabase functions logs property-analysis
```

### Database Queries

```sql
-- View recent scraper runs
SELECT * FROM scout_agents
WHERE name = 'Hillsborough County Scraper'
ORDER BY last_run_at DESC;

-- View recent properties from Hillsborough
SELECT * FROM properties
WHERE county = 'Hillsborough'
ORDER BY created_at DESC
LIMIT 50;

-- View upload history
SELECT * FROM lead_uploads
ORDER BY created_at DESC;
```

## Troubleshooting

### "Google Maps API key not configured"

**Solution**: Add the Google Maps API key in Admin > API Keys with service name `google_maps`

### "Failed to fetch: 403"

**Solution**: The Hillsborough County website may have anti-scraping measures. Consider:
- Adding delays between requests
- Using a proxy service
- Checking robots.txt compliance

### "Analysis error: OpenAI API key not configured"

**Solution**: This is optional. Properties will still be imported without AI analysis. To enable:
- Add OpenAI API key in Admin > API Keys with service name `openai`

### "No properties found in CSV"

**Solution**: Ensure CSV has a column with property addresses. Supported column names:
- `address`, `property_address`, `street_address`, `full_address`, `Address`, `Property Address`

### Edge Function Timeout

**Solution**: For large datasets, consider:
- Processing in batches
- Increasing function timeout in `supabase/config.toml`
- Breaking into multiple smaller uploads

## Security Considerations

1. **API Keys**: Stored encrypted in Supabase database
2. **Edge Functions**: Verify JWT tokens if needed (currently disabled for testing)
3. **Rate Limiting**: Implement rate limiting for production use
4. **Data Privacy**: Ensure compliance with data scraping laws and website ToS

## Next Steps

1. **Enable JWT verification** in `supabase/config.toml` for production
2. **Set up automated scheduling** for daily scraper runs
3. **Add more counties** by following the template pattern
4. **Implement OCR** for PDF processing using Google Document AI
5. **Add email notifications** when new properties are found

## Support

For issues or questions:
1. Check Edge Function logs: `supabase functions logs`
2. Review database tables for data integrity
3. Verify API keys are configured correctly in Admin panel

---

**Version**: 1.0.0
**Last Updated**: 2025-11-17
**Compatibility**: Supabase Edge Functions (Deno runtime)
