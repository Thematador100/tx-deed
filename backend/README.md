# Tax Sale Scraping Service 🏡

**Professional-grade web scraping infrastructure for tax sale properties**

This is an advanced, production-ready scraping service that extracts tax sale data from multiple sources including TaxSaleResources.com, county websites, and any custom URL using AI-powered extraction.

## 🚀 Features

### Multi-Source Scraping
- **TaxSaleResources.com**: Aggregate tax sale listings
- **County-Specific Scrapers**: Pre-configured for major counties (Harris-TX, Travis-TX, Fulton-GA, etc.)
- **AI-Powered Universal Scraper**: Can scrape ANY tax sale website using Claude/GPT

### Advanced Capabilities
- ✅ **Playwright** browser automation with anti-detection
- ✅ **BeautifulSoup** HTML parsing
- ✅ **AI/LLM extraction** for complex/dynamic sites
- ✅ **SQLite database** with async SQLAlchemy
- ✅ **FastAPI REST API** with full CRUD operations
- ✅ **Automated scheduling** with APScheduler
- ✅ **Rate limiting** and concurrent scraping
- ✅ **Retry logic** with exponential backoff
- ✅ **Data normalization** and validation
- ✅ **CLI interface** for manual operations

## 📋 Prerequisites

- Python 3.10+
- pip or poetry
- (Optional) OpenAI or Anthropic API key for AI scraping

## 🛠️ Installation

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Install Playwright Browsers

```bash
playwright install chromium
```

### 3. Configure Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

**Important**: To use AI scraping, add your API key:
```bash
# For Claude (recommended)
ANTHROPIC_API_KEY=your_key_here

# OR for OpenAI
OPENAI_API_KEY=your_key_here
```

### 4. Initialize Database

```bash
python cli.py init
```

## 🎯 Usage

### Starting the API Server

```bash
# Development mode with auto-reload
python main.py

# Production mode
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

The API will be available at `http://localhost:8000`

API Documentation: `http://localhost:8000/docs`

### Using the CLI

```bash
# List available sources
python cli.py list-sources

# Scrape all sources
python cli.py scrape-all

# Scrape specific county
python cli.py scrape county --county harris-tx

# Scrape with AI (any URL)
python cli.py scrape-url https://example.com/tax-sales

# Quick Texas scrape
python cli.py quick-tx

# View statistics
python cli.py stats
```

### Running the Scheduler

For automated daily scraping:

```bash
python scheduler.py
```

## 🌐 API Endpoints

### Properties

- `GET /api/properties` - List properties with filters
- `GET /api/properties/{id}` - Get specific property
- `GET /api/properties/upcoming/auctions` - Upcoming auctions
- `GET /api/properties/search?q=query` - Search properties

### Scraping

- `POST /api/scrape/all` - Scrape all sources (background)
- `POST /api/scrape/source` - Scrape specific source
- `POST /api/scrape/custom-url?url=...` - Scrape custom URL with AI

### Information

- `GET /api/sources` - List all sources
- `GET /api/stats` - Database statistics
- `GET /api/counties` - Available county scrapers

### Example API Calls

```bash
# Get all Texas properties
curl "http://localhost:8000/api/properties?state=TX&limit=50"

# Get upcoming auctions in next 30 days
curl "http://localhost:8000/api/properties/upcoming/auctions?days_ahead=30"

# Scrape Harris County, TX
curl -X POST "http://localhost:8000/api/scrape/source?source_type=county&county_key=harris-tx"

# Scrape custom URL with AI
curl -X POST "http://localhost:8000/api/scrape/custom-url?url=https://tax-sales.example.com"

# Search properties
curl "http://localhost:8000/api/properties/search?q=Main+Street"
```

## 🏗️ Architecture

```
backend/
├── main.py                    # FastAPI application
├── config.py                  # Configuration management
├── models.py                  # Database models
├── database.py                # Database operations
├── scraper_orchestrator.py   # Scraping coordinator
├── scheduler.py               # Automated scheduling
├── cli.py                     # Command-line interface
├── scrapers/
│   ├── base.py               # Base scraper class
│   ├── tax_sale_resources.py # TaxSaleResources.com scraper
│   ├── county_scraper.py     # County-specific scrapers
│   └── ai_scraper.py         # AI-powered scraper
├── data/                     # SQLite database
└── logs/                     # Application logs
```

## 🔧 Configuration

Edit `.env` file:

