# Autonomous Scraper System - Zero-Touch Operation

## 🤖 Overview

This is a **fully autonomous 24/7 system** that requires **ZERO human intervention**. Once started, it:

- ✅ Runs continuously without stopping
- ✅ Scrapes property data on schedule (2 AM daily by default)
- ✅ Automatically saves ALL data to Supabase database
- ✅ Self-heals from any errors or failures
- ✅ Auto-restarts if crashed
- ✅ Monitors its own health every minute
- ✅ Retries failed operations automatically
- ✅ Manages database connections automatically

**You are NOT the bottleneck. The agent handles everything.**

---

## 🚀 Quick Start (One Command)

```bash
# 1. Copy environment file
cp .env.example .env

# 2. Edit .env and add your Supabase credentials
nano .env

# 3. Start autonomous system
./start-autonomous.sh
```

**That's it. The system is now running 24/7 autonomously.**

---

## 📋 Prerequisites

### 1. Supabase Setup

You already have Supabase. Just ensure these tables exist:

#### `properties` table
Your existing properties table will be used automatically.

#### `scraper_runs` table (for tracking)
Run this SQL in your Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS scraper_runs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  platform_type TEXT,
  started_at TIMESTAMP NOT NULL,
  completed_at TIMESTAMP,
  status TEXT NOT NULL,
  items_scraped INTEGER DEFAULT 0,
  items_saved INTEGER DEFAULT 0,
  errors JSONB,
  duration_ms INTEGER,
  stats JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_runs_county ON scraper_runs(county, state);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_created_at ON scraper_runs(created_at DESC);
```

### 2. Environment Variables

Edit `.env` file:

```env
# Supabase - REQUIRED
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key  # NOT anon key!

# Scraper Configuration
PORT=3001
MAX_CONCURRENT_SCRAPERS=3
SCRAPER_SCHEDULE=0 2 * * *  # 2 AM daily
RUN_INITIAL_SCRAPE=false     # Set true to scrape immediately on start

# Autonomous Operation - LEAVE AS TRUE
AUTO_START_SCHEDULER=true
AUTO_RESTART=true
```

**⚠️ IMPORTANT:** Use `SUPABASE_SERVICE_KEY` (service role), NOT the anon key!

---

## 🎯 How It Works (Autonomous Operation)

### System Architecture

```
┌─────────────────────────────────────────────────────┐
│         Autonomous Agent (24/7 Manager)             │
│  • Self-starting                                    │
│  • Self-healing                                     │
│  • Self-monitoring                                  │
└─────────────────┬───────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼──────┐   ┌────────▼─────────┐
│   Scraper    │   │    Database      │
│   Manager    │   │    Manager       │
│              │   │                  │
│ • Scheduling │   │ • Auto-save      │
│ • Queue mgmt │   │ • Deduplication  │
│ • Retry logic│   │ • Health checks  │
└───────┬──────┘   └────────┬─────────┘
        │                   │
        └─────────┬─────────┘
                  │
          ┌───────▼────────┐
          │   Supabase     │
          │   Database     │
          └────────────────┘
```

### Autonomous Features

**1. Auto-Start on Boot**
- Use PM2 or systemd service
- Automatically starts when server boots
- No manual intervention needed

**2. Scheduled Scraping**
- Runs at 2 AM daily (configurable)
- Scrapes all active counties automatically
- Saves ALL data to Supabase automatically

**3. Auto-Save to Database**
- Every property is automatically saved
- Duplicate detection prevents re-saving
- Failed saves are retried automatically (up to 5 times)

**4. Self-Healing**
- Database connection lost? Auto-reconnects
- Scraper crashed? Auto-restarts
- Network timeout? Retries automatically
- Too many failures? Resets and starts fresh

**5. Health Monitoring**
- Checks health every 60 seconds
- Database connection verified
- Scraper status monitored
- System resources tracked
- Auto-recovery triggered if unhealthy

**6. Error Recovery**
- All errors are caught and logged
- Failed operations go to retry queue
- Retry queue processes automatically
- Critical failures trigger full system restart
- Maximum 5 retries before giving up on individual items

**7. Zero Downtime**
- Runs forever until manually stopped
- Survives server restarts (with PM2/systemd)
- Handles uncaught exceptions gracefully
- Continues operation through network issues

---

## 🎮 Deployment Options

### Option 1: PM2 (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Start autonomous system
pm2 start ecosystem.config.js

# Save configuration
pm2 save

# Enable auto-start on boot
pm2 startup
# Follow the command it gives you

# Monitor
pm2 monit

# View logs
pm2 logs scraper-autonomous
```

