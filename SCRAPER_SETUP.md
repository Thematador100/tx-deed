# 🤖 Autonomous AI Scraper System - Setup Guide

## Overview

This is the world's most advanced autonomous property scraper system. It can automatically discover, analyze, and extract tax deed data from **all 3,143 US counties** without manual configuration.

## Architecture

### Core Components

1. **AI Scraper Agent** (`supabase/functions/ai-scraper-agent`)
   - Phase 1: AI-powered website discovery
   - Phase 2: Claude 3.5 Sonnet HTML analysis
   - Phase 3: Adaptive data extraction

2. **Scraper Orchestrator** (`supabase/functions/scraper-orchestrator`)
   - Manages 10 parallel workers
   - Priority-based county queue
   - Auto-refills and retries failed tasks

3. **Proxy Manager** (`supabase/functions/proxy-manager`)
   - BrightData integration
   - Intelligent rotation
   - Anti-detection headers

4. **Database Infrastructure** (`supabase/migrations/20241126_agentic_scraper_system.sql`)
   - 8 tables for orchestration
   - Real-time monitoring views
   - Pre-loaded with top 25 counties

## Prerequisites

### Required Services

1. **Supabase Account** (already configured)
2. **AI API Key** (choose one):
   - Anthropic Claude API (recommended)
   - OpenAI GPT-4 API
3. **Proxy Service** (optional but recommended):
   - BrightData (best for residential proxies)
   - Oxylabs
   - SmartProxy

### API Keys Needed

Add these to your Supabase Edge Functions secrets:

```bash
# AI Analysis Keys (choose one)
ANTHROPIC_API_KEY=sk-ant-...
# OR
OPENAI_API_KEY=sk-...

# Proxy Services (optional)
BRIGHTDATA_USERNAME=your-username
BRIGHTDATA_PASSWORD=your-password

# CAPTCHA Solving (optional)
TWOCAPTCHA_API_KEY=your-key
```

## Installation Steps

### 1. Deploy Database Schema

Run the migration to create all necessary tables:

```bash
# Connect to your Supabase project
supabase link --project-ref YOUR_PROJECT_REF

# Run the migration
supabase db push

# Or manually run the SQL file
psql YOUR_DATABASE_URL < supabase/migrations/20241126_agentic_scraper_system.sql
```

### 2. Deploy Edge Functions

Deploy all scraper functions to Supabase:

```bash
# Deploy AI Scraper Agent
supabase functions deploy ai-scraper-agent

# Deploy Orchestrator
supabase functions deploy scraper-orchestrator

# Deploy Proxy Manager
supabase functions deploy proxy-manager

# Deploy County Scraper (universal)
supabase functions deploy scrape-county
```

### 3. Configure Secrets

Set your API keys in Supabase:

```bash
# Set Anthropic key
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...

# Set proxy credentials
supabase secrets set BRIGHTDATA_USERNAME=your-username
supabase secrets set BRIGHTDATA_PASSWORD=your-password
```

### 4. Initialize Proxy Pool

Set up your proxy rotation system:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/proxy-manager \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "setup_brightdata",
    "username": "your-username",
    "password": "your-password"
  }'
```

### 5. Start the Orchestrator

Begin nationwide scraping:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/scraper-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "start",
    "workerCount": 10
  }'
```

## Usage

### Scrape a Single County

Trigger scraping for a specific county:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/scrape-county \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "county": "Harris",
    "state": "Texas",
    "type": "tax_deed"
  }'
```

### Monitor Scraping Progress

Check the dashboard view:

```sql
SELECT * FROM scraper_dashboard;
```

Result:
```
pending_tasks: 247
active_tasks: 10
completed_tasks: 1,832
failed_tasks: 14
active_proxies: 150
counties_scraped_24h: 45
properties_added_24h: 3,421
```

### Check County Status

See which counties have been scraped:

```sql
SELECT
  county,
  state,
  priority_score,
  last_scraped,
  queue_status,
  last_records_found
FROM county_scraping_status
ORDER BY priority_score DESC
LIMIT 20;
```

### View Recent Scraping Logs

```sql
SELECT
  county,
  state,
  status,
  records_found,
  records_inserted,
  duration_ms,
  created_at
