# Win With Deeds - Tax Sale Platform 🏡

A comprehensive tax deed investment platform with **advanced AI-powered web scraping** capabilities for extracting real-time tax sale data from multiple sources.

## 🚀 Project Overview

This platform combines a modern React frontend with a powerful Python scraping backend to help real estate investors find and track tax sale opportunities across the United States.

### Key Features

- 📊 **Real-Time Tax Sale Data** - Automated scraping from multiple sources
- 🤖 **AI-Powered Extraction** - Use Claude/GPT to scrape ANY tax sale website
- 🗺️ **Multi-Source Aggregation** - County sites, aggregators, and custom URLs
- 📅 **Auction Tracking** - Monitor upcoming sales and deadlines
- 💰 **ROI Analysis** - Calculate investment opportunities
- 🔍 **Advanced Search** - Filter by location, price, property type
- 📈 **Pipeline Management** - Track deals from research to acquisition

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Frontend (React/Vite)                 │
│  - Modern UI with Tailwind CSS                          │
│  - Property search and filtering                        │
│  - Deal pipeline management                             │
│  - Interactive maps and charts                          │
└────────────────────┬────────────────────────────────────┘
                     │ REST API
┌────────────────────▼────────────────────────────────────┐
│              Backend (FastAPI/Python)                    │
│  - RESTful API endpoints                                │
│  - Database management (SQLite/PostgreSQL)              │
│  - Scraping orchestration                               │
│  - Data normalization and validation                    │
└────────────────────┬────────────────────────────────────┘
                     │
        ┌────────────┴────────────┬─────────────────┐
        │                         │                 │
┌───────▼────────┐    ┌──────────▼──────┐   ┌─────▼─────────┐
│   Playwright   │    │   BeautifulSoup │   │  AI Scrapers  │
│ (Browser Auto) │    │   (HTML Parse)  │   │(Claude/GPT-4) │
└───────┬────────┘    └──────────┬──────┘   └─────┬─────────┘
        │                        │                 │
        └────────────┬───────────┴─────────────────┘
                     ▼
        ┌────────────────────────────┐
        │    Tax Sale Websites       │
        │  - TaxSaleResources.com    │
        │  - County tax offices      │
        │  - Custom URLs             │
        └────────────────────────────┘
```

## 📦 What's Included

### Frontend (`/src`)
- React 18 with Vite
- Tailwind CSS for styling
- Radix UI components
- React Router for navigation
- Supabase integration (optional)
- Responsive design

### Backend (`/backend`)
- **FastAPI** REST API
- **Playwright** browser automation
- **BeautifulSoup** HTML parsing
- **AI scrapers** (Claude/OpenAI)
- **SQLAlchemy** async ORM
- **APScheduler** for automation
- CLI tools for management

### Scrapers
1. **TaxSaleResources.com Scraper** - Aggregate listings
2. **County Scrapers** - Pre-configured for major counties:
   - Harris County, TX
   - Travis County, TX
   - Fulton County, GA
   - Maricopa County, AZ
   - Cook County, IL
3. **AI Universal Scraper** - Works with ANY tax sale website

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.10+
- npm or yarn

### 1. Frontend Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### 2. Backend Setup

```bash
# Navigate to backend
cd backend

# Run setup script (installs everything)
bash setup.sh

# OR manual setup:
pip install -r requirements.txt
playwright install chromium
python cli.py init
```

### 3. Configure API Keys (Optional - for AI scraping)

Edit `backend/.env`:
```bash
ANTHROPIC_API_KEY=your_claude_key_here
# OR
OPENAI_API_KEY=your_openai_key_here
```

### 4. Start Backend

```bash
# Development mode
cd backend
python main.py

# Access API: http://localhost:8000
# API Docs: http://localhost:8000/docs
```

### 5. Start Scraping

```bash
# Using CLI
python backend/cli.py scrape-all

# OR via API
curl -X POST http://localhost:8000/api/scrape/all

# OR using web interface (after integration)
```

## 📚 Documentation

- **[Backend README](backend/README.md)** - Detailed backend documentation
- **[Integration Guide](INTEGRATION_GUIDE.md)** - Connect frontend to backend
- **[API Documentation](http://localhost:8000/docs)** - Interactive API docs (when running)

## 🎯 Usage Examples

### CLI Examples

```bash
# List available scrapers
python backend/cli.py list-sources

# Scrape Texas counties
python backend/cli.py quick-tx

# Scrape specific county
python backend/cli.py scrape county --county harris-tx

# Scrape any website with AI
python backend/cli.py scrape-url https://countytaxsale.example.com

# View statistics
python backend/cli.py stats
```

### API Examples

```bash
# Get Texas properties
curl "http://localhost:8000/api/properties?state=TX&limit=50"

# Get upcoming auctions
curl "http://localhost:8000/api/properties/upcoming/auctions?days_ahead=30"

# Search properties
curl "http://localhost:8000/api/properties/search?q=Main+Street"

