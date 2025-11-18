# 🚀 Automation System - Deployment Guide

**Get your AI workforce running in 30 minutes**

---

## Prerequisites

- ✅ Supabase project created
- ✅ OpenAI API key
- ✅ Supabase CLI installed: `npm install -g supabase`
- ✅ Basic terminal knowledge

---

## 📦 Step 1: Initialize Supabase (5 min)

```bash
# Navigate to your project
cd /home/user/tx-deed

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Initialize (if not already done)
supabase init
```

---

## 🗄️ Step 2: Setup Database (2 min)

```bash
# Run migrations to create tables and triggers
supabase db push

# Or manually run the SQL:
# 1. Open Supabase Dashboard → SQL Editor
# 2. Copy contents of supabase/migrations/001_automation_setup.sql
# 3. Execute
```

**This creates:**
- ✅ Database triggers (auto-enrich properties)
- ✅ Admin alerts table
- ✅ Agent status tracking
- ✅ Automation logs
- ✅ Classification cache
- ✅ Helper functions

---

## ⚙️ Step 3: Set Environment Variables (3 min)

### In Supabase Dashboard:

1. Go to **Project Settings** → **Edge Functions** → **Secrets**
2. Add these secrets:

```
OPENAI_API_KEY=sk-your-openai-key-here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Optional API Keys (for enhanced features):

```
CENSUS_API_KEY=your-census-key
GREATSCHOOLS_API_KEY=your-greatschools-key
ZILLOW_API_KEY=your-zillow-key
SENDGRID_API_KEY=your-sendgrid-key (for emails)
TWILIO_ACCOUNT_SID=your-twilio-sid (for SMS)
TWILIO_AUTH_TOKEN=your-twilio-token
```

---

## 🤖 Step 4: Deploy Edge Functions (10 min)

### Deploy County Scraper

```bash
supabase functions deploy county-scraper

# Test it
supabase functions invoke county-scraper

# Expected output:
# {
#   "success": true,
#   "results": {
#     "success": ["Los Angeles County", ...],
#     "failed": [],
#     "total": 30
#   }
# }
```

### Deploy AI Classifier

```bash
supabase functions deploy ai-classifier

# Test with sample data
curl -X POST 'https://your-project.supabase.co/functions/v1/ai-classifier' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "data": "County,Sale Date,Properties\nHarris County,01/21/2026,892",
    "dataType": "csv",
    "filename": "test.csv"
  }'

# Expected output:
# {
#   "classification": "upcoming_sales",
#   "confidence": 0.95,
#   "table_name": "upcoming_sales",
#   ...
# }
```

### Deploy Property Enrichment

```bash
supabase functions deploy property-enrichment

# Test (replace with real property ID)
curl -X POST 'https://your-project.supabase.co/functions/v1/property-enrichment' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"propertyId": "uuid-here"}'
```

---

## ⏰ Step 5: Setup Cron Jobs (5 min)

### Option A: Supabase Platform (Recommended)

1. Go to **Supabase Dashboard** → **Edge Functions** → **Cron Jobs**
2. Add these schedules:

```
Daily 3:00 AM: county-scraper
Daily 4:00 AM: property-enrichment (batch)
Daily 9:00 AM: auction-reminders
Monday 10:00 AM: stalled-deal-detector
Sunday 6:00 AM: market-analysis
1st of month 8:00 AM: monthly-report
```

### Option B: GitHub Actions (Alternative)

Create `.github/workflows/automation.yml`:

```yaml
name: Run Automation

on:
  schedule:
    - cron: '0 3 * * *'  # Daily at 3 AM UTC

jobs:
  run-scrapers:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger County Scraper
        run: |
          curl -X POST '${{ secrets.SUPABASE_URL }}/functions/v1/county-scraper' \
            --header 'Authorization: Bearer ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}'
```

---

## 🔄 Step 6: Add Route for Smart Import (2 min)

Add to `src/App.jsx`:

```javascript
import AdminSmartImport from '@/pages/admin/AdminSmartImport';

