# 🤖 TX Deed Autonomous Scraping Agents

**Autonomous data collection system for Texas deed records with AI-powered extraction and county-level configuration.**

This system deploys self-operating bots that continuously scrape Texas county websites for tax deed, tax lien, foreclosure, and constable sale data. The agents run autonomously 24/7, intelligently extracting property data and feeding it into your Win With Deeds platform.

## 🎯 Features

- **Autonomous Operation**: Agents run 24/7 on configurable schedules
- **Multi-County Support**: Currently supports 8+ major Texas counties (Harris, Dallas, Travis, Tarrant, Bexar, Collin, Denton, Fort Bend)
- **AI-Powered Extraction**: Uses Claude/GPT to intelligently extract data from complex websites
- **County Selection**: Easily enable/disable specific counties
- **Smart Scheduling**: Different counties can have different scraping frequencies
- **Data Pipeline Integration**: Automatic Supabase integration with scout agent matching
- **Opportunity Scoring**: AI calculates opportunity scores for each property
- **Retry Logic**: Robust error handling with exponential backoff
- **Docker Support**: Easy deployment with Docker Compose

## 🏗️ Architecture

```
scraping-agents/
├── agent_orchestrator.py      # Main coordinator
├── scrapers/                   # County-specific scrapers
│   ├── base_scraper.py        # Base scraper class
│   ├── harris/                # Harris County scraper
│   ├── dallas/                # Dallas County scraper
│   ├── travis/                # Travis County scraper
│   └── ...                    # Additional counties
├── models/                     # Data models
│   └── property.py            # Property data model
├── utils/                      # Utilities
│   ├── database.py            # Supabase integration
│   └── ai_extractor.py        # AI data extraction
├── config/                     # Configuration
│   └── counties.json          # County settings
└── logs/                       # Scraping logs
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Set up environment
cp .env.example .env
# Edit .env with your credentials

# 2. Start the agents
docker-compose up -d

# 3. View logs
docker-compose logs -f scraping-agents
```

### Option 2: Manual Setup

```bash
# 1. Run setup script
chmod +x setup.sh
./setup.sh

# 2. Configure environment
# Edit .env with your Supabase and API credentials

# 3. Run a test scrape
python agent_orchestrator.py --mode once

# 4. Start daemon mode (runs continuously)
python agent_orchestrator.py --mode daemon
```

## ⚙️ Configuration

### Environment Variables

Edit `.env` file:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key
SUPABASE_SERVICE_KEY=your_service_key

# AI API Keys (for intelligent extraction)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Redis (for task queuing)
REDIS_URL=redis://localhost:6379/0
```

### County Configuration

Edit `config/counties.json` to enable/disable counties:

```json
{
  "texas_counties": {
    "harris": {
      "name": "Harris County",
      "enabled": true,
      "update_frequency": "daily",
      ...
    },
    "dallas": {
      "name": "Dallas County",
      "enabled": true,
      "update_frequency": "daily",
      ...
    }
  }
}
```

**Available Frequencies:**
- `hourly` - Runs every hour
- `daily` - Runs once per day at 2 AM
- `weekly` - Runs once per week on Monday at 2 AM

## 📊 Usage Examples

### Run All Enabled Counties Once

```bash
python agent_orchestrator.py --mode once
```

### Run Specific Counties

```bash
python agent_orchestrator.py --mode counties --counties harris dallas travis
```

### Run as Daemon (Scheduled)

```bash
python agent_orchestrator.py --mode daemon
```

### Using Helper Scripts

```bash
# Quick run (once mode)
./run_scraper.sh

# Daemon mode
./run_scraper.sh daemon

