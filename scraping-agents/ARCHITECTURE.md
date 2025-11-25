# 🏗️ Scraping Agents Architecture

## System Overview

The TX Deed Scraping Agents system is a distributed, autonomous data collection platform designed to continuously gather property deed information from Texas county websites.

## Core Components

### 1. Agent Orchestrator (`agent_orchestrator.py`)

**Purpose**: Central coordinator that manages all scraping agents

**Responsibilities**:
- Loads county configurations
- Schedules scraping jobs
- Manages concurrent execution
- Coordinates database operations
- Handles error recovery

**Key Methods**:
```python
run_county_scraper(county)    # Run single county
run_all_scrapers()            # Run all enabled counties
run_specific_counties([...])  # Run selected counties
schedule_scrapers()           # Set up scheduled jobs
run_daemon()                  # Run continuously with scheduling
```

### 2. Base Scraper (`scrapers/base_scraper.py`)

**Purpose**: Abstract base class providing common scraping functionality

**Features**:
- Selenium/Playwright driver management
- HTTP request handling with retry logic
- HTML table parsing
- Data cleaning utilities (currency, addresses)
- Database integration
- Error handling & logging

**Template Pattern**:
```python
class CountyScraper(BaseScraper):
    async def scrape(self) -> List[ScrapedProperty]:
        # County-specific implementation
        pass
```

### 3. County-Specific Scrapers

Each county has its own scraper module:

#### Harris County Scraper (`scrapers/harris/harris_scraper.py`)
- Uses Selenium for dynamic content
- Scrapes delinquent tax search
- Handles Harris County appraisal district

#### Travis County Scraper (`scrapers/travis/travis_scraper.py`)
- Uses Playwright for modern JS-heavy sites
- Scrapes constable sales
- Handles Travis County tax office

#### Dallas County Scraper (`scrapers/dallas/dallas_scraper.py`)
- Uses requests for simpler sites
- Scrapes sheriff sales
- Parses HTML tables

### 4. Data Models (`models/property.py`)

**ScrapedProperty Model**:
```python
class ScrapedProperty(BaseModel):
    # Identifiers
    external_id: Optional[str]
    account_number: Optional[str]
    parcel_id: Optional[str]

    # Location
    address: str
    county: str

    # Financial
    appraised_value: Optional[float]
    taxes_owed: Optional[float]
    minimum_bid: Optional[float]

    # Methods
    calculate_roi()
    calculate_opportunity_score()
    to_supabase_dict()
```

**Key Features**:
- Pydantic validation
- Automatic score calculation
- Supabase serialization

### 5. Database Manager (`utils/database.py`)

**Purpose**: Handles all database operations

**Key Operations**:
```python
save_property(property)              # Save single property
save_properties_batch([...])         # Batch save
get_active_scout_agents()            # Get active agents
check_agent_matches(property)        # Match against agents
notify_agent_match(agent_id, prop)   # Create notification
log_scraper_run(run)                 # Log scraping activity
```

### 6. AI Extractor (`utils/ai_extractor.py`)

**Purpose**: Intelligent data extraction from unstructured sources

**Capabilities**:
- Extract from raw text using Claude/GPT
- Parse PDFs with OCR
- Extract from images
- Structure unstructured data

**Usage**:
```python
extractor = AIDataExtractor(provider="anthropic")
data = extractor.extract_property_data(raw_text)
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Agent Orchestrator                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Schedule │  │ Execute  │  │ Monitor  │  │   Log    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                ┌─────────┼─────────┐
                │         │         │
        ┌───────▼──┐  ┌──▼──────┐  ┌▼────────┐
        │ Harris   │  │ Dallas  │  │ Travis  │
        │ Scraper  │  │ Scraper │  │ Scraper │
        └────┬─────┘  └────┬────┘  └────┬────┘
             │             │             │
    ┌────────▼─────────────▼─────────────▼─────────┐
    │         Base Scraper (Common Logic)           │
    │  • HTTP Requests  • Selenium  • Playwright   │
    │  • HTML Parsing   • Retry Logic • Validation │
    └────────────────────┬──────────────────────────┘
                         │
                ┌────────▼─────────┐
                │   AI Extractor   │
                │   (Optional)     │
                └────────┬─────────┘
                         │
                ┌────────▼─────────┐
                │  Data Validation │
                │  & Enrichment    │
                └────────┬─────────┘
                         │
                ┌────────▼─────────┐
                │ Database Manager │
                └────────┬─────────┘
                         │
            ┌────────────┼────────────┐
            │            │            │
     ┌──────▼──────┐ ┌──▼──────┐ ┌──▼────────┐
     │  Properties │ │  Scout  │ │ Scraper   │
     │    Table    │ │ Agents  │ │   Runs    │
     └─────────────┘ └─────────┘ └───────────┘
```