// Add this route in the admin section:
<Route
  path="/admin/smart-import"
  element={
    <AdminRoute>
      <AdminSmartImport />
    </AdminRoute>
  }
/>
```

Update admin menu in `src/pages/admin/AdminLayout.jsx`:

```javascript
{
  name: 'Smart Import',
  path: '/admin/smart-import',
  icon: <Upload className="w-5 h-5" />
}
```

---

## 🧪 Step 7: Test Automation (5 min)

### Test 1: Property Auto-Enrichment

```sql
-- Insert test property
INSERT INTO properties (
  address,
  price,
  estimated_value,
  property_type,
  state,
  county,
  auction_date
) VALUES (
  '123 Main St, Miami, FL',
  50000,
  150000,
  'Single Family',
  'Florida',
  'Miami-Dade County',
  '2026-01-15'
);

-- Check if enrichment triggered
-- Wait 10-20 seconds, then:
SELECT * FROM properties WHERE address LIKE '123 Main%';

-- Should see:
-- - opportunity_score populated
-- - red_flags populated
-- - enriched_at timestamp set
```

### Test 2: Smart Import

1. Navigate to `/admin/smart-import`
2. Create test CSV file:

```csv
County,State,Sale Date,Properties
Los Angeles County,California,2026-03-15,450
Cook County,Illinois,2026-04-01,890
```

3. Drop file in Smart Import
4. Verify AI detects "upcoming_sales"
5. Click "Confirm Import"
6. Check `/auctions-leads` - should see new sales!

### Test 3: Manual Scraper Run

```bash
# Trigger scraper manually
supabase functions invoke county-scraper

# Check results in admin dashboard
# Navigate to /admin/ai-workforce
```

---

## 📊 Step 8: Monitor Automation (Ongoing)

### Admin Dashboard (`/admin/ai-workforce`)

View:
- ✅ Agent status (Active/Idle/Error)
- ✅ Last run times
- ✅ Success rates
- ✅ Error logs
- ✅ Performance metrics

### Automation Logs

```sql
-- View recent logs
SELECT * FROM automation_logs
ORDER BY created_at DESC
LIMIT 50;

-- View errors
SELECT * FROM automation_logs
WHERE status = 'failed'
ORDER BY created_at DESC;

-- Agent performance
SELECT
  agent_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful,
  SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed,
  ROUND(AVG(duration_ms)) as avg_duration_ms
FROM automation_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY agent_name;
```

### Admin Alerts

```sql
-- View unread alerts
SELECT * FROM admin_alerts
WHERE is_read = FALSE
ORDER BY created_at DESC;
```

---

## 🎯 Step 9: Scale Automation

### Add More Counties to Scrape

Edit `supabase/functions/county-scraper/index.ts`:

```typescript
const COUNTIES_TO_SCRAPE = [
  // Add 3,000 counties here
  // You can import from a JSON file:
  ...require('./counties.json')
]
```

### Optimize Performance

```typescript
// Process counties in batches
const BATCH_SIZE = 100;
for (let i = 0; i < counties.length; i += BATCH_SIZE) {
  const batch = counties.slice(i, i + BATCH_SIZE);
  await Promise.all(batch.map(county => scrapeCounty(county)));
}
```

### Add More Agents

Create new Edge Functions:
- `news-monitor` - Track legislation changes
- `lead-quality-scorer` - Auto-score uploaded leads
- `buyer-match-auto` - Auto-run Buyer-Match
- `document-generator` - Auto-generate docs
- `email-automation` - Handle drip campaigns

---

## 🔐 Security Best Practices

### 1. Never expose service role key

```javascript
// ❌ WRONG - Don't use in frontend
const supabase = createClient(url, SERVICE_ROLE_KEY)