# Trigger scraping
curl -X POST "http://localhost:8000/api/scrape/source?source_type=county&county_key=harris-tx"

# Scrape custom URL
curl -X POST "http://localhost:8000/api/scrape/custom-url?url=https://tax-sales.example.com"
```

### JavaScript Integration

```javascript
import { api } from './lib/api';

// Get properties
const properties = await api.getProperties({
  state: 'TX',
  county: 'Harris',
  min_bid: 10000,
  max_bid: 100000,
  limit: 50
});

// Search
const results = await api.searchProperties('123 Main St');

// Scrape
await api.scrapeSource('county', { county_key: 'harris-tx' });
```

## 🌐 Available Data Sources

### Pre-Configured Sources

1. **TaxSaleResources.com**
   - Coverage: All states
   - Type: Aggregator
   - Updates: Daily

2. **County Tax Offices**
   - Harris County, TX
   - Travis County, TX
   - Fulton County, GA
   - Maricopa County, AZ
   - Cook County, IL
   - *More can be easily added*

3. **AI Universal Scraper**
   - Works with: ANY tax sale website
   - Powered by: Claude 3.5 Sonnet or GPT-4
   - Setup: Just provide URL

### Adding Custom Sources

```python
# backend/scrapers/my_scraper.py
from scrapers.base import BaseScraper

class MyCountyScraper(BaseScraper):
    def __init__(self):
        super().__init__("mycounty-state")
        self.base_url = "https://mycounty.gov/tax-sales"

    async def scrape(self):
        # Implementation
        pass
```

## 🔧 Configuration

### Backend Configuration (`backend/.env`)

```bash
# API
API_HOST=0.0.0.0
API_PORT=8000

# Database
DATABASE_URL=sqlite+aiosqlite:///./data/taxsales.db

# Scraping
SCRAPING_DELAY_MIN=2
SCRAPING_DELAY_MAX=5
MAX_RETRIES=3

# LLM (for AI scraping)
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key

# Scheduling
SCRAPE_SCHEDULE_CRON=0 2 * * *  # Daily at 2 AM
```

### Frontend Configuration (`.env`)

```bash
VITE_API_URL=http://localhost:8000
```

## 🚢 Deployment

### Development

```bash
# Frontend
npm run dev

# Backend
cd backend && python main.py
```

### Production (Docker)

```bash
# Backend with Docker Compose
cd backend
docker-compose up -d

# Frontend build
npm run build
# Deploy to Vercel/Netlify/etc
```

### Environment Variables

```bash
# Production
VITE_API_URL=https://api.yourdomain.com
```

## 📊 Database Schema

```sql
tax_sale_properties
├── id (primary key)
├── source (data source identifier)
├── parcel_id
├── owner
├── address, city, state, zip_code, county
├── starting_bid, minimum_bid, tax_amount, assessed_value
├── auction_date, auction_time, auction_location
├── status (Upcoming, Completed, etc.)
├── property_type, bedrooms, bathrooms, sqft
├── latitude, longitude
├── description, image_url, listing_url
├── scraped_at, updated_at, is_active
```

## 🔐 Security Features

- ✅ CORS configuration
- ✅ Rate limiting (configurable)
- ✅ Input validation with Pydantic
- ✅ SQL injection protection (SQLAlchemy ORM)
- ✅ Browser fingerprint randomization
- ✅ Proxy support (optional)
- ✅ Request retry with backoff

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest tests/

# Frontend tests
npm test

# Integration tests
npm run test:integration
```

## 📈 Performance

- **Concurrent scraping** with rate limiting
- **Async/await** throughout backend
- **Database connection pooling**
- **Caching** for frequently accessed data
- **Background jobs** for long-running tasks
- **Incremental updates** (only new properties)

## 🛠️ Tech Stack

### Frontend
- React 18
- Vite
- Tailwind CSS
- Radix UI
- React Router
- Lucide Icons

### Backend
- Python 3.11
- FastAPI
- SQLAlchemy
- Playwright
- BeautifulSoup
- APScheduler
- Anthropic/OpenAI APIs

## 🤝 Contributing

Contributions are welcome! Areas for improvement:

- Add more county scrapers
- Improve AI extraction prompts
- Add WebSocket support for real-time updates
- Implement user authentication
- Add email notifications
- Create mobile app

## 📝 License

MIT License - See LICENSE file for details

## 🙏 Acknowledgments

- Anthropic (Claude AI)
- OpenAI (GPT-4)
- Playwright team
- FastAPI community

## 📞 Support

- Documentation: See `/backend/README.md` and `/INTEGRATION_GUIDE.md`
- API Docs: `http://localhost:8000/docs` (when running)
- Issues: Open an issue on GitHub

---

**Built for real estate investors by Senior Software Engineers** 🚀

**Ready to scrape thousands of tax sale properties?**

```bash
python backend/cli.py scrape-all
```
