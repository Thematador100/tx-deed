# 🚀 Quick Start Guide

Get up and running with TX Deed Scraping Agents in 5 minutes!

## Prerequisites

- Python 3.11+ or Docker
- Supabase account
- (Optional) OpenAI or Anthropic API key for AI extraction

## Option 1: Docker Quick Start (Easiest)

```bash
# 1. Clone and navigate
cd tx-deed/scraping-agents

# 2. Configure environment
cp .env.example .env
# Edit .env with your credentials

# 3. Start the agents
docker-compose up -d

# 4. Watch the magic happen
docker-compose logs -f scraping-agents
```

That's it! Your agents are now running autonomously.

## Option 2: Local Python Setup

```bash
# 1. Run setup
chmod +x setup.sh
./setup.sh

# 2. Configure environment
# Edit .env with your Supabase credentials

# 3. Test with a single run
python agent_orchestrator.py --mode once

# 4. Start continuous mode
python agent_orchestrator.py --mode daemon
```

## Initial Configuration

### 1. Supabase Setup

Create these environment variables in `.env`:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

### 2. Run Database Schema

Go to Supabase SQL Editor and run:
```sql
-- Copy contents from database/schema.sql
```

### 3. Configure Counties

Edit `config/counties.json` to enable counties you want:

```json
{
  "texas_counties": {
    "harris": {
      "enabled": true,  // ← Set to true
      "update_frequency": "daily"
    }
  }
}
```

## Verify It's Working

### Check Logs

```bash
# Docker
docker-compose logs -f scraping-agents

# Local
tail -f logs/orchestrator_*.log
```

### Check Database

Run in Supabase SQL editor:
```sql
-- See recent scraper runs
SELECT * FROM scraper_runs
ORDER BY started_at DESC
LIMIT 5;

-- See properties found
SELECT county, COUNT(*)
FROM properties
GROUP BY county;
```

### Check Properties

Your properties should appear in:
- Supabase `properties` table
- Win With Deeds dashboard
- Scout Agent matches (if configured)

## Common First-Run Issues

### Issue: "Supabase connection error"

**Solution**: Verify your `.env` credentials
```bash
# Test connection
python -c "from utils.database import DatabaseManager; db = DatabaseManager(); print('✓ Connected!')"
```

### Issue: "No properties found"

**Reasons**:
1. County websites may have changed
2. No properties currently available
3. Scraper needs customization

**Check**:
```bash
# Run with debug logging
LOG_LEVEL=DEBUG python agent_orchestrator.py --mode counties --counties harris
```

### Issue: "ChromeDriver not found"

**Solution**:
```bash
# Install Playwright browsers
playwright install chromium
```

## Next Steps

1. **Monitor**: Set up monitoring dashboard
2. **Customize**: Adjust county scrapers for your needs
3. **Scale**: Add more counties
4. **Automate**: Let it run 24/7

## Getting Help

- Check logs first: `docker-compose logs -f`
- Review `README.md` for detailed docs
- Check `ARCHITECTURE.md` for how it works
- Open an issue on GitHub

## Success Checklist

- [ ] Environment configured (`.env`)
- [ ] Database schema created
- [ ] Counties enabled in config
- [ ] First scraper run completed
- [ ] Properties appearing in database
- [ ] Logs showing successful runs
- [ ] Scout agents matching properties (if using)

Congratulations! Your autonomous scraping agents are now working! 🎉