```bash
# API
API_HOST=0.0.0.0
API_PORT=8000

# Database
DATABASE_URL=sqlite+aiosqlite:///./data/taxsales.db

# Scraping
SCRAPING_DELAY_MIN=2          # Min delay between requests (seconds)
SCRAPING_DELAY_MAX=5          # Max delay
MAX_RETRIES=3                 # Retry attempts

# LLM (for AI scraping)
ANTHROPIC_API_KEY=            # Claude API key
OPENAI_API_KEY=               # OpenAI API key

# Scheduling
SCRAPE_SCHEDULE_CRON=0 2 * * *  # Daily at 2 AM

# Logging
LOG_LEVEL=INFO
```

## 📊 Pre-Configured County Scrapers

The following counties are ready to use:

- **Harris County, TX** (harris-tx)
- **Travis County, TX** (travis-tx)
- **Fulton County, GA** (fulton-ga)
- **Maricopa County, AZ** (maricopa-az)
- **Cook County, IL** (cook-il)

Add more counties by editing `COUNTY_CONFIGS` in `scrapers/county_scraper.py`.

## 🤖 AI-Powered Scraping

The AI scraper uses Claude (recommended) or GPT-4 to intelligently extract data from ANY tax sale website:

```python
# Example: Scrape any tax sale website
python cli.py scrape-url https://countytaxsale.example.com
```

The AI scraper:
- Automatically identifies property listings
- Extracts structured data (address, price, dates, etc.)
- Handles various website formats
- No manual selector configuration needed

## 📈 Production Deployment

### Docker Deployment

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
RUN playwright install chromium

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: ./backend
    ports:
      - "8000:8000"
    volumes:
      - ./backend/data:/app/data
      - ./backend/logs:/app/logs
    environment:
      - DATABASE_URL=sqlite+aiosqlite:///./data/taxsales.db
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped

  scheduler:
    build: ./backend
    command: python scheduler.py
    volumes:
      - ./backend/data:/app/data
      - ./backend/logs:/app/logs
    depends_on:
      - api
    restart: unless-stopped
```

### systemd Service

Create `/etc/systemd/system/taxsales-api.service`:

```ini
[Unit]
Description=Tax Sales API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/opt/taxsales/backend
ExecStart=/usr/bin/python3 main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable taxsales-api
sudo systemctl start taxsales-api
```

## 🔒 Security Considerations

- Configure CORS appropriately for production
- Use API authentication (implement JWT/API keys)
- Rate limit API endpoints
- Use rotating proxies for large-scale scraping
- Respect robots.txt and website terms of service
- Add request timeouts and circuit breakers

## 🧪 Testing

```bash
# Test API endpoints
pytest tests/

# Test scraper
python -c "
import asyncio
from scrapers import TaxSaleResourcesScraper

async def test():
    async with TaxSaleResourcesScraper() as scraper:
        props = await scraper.scrape(state='TX')
        print(f'Scraped {len(props)} properties')

asyncio.run(test())
"
```

## 📝 Adding Custom Scrapers

1. Create new scraper class extending `BaseScraper`
2. Implement `scrape()` and `parse_property()` methods
3. Add to orchestrator configuration

Example:
```python
from scrapers.base import BaseScraper

class MyCustomScraper(BaseScraper):
    def __init__(self):
        super().__init__("mycustomsite.com")
        self.base_url = "https://mycustomsite.com/tax-sales"

    async def scrape(self):
        html = await self.fetch_page(self.base_url)
        soup = self.parse_html(html)
        # ... parsing logic
        return properties

    def parse_property(self, element):
        # ... extract property data
        return property_dict
```

## 🐛 Troubleshooting

**Playwright installation issues:**
```bash
playwright install --with-deps chromium
```

**Database locked errors:**
- Use connection pooling
- Ensure no concurrent writes
- Consider PostgreSQL for production

**Scraping failures:**
- Check website structure hasn't changed
- Verify user agent and headers
- Use AI scraper as fallback
- Check rate limiting

## 📚 Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Playwright Documentation](https://playwright.dev/python/)
- [BeautifulSoup Documentation](https://www.crummy.com/software/BeautifulSoup/)
- [SQLAlchemy Async](https://docs.sqlalchemy.org/en/20/orm/extensions/asyncio.html)

## 📄 License

MIT License - See LICENSE file for details

## 🤝 Contributing

Contributions welcome! Please submit pull requests or open issues.

---

**Built with ❤️ for real estate investors**
