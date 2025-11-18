# Enterprise Real Estate Scraping & Data Science System

A comprehensive, enterprise-level web scraping and data science platform for real estate property data. Built for scalability, reliability, and advanced analytics.

## 🚀 Features

### Core Scraping Infrastructure
- **Multiple Data Sources**: Zillow, Realtor.com, Redfin, County Tax Records, Public Records
- **Proxy Rotation**: Automatic proxy management with health checking
- **Rate Limiting**: Configurable rate limiting with multiple strategies (token bucket, sliding window, fixed window)
- **Retry Logic**: Exponential backoff with configurable retries
- **Session Management**: Connection pooling and cookie management
- **Queue System**: Distributed scraping with Redis/RabbitMQ support

### Data Pipeline
- **Data Cleaning**: Automatic data standardization and normalization
- **Data Validation**: Schema validation with quality scoring
- **Data Transformation**: Feature engineering and categorization
- **Data Enrichment**: Geocoding, demographics, school ratings, crime data

### Data Science & ML
- **Property Analysis**: Comprehensive statistical analysis and insights
- **Market Analysis**: Market health scoring and trend forecasting
- **Property Valuation**: ML-based property valuation using Random Forest
- **Lead Scoring**: Intelligent lead scoring and ranking system
- **Visualization**: Charts, maps, and interactive dashboards

### Enterprise Features
- **Multiple Databases**: SQLite, PostgreSQL, MongoDB support
- **Task Queues**: Memory, Redis, and RabbitMQ support
- **Docker Support**: Full containerization with Docker Compose
- **Logging**: Structured logging with rotation
- **Configuration**: YAML-based configuration management

## 📋 Prerequisites

- Python 3.11+
- Docker & Docker Compose (optional, for containerized deployment)
- PostgreSQL 15+ (optional, SQLite works out of the box)
- Redis 7+ (optional, for distributed scraping)

## 🔧 Installation

### Option 1: Local Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/tx-deed.git
cd tx-deed

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
```

### Option 2: Docker Installation

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f scraper

# Stop services
docker-compose down
```

## 🚀 Quick Start

### 1. Basic Property Scraping

```bash
# Scrape properties from Zillow
python scraping_system/main.py scrape --location "Austin, TX" --source zillow --save-db

# Scrape from all sources
python scraping_system/main.py scrape --location "Austin, TX" --source all --save-db
```

### 2. Tax Records Scraping

```bash
# Scrape tax delinquent properties
python scraping_system/main.py tax --county travis --save-db
```

### 3. Data Analysis

```bash
# Analyze properties and generate leads
python scraping_system/main.py analyze --generate-leads --limit 1000
```

### 4. Using Python API

```python
from scraping_system.scrapers.property.zillow_scraper import ZillowScraper
from scraping_system.data_science.ml_models.lead_scoring import LeadScoringModel

# Scrape properties
with ZillowScraper() as scraper:
    properties = scraper.scrape("Austin, TX", max_pages=5)

# Score leads
lead_scorer = LeadScoringModel()
top_leads = lead_scorer.get_top_leads(properties, limit=10)

for lead in top_leads:
    print(f"{lead['address']}: Score {lead['lead_score']['total_score']}")
```

## 📚 Examples

See the `examples/` directory for detailed examples:

- `basic_scraping.py` - Simple scraping from multiple sources
- `data_analysis.py` - Property analysis and lead scoring

## 🏗️ Architecture

```
scraping_system/
├── core/                  # Core infrastructure
│   ├── base_scraper.py   # Base scraper class
│   ├── proxy_manager.py  # Proxy rotation
│   ├── rate_limiter.py   # Rate limiting
│   ├── database_manager.py
│   └── queue_manager.py
├── scrapers/             # Scraper implementations
│   ├── property/        # Property listing scrapers
│   ├── tax_records/     # Tax record scrapers
│   ├── public_records/  # Public record scrapers
│   └── market_data/     # Market data scrapers
├── pipelines/            # Data pipelines
│   ├── data_cleaner.py
│   ├── data_validator.py
│   ├── data_transformer.py
│   └── data_enricher.py
├── data_science/         # Data science modules
│   ├── analysis/        # Analysis tools
│   ├── ml_models/       # ML models
│   └── visualization/   # Visualization tools
└── config/               # Configuration files
```

## ⚙️ Configuration

Edit `scraping_system/config/config.yaml`:

```yaml
scraping:
  use_proxy: true
  rate_limit: 2.0
  max_retries: 3

database:
  type: "postgresql"  # or "sqlite", "mongodb"

queue:
  type: "redis"  # or "memory", "rabbitmq"

pipeline:
  strict_validation: false
  enable_enrichment: true
```

## 🔐 Environment Variables

```bash
# Database
DATABASE_TYPE=postgresql
POSTGRES_HOST=localhost
POSTGRES_DB=scraping
POSTGRES_USER=scraper
POSTGRES_PASSWORD=your_password

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Scraping
USE_PROXY=false
RATE_LIMIT=2.0
```

## 📊 Data Sources

### Property Listings
- **Zillow**: Property listings, market data
- **Realtor.com**: MLS listings via API
- **Redfin**: Property and market data

### Public Records
- **County Tax Records**: Travis, Harris, Dallas, Bexar counties (TX)
- **Public Records**: Deeds, liens, foreclosures
- **Market Data**: Trends, forecasts, analytics

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=scraping_system

# Run specific test
pytest tests/test_scrapers.py
```

## 📈 Performance

- **Rate Limiting**: 2 requests/second (configurable)
- **Concurrent Scraping**: Multi-threaded with queue system
- **Database**: Bulk inserts with transaction batching
- **Caching**: Proxy and session caching

## 🛡️ Best Practices

1. **Respect robots.txt** and terms of service
2. **Use rate limiting** to avoid overwhelming servers
3. **Rotate proxies** for large-scale scraping
4. **Validate data** before storage
5. **Monitor logs** for errors and anomalies

## 🔄 Workflow

1. **Scrape** → Collect data from sources
2. **Clean** → Standardize and normalize
3. **Validate** → Check quality and completeness
4. **Transform** → Feature engineering
5. **Enrich** → Add external data
6. **Analyze** → Generate insights
7. **Score** → Rank opportunities

## 📝 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions welcome! Please read our contributing guidelines first.

## 📧 Contact

For questions or support, please open an issue on GitHub.

## 🙏 Acknowledgments

Built with:
- Beautiful Soup & lxml for parsing
- Requests for HTTP
- scikit-learn for ML models
- PostgreSQL, MongoDB, Redis for storage
- Docker for containerization

---

**Note**: This system is for educational and authorized use only. Always comply with website terms of service and local regulations when scraping data.
