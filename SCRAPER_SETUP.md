# Web Scraper System - Setup & Usage Guide

## Overview

This document describes the state-of-the-art web scraping system for automatically collecting property data from county tax deed auction websites. The system is designed to be robust, undetectable, and capable of handling sophisticated anti-scraping measures.

## 🚀 Features

### **Advanced Anti-Detection**
- **Puppeteer Stealth Plugin** - Makes the browser undetectable to anti-bot systems
- **Rotating User Agents** - Random, realistic browser fingerprints
- **Human-Like Behavior** - Mouse movements, scrolling, random delays
- **WebRTC & Canvas Protection** - Prevents fingerprinting
- **Request Throttling** - Respectful rate limiting

### **Multi-Platform Support**
Adapts to different county website platforms:
- **Civicsource** - Used by many counties
- **Realauction** - Common auction platform
- **Grant Street Group** - Pennsylvania and other states
- **Custom Sites** - Configurable selectors for any county

### **Smart Data Extraction**
- Pattern recognition for addresses, parcel IDs, dates, and currency
- Automatic data normalization and validation
- Duplicate detection
- Fallback strategies for missing data

### **Production-Ready**
- Queue system with concurrency control
- Automatic retry logic with exponential backoff
- Comprehensive error handling and logging
- Cron-based scheduling
- Database integration with Supabase
- Admin dashboard for monitoring

## 📋 Prerequisites

### System Requirements
- **Node.js** 18+ (for ES modules support)
- **Chrome/Chromium** browser (auto-installed with Puppeteer)
- **4GB+ RAM** (for running multiple browser instances)
- **Supabase** database (or PostgreSQL)

### Required Environment Variables

Create a `.env` file in the project root:

```env
# Supabase Configuration
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_role_key  # NOT the anon key!

# Scraper Configuration
PORT=3001
MAX_CONCURRENT_SCRAPERS=3
SCRAPER_SCHEDULE=0 2 * * *  # 2 AM daily (cron format)
AUTO_START_SCHEDULER=false  # Set to 'true' for auto-start

# Optional: Proxy Configuration
# USE_PROXY=true
# PROXY_URL=http://your-proxy:port
```

## 🛠️ Installation

### 1. Install Dependencies

```bash
npm install
```

This installs:
- `puppeteer` - Headless browser automation
- `puppeteer-extra` - Plugin system
- `puppeteer-extra-plugin-stealth` - Anti-detection
- `cheerio` - HTML parsing
- `axios` - HTTP client
- `user-agents` - Realistic user agent rotation
- `cron` - Task scheduling
- `express` - API server
- `cors` - Cross-origin support

### 2. Install Chrome/Chromium

Puppeteer will attempt to download Chrome automatically. If it fails:

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get install chromium-browser

# CentOS/RHEL
sudo yum install chromium
```

**macOS:**
```bash
brew install chromium
```

**Windows:**
Download from [https://www.chromium.org/getting-involved/download-chromium](https://www.chromium.org/getting-involved/download-chromium)

### 3. Database Setup

The scraper requires two database tables:

#### `properties` table
This should already exist, but ensure it has these columns:
- `parcel_id` (text)
- `address` (text)
- `city` (text)
- `state` (text)
- `zip` (text)
- `owner` (text)
- `price` (numeric)
- `starting_bid` (numeric)
- `estimated_value` (numeric)
- `auction_date` (date)
- `property_type` (text)
- `bedrooms` (integer)
- `bathrooms` (numeric)
- `sqft` (integer)
- `status` (text)
- `listing_type` (text)
- `source` (text)
- `source_state` (text)
- `scraped_at` (timestamp)
- `metadata` (jsonb)

#### `scraper_runs` table (NEW)
Create this table for tracking scraper runs:

```sql
CREATE TABLE scraper_runs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  platform_type TEXT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status TEXT NOT NULL, -- 'running', 'completed', 'failed'
  items_scraped INTEGER DEFAULT 0,
  items_saved INTEGER DEFAULT 0,
  errors JSONB,
  duration_ms INTEGER,
  stats JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_scraper_runs_county ON scraper_runs(county, state);
CREATE INDEX idx_scraper_runs_created_at ON scraper_runs(created_at DESC);
```

## 🚀 Running the Scraper System

### Start the Scraper Server

```bash
node server/index.js
```

The server will:
1. Initialize the scraper manager
2. Start the API server on port 3001 (or PORT env var)
3. Optionally start the scheduler (if AUTO_START_SCHEDULER=true)

You should see:
```
[Server] Starting scraper server...
[ScraperManager] Initializing...
[ScraperManager] Ready
[Server] API server listening on port 3001
[Server] Health check: http://localhost:3001/health
```

### Keep Running with PM2 (Production)

For production, use PM2 to keep the scraper running:

```bash
# Install PM2
npm install -g pm2

# Start scraper
pm2 start server/index.js --name "scraper-server"

# View logs
pm2 logs scraper-server

# Monitor
pm2 monit