## Execution Flow

### 1. Scheduled Run

```
Scheduler Triggers
    ↓
Load County Config
    ↓
Initialize Scraper
    ↓
Fetch Web Pages
    ↓
Parse HTML/JSON
    ↓
Extract Property Data
    ↓
Validate & Clean
    ↓
Calculate Scores
    ↓
Save to Database
    ↓
Check Agent Matches
    ↓
Create Notifications
    ↓
Log Run Results
```

### 2. Manual Run

```bash
# User executes
python agent_orchestrator.py --mode once

# Orchestrator:
1. Load config
2. Get enabled counties
3. Create async tasks
4. Execute concurrently
5. Aggregate results
6. Display summary
```

## Configuration System

### County Configuration (`config/counties.json`)

```json
{
  "county_name": {
    "name": "Full County Name",
    "population": 1000000,
    "websites": {
      "tax_sale": "https://...",
      "appraisal_district": "https://..."
    },
    "scraper_type": "selenium|playwright|requests",
    "data_format": "html_table|json_api|pdf",
    "update_frequency": "hourly|daily|weekly",
    "enabled": true|false
  }
}
```

### Environment Configuration (`.env`)

```
# Database
SUPABASE_URL=...
SUPABASE_KEY=...

# AI Services
OPENAI_API_KEY=...
ANTHROPIC_API_KEY=...

# Infrastructure
REDIS_URL=...
LOG_LEVEL=INFO|DEBUG
```

## Scheduling System

Uses APScheduler with async support:

```python
scheduler = AsyncIOScheduler()

# Interval-based (hourly)
scheduler.add_job(
    func=run_county_scraper,
    trigger=IntervalTrigger(hours=1),
    args=['harris']
)

# Cron-based (daily at 2 AM)
scheduler.add_job(
    func=run_county_scraper,
    trigger=CronTrigger(hour=2, minute=0),
    args=['dallas']
)
```

## Error Handling

### Retry Logic

```python
@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=4, max=10)
)
def fetch_page(url):
    # Attempts: 1, wait 4s, 2, wait 8s, 3
    pass
```

### Error Tracking

All errors are:
1. Logged with Loguru
2. Added to ScraperRun.errors
3. Stored in database
4. Optionally sent to Sentry

## Scalability Considerations

### Horizontal Scaling

- Each county scraper is independent
- Can run multiple orchestrators
- Use Redis for distributed locking
- Coordinate via message queue

### Vertical Scaling

- Concurrent scraping via asyncio
- Configurable worker count
- Resource-aware scheduling

### Performance Optimization

- Batch database operations
- Cache frequently accessed data
- Use connection pooling
- Implement rate limiting

## Security Architecture

### Data Security

- Environment variable isolation
- Encrypted credentials
- Secure database connections
- API key rotation

### Scraping Ethics

- Respects robots.txt
- Implements delays
- Uses rate limiting
- Rotates user agents
- No authentication bypass

## Monitoring & Observability

### Logging Levels

```python
logger.debug()   # Detailed debugging
logger.info()    # General information
logger.warning() # Potential issues
logger.error()   # Error conditions
logger.critical() # Critical failures
```

### Metrics Tracked

- Properties scraped per county
- Success/failure rates
- Execution duration
- Error frequency
- Database performance

### Health Checks

```python
# Check scraper health
GET /health
{
  "status": "healthy",
  "last_run": "2025-01-15T02:00:00Z",
  "active_scrapers": 3,
  "queue_size": 0
}
```

## Future Enhancements

1. **Machine Learning**
   - Automated pattern detection
   - Dynamic scraper adaptation
   - Predictive opportunity scoring

2. **Distributed Architecture**
   - Kubernetes deployment
   - Multi-region support
   - Load balancing

3. **Real-time Processing**
   - WebSocket notifications
   - Stream processing
   - Live dashboards

4. **Enhanced AI**
   - Computer vision for documents
   - Natural language understanding
   - Automated data validation

---

**Last Updated**: 2025-01-15