# Specific counties
./run_scraper.sh counties "harris travis"
```

## 🗂️ Data Models

Properties are scraped with the following structure:

```python
{
  "address": "123 Main St, Houston, TX 77001",
  "county": "Harris",
  "appraised_value": 250000,
  "taxes_owed": 15234.50,
  "minimum_bid": 50000,
  "sale_date": "2025-03-15",
  "property_type": "Single Family",
  "deed_type": "Tax Deed",
  "opportunity_score": 88,  # AI-calculated
  "estimated_roi": 400.0,   # AI-calculated
  ...
}
```

## 🎯 Scout Agent Integration

The scrapers automatically check each property against active Scout Agents:

1. **Property Scraped** → Property data extracted
2. **Score Calculated** → AI calculates opportunity score
3. **Agent Matching** → Checks against active scout agent criteria
4. **Notification Created** → Creates notification if match found
5. **User Alerted** → User receives notification via email/SMS

## 🧪 Adding New Counties

To add a new county:

1. **Create Scraper File**: `scrapers/new_county/new_county_scraper.py`

```python
from scrapers.base_scraper import BaseScraper

class NewCountyScraper(BaseScraper):
    async def scrape(self):
        # Implement scraping logic
        pass
```

2. **Register in `scrapers/__init__.py`**:

```python
from scrapers.new_county.new_county_scraper import NewCountyScraper

SCRAPER_REGISTRY = {
    ...
    'new_county': NewCountyScraper
}
```

3. **Add Configuration** to `config/counties.json`:

```json
"new_county": {
  "name": "New County",
  "enabled": true,
  "websites": {...},
  "update_frequency": "daily"
}
```

## 📈 Monitoring

### View Logs

```bash
# Docker
docker-compose logs -f scraping-agents

# Local
tail -f logs/orchestrator_*.log
```

### Redis Commander (Web UI)

Access at `http://localhost:8081` to monitor task queue

### Database Monitoring

Check `scraper_runs` table in Supabase for run history:

```sql
SELECT * FROM scraper_runs
ORDER BY started_at DESC
LIMIT 10;
```

## 🛠️ Advanced Features

### AI-Powered Extraction

For complex websites, use the AI extractor:

```python
from utils.ai_extractor import AIDataExtractor

extractor = AIDataExtractor(provider="anthropic")
data = extractor.extract_property_data(raw_html_text)
```

### Custom Scheduling

Add custom schedules in `agent_orchestrator.py`:

```python
# Run Harris County every 4 hours
scheduler.add_job(
    run_county_scraper,
    trigger=IntervalTrigger(hours=4),
    args=['harris']
)
```

### Proxy Support

Enable proxy in `.env`:

```bash
USE_PROXY=true
PROXY_URL=http://your-proxy:port
```

## 🚨 Troubleshooting

### Common Issues

**Issue**: Selenium driver not found
```bash
# Install ChromeDriver
playwright install chromium
```

**Issue**: Supabase connection errors
```bash
# Check credentials in .env
# Verify Supabase project is running
```

**Issue**: No properties found
```bash
# Check if county websites have changed
# Enable verbose logging: LOG_LEVEL=DEBUG
```

### Debug Mode

```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python agent_orchestrator.py --mode once
```

## 📚 Tech Stack

- **Python 3.11+**
- **Selenium** - Browser automation
- **Playwright** - Modern browser automation
- **BeautifulSoup** - HTML parsing
- **Supabase** - Database & storage
- **Redis** - Task queuing
- **APScheduler** - Job scheduling
- **Claude/GPT** - AI extraction
- **Docker** - Containerization

## 🔐 Security & Ethics

- Respects robots.txt
- Implements rate limiting
- Uses random user agents
- Includes retry delays
- Only scrapes public data
- No authentication bypass

## 📝 License

MIT License - See parent project for details

## 🤝 Contributing

To add support for new counties:
1. Fork the repository
2. Create a new county scraper
3. Add tests
4. Submit pull request

## 📞 Support

For issues or questions:
- Check the logs first
- Review Supabase integration
- Open an issue on GitHub

---

**Built with ❤️ for the Win With Deeds platform**