# Auto-restart on server reboot
pm2 startup
pm2 save
```

## 📡 API Endpoints

The scraper server provides a REST API:

### Health Check
```
GET /health
```

### Get Status
```
GET /api/scrapers/status
Response: {
  isRunning: boolean,
  schedulerActive: boolean,
  queueLength: number,
  runningJobs: number,
  runningJobDetails: []
}
```

### Get Statistics
```
GET /api/scrapers/stats
Response: {
  manager: { ... },
  database: { ... }
}
```

### Scrape All Counties
```
POST /api/scrapers/scrape-all
Response: {
  message: "Scraping started",
  status: { ... }
}
```

### Scrape Specific County
```
POST /api/scrapers/scrape/:countyId
Example: POST /api/scrapers/scrape/harris-tx
```

### Start Scheduler
```
POST /api/scrapers/scheduler/start
```

### Stop Scheduler
```
POST /api/scrapers/scheduler/stop
```

### Clear History
```
POST /api/scrapers/clear-history
```

## 🎛️ Admin Dashboard

Access the admin dashboard at:
```
http://localhost:3000/admin/scrapers
```

Features:
- Real-time status monitoring
- Start/stop individual scrapes
- Scheduler control
- View statistics and recent runs
- See running jobs

## ⚙️ Configuration

### Adding New Counties

Edit `server/config/counties.config.js`:

```javascript
'new-county-id': {
  name: 'County Name',
  state: 'TX',
  defaultCity: 'Default City',
  url: 'https://county-tax-site.gov',
  platformType: 'custom', // or 'civicsource', 'realauction', 'grantstreet'
  active: true,

  // For custom scrapers, provide selectors:
  selectors: {
    container: '.property-row',
    fields: {
      parcel_id: '.parcel',
      address: '.address',
      opening_bid: '.bid',
      // ... etc
    }
  }
},
```

### Platform Types

**civicsource**
- Used by many counties
- Typical URL patterns: Contains "qpublic", "civicsource", or similar
- Auto-detects common table structures

**realauction**
- Used for online auctions
- Handles AJAX-loaded content
- Supports lazy loading with auto-scroll

**grantstreet**
- Common in Pennsylvania
- Often uses iframes
- Bid4assets integration

**custom**
- Requires selector configuration
- Most flexible option
- Use when county site doesn't match other platforms

### Adjusting Concurrency

To run more/fewer scrapers simultaneously:

```env
MAX_CONCURRENT_SCRAPERS=5  # Default is 3
```

**Considerations:**
- More concurrent = faster but higher resource usage
- More concurrent = higher chance of IP blocking
- Recommended: 2-5 concurrent scrapers

### Scheduling

The scraper uses cron syntax for scheduling:

```env
# Format: minute hour day month day-of-week
SCRAPER_SCHEDULE=0 2 * * *    # 2 AM daily
SCRAPER_SCHEDULE=0 */6 * * *  # Every 6 hours
SCRAPER_SCHEDULE=0 0 * * 0    # Weekly on Sunday midnight
```

## 🔧 Troubleshooting

### Scraper Not Connecting

**Error:** Connection refused to localhost:3001

**Solution:**
1. Ensure scraper server is running: `node server/index.js`
2. Check PORT environment variable
3. Update `VITE_SCRAPER_API_URL` in frontend .env

### Chrome Download Fails

**Error:** Failed to set up chrome-headless-shell

**Solution:**
```bash
# Set environment variable to skip download
export PUPPETEER_SKIP_DOWNLOAD=true

# Install Chromium manually (see Installation section)

# Or use system Chrome
export PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

### CAPTCHA Detected

**Issue:** County sites are showing CAPTCHAs

**Solutions:**
1. **Reduce frequency** - Increase delays between requests
2. **Use proxies** - Rotate IP addresses (requires proxy service)
3. **Contact county** - Some counties provide data feeds for authorized users
4. **Manual intervention** - Some scrapers support CAPTCHA solving services (not implemented by default)

### No Data Extracted

**Issue:** Scraper runs but finds 0 properties

**Debug Steps:**
1. Check if county URL is accessible
2. Verify selectors are correct for that county
3. Check browser console logs for JavaScript errors
4. Take screenshot: Enable debug mode in scraper
5. Try different platform type

**Enable Screenshots:**
```javascript
// In CountyTaxDeedScraper.js, add after page load:
await this.browserManager.screenshot(page, `debug-${county.name}.png`);
```

### High Memory Usage

**Issue:** Scraper uses too much RAM

**Solutions:**
1. Reduce MAX_CONCURRENT_SCRAPERS
2. Close browser pages after scraping:
   ```javascript
   await this.browserManager.closePage('main');
   ```
3. Increase system swap space
4. Use `headless: 'new'` mode (enabled by default)

### IP Blocked by County

**Issue:** County website returns 403 or blocks requests

**Solutions:**
1. **Reduce frequency** - Increase `requestDelay` in scraper config
2. **Rotate user agents** - Already implemented
3. **Use proxy rotation** - Set up proxy service:
   ```env
   USE_PROXY=true
   PROXY_URL=http://proxy-service:port
   ```
4. **VPN** - Route through VPN
5. **Contact county** - Request API access

## 🔒 Legal & Ethical Considerations