**Benefits:**
- Auto-restart on crash
- Auto-start on server boot
- Process monitoring
- Log management
- Daily auto-restart at 1 AM (for fresh state)

### Option 2: Systemd Service (Linux)

```bash
# Copy service file
sudo cp scraper.service /etc/systemd/system/

# Edit paths in service file
sudo nano /etc/systemd/system/scraper.service

# Enable and start
sudo systemctl enable scraper
sudo systemctl start scraper

# Check status
sudo systemctl status scraper

# View logs
sudo journalctl -u scraper -f
```

**Benefits:**
- Native Linux service
- Auto-start on boot
- System-level management
- Security hardening built-in

### Option 3: Direct Node.js (Development)

```bash
# Just run it
node server/index.js

# Or use the startup script
./start-autonomous.sh
```

**Note:** This won't auto-restart on system reboot.

---

## 📊 Monitoring

### Admin Dashboard

Access at: `http://localhost:3000/admin/scrapers`

**Features:**
- Real-time status
- Running jobs display
- Success/failure statistics
- Database statistics
- Manual controls (if needed)
- Auto-refreshes every 5 seconds

### API Endpoints

```bash
# Get status
curl http://localhost:3001/api/scrapers/status

# Get statistics
curl http://localhost:3001/api/scrapers/stats

# Health check
curl http://localhost:3001/health
```

### Logs

**PM2:**
```bash
pm2 logs scraper-autonomous
pm2 logs scraper-autonomous --lines 100
```

**Systemd:**
```bash
sudo journalctl -u scraper -f
sudo journalctl -u scraper --since "1 hour ago"
```

**Direct:**
```bash
tail -f logs/scraper-combined.log
```

---

## 🔧 Configuration

### Scraping Schedule

Edit `.env`:
```env
# Format: minute hour day month day-of-week
SCRAPER_SCHEDULE=0 2 * * *    # 2 AM daily (default)
SCRAPER_SCHEDULE=0 */6 * * *  # Every 6 hours
SCRAPER_SCHEDULE=0 0 * * 0    # Weekly on Sunday
```

### Concurrency

```env
MAX_CONCURRENT_SCRAPERS=3  # Scrape 3 counties simultaneously
MAX_CONCURRENT_SCRAPERS=1  # Conservative (stealthier)
MAX_CONCURRENT_SCRAPERS=5  # Aggressive (faster)
```

### Add Counties

Edit `server/config/counties.config.js`:

```javascript
'your-county-id': {
  name: 'County Name',
  state: 'TX',
  defaultCity: 'City',
  url: 'https://county-website.gov',
  platformType: 'custom',
  active: true,
}
```

Set `active: false` to disable a county.

---

## ✅ What Happens Automatically

### On System Start
1. ✅ Autonomous agent initializes
2. ✅ Database connection verified
3. ✅ Tables checked/created if needed
4. ✅ Scraper manager initialized
5. ✅ Scheduler started (if AUTO_START_SCHEDULER=true)
6. ✅ Health monitoring begins
7. ✅ System is now autonomous