FROM scraper_logs
ORDER BY created_at DESC
LIMIT 50;
```

## Monitoring

### Proxy Health

Check your proxy rotation performance:

```sql
SELECT * FROM proxy_health_view;
```

### Failed Scrapes

Identify counties that need attention:

```sql
SELECT
  county,
  state,
  error_message,
  attempts,
  updated_at
FROM scraper_queue
WHERE status = 'failed'
  AND attempts >= 3
ORDER BY priority DESC;
```

### AI Agent Tasks

Monitor AI discovery and analysis:

```sql
SELECT
  task_type,
  county,
  state,
  status,
  ai_model,
  confidence_score,
  tokens_used
FROM ai_agent_tasks
ORDER BY created_at DESC
LIMIT 50;
```

## Scaling

### Increase Workers

More parallel workers = faster nationwide coverage:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/scraper-orchestrator \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "scale",
    "workerCount": 50
  }'
```

### Add More Proxies

Expand your proxy pool for better coverage:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/proxy-manager \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_proxies",
    "proxies": [
      {
        "url": "http://user:pass@proxy1.example.com:8080",
        "provider": "oxylabs",
        "type": "residential",
        "country": "us"
      }
    ]
  }'
```

## Cost Estimates

### AI Analysis Costs

- **Anthropic Claude 3.5 Sonnet**: ~$0.003 per county
- **OpenAI GPT-4**: ~$0.005 per county
- **Total for all US counties**: $10-15

### Proxy Costs

- **BrightData**: $15-20/month for light usage
- **Oxylabs**: $20-30/month
- **Free Proxies**: $0 (lower success rate)

### Total Monthly Cost

- **Full US Coverage**: $25-50/month
- **Maintains up-to-date data for all 3,143 counties**

## Troubleshooting

### Scraper Not Finding Properties

1. Check if AI analysis succeeded:
```sql
SELECT * FROM ai_agent_tasks
WHERE county = 'YourCounty' AND state = 'YourState'
ORDER BY created_at DESC;
```

2. Verify proxy health:
```sql
SELECT * FROM proxy_health_view;
```

3. Check rate limiting:
```sql
SELECT * FROM rate_limit_events
ORDER BY detected_at DESC LIMIT 20;
```

### Low Success Rate

1. Add more residential proxies
2. Increase delay between requests
3. Rotate user agents more frequently
4. Enable CAPTCHA solving service

### AI Not Discovering Websites

1. Verify Perplexity/Anthropic API key is set
2. Check AI agent task logs for errors
3. Manually add county to scraper_configs table

## Manual Overrides

### Add County Configuration

If AI discovery fails, manually configure:

```sql
INSERT INTO scraper_configs (
  county, state, scraper_type,
  website_url, scraper_method,
  selectors, ai_confidence
) VALUES (
  'Harris', 'TX', 'tax_deed',
  'https://www.hctax.net/Property/PropertyTax',
  'web_scrape',
  '{
    "container": "table.property-list",
    "address": "td:nth-child(1)",
    "parcel": "td:nth-child(2)",
    "owner": "td:nth-child(3)",
    "amount": "td:nth-child(4)"
  }'::jsonb,
  0.95
);
```

### Force Re-scrape

Bypass the 24-hour cache:

```bash
curl -X POST \
  https://YOUR_PROJECT_REF.supabase.co/functions/v1/scrape-county \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "county": "Harris",
    "state": "Texas",
    "type": "tax_deed",
    "force": true
  }'
```

## Performance Tuning

### Optimize for Speed

```sql
-- Increase worker count
UPDATE scraper_queue
SET priority = priority + 50
WHERE county IN (
  SELECT county FROM county_metadata
  ORDER BY priority_score DESC LIMIT 100
);
```

### Optimize for Cost

```sql
-- Reduce scraping frequency for low-priority counties
UPDATE county_metadata
SET priority_score = priority_score * 0.5
WHERE population < 50000;
```

## Support

For issues or questions:
1. Check scraper_logs table for error messages
2. Review ai_agent_tasks for AI analysis failures
3. Verify all API keys are correctly set
4. Ensure proxy pool has active proxies

## Next Steps

1. ✅ Run database migration
2. ✅ Deploy edge functions
3. ✅ Configure API keys
4. ✅ Initialize proxy pool
5. ✅ Start orchestrator
6. 📊 Monitor dashboard
7. 🎯 Watch properties roll in from all over the country!
