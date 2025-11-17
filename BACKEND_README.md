# Win With Deeds - Backend Intelligence Platform

## 🏆 Overview

Enterprise-grade property intelligence platform with institutional-level analytics, anti-blocking infrastructure, and multi-API integration with cost optimization.

### Key Features

- **Anti-Blocking Infrastructure**: Rotating proxies, user-agent spoofing, rate limiting, CAPTCHA handling
- **Multi-API Integration**: Automatically selects cheapest API provider with fallback mechanisms
- **Melissa Data Integration**: Prepaid license integration for property enrichment
- **Distressed Property Detection**: ML-style scoring with 20+ distress signals
- **Quantitative Models**: Hedge fund level analytics (Monte Carlo, Sharpe Ratio, CMA, Portfolio Optimization)
- **Goldman Sachs Quality Reports**: Institutional-grade investment dossiers
- **Web Scraping Engine**: Anti-detection scraping for county websites

---

## 📋 Table of Contents

1. [Architecture](#architecture)
2. [Setup](#setup)
3. [Configuration](#configuration)
4. [API Integrations](#api-integrations)
5. [Usage](#usage)
6. [Anti-Blocking Features](#anti-blocking-features)
7. [Analytics Models](#analytics-models)
8. [Cost Optimization](#cost-optimization)
9. [Troubleshooting](#troubleshooting)

---

## 🏗 Architecture

```
backend/
├── config/
│   └── config.js              # Centralized configuration management
├── services/
│   ├── ProxyManager.js        # Proxy rotation (BrightData, Oxylabs, SmartProxy)
│   ├── UserAgentRotator.js   # User-agent rotation
│   ├── RateLimiter.js         # Token bucket rate limiting
│   ├── AntiBlockingHttpClient.js  # HTTP client with anti-blocking
│   ├── MultiAPIClient.js     # Multi-API integration with cost optimization
│   └── MelissaDataClient.js  # Melissa Data API integration
├── analytics/
│   ├── DistressedPropertyDetector.js  # Distress signal analysis
│   └── QuantitativeModels.js # Quant models (Monte Carlo, Sharpe, CMA, etc.)
├── reports/
│   └── InstitutionalReportGenerator.js  # Goldman Sachs quality reports
├── scrapers/
│   └── WebScraperEngine.js   # Anti-detection web scraping
├── scripts/
│   ├── analyze-property.js   # CLI property analysis
│   ├── scrape-county.js      # CLI county scraping
│   └── batch-analysis.js     # Batch processing
└── index.js                   # Main orchestrator
```

---

## 🚀 Setup

### Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- API keys for services (see Configuration section)

### Installation

```bash
cd backend
npm install
```

### Environment Configuration

1. Copy the example environment file:

```bash
cp ../.env.example ../.env
```

2. Edit `.env` and add your API keys:

```env
# Melissa Data (REQUIRED - you have prepaid license)
MELISSA_DATA_LICENSE_KEY=your_melissa_data_license_key_here

# Proxy Services (choose one or more)
BRIGHT_DATA_USERNAME=your_brightdata_username
BRIGHT_DATA_PASSWORD=your_brightdata_password

# API Keys (add as many as you want for cost optimization)
ATTOM_API_KEY=your_attom_api_key_here
PROPSTREAM_API_KEY=your_propstream_api_key_here
REGRID_API_KEY=your_regrid_api_key_here

# DeepSeek AI
DEEPSEEK_API_KEY=your_deepseek_api_key_here
```

---

## ⚙️ Configuration

### Proxy Configuration

The system supports multiple proxy providers:

1. **BrightData** (Recommended for residential IPs)
2. **Oxylabs** (High-quality residential proxies)
3. **SmartProxy** (Budget-friendly option)

Configure in `.env`:

```env
PROXY_PROVIDER=brightdata  # Options: brightdata, oxylabs, smartproxy, all
PROXY_ROTATION_ENABLED=true
PROXY_ROTATION_INTERVAL=300000  # 5 minutes
```

### Rate Limiting

Prevent being flagged as a bot:

```env
RATE_LIMIT_REQUESTS_PER_MINUTE=10
RATE_LIMIT_REQUESTS_PER_HOUR=100
RATE_LIMIT_CONCURRENT_REQUESTS=5
```

### Scraping Configuration

```env
SCRAPING_ENABLED=true
SCRAPING_HEADLESS=true  # Run browser in headless mode
SCRAPING_TIMEOUT=30000  # 30 seconds
SCRAPING_RETRY_ATTEMPTS=3
SCRAPING_RETRY_DELAY=5000
```

---

## 🔌 API Integrations

### Primary: Melissa Data (Prepaid License)

**Priority**: Highest (uses your prepaid license)

**Capabilities**:
- Address validation and standardization
- Property demographics
- Geocoding
- Census data

**Cost**: $0.10 per request (prepaid)

### Fallback APIs (Cost Optimization)

The system automatically selects the cheapest available API:

1. **Regrid** - $0.08/request (Cheapest)
   - Parcel data
   - Property boundaries

2. **Melissa Data** - $0.10/request (Your prepaid license)
   - Address enrichment
   - Demographics

3. **PropStream** - $0.12/request
   - Comprehensive property data
   - Owner information

4. **Attom Data** - $0.15/request
   - Property characteristics
   - Sales history

5. **CoreLogic** - $0.20/request (Most expensive, highest quality)
   - Professional-grade data
   - Valuation models

### Cost Optimization Settings

```env
API_COST_OPTIMIZATION_ENABLED=true
API_FALLBACK_ORDER=melissa,attom,corelogic,propstream,regrid
```

---

## 💻 Usage

### 1. Analyze a Single Property

```javascript
import backend from './index.js';

const analysis = await backend.analyzeProperty('123 Main St, Austin, TX 78701');

console.log(analysis.report.executiveSummary);
// Output:
// {
//   recommendation: 'STRONG BUY',
//   rating: '4.5',
//   distressScore: 75,
//   upside: 35.2%,
//   sharpeRatio: 2.3
// }
```

**CLI:**

```bash
node scripts/analyze-property.js "123 Main St, Austin, TX 78701"
```

### 2. Batch Analyze Multiple Properties

```javascript
const addresses = [
  '123 Main St, Austin, TX 78701',
  '456 Oak Ave, Houston, TX 77001',
  '789 Pine Rd, Dallas, TX 75201'
];

const { results, errors } = await backend.batchAnalyzeProperties(addresses);

console.log(`Analyzed ${results.length} properties`);
```

### 3. Scrape County Tax Sales

```javascript
const result = await backend.scrapeCountyTaxSales('Travis', 'TX');

console.log(`Found ${result.properties.length} properties`);
```

**CLI:**

```bash
node scripts/scrape-county.js Travis TX
```

### 4. Get System Statistics

```javascript
const stats = backend.getSystemStats();

console.log(stats);
// Output:
// {
//   proxy: { totalProxies: 3, failedProxies: 0, ... },
//   multiAPI: { totalRequests: 150, totalCost: 15.50, ... },
//   distressDetector: { propertiesAnalyzed: 150, distressedFound: 42, ... }
// }
```

---

## 🛡️ Anti-Blocking Features

### 1. Proxy Rotation

Automatically rotates through residential proxies to avoid IP blocking:

```javascript
import proxyManager from './services/ProxyManager.js';

// Get current proxy
const proxy = proxyManager.getCurrentProxy();

// Force rotation
proxyManager.rotateProxy();

// Mark proxy as failed (auto-rotates)
proxyManager.markProxyAsFailed();
```

### 2. User-Agent Rotation

Rotates through 14+ real browser user agents:

```javascript
import userAgentRotator from './services/UserAgentRotator.js';

// Get random user-agent
const ua = userAgentRotator.getRandomUserAgent();

// Get default headers (includes realistic browser headers)
const headers = userAgentRotator.getDefaultHeaders();
```

### 3. Rate Limiting

Prevents rate limit violations using token bucket algorithm:

```javascript
import rateLimiter from './services/RateLimiter.js';

// Execute with rate limiting
await rateLimiter.executeWithRateLimit(async () => {
  // Your API call here
});
```

### 4. Anti-Detection Web Scraping

Puppeteer with stealth plugin to avoid bot detection:

```javascript
import webScraperEngine from './scrapers/WebScraperEngine.js';

const result = await webScraperEngine.scrapeUrl('https://example.com', {
  selector: '.property-listing',
  waitFor: '.property-listing',
  extractData: () => {
    // Custom extraction logic
  }
});
```

**Features**:
- Stealth mode (puppeteer-extra-plugin-stealth)
- Random mouse movements
- Realistic viewport sizes
- WebDriver property override
- Plugin fingerprinting evasion

---

## 📊 Analytics Models

### 1. Distressed Property Detection

Analyzes 20+ distress signals:

```javascript
import distressedPropertyDetector from './analytics/DistressedPropertyDetector.js';

const analysis = await distressedPropertyDetector.analyzeProperty(property);

// Output:
// {
//   distressScore: 75,
//   classification: 'high',
//   urgency: 'critical',
//   signals: [
//     { type: 'taxDelinquency', confidence: 0.95 },
//     { type: 'foreclosure', confidence: 0.98 }
//   ],
//   recommendations: [...]
// }
```

**Distress Signals**:
- Tax delinquency
- Foreclosure status
- Code violations
- Absentee owner
- Probate/estate
- Divorce
- Bankruptcy
- Extended vacancy
- Multiple price reductions
- Below-market pricing
- +10 more...

### 2. Monte Carlo Simulation

Simulates 10,000 investment scenarios:

```javascript
import quantitativeModels from './analytics/QuantitativeModels.js';

const simulation = await quantitativeModels.runMonteCarloSimulation(property, {
  purchasePrice: 250000,
  rehabCost: 50000,
  holdingPeriod: 24,
  monthlyRent: 2000
});

// Output:
// {
//   roi: {
//     mean: 22.5,
//     median: 21.3,
//     stdDev: 8.4,
//     percentile25: 15.2,
//     percentile75: 28.9
//   },
//   probability: {
//     profitableOutcomes: 0.85,
//     roi10PercentPlus: 0.78,
//     roi20PercentPlus: 0.52
//   }
// }
```

### 3. Risk-Adjusted Returns (Sharpe Ratio)

Calculates investment quality:

```javascript
const riskAdjusted = quantitativeModels.calculateRiskAdjustedReturn(property, marketData);

// Output:
// {
//   expectedReturn: 0.15,
//   volatility: 0.08,
//   sharpeRatio: 2.3,
//   classification: 'Very Good'
// }
```

**Sharpe Ratio Scale**:
- > 3.0: Exceptional
- > 2.0: Very Good
- > 1.0: Good
- > 0: Acceptable
- < 0: Poor

### 4. Comparative Market Analysis (CMA)

K-Nearest Neighbors algorithm:

```javascript
const cma = await quantitativeModels.performCMA(targetProperty, comparables, 5);

// Output:
// {
//   estimatedValue: 285000,
//   priceRange: { min: 260000, max: 310000 },
//   comparables: [
//     { address: '...', price: 275000, similarity: '92.5%' }
//   ],
//   confidenceScore: 0.89
// }
```

### 5. Portfolio Optimization

Modern Portfolio Theory for multi-property portfolios:

```javascript
const portfolio = await quantitativeModels.optimizePortfolio(properties);

// Output:
// {
//   weights: [
//     { property: '123 Main St', allocation: '35%' },
//     { property: '456 Oak Ave', allocation: '25%' }
//   ],
//   portfolioReturn: '12.5%',
//   portfolioRisk: '6.8%',
//   sharpeRatio: '1.85'
// }
```

---

## 💰 Cost Optimization

### How It Works

1. **API Ranking**: APIs ranked by cost per request
2. **Automatic Selection**: System selects cheapest available API
3. **Fallback Chain**: If one fails, tries next cheapest
4. **Cost Tracking**: Monitors total spend across all APIs

### Example Cost Savings

Traditional approach (using only Attom Data):
- 1,000 requests × $0.15 = **$150.00**

With cost optimization (auto-selects cheapest):
- 700 requests × $0.08 (Regrid) = $56.00
- 200 requests × $0.10 (Melissa) = $20.00
- 100 requests × $0.15 (Attom fallback) = $15.00
- **Total: $91.00** (39% savings)

### Cost Monitoring

```javascript
const stats = multiAPIClient.getStats();

console.log(`Total cost: $${stats.totalCost.toFixed(2)}`);
console.log(`Average cost per request: $${stats.averageCost}`);
console.log('Cost by provider:', stats.costByProvider);
```

---

## 📈 Goldman Sachs Quality Reports

Generate institutional-grade investment dossiers:

```javascript
import reportGenerator from './reports/InstitutionalReportGenerator.js';

const report = await reportGenerator.generateInvestmentDossier(property, marketData);

// Report Sections:
// - Executive Summary
// - Investment Thesis
// - Property Overview
// - Market Analysis
// - Financial Analysis
// - Risk Analysis
// - Valuation Analysis
// - Monte Carlo Simulation
// - Distress Analysis
// - Recommended Actions
// - Conclusion
```

**Report Quality**:
- Investment rating (1-5 stars)
- Buy/Sell/Hold recommendation
- Risk matrices
- Financial projections (1, 3, 5, 10 years)
- Stress testing scenarios
- Detailed recommendations with timelines

---

## 🔧 Troubleshooting

### Issue: API calls being blocked

**Solution**: Enable proxy rotation

```env
PROXY_ROTATION_ENABLED=true
PROXY_PROVIDER=brightdata
```

### Issue: Rate limit exceeded

**Solution**: Adjust rate limits

```env
RATE_LIMIT_REQUESTS_PER_MINUTE=5  # Reduce from 10
RATE_LIMIT_REQUESTS_PER_HOUR=50   # Reduce from 100
```

### Issue: Melissa Data not working

**Solution**: Verify license key

```bash
node -e "import('./services/MelissaDataClient.js').then(m => m.default.getPropertyData('123 Main St, Austin, TX').then(console.log))"
```

### Issue: Web scraping detected

**Solution**:
1. Enable headless mode: `SCRAPING_HEADLESS=true`
2. Increase delays: `SCRAPING_RETRY_DELAY=10000`
3. Enable proxy: `PROXY_ROTATION_ENABLED=true`

### Issue: High API costs

**Solution**: Enable cost optimization

```env
API_COST_OPTIMIZATION_ENABLED=true
API_FALLBACK_ORDER=regrid,melissa,propstream,attom,corelogic
```

---

## 📞 Support

For issues or questions:
1. Check configuration in `.env`
2. Review system stats: `backend.getSystemStats()`
3. Check logs for error messages
4. Verify API keys are valid

---

## 🎯 Competing with TaxSaleResources.com

This platform matches or exceeds TaxSaleResources.com capabilities:

| Feature | TaxSaleResources.com | Win With Deeds |
|---------|---------------------|----------------|
| Tax Sale Tracking | ✓ | ✓ |
| County Coverage | National | National |
| Distressed Property Detection | Basic | **Advanced** (20+ signals) |
| Investment Analysis | Basic | **Quant Models** (Jim Simons level) |
| Reports | Standard | **Goldman Sachs Quality** |
| Anti-Blocking | Unknown | **Advanced** (Proxy rotation, stealth) |
| Cost Optimization | N/A | **Multi-API with auto-selection** |
| API Access | Limited | **Multiple providers** |

**Key Advantages**:
- Institutional-grade analytics
- Cost-optimized API usage
- Advanced anti-blocking
- Professional reports
- Quantitative models
- Multi-source data integration

---

## 📄 License

PROPRIETARY - All Rights Reserved

---

**Built to compete at the institutional level. 🏆**