// ✅ CORRECT - Use in Edge Functions only
// Edge Functions have access to service role key via environment
```

### 2. Use RLS policies

All tables have Row Level Security enabled. Users can only access their own data.

### 3. Rate limit API calls

```typescript
// Add rate limiting to Edge Functions
const rateLimit = 100; // requests per minute
// Use library like bottleneck or custom implementation
```

### 4. Validate inputs

```typescript
// Always validate user inputs
if (!propertyId || typeof propertyId !== 'string') {
  throw new Error('Invalid property ID');
}
```

---

## 💰 Cost Optimization

### OpenAI API Costs

- Use **gpt-4o-mini** for data extraction ($0.15/1M tokens)
- Use **gpt-4o** only for complex analysis ($5/1M tokens)
- Cache classification results
- Batch requests when possible

**Estimated monthly costs:**
- 30 counties/day scraping: ~$5-10/month
- 100 properties/day enrichment: ~$15-20/month
- Classification: ~$2-5/month
- **Total: ~$25-35/month** for full automation

### Supabase Costs

- Free tier: 500MB database, 2GB bandwidth, 50GB file storage
- Pro tier ($25/month): 8GB database, 50GB bandwidth, 100GB storage
- Estimate: **$0-25/month** depending on usage

### Total Automation Cost: **$25-60/month**

*(Can support thousands of properties and users)*

---

## 🚨 Troubleshooting

### Issue: Scraper failing

```sql
-- Check logs
SELECT * FROM automation_logs
WHERE agent_name = 'county-scraper'
AND status = 'failed'
ORDER BY created_at DESC;

-- Common causes:
-- 1. Website changed structure → Update parsing logic
-- 2. Rate limited → Add delays between requests
-- 3. Network timeout → Increase timeout in fetch()
```

### Issue: Enrichment not triggering

```sql
-- Check if trigger exists
SELECT * FROM pg_trigger
WHERE tgname = 'on_property_insert';

-- Re-create trigger if missing:
-- Run migration SQL again
```

### Issue: AI classification inaccurate

```sql
-- View classification cache
SELECT * FROM classification_cache
ORDER BY created_at DESC;

-- Low confidence? Adjust prompt in ai-classifier function
-- Add more examples to training data
```

---

## ✅ Deployment Checklist

Before going live:

- [ ] All Edge Functions deployed
- [ ] Environment variables set
- [ ] Database migrations run
- [ ] Cron jobs scheduled
- [ ] Test property enrichment working
- [ ] Test Smart Import working
- [ ] Test manual scraper run successful
- [ ] Admin dashboard showing agent status
- [ ] Logs table populated
- [ ] Alerts system working
- [ ] RLS policies verified
- [ ] API keys secured
- [ ] Rate limiting configured
- [ ] Monitoring dashboard set up
- [ ] Backup strategy in place

---

## 🎓 Next Steps

### Level Up Automation:

1. **Add Email Campaigns**
   - Welcome sequences
   - Drip campaigns
   - Auction reminders

2. **Implement SMS Alerts**
   - Twilio integration
   - Real-time property alerts
   - Auction notifications

3. **Auto-Generate Reports**
   - Weekly performance
   - Market insights
   - User analytics

4. **ML Model Training**
   - Improve Buyer-Match accuracy
   - Better opportunity scoring
   - Predictive analytics

5. **API Webhooks**
   - Zapier integration
   - Third-party connections
   - Real-time data sync

---

## 📚 Resources

- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
- [OpenAI API Docs](https://platform.openai.com/docs/api-reference)
- [Cron Expression Generator](https://crontab.guru/)
- [PostgreSQL Triggers](https://www.postgresql.org/docs/current/trigger-definition.html)

---

## 🆘 Support

Need help? Check:
1. Automation logs in database
2. Admin alerts table
3. Supabase Edge Function logs
4. Browser console for frontend errors

---

**Congratulations! Your AI workforce is now operational. 🎉**

**The platform will:**
- ✅ Update itself daily with new sales
- ✅ Enrich properties automatically
- ✅ Classify data intelligently
- ✅ Send alerts proactively
- ✅ Run 24/7 without manual work

**You just built a self-operating platform. 🚀**

---

*Last Updated: 2025-11-18*
*Version: 1.0*