### ✅ Legal Uses
- Scraping **public records** - tax delinquent properties are public information
- Personal research and analysis
- Creating aggregation services
- Non-commercial use

### ⚠️ Be Respectful
- Follow `robots.txt` guidelines (check county sites)
- Implement rate limiting (already included)
- Don't overwhelm county servers
- Consider API access if available
- Some counties charge for bulk data access

### 📜 Terms of Service
Check each county's terms of service. Most public records are fair game, but:
- Commercial use may require licensing
- Some counties restrict automated access
- Always verify you're allowed to scrape

## 🎯 Best Practices

### 1. Start Small
```javascript
// Test with one county first
await scraperManager.scrapeCounty('harris-tx');
```

### 2. Monitor Logs
```bash
# Real-time monitoring
pm2 logs scraper-server --lines 100
```

### 3. Schedule During Off-Hours
```env
SCRAPER_SCHEDULE=0 3 * * *  # 3 AM when county sites have low traffic
```

### 4. Handle Failures Gracefully
The system automatically:
- Retries failed requests (3 times by default)
- Logs errors to database
- Continues with next county if one fails

### 5. Validate Data
```javascript
// Data validation is automatic
// But you can add custom validation in transformData()
```

## 📊 Performance Tuning

### Speed vs. Detection Trade-off

**Faster (Higher Detection Risk):**
```javascript
requestDelay: 500,      // 500ms between requests
maxConcurrent: 5,       // 5 scrapers at once
skipStyles: true,       // Skip CSS downloads
```

**Slower (Lower Detection Risk):**
```javascript
requestDelay: 5000,     // 5 seconds between requests
maxConcurrent: 1,       // 1 scraper at a time
simulateHuman: true,    // Add mouse movements, scrolling
```

### Resource Optimization

**Memory:**
- Set `headless: 'new'` (default) - Uses less memory
- Close pages after use
- Limit concurrent scrapers

**CPU:**
- Disable unnecessary image loading (already done)
- Skip CSS/fonts (optional)
- Use static scraping (Cheerio) when possible

**Network:**
- Block ads/trackers (already done)
- Use compression
- Implement caching for repeated requests

## 🔄 Data Flow

```
1. ScraperManager schedules jobs
   ↓
2. CountyTaxDeedScraper launches browser
   ↓
3. BrowserManager navigates with anti-detection
   ↓
4. Extract data from page
   ↓
5. Transform & validate data
   ↓
6. DatabaseManager saves to Supabase
   ↓
7. Stats updated in admin dashboard
```

## 📚 Architecture

```
server/
├── index.js                 # Entry point, API server
├── lib/
│   ├── BrowserManager.js    # Browser automation with anti-detection
│   ├── BaseScraper.js       # Abstract scraper class
│   ├── ScraperManager.js    # Orchestrates multiple scrapers
│   └── DatabaseManager.js   # Database operations
├── scrapers/
│   └── CountyTaxDeedScraper.js  # County-specific scraper
└── config/
    └── counties.config.js   # County configurations
```

## 🤝 Contributing

### Adding Support for New County Platforms

1. Identify the platform (check source code, URL patterns)
2. Add platform detection logic
3. Implement extraction strategy
4. Add to counties.config.js
5. Test thoroughly

### Reporting Issues

Include:
- County ID and state
- Error messages
- Screenshots (if applicable)
- Scraper logs

## 📞 Support

For issues:
1. Check logs: `pm2 logs scraper-server`
2. Review error messages in admin dashboard
3. Check database scraper_runs table for details
4. Enable debug mode for detailed output

## 🎓 Advanced Topics

### Custom Scraper Development

Create a new scraper by extending BaseScraper:

```javascript
import BaseScraper from '../lib/BaseScraper.js';

class MyCustomScraper extends BaseScraper {
  constructor(config) {
    super({ name: 'MyCustomScraper', ...config });
  }

  async scrape() {
    // Your scraping logic here
  }

  async extractData(html) {
    // Your extraction logic
  }
}
```

### Proxy Rotation

To use rotating proxies:

```javascript
// In server/index.js or scraper config
const proxies = [
  'http://proxy1:port',
  'http://proxy2:port',
  'http://proxy3:port'
];

// Rotate proxy for each scraper
const randomProxy = proxies[Math.floor(Math.random() * proxies.length)];
```

### CAPTCHA Handling

For sites with CAPTCHAs, integrate a solving service:

```javascript
// Detect CAPTCHA
const captcha = await this.browserManager.detectCaptcha(page);

if (captcha.detected) {
  // Option 1: Manual intervention (pause and notify admin)
  // Option 2: Integrate 2captcha, Anti-Captcha, etc.
  // Option 3: Skip and retry later
}
```

## 📈 Scaling

For large-scale scraping:

1. **Horizontal Scaling** - Run multiple scraper servers
2. **Load Balancing** - Distribute counties across servers
3. **Database Sharding** - Split data by state/county
4. **Caching** - Cache frequently accessed data
5. **CDN** - Serve static content via CDN

---

**Note:** This scraper system is designed for collecting public information. Always respect website terms of service and applicable laws.
