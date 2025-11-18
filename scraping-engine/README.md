# AI-Driven Web Scraping Engine

A sophisticated, production-ready web scraping and data acquisition system powered by AI for intelligent data extraction, featuring advanced anti-detection, distributed job queues, proxy rotation, and comprehensive monitoring.

## 🚀 Features

### Core Capabilities
- **AI-Powered Extraction**: Uses Claude/GPT-4 for intelligent structured data extraction
- **Advanced Anti-Detection**: Browser fingerprinting, stealth plugins, random user agents
- **Proxy Rotation**: Support for residential/datacenter proxies with health monitoring
- **Distributed Queue System**: BullMQ-based job queue with Redis for scalability
- **Multiple Storage Backends**: JSON, PostgreSQL, MongoDB, Prisma support
- **Rate Limiting**: Per-domain rate limiting and request throttling
- **Comprehensive Monitoring**: Prometheus metrics, Grafana dashboards
- **Real-time Alerting**: Email, SMS, webhook notifications
- **REST API**: Full-featured API for job submission and monitoring

### Advanced Features
- Browser pool management with automatic cleanup
- Robots.txt compliance checking
- Sitemap parsing and batch scraping
- Screenshot capture capability
- Dynamic JavaScript rendering
- CAPTCHA detection
- Session persistence
- Automatic retries with exponential backoff
- Data validation and schema enforcement

## 📋 Prerequisites

- Node.js 20+
- Redis 7+
- PostgreSQL 15+ or MongoDB 7+ (optional)
- Docker & Docker Compose (optional)

## 🛠️ Installation

### Standard Installation

```bash
# Clone the repository
git clone <repository-url>
cd scraping-engine

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Edit .env with your configuration
nano .env

# Start the engine
npm start
```

### Docker Installation

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f scraping-engine

# Stop services
docker-compose down
```

## ⚙️ Configuration

### Environment Variables

Key configuration variables in `.env`:

```bash
# AI Configuration
ANTHROPIC_API_KEY=your_key_here
AI_PROVIDER=anthropic
AI_MODEL=claude-3-5-sonnet-20241022

# Storage
STORAGE_TYPE=postgres  # json, postgres, mongodb, prisma
POSTGRES_HOST=localhost
POSTGRES_DB=scraping

# Proxies
BRIGHTDATA_USERNAME=your_username
BRIGHTDATA_PASSWORD=your_password

# Rate Limiting
MAX_CONCURRENT=5
MIN_TIME_BETWEEN_REQUESTS=1000
```

See `.env.example` for full configuration options.

## 🎯 Usage

### Programmatic Usage

```javascript
import ScrapingEngine from './index.js';

const engine = new ScrapingEngine();
await engine.start();

// Scrape single page
const job = await engine.scrape('https://example.com', {
  extractionMethod: 'ai',
  extractionType: 'property',
  screenshot: true
});

console.log(`Job queued: ${job.id}`);

// Check status
const status = await engine.getJobStatus(job.id);
console.log(status);

// Scrape multiple pages
await engine.scrapeMultiple([
  'https://example.com/page1',
  'https://example.com/page2'
], {
  concurrency: 3
});

// Extract property data
await engine.extractPropertyData('https://taxdeed.example.com', {
  save: true,
  collection: 'properties'
});
```

### REST API Usage

Start the API server:

```bash
npm run api
```

#### Submit Scraping Job

```bash
curl -X POST http://localhost:3001/api/scrape/single \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://example.com",
    "config": {
      "extractionMethod": "ai",
      "screenshot": true
    }
  }'
```

#### Get Job Status

```bash
curl http://localhost:3001/api/jobs/{jobId}
```

#### Extract Property Data

```bash
curl -X POST http://localhost:3001/api/extract/property \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://taxdeed.example.com/property/12345",
    "config": {
      "save": true,
      "collection": "properties"
    }
  }'
```

#### Schedule Recurring Job

```bash
curl -X POST http://localhost:3001/api/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "jobData": {
      "type": "scrape_single",
      "url": "https://example.com"
    },
    "cronPattern": "0 */6 * * *"
  }'
