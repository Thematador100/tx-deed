# AI-Driven Web Scraping Engine - Architecture Documentation

## System Overview

This document provides a comprehensive overview of the architecture, design decisions, and implementation details of the AI-Driven Web Scraping Engine.

## Table of Contents

1. [High-Level Architecture](#high-level-architecture)
2. [Component Details](#component-details)
3. [Data Flow](#data-flow)
4. [Scalability](#scalability)
5. [Security](#security)
6. [Performance Optimization](#performance-optimization)

## High-Level Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         Client Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │  Web Client  │  │  API Client  │  │  CLI Client  │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                         API Layer                                 │
│                    Fastify REST API                               │
│  ┌────────────────────────────────────────────────────┐          │
│  │  Routes: /scrape, /extract, /schedule, /stats      │          │
│  │  Middleware: CORS, Rate Limiting, Auth, Validation │          │
│  └────────────────────────────────────────────────────┘          │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                    Job Queue Layer (BullMQ)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐             │
│  │  Scraping   │  │ Extraction  │  │  Monitoring │             │
│  │   Queue     │  │   Queue     │  │    Queue    │             │
│  └─────────────┘  └─────────────┘  └─────────────┘             │
│                    Redis Backend                                 │
└────────────────────────────┬─────────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Orchestration Layer                             │
│                   ScrapingOrchestrator                            │
│  ┌──────────────────────────────────────────────────┐           │
│  │  Job Routing │ Workflow Management │ Coordination│           │
│  └──────────────────────────────────────────────────┘           │
└─────────┬────────────────────────────────────────────────────────┘
          │
          ├─────────────┬─────────────┬─────────────┬──────────────┐
          ▼             ▼             ▼             ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   Browser    │ │    AI    │ │  Proxy   │ │   Rate   │ │   Data   │
│   Manager    │ │ Extraction│ │ Manager  │ │ Limiter  │ │ Pipeline │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
       │               │             │             │            │
       ▼               ▼             ▼             ▼            ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│  Puppeteer   │ │ Anthropic│ │ Proxies  │ │Bottleneck│ │PostgreSQL│
│  Playwright  │ │  OpenAI  │ │  Pool    │ │          │ │ MongoDB  │
└──────────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘
```

## Component Details

### 1. Browser Manager

**Responsibility**: Manages browser lifecycle, implements anti-detection techniques

**Key Features**:
- Browser pool management with configurable limits
- Puppeteer-extra with stealth plugins
- Browser fingerprint randomization
- User agent rotation
- Proxy integration per browser instance
- Automatic cleanup and resource management

**Anti-Detection Techniques**:
```javascript
- WebDriver flag concealment
- Navigator property spoofing
- Plugin/MIME type mocking
- Canvas/WebGL fingerprint randomization
- Mouse movement simulation
- Random delays between actions
- Timezone and locale randomization
```

**Architecture**:
```
BrowserManager
  ├─ Browser Pool (Map<id, BrowserInstance>)
  ├─ Fingerprint Generator
  ├─ Stealth Plugins
  └─ Resource Monitor
```

### 2. AI Extraction Engine

**Responsibility**: Intelligent data extraction using LLMs

**Supported Providers**:
- Anthropic Claude (claude-3-5-sonnet)
- OpenAI GPT-4

**Extraction Methods**:

1. **Schema-Based Extraction**:
   - User provides schema
   - AI extracts data matching schema structure
   - Type validation and coercion

2. **Property-Specific Extraction**:
   - Pre-defined schema for real estate/tax deed data
   - Optimized prompts for property extraction
   - Structured output guaranteed

3. **Entity Recognition**:
   - Automatic entity extraction (people, orgs, locations, dates, amounts)
   - No schema required

4. **Classification**:
   - Page type classification
   - Content categorization
   - Confidence scoring

**Caching Strategy**:
- LRU cache for extraction results
- Cache key: hash(html + schema)
- Configurable TTL

**Architecture**:
```
AIExtractionEngine
  ├─ Provider Clients (Anthropic/OpenAI)
  ├─ Prompt Templates
  ├─ Schema Validator
  ├─ Response Parser
  └─ Cache Manager
```

### 3. Proxy Manager

**Responsibility**: Proxy rotation, health monitoring, failover

**Supported Providers**:
- BrightData (residential/datacenter)
- Oxylabs (residential/datacenter)
- Smartproxy
- Custom proxy lists (HTTP/SOCKS)

**Rotation Strategies**:
1. **Round-Robin**: Sequential rotation
2. **Random**: Random selection
3. **Least-Used**: Balance based on usage count

**Health Monitoring**:
- Periodic health checks (configurable interval)
- Automatic proxy marking (healthy/unhealthy)
- Failure threshold tracking
- Automatic failover on failures

**Features**:
- Per-proxy statistics (requests, success rate)
- IP rotation on demand
- Proxy authentication handling
- Geographic targeting (where supported)

**Architecture**:
```
ProxyManager
  ├─ Proxy Pool (Array<ProxyInstance>)
  ├─ Health Checker
  ├─ Usage Statistics
  ├─ Rotation Strategy
  └─ Provider Integrations
```

### 4. Job Queue System

**Responsibility**: Distributed job processing, scheduling, retries

**Technology**: BullMQ + Redis

**Queue Types**:
- `scraping`: General scraping jobs
- `extraction`: AI extraction jobs
- `monitoring`: Monitoring/health checks

**Job Lifecycle**:
```
Created → Waiting → Active → Completed/Failed
                      ↓
                   Retrying (if failed)
```

**Features**:
- Priority-based processing (critical > high > normal > low)
- Automatic retries with exponential backoff
- Job scheduling (cron patterns)
- Concurrency control
- Job progress tracking
- Delayed jobs
- Recurring jobs

**Worker Architecture**:
```
Worker
  ├─ Job Processor
  ├─ Retry Logic
  ├─ Error Handler
  └─ Progress Reporter
```

### 5. Rate Limiter

**Responsibility**: Request throttling per domain

**Technology**: Bottleneck.js

**Features**:
- Per-domain rate limiting
- Configurable concurrent requests
- Minimum time between requests
- Request reservoir (quota-based limiting)
- Automatic queuing
- Priority support

**Configuration**:
```javascript
{
  maxConcurrent: 5,        // Max simultaneous requests
  minTime: 1000,           // Min ms between requests
  reservoir: 100,          // Max requests in time window
  reservoirRefreshAmount: 100,
  reservoirRefreshInterval: 60000  // Refresh every minute
}
```

### 6. Data Pipeline

**Responsibility**: Data storage, transformation, querying

**Storage Backends**:
1. **JSON Files**: Simple file-based storage
2. **PostgreSQL**: Relational database with JSONB
3. **MongoDB**: Document database
4. **Prisma**: ORM-based (supports multiple DBs)

**Features**:
- Batch processing with auto-flush
- Configurable batch size
- Automatic schema creation (PostgreSQL)
- Structured property data tables
- Query interface with filtering
- Data validation

**Schema (PostgreSQL)**:
```sql
scraping_results
  ├─ id (PK)
  ├─ url
  ├─ data (JSONB)
  ├─ metadata (JSONB)
  ├─ screenshot
  ├─ success
  └─ scraped_at

property_data
  ├─ id (PK)
  ├─ scraping_result_id (FK)
  ├─ address, city, state, zip
  ├─ parcel_id, apn
  ├─ owner information
  ├─ tax information
  └─ property details
```

### 7. Monitoring & Alerting

**Metrics (Prometheus)**:
- Scraping duration histogram
- Total scraping operations counter
- Error counters by type
- Active browser gauge
- Queue size gauge
- Proxy health gauge
- AI request counter
- AI cost counter

**Alerting Channels**:
1. **Email** (SMTP)
2. **SMS** (Twilio)
3. **Webhook** (HTTP POST)

**Alert Types**:
- High error rate
- Queue backlog
- Proxy failures
- System errors
- Storage issues
- AI quota exceeded

**Alert Severity Levels**:
- Low: Informational
- Medium: Warning
- High: Action required
- Critical: Immediate action

## Data Flow

### Standard Scraping Flow

```
1. Client Request
   ↓
2. API Validation
   ↓
3. Job Creation (BullMQ)
   ↓
4. Worker Picks Up Job
   ↓
5. Orchestrator Routes to Handlers
   ↓
6. Rate Limiter Check
   ↓
7. Browser Manager Creates Browser
   ↓
8. Proxy Manager Assigns Proxy
   ↓
9. Navigation & Data Collection
   ↓
10. AI Extraction (if configured)
   ↓
11. Data Pipeline Saves Result
   ↓
12. Metrics Recording
   ↓
13. Job Completion
   ↓
14. Client Receives Result
```

### Error Handling Flow

```
Error Occurs
   ↓
Retry Check (attempts < maxRetries)
   ├─ Yes → Exponential Backoff → Retry
   │
   └─ No → Mark Failed
            ↓
         Alert System
            ↓
         Log Error
            ↓
         Return Error to Client
```

## Scalability

### Horizontal Scaling

**Worker Scaling**:
```bash
# Run multiple workers on different machines
# All connect to same Redis instance

Machine 1: Worker(s) 1-5
Machine 2: Worker(s) 6-10
Machine 3: Worker(s) 11-15
```

**Database Scaling**:
- PostgreSQL: Replication, read replicas
- MongoDB: Sharding, replica sets
- Redis: Cluster mode, sentinels

### Vertical Scaling

**Resource Optimization**:
```javascript
{
  maxConcurrentBrowsers: 20,  // More browsers per instance
  queueConcurrency: 20,        // More concurrent jobs
  workerCount: 4               // Multiple workers per machine
}
```

### Performance Considerations

**Browser Pool**:
- Reuse browsers when possible
- Implement max lifetime
- Monitor memory usage
- Automatic cleanup

**Caching**:
- Cache AI extraction results
- Cache robots.txt checks
- Cache proxy health status
- LRU eviction policy

**Database**:
- Batch inserts
- Index optimization
- Periodic cleanup of old data

## Security

### Input Validation

- URL validation
- Schema validation (Zod)
- Request body size limits
- Rate limiting per client

### Anti-Detection

- Random fingerprints
- Proxy rotation
- User agent rotation
- Request timing randomization
- Mouse movement simulation

### Data Protection

- Environment variable configuration
- Secure credential storage
- HTTPS for external APIs
- Secure database connections

### API Security

- CORS configuration
- Rate limiting
- Request size limits
- Error message sanitization

## Performance Optimization

### Browser Optimization

```javascript
{
  headless: 'new',           // Faster than legacy
  blockResources: true,      // Block images/fonts
  defaultViewport: {         // Standard viewport
    width: 1920,
    height: 1080
  }
}
```

### Network Optimization

- Connection pooling
- Keep-alive connections
- Compression
- Resource blocking

### Memory Management

- Automatic browser cleanup
- Page closure after scraping
- Buffer flushing
- Cache size limits

### Database Optimization

- Batch writes
- Indexed queries
- Connection pooling
- Prepared statements

## Deployment Patterns

### Single Server

```
┌─────────────────────────┐
│   Single Server         │
│  ┌─────────┐            │
│  │   API   │            │
│  ├─────────┤            │
│  │ Workers │            │
│  ├─────────┤            │
│  │  Redis  │            │
│  ├─────────┤            │
│  │   DB    │            │
│  └─────────┘            │
└─────────────────────────┘
```

### Distributed

```
┌─────────────┐  ┌─────────────┐  ┌─────────────┐
│  API Server │  │ Worker Pool │  │ Worker Pool │
│    (Load    │  │   Server 1  │  │   Server 2  │
│   Balanced) │  └─────────────┘  └─────────────┘
└─────────────┘         │                 │
       │                └────────┬────────┘
       │                         │
    ┌──┴─────────────────────────┴──┐
    │      Shared Infrastructure     │
    │  ┌───────┐  ┌──────┐  ┌────┐ │
    │  │ Redis │  │  DB  │  │ S3 │ │
    │  └───────┘  └──────┘  └────┘ │
    └───────────────────────────────┘
```

## Monitoring Dashboard

### Grafana Dashboard Panels

1. **Scraping Metrics**
   - Requests per minute
   - Success rate
   - Average duration
   - Error rate by type

2. **System Resources**
   - CPU usage
   - Memory usage
   - Active browsers
   - Network I/O

3. **Queue Status**
   - Pending jobs
   - Active jobs
   - Completed jobs
   - Failed jobs

4. **Proxy Health**
   - Total proxies
   - Healthy proxies
   - Success rate
   - Top failures

5. **AI Usage**
   - API calls
   - Token usage
   - Cost tracking
   - Response times

## Future Enhancements

1. **Machine Learning**
   - Auto-selector generation
   - Anomaly detection
   - Adaptive rate limiting

2. **Advanced Features**
   - Playwright integration
   - CAPTCHA solving
   - Session persistence
   - Multi-region deployment

3. **Optimization**
   - Smart caching
   - Predictive scaling
   - Query optimization
   - Enhanced deduplication
