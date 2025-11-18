# Tax Sale Data Scraper Integration

## Overview

This document describes the tax sale data scraper integration for Win With Deeds platform. The system automatically scrapes upcoming tax sales and property addresses from TaxSaleResources.com and other sources, transforming and storing the data in your Supabase database.

## Features

✅ **Automated Data Collection**
- Scrapes nationwide tax sale data (liens, deeds, redeemable deeds)
- Configurable by state, county, and sale type
- Scheduled execution (daily at 2 AM by default)
- Manual on-demand execution

✅ **Advanced Scraping Capabilities**
- Proxy rotation to avoid IP blocks
- Rate limiting for respectful scraping
- Automatic retry with exponential backoff
- Session management and authentication
- AI-powered data extraction for dynamic sites

✅ **Data Processing**
- Address normalization and validation
- Geocoding integration (Smarty API, OpenStreetMap)
- Property enrichment (market value estimation)
- Opportunity score calculation
- ROI and profit potential analysis

✅ **Admin Interface**
- Web-based configuration
- Real-time job monitoring
- Statistics and execution history
- Credential management
- Manual execution controls

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Admin UI                                  │
│                 (AdminDataSources)                           │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Scraper Scheduler                               │
│         (Manages job execution & timing)                     │
└───────────────────────┬─────────────────────────────────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼────────┐
│ TaxSale      │ │  Future     │ │   Future     │
│ Resources    │ │  Source 2   │ │   Source 3   │
│ Scraper      │ │  Scraper    │ │   Scraper    │
└───────┬──────┘ └──────┬──────┘ └─────┬────────┘
        │               │               │
        └───────────────┼───────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│           Property Transformer                               │
│      (Normalizes, enriches, calculates scores)              │
└───────────────────────┬─────────────────────────────────────┘
                        │
┌───────────────────────▼─────────────────────────────────────┐
│              Supabase Database                               │
│                (properties table)                            │
└─────────────────────────────────────────────────────────────┘
```

## File Structure

```
src/services/scrapers/
├── base/
│   ├── BaseScraper.js           # Abstract base class
│   └── ScraperConfig.js         # Configuration (future)
├── sources/
│   └── TaxSaleResourcesScraper.js  # TaxSaleResources implementation
├── transformers/
│   └── PropertyTransformer.js   # Data normalization & enrichment
├── scheduler/
│   └── ScraperScheduler.js      # Job scheduling & orchestration
├── utils/                        # Future utilities
│   ├── ProxyManager.js          # Proxy rotation (future)
│   ├── RateLimiter.js           # Rate limiting (future)
│   └── ErrorHandler.js          # Error handling (future)
├── index.js                      # Main entry point
└── README.md                     # Architecture docs

src/pages/admin/
└── AdminDataSources.jsx          # Admin UI component
```

## Setup Instructions

### 1. TaxSaleResources Account

Create an account at [taxsaleresources.com](https://taxsaleresources.com):

- **Trial Plan**: $1.99 for initial access
- **Full Access**: $1,000/month for management solutions

### 2. Configure Credentials

Navigate to **Admin Panel > Data Sources** and enter:

- TaxSaleResources username
- TaxSaleResources password
- Optional: Specific states to scrape (comma-separated: FL, GA, TX)
- Optional: Specific counties to scrape (comma-separated)
- Max pages to scrape per job (default: 10)

### 3. API Keys (Optional but Recommended)

For enhanced functionality, configure these API keys in **Admin Panel > API Keys**:

- **Smarty API**: For address validation and geocoding
- **OpenAI API**: For AI-powered data extraction
- **Google Document AI**: For OCR on PDFs

### 4. Run the Scraper

**Manual Execution:**
1. Navigate to Admin Panel > Data Sources
2. Click "Run Scraper"
3. Monitor progress and view statistics

**Automated Execution:**
1. Enable the job toggle in Admin Panel
2. Scraper runs daily at 2 AM automatically
3. Check execution history in the jobs table

## Usage Examples

### Programmatic Usage

```javascript
import { scrapeTaxSaleResources } from '@/services/scrapers';