### Every 2 AM (default)
1. ✅ All active counties queued for scraping
2. ✅ 3 counties scraped simultaneously
3. ✅ Each property automatically saved to Supabase
4. ✅ Duplicate properties updated instead of re-inserted
5. ✅ Statistics tracked in scraper_runs table
6. ✅ Errors logged and retried
7. ✅ Cycle repeats next day

### Every Minute
1. ✅ Health check performed
2. ✅ Database connection verified
3. ✅ Scraper status checked
4. ✅ System resources monitored
5. ✅ Auto-recovery triggered if needed

### On Error
1. ✅ Error logged with context
2. ✅ Failed operation added to retry queue
3. ✅ Retry queue processed automatically
4. ✅ Up to 5 retries per operation
5. ✅ If consecutive failures > 3: full system restart
6. ✅ System continues operation

### On Database Failure
1. ✅ Connection retry attempted
2. ✅ Exponential backoff (5 min, 10 min, 15 min...)
3. ✅ Up to 5 reconnection attempts
4. ✅ If still failing: system restarts completely
5. ✅ Auto-restart ensures eventual recovery

### On Crash
1. ✅ PM2/systemd automatically restarts process
2. ✅ Autonomous agent re-initializes
3. ✅ Database reconnects
4. ✅ Scheduler resumes
5. ✅ Operation continues seamlessly

---

## 🚫 What You DON'T Need to Do

❌ Start the scraper manually
❌ Monitor for errors
❌ Save data to database manually
❌ Restart on failures
❌ Check if it's running
❌ Handle database connections
❌ Retry failed operations
❌ Schedule scraping runs
❌ Watch logs constantly
❌ Be available 24/7

**The autonomous agent handles ALL of this.**

---

## 🆘 Troubleshooting (Rare)

### System Not Starting

**Check environment:**
```bash
cat .env | grep SUPABASE
```

**Ensure Supabase credentials are correct.**

**Check Node.js:**
```bash
node --version  # Should be 18+
```

### Database Connection Issues

**Test Supabase connection:**
```bash
curl -H "apikey: YOUR_SERVICE_KEY" \
  "https://your-project.supabase.co/rest/v1/properties?limit=1"
```

**Verify service role key** (not anon key).

### Scraper Not Running

**Check status:**
```bash
curl http://localhost:3001/api/scrapers/status
```

**Check scheduler:**
```json
{
  "schedulerActive": true  // Should be true
}
```

**Manually trigger:**
```bash
curl -X POST http://localhost:3001/api/scrapers/scrape-all
```

### High Memory Usage

**Restart PM2:**
```bash
pm2 restart scraper-autonomous
```

**Reduce concurrency:**
```env
MAX_CONCURRENT_SCRAPERS=1
```

---

## 📈 Scaling

### Horizontal Scaling

Run multiple instances across servers:

**Server 1:** Texas counties
**Server 2:** Florida counties
**Server 3:** California counties

Each instance saves to same Supabase database.

### Database Optimization

**Add indexes for performance:**
```sql
CREATE INDEX idx_properties_scraped_at ON properties(scraped_at DESC);
CREATE INDEX idx_properties_source ON properties(source, state);
CREATE INDEX idx_properties_parcel ON properties(parcel_id);
```

### Monitoring at Scale

Use Supabase dashboard to monitor:
- Total properties
- Properties by source
- Recent activity
- Error rates

---

## 🎯 Summary

**One command to start:**
```bash
./start-autonomous.sh
```

**System runs 24/7 automatically:**
- ✅ Scrapes on schedule
- ✅ Saves to Supabase
- ✅ Self-heals from errors
- ✅ Auto-restarts on crash
- ✅ Zero human intervention required

**You are free to focus on other tasks. The autonomous agent handles everything.**

---

## 📞 Advanced Configuration

See `SCRAPER_SETUP.md` for:
- Detailed architecture
- Custom scraper development
- Proxy rotation
- CAPTCHA handling
- Performance tuning
- Legal considerations

---

**The system is now truly autonomous. Set it and forget it.** 🚀
