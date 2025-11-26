# 🚀 Quick Start Guide - Autonomous AI Scraper

Get your nationwide property scraper running in 5 minutes.

## Prerequisites Checklist

- [ ] Supabase account with project created
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] Project linked to Supabase (`supabase link`)
- [ ] AI API key (Anthropic Claude recommended)
- [ ] (Optional) BrightData proxy account

## Step 1: Configure API Keys (2 minutes)

Copy the example file and add your credentials:

```bash
cp .env.scraper.example .env.scraper
```

Edit `.env.scraper` and add at minimum:

```bash
ANTHROPIC_API_KEY=sk-ant-api03-YOUR_KEY_HERE
```

**Where to get keys:**
- Anthropic Claude: https://console.anthropic.com/
- BrightData Proxies: https://brightdata.com/ (optional)

## Step 2: Deploy Everything (2 minutes)

Run the automated deployment script:

```bash
./scripts/deploy-scrapers.sh
```

This will:
- ✅ Create database tables
- ✅ Deploy 4 edge functions
- ✅ Configure your secrets

## Step 3: Test Single County (1 minute)

Test that everything works with one county:

```bash
./scripts/test-single-county.sh Harris Texas
```

You should see:
```
✅ Test completed successfully!
Records Found: 150
Records Inserted: 150
```

## Step 4: Start Nationwide Scraping

Launch the autonomous system:

```bash
./scripts/start-scraping.sh
```

## Step 5: Monitor Progress

Watch it work in real-time:

```bash
./scripts/monitor-scrapers.sh
```

You'll see:
- Counties being scraped
- Properties being added
- Success/failure rates
- Proxy health

## That's It! 🎉

Your system is now autonomously scraping all 3,143 US counties.

## What Happens Next?

The AI scraper will:
1. **Discover** county websites automatically (no manual config!)
2. **Analyze** page structure using Claude AI
3. **Extract** property data intelligently
4. **Store** everything in your Supabase database
5. **Retry** failed counties with exponential backoff
6. **Scale** to cover the entire country

## Viewing Your Data

Properties are stored in these tables:
- `properties` - Tax deed properties
- `tax_delinquent_leads` - Delinquent properties
- `redeemable_deeds` - Redeemable deed properties

Query example:
```sql
SELECT
  address,
  county,
  state,
  starting_bid,
  auction_date
FROM properties
WHERE county = 'Harris'
  AND state = 'TX'
ORDER BY scraped_at DESC;
```

## Performance Expectations

### With Free Proxies
- Speed: ~50-100 counties/day
- Success Rate: ~60-70%
- Cost: $10-15/month (AI only)

### With BrightData Proxies
- Speed: ~500-1000 counties/day
- Success Rate: ~85-95%
- Cost: $35-50/month (AI + proxies)

### Full US Coverage
- All 3,143 counties: 3-6 days (with proxies)
- Total properties: 500K-2M+ listings
- Updates: Automatically re-scrapes every 24h

## Troubleshooting

### No properties found?
1. Check AI API key is set correctly
2. Run test on known-good county: `./scripts/test-single-county.sh Harris Texas`
3. Check scraper logs: `SELECT * FROM scraper_logs ORDER BY created_at DESC;`

### Rate limited?
1. Add proxy service (BrightData recommended)
2. Reduce worker count: `./scripts/start-scraping.sh 5`
3. Increase delay in code

### AI errors?
1. Verify API key has credits
2. Check Anthropic dashboard for usage
3. Try switching to OpenAI as fallback

## Scaling Up

### Increase Speed
```bash
# 50 workers instead of 10
./scripts/start-scraping.sh 50
```

### Add More Proxies
```bash
./scripts/init-proxies.sh
```

## Cost Breakdown

| Service | Monthly Cost | Purpose |
|---------|-------------|---------|
| Supabase | $0-25 | Database & Functions |
| Anthropic Claude | $10-15 | AI Analysis |
| BrightData | $15-20 | Proxy Rotation |
| **Total** | **$25-60** | **Full US Coverage** |

## Support

Having issues? Check:
1. Logs: `SELECT * FROM scraper_logs WHERE status = 'failed';`
2. AI tasks: `SELECT * FROM ai_agent_tasks WHERE status = 'failed';`
3. Setup guide: `SCRAPER_SETUP.md`

## Next Steps

Once you have data flowing:
1. 📊 Connect your frontend to display properties
2. 🤖 Set up automated alerts for new listings
3. 📧 Configure email notifications
4. 💰 Start finding deals!

---

**Questions?** Check `SCRAPER_SETUP.md` for detailed documentation.

**Ready to scale?** The system is built to handle millions of properties across all 50 states. Just let it run! 🚀