// Scrape Florida tax deeds
const result = await scrapeTaxSaleResources({
  username: 'your-username',
  password: 'your-password',
  states: ['FL'],
  counties: ['Miami-Dade', 'Broward'],
  saleTypes: ['tax-deed'],
  maxPages: 5
});

console.log(result);
// {
//   success: true,
//   recordsScraped: 150,
//   recordsSaved: 142,
//   message: "Successfully scraped and saved 142 properties"
// }
```

### Using the Scheduler

```javascript
import { defaultScheduler } from '@/services/scrapers';

// Execute a scheduled job
await defaultScheduler.executeJob('taxsaleresources', {
  states: ['GA', 'TX'],
  maxPages: 10
});

// Get job status
const status = defaultScheduler.getJobStatus('taxsaleresources');
console.log(status);
// {
//   name: 'taxsaleresources',
//   enabled: true,
//   isRunning: false,
//   lastRun: '2025-11-18T02:00:00.000Z',
//   nextRun: '2025-11-19T02:00:00.000Z',
//   stats: {
//     totalRuns: 45,
//     successfulRuns: 43,
//     failedRuns: 2,
//     totalRecordsScraped: 6789
//   }
// }
```

### Testing

```javascript
import { testScraper } from '@/services/scrapers';

// Test with mock data
const result = await testScraper();
// Inserts test property to verify system works
```

## Data Schema

### Input Data (from TaxSaleResources)

```javascript
{
  sourceId: 'TSR-12345',
  address: {
    street: '123 Main St',
    city: 'Atlanta',
    state: 'GA',
    zip: '30301',
    county: 'Fulton'
  },
  sale: {
    type: 'tax-deed',
    date: '2025-12-15',
    location: 'County Courthouse',
    status: 'upcoming'
  },
  financials: {
    assessedValue: 150000,
    taxAmount: 8500,
    openingBid: 45000,
    estimatedValue: 175000
  },
  property: {
    parcelId: '14-0123-456-789',
    ownerName: 'John Doe',
    propertyType: 'Single Family',
    bedrooms: 3,
    bathrooms: 2,
    sqft: 1500,
    yearBuilt: 1985
  }
}
```

### Output Data (stored in database)

The transformer enriches and normalizes the data:

```javascript
{
  // Address (normalized)
  address: '123 Main St',
  city: 'Atlanta',
  state: 'GA',
  zip_code: '30301',
  county: 'Fulton',
  lat: 33.7490,
  lng: -84.3880,

  // Property details
  bedrooms: 3,
  bathrooms: 2,
  sqft: 1500,
  lot_size: null,
  year_built: 1985,
  property_type: 'Single Family',

  // Financial data
  price: 45000,
  assessed_value: 150000,
  estimated_value: 175000,
  tax_amount: 8500,

  // Sale information
  sale_date: '2025-12-15',
  sale_type: 'tax-deed',
  sale_status: 'upcoming',
  sale_location: 'County Courthouse',

  // Calculated metrics
  roi: 93,  // % return on investment
  profit_potential: 105000,  // estimated profit
  opportunity_score: 87,  // 0-100 overall score
  location_score: 85,
  value_score: 95,
  competition_score: 82,

  // Metadata
  source: 'taxsaleresources',
  source_id: 'TSR-12345',
  scraped_at: '2025-11-18T10:30:00Z',
  status: 'active'
}
```

## Opportunity Score Calculation

### Location Score (30% weight)

- Major market: +20 points (Atlanta, Miami, Phoenix, etc.)
- Has city: +10 points
- Has county: +5 points
- Has coordinates: +15 points
- **Range**: 0-100

### Value Score (50% weight)

- 50%+ discount: +40 points
- 30-49% discount: +30 points
- 20-29% discount: +20 points
- 10-19% discount: +10 points
- Complete property data: +10 points
- **Range**: 0-100

### Competition Score (20% weight)

- Rural/small area: +15 points
- Low price (<$50k): +10 points
- **Range**: 0-100

### Overall Score

```
opportunity_score = (location_score × 0.3) + (value_score × 0.5) + (competition_score × 0.2)
```

## ROI Calculation

```javascript
// Investment calculation
purchaseCost = openingBid
renovationCosts = estimatedValue × 0.10  // 10% of value
closingCosts = purchaseCost × 0.08  // 8% of purchase
totalInvestment = purchaseCost + renovationCosts + closingCosts