```

#### Get System Stats

```bash
curl http://localhost:3001/api/stats
```

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        REST API Layer                        │
│                    (Fastify - Port 3001)                     │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                    Job Queue Manager                         │
│                  (BullMQ + Redis)                            │
└──────────────────────────┬──────────────────────────────────┘
                           │
┌──────────────────────────┴──────────────────────────────────┐
│                  Scraping Orchestrator                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Browser   │ │     AI      │ │    Rate     │           │
│  │   Manager   │ │  Extraction │ │   Limiter   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │    Proxy    │ │    Data     │ │  Monitoring │           │
│  │   Manager   │ │  Pipeline   │ │  & Alerts   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### Components

#### Browser Manager
- Creates and manages Puppeteer browser instances
- Implements stealth techniques and fingerprint spoofing
- Handles proxy authentication
- Pool-based resource management

#### AI Extraction Engine
- Integrates with Anthropic Claude and OpenAI
- Intelligent schema-based data extraction
- Property-specific extraction models
- Entity recognition and classification

#### Proxy Manager
- Supports multiple proxy providers (BrightData, Oxylabs, Smartproxy)
- Health monitoring and automatic failover
- Round-robin, random, and least-used rotation strategies
- IP rotation on demand

#### Job Queue
- BullMQ-powered distributed queue
- Priority-based job scheduling
- Automatic retries with exponential backoff
- Recurring job support (cron patterns)

#### Data Pipeline
- Multiple storage backends
- Batch processing with auto-flush
- Structured property data storage
- Query interface for data retrieval

#### Monitoring System
- Prometheus metrics export
- Grafana dashboard integration
- Real-time alerting (Email/SMS/Webhook)
- Performance tracking

## 📊 Monitoring

Access monitoring dashboards:

- **Prometheus**: http://localhost:9090
- **Grafana**: http://localhost:3000 (admin/admin)
- **Metrics Endpoint**: http://localhost:3001/metrics

### Key Metrics

- `scraping_duration_seconds` - Scraping operation duration
- `scraping_total` - Total scraping operations
- `scraping_errors_total` - Total errors by type
- `active_browsers` - Active browser instances
- `queue_size` - Queue size by status
- `proxy_health` - Healthy proxy count
- `ai_requests_total` - AI API requests
- `ai_cost_total` - AI API costs

## 🔐 Security

### Anti-Detection Features
- Browser fingerprint randomization
- User agent rotation
- WebGL/Canvas fingerprint spoofing
- Plugin simulation
- Mouse movement simulation
- Randomized request timing

### Best Practices
- Always use proxies for production scraping
- Respect robots.txt (enabled by default)
- Implement appropriate rate limiting
- Monitor proxy health regularly
- Rotate user agents frequently

## 📈 Scaling

### Horizontal Scaling

Run multiple workers:

```bash
# Worker 1
npm run worker

# Worker 2 (different machine)
npm run worker
```

All workers connect to the same Redis instance and process jobs from the queue.

### Vertical Scaling

Adjust concurrency settings:

```bash
MAX_CONCURRENT_BROWSERS=10
QUEUE_CONCURRENCY=10
MAX_CONCURRENT=10
```

## 🐛 Troubleshooting

### Browser Issues

If browsers fail to launch:

```bash
# Install missing dependencies
sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 \
  libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 \
  libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 \
  libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 \
  libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates \
  fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
```

### Memory Issues

Reduce concurrent browsers:

```bash
MAX_CONCURRENT_BROWSERS=3
QUEUE_CONCURRENCY=3
```

### Proxy Issues

Check proxy health:

```bash
curl http://localhost:3001/api/proxies/stats
```

## 📚 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/metrics` | Prometheus metrics |
| POST | `/api/scrape/single` | Scrape single URL |
| POST | `/api/scrape/multiple` | Scrape multiple URLs |
| POST | `/api/scrape/sitemap` | Scrape sitemap |
| POST | `/api/extract/property` | Extract property data |
| POST | `/api/schedule` | Schedule recurring job |
| GET | `/api/jobs/:jobId` | Get job status |
| POST | `/api/jobs/:jobId/retry` | Retry failed job |
| DELETE | `/api/jobs/:jobId` | Remove job |
| GET | `/api/queues/stats` | Get queue stats |
| GET | `/api/browsers/stats` | Get browser stats |
| GET | `/api/proxies/stats` | Get proxy stats |
| GET | `/api/data` | Query scraped data |
| GET | `/api/stats` | System statistics |

## 🤝 Integration Examples

### Integration with Frontend

```javascript
// React example
const scrapeProperty = async (url) => {
  const response = await fetch('http://localhost:3001/api/extract/property', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      config: {
        save: true,
        collection: 'properties'
      }
    })
  });

  const { jobId } = await response.json();

  // Poll for results
  const checkStatus = async () => {
    const statusRes = await fetch(`http://localhost:3001/api/jobs/${jobId}`);
    const { job } = await statusRes.json();

    if (job.state === 'completed') {
      return job.returnvalue;
    } else if (job.state === 'failed') {
      throw new Error(job.failedReason);
    }

    await new Promise(r => setTimeout(r, 1000));
    return checkStatus();
  };

  return checkStatus();
};
```

### Webhook Integration

Configure webhook alerts:

```bash
ALERT_WEBHOOK_ENABLED=true
ALERT_WEBHOOK_URL=https://your-webhook-endpoint.com/alerts
```

The system will POST JSON to your endpoint:

```json
{
  "type": "high_error_rate",
  "severity": "high",
  "title": "High Error Rate Detected",
  "message": "Error rate is 15.23% over the last 60 minutes",
  "timestamp": "2025-01-15T10:30:00Z"
}
```

## 📝 License

MIT

## 🙋 Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: See this README and inline code comments

## 🔄 Updates & Roadmap

### Current Version: 1.0.0

### Planned Features
- Playwright support alongside Puppeteer
- Machine learning for extraction optimization
- Enhanced CAPTCHA solving integration
- WebSocket API for real-time updates
- Advanced data deduplication
- Enhanced caching strategies
- Multi-region deployment support