// Returns
profit_potential = estimatedValue - totalInvestment
roi = (profit_potential / totalInvestment) × 100
```

## Error Handling

The scraper includes comprehensive error handling:

1. **Authentication Failures**: Retries with exponential backoff
2. **Rate Limiting**: Automatic delays between requests
3. **Network Errors**: Up to 3 retry attempts
4. **Data Validation**: Invalid records are logged but don't stop execution
5. **Logging**: All errors logged to console and database

## Rate Limiting

To be respectful to data sources:

- **Default**: 2 requests per second
- **Between pages**: 500ms delay
- **Between states**: 2 second delay
- **Configurable** per scraper

## Monitoring & Logging

### Execution Logs

All scraper runs are logged to `scout_agents` table:

```sql
SELECT * FROM scout_agents
WHERE agent_name = 'taxsaleresources'
ORDER BY started_at DESC
LIMIT 10;
```

### Statistics

View real-time statistics in Admin Panel:

- Total runs
- Success rate
- Failed runs
- Total records scraped
- Last execution time
- Next scheduled run

## Extending the System

### Adding a New Data Source

1. Create a new scraper class extending `BaseScraper`:

```javascript
// src/services/scrapers/sources/NewSourceScraper.js
import { BaseScraper } from '../base/BaseScraper.js';

export class NewSourceScraper extends BaseScraper {
  async scrape(params) {
    // Implementation
  }
}
```

2. Register with scheduler:

```javascript
// src/services/scrapers/scheduler/ScraperScheduler.js
defaultScheduler.registerJob(
  'newsource',
  NewSourceScraper,
  {
    schedule: '0 3 * * *',
    enabled: true
  }
);
```

3. Add UI configuration in `AdminDataSources.jsx`

## Advanced Features (Roadmap)

### Planned Enhancements

- **Proxy Rotation**: Automatic proxy switching for high-volume scraping
- **CAPTCHA Solving**: Integration with 2Captcha or similar services
- **Browser Automation**: Playwright/Puppeteer for JavaScript-heavy sites
- **LLM Extraction**: Use GPT-4 to parse unstructured property data
- **Webhook Notifications**: Alert on new high-value opportunities
- **Data Quality Scoring**: Flag suspicious or incomplete records
- **Deduplication**: Intelligent matching of duplicate properties
- **Historical Tracking**: Track price changes and sale outcomes

### Available Tools (Not Yet Implemented)

As mentioned in your requirements, these tools are available:

- **Apify Platform**: 7000+ actors for any website
- **Oxylabs**: AI-powered scraping with NLP bots
- **Zyte (Scrapy)**: ML-driven extraction for difficult sites
- **Firecrawl**: AI-driven LLM-ready data crawler
- **BrightData**: Enterprise-grade with CAPTCHA solver
- **Browse AI**: No-code LLM-based bots

Integration with these services can be added as needed.

## Troubleshooting

### Scraper Not Running

1. Check credentials are correct
2. Verify TaxSaleResources subscription is active
3. Check browser console for errors
4. Review logs in `scout_agents` table

### No Data Being Saved

1. Verify Supabase connection
2. Check database permissions
3. Review validation errors in console
4. Test with `testScraper()` function

### Authentication Failing

1. Confirm username/password are correct
2. Check if account is locked (too many attempts)
3. Verify TaxSaleResources platform is accessible
4. Try logging in manually to their site first

### Low Success Rate

1. Reduce `maxPages` to avoid timeouts
2. Check network connectivity
3. Review rate limiting settings
4. Verify source website hasn't changed structure

## Support

For issues or questions:

1. Check this documentation
2. Review code comments in scraper files
3. Check execution logs in database
4. Contact platform administrator

## License

Proprietary - Win With Deeds Platform

---

**Last Updated**: November 18, 2025
**Version**: 1.0.0
