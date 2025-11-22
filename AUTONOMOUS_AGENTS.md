# Autonomous Agents System - Complete Documentation

## 🤖 Overview

This system operates **24/7 without human intervention** using multiple specialized autonomous agents that work together to manage your property investment operations. Once started, these agents handle everything from data collection to member management.

**You are NOT the bottleneck. The agents handle everything.**

---

## 🎯 Autonomous Agents

### 1. Web Scraping Agent
**Purpose:** Collect property data from county tax deed websites

**Features:**
- ✅ Scheduled scraping (2 AM daily by default)
- ✅ Multi-platform support (Civicsource, Realauction, Grant Street, custom)
- ✅ Anti-detection (Puppeteer Stealth, rotating user agents)
- ✅ Auto-save to Supabase database
- ✅ Duplicate detection
- ✅ Self-healing from errors

**Configuration:**
```env
SCRAPER_SCHEDULE=0 2 * * *  # 2 AM daily
MAX_CONCURRENT_SCRAPERS=3   # Scrape 3 counties simultaneously
```

**What it does automatically:**
- Scrapes all active counties on schedule
- Saves every property to database
- Updates existing properties
- Tracks scraping statistics
- Retries failed operations
- Self-heals from errors

---

### 2. Skip Tracing Agent
**Purpose:** Find family members and contact information for property owners

**Features:**
- ✅ Autonomous 24/7 operation
- ✅ Finds family members (children, relatives)
- ✅ Validates email addresses
- ✅ Validates phone numbers
- ✅ Handles deceased owners (estate information)
- ✅ Auto-saves all data to Supabase
- ✅ Processes properties needing tracing every minute

**What it does automatically:**
- Monitors for properties needing skip tracing
- Parses owner names intelligently
- Detects deceased owners, trusts, LLCs
- Finds family members through multiple strategies:
  - Common surnames in same area
  - Public records search
  - Social media research
  - Property ownership cross-reference
- Generates email patterns and validates them
- Validates phone numbers
- Gathers estate information for deceased owners
- Saves all results to `skip_trace_results` table

**Skip Tracing Data:**
```javascript
{
  owner_name: "John Smith",
  parsed_first_name: "John",
  parsed_last_name: "Smith",
  is_deceased: false,
  family_members: [
    {
      name: "Jane Smith",
      relationship: "spouse",
      contact_info: {
        email: "jane.smith@example.com",
        phone: "+1-555-0123",
        validated: true
      }
    }
  ],
  contacts: [
    {
      type: "email",
      value: "john.smith@example.com",
      confidence: 0.85,
      validated: true
    },
    {
      type: "phone",
      value: "+1-555-0100",
      confidence: 0.90,
      validated: true
    }
  ],
  trace_confidence: 0.87
}
```

---

### 3. Property Enrichment Agent
**Purpose:** Build comprehensive property reports (BatchLeads/Reonomy-style)

**Features:**
- ✅ Autonomous 24/7 operation
- ✅ Comprehensive data aggregation
- ✅ Ownership history tracking
- ✅ Lien and tax information
- ✅ Market comparables analysis
- ✅ Neighborhood data and ratings
- ✅ School information
- ✅ Environmental hazard checks
- ✅ Crime statistics
- ✅ Investment metrics calculation
- ✅ Auto-saves to Supabase
- ✅ Processes properties every 2 minutes

**What it does automatically:**
- Monitors for properties needing enrichment
- Gathers comprehensive property details
- Builds ownership history timeline
- Finds all liens and encumbrances
- Analyzes tax payment history
- Identifies tax delinquencies
- Finds comparable sales (comps)
- Estimates market value
- Gathers neighborhood data:
  - Walk score
  - Crime statistics
  - Demographics
  - Points of interest
- Collects school ratings
- Checks environmental hazards
- Identifies flood zones
- Calculates investment metrics:
  - Estimated rent
  - Cap rate
  - Cash-on-cash return
  - Appreciation rate
- Provides market insights
- Saves comprehensive report to `property_enrichment` table

**Enrichment Data Structure:**
```javascript
{
  property_details: { /* Full property information */ },
  ownership_history: [
    { owner: "Previous Owner", from: "2010-01-01", to: "2020-05-15" },
    { owner: "Current Owner", from: "2020-05-15", to: null }
  ],
  liens: [
    { type: "Tax Lien", amount: 5000, date: "2023-01-15", status: "Active" }
  ],
  tax_history: [
    { year: 2023, assessed_value: 250000, tax_amount: 3500, paid: true },
    { year: 2022, assessed_value: 240000, tax_amount: 3360, paid: true }
  ],
  comps: [
    { address: "123 Main St", price: 275000, sold_date: "2024-01-15", sqft: 1800 }
  ],
  estimated_market_value: 265000,
  neighborhood_data: {
    walk_score: 75,
    crime_score: 65,
    median_income: 75000
  },
  school_data: [
    { name: "Lincoln Elementary", rating: 8, distance: 0.5 }
  ],
  environmental_data: {
    flood_zone: "X",
    has_hazards: false
  },
  investment_metrics: {
    estimated_rent: 1800,
    cap_rate: 8.15,
    cash_on_cash_return: 12.5
  },
  market_insights: {
    appreciation_rate: 5.2,
    days_on_market_avg: 45,
    inventory_trend: "decreasing"
  },
  enrichment_score: 0.92
}
```

---

### 4. Property Assignment Agent
**Purpose:** Assign properties to specific members and manage their responses

**Features:**
- ✅ Autonomous 24/7 operation
- ✅ Assign properties to specific members
- ✅ Send automatic notifications
- ✅ Track member responses (accept/decline)
- ✅ Competitive assignments (first to respond wins)
- ✅ Auto-expire after 72 hours
- ✅ Add accepted properties to member pipeline
- ✅ All operations saved to Supabase
- ✅ Processes assignments every 5 minutes

**What it does automatically:**
- Processes assignment requests
- Sends notifications to members:
  - In-app notifications
  - Email notifications (production)
  - SMS notifications (production)
  - Push notifications (production)
- Tracks assignment status
- Handles member acceptance:
  - Updates assignment status
  - Cancels competitive assignments
  - Adds property to member pipeline
  - Sends confirmation
- Handles member decline:
  - Records decline reason
  - Optionally reassigns to another member
- Auto-expires assignments after 72 hours
- Sends cancellation notifications

**Assignment Flow:**
1. Admin assigns property to member(s)
2. System sends notification automatically
3. Member receives notification
4. Member accepts or declines
5. System updates status automatically
6. If accepted: Property added to pipeline
7. If competitive: Other assignments cancelled
8. If expires: Status changed to expired

**Assignment Types:**

**Single Assignment:**
```javascript
// Assign to one member
await assignmentAgent.assignProperty(
  propertyId,
  memberId,
  assignedBy,
  {
    notes: "High-value opportunity",
    priority: "high"
  }
);
```

**Competitive Assignment:**
```javascript
// Assign to multiple members (first to respond wins)
await assignmentAgent.assignToMultiple(
  propertyId,
  [member1Id, member2Id, member3Id],
  assignedBy,
  {
    notes: "First to respond gets this property",
    priority: "urgent"
  }
);
```

---

## 📊 Database Schema

All agents automatically save data to Supabase tables:

### Tables Created:
1. **skip_trace_results** - Skip tracing results
2. **property_enrichment** - Comprehensive property reports
3. **property_assignments** - Property-to-member assignments
4. **notifications** - User notifications
5. **saved_properties** - Member property pipeline
6. **pipeline_stages** - Pipeline stage definitions
7. **scraper_runs** - Scraping operation tracking

### Setup Database:
```bash
# Run this SQL in your Supabase SQL Editor
cat supabase-migrations.sql
```

This creates all tables with:
- ✅ Proper indexes for performance
- ✅ Foreign key constraints
- ✅ Row Level Security (RLS) policies
- ✅ Auto-updating timestamps
- ✅ Default pipeline stages

---

## 🚀 Getting Started

### 1. Prerequisites

**Supabase Setup:**
- Active Supabase project
- Service role key (NOT anon key!)
- Database tables created (run `supabase-migrations.sql`)

**Environment Variables:**
```env
# Supabase - REQUIRED
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# Scraper Configuration
PORT=3001
MAX_CONCURRENT_SCRAPERS=3
SCRAPER_SCHEDULE=0 2 * * *
RUN_INITIAL_SCRAPE=false

# Autonomous Operation
AUTO_START_SCHEDULER=true
AUTO_RESTART=true
```

### 2. Start the System

**Option 1: PM2 (Recommended)**
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Enable auto-start on boot
```

**Option 2: Direct Node.js**
```bash
./start-autonomous.sh
```

### 3. That's It!

The system is now running 24/7 autonomously. All agents are operational.

---

## 🎮 Using the Agents

### Skip Tracing

**Trigger skip trace for a property:**
```bash
curl -X POST http://localhost:3001/api/agents/skip-trace \
  -H "Content-Type: application/json" \
  -d '{"property_id": "uuid-here"}'
```

**Get skip trace results:**
```bash
curl http://localhost:3001/api/agents/skip-trace/uuid-here
```

**Agent will automatically:**
- Parse owner name
- Find family members
- Validate contact information
- Handle deceased owners
- Save all results to database

---

### Property Enrichment

**Trigger enrichment for a property:**
```bash
curl -X POST http://localhost:3001/api/agents/enrich \
  -H "Content-Type: application/json" \
  -d '{"property_id": "uuid-here"}'
```

**Get enrichment report:**
```bash
curl http://localhost:3001/api/agents/enrichment/uuid-here
```

**Agent will automatically:**
- Gather all property details
- Build ownership history
- Find liens and tax info
- Calculate market comps
- Analyze neighborhood
- Check schools and crime
- Calculate investment metrics
- Save comprehensive report

---

### Property Assignment

**Assign property to member:**
```bash
curl -X POST http://localhost:3001/api/agents/assign \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "uuid-here",
    "member_id": "uuid-here",
    "notes": "Great opportunity",
    "priority": "high"
  }'
```

**Assign to multiple members (competitive):**
```bash
curl -X POST http://localhost:3001/api/agents/assign-multiple \
  -H "Content-Type: application/json" \
  -d '{
    "property_id": "uuid-here",
    "member_ids": ["uuid1", "uuid2", "uuid3"],
    "notes": "First to respond wins"
  }'
```

**Member accepts assignment:**
```bash
curl -X POST http://localhost:3001/api/agents/assignment/uuid/accept \
  -H "Content-Type: application/json" \
  -d '{"member_id": "uuid-here"}'
```

**Member declines assignment:**
```bash
curl -X POST http://localhost:3001/api/agents/assignment/uuid/decline \
  -H "Content-Type: application/json" \
  -d '{
    "member_id": "uuid-here",
    "reason": "Not interested in this area"
  }'
```

**Agent will automatically:**
- Send notifications
- Track responses
- Handle competitive assignments
- Add to member pipeline
- Cancel expired assignments
- Send cancellation notices

---

## 📈 Monitoring

### Agent Status

**Get overall system status:**
```bash
curl http://localhost:3001/api/status
```

**Response:**
```json
{
  "isRunning": true,
  "stats": {
    "startTime": "2024-01-20T10:00:00.000Z",
    "uptime": 86400000,
    "uptimeFormatted": "1d 0h"
  },
  "agents": {
    "scraper": {
      "status": "idle",
      "nextRun": "2024-01-21T02:00:00.000Z"
    },
    "skipTracing": {
      "isRunning": true,
      "totalProcessed": 150,
      "totalFound": 120,
      "averageConfidence": 0.82
    },
    "enrichment": {
      "isRunning": true,
      "totalEnriched": 200,
      "averageScore": 0.88
    },
    "assignment": {
      "isRunning": true,
      "totalAssignments": 50,
      "activeAssignments": 12,
      "acceptedAssignments": 30
    }
  }
}
```

### Logs

**PM2:**
```bash
pm2 logs scraper-autonomous
pm2 logs scraper-autonomous --lines 100
```

**Direct:**
```bash
tail -f logs/scraper-combined.log
```

---

## ✅ What Happens Automatically

### On System Start
1. ✅ All agents initialize
2. ✅ Database connection verified
3. ✅ Tables checked/created
4. ✅ Scheduler started
5. ✅ Health monitoring begins
6. ✅ All agents start autonomous operation

### Every 2 AM (Scraper)
1. ✅ All active counties queued
2. ✅ Properties scraped automatically
3. ✅ Data saved to database
4. ✅ Duplicates updated
5. ✅ Statistics tracked

### Every Minute (Skip Tracing)
1. ✅ Check for properties needing tracing
2. ✅ Process up to 10 properties
3. ✅ Find family members
4. ✅ Validate contact info
5. ✅ Save results to database

### Every 2 Minutes (Enrichment)
1. ✅ Check for properties needing enrichment
2. ✅ Process up to 5 properties
3. ✅ Gather comprehensive data
4. ✅ Calculate metrics
5. ✅ Save reports to database

### Every 5 Minutes (Assignment)
1. ✅ Process expired assignments
2. ✅ Send pending notifications
3. ✅ Update assignment statuses

### Every Minute (Health Check)
1. ✅ Verify database connection
2. ✅ Check all agent statuses
3. ✅ Monitor system resources
4. ✅ Auto-recover if needed

---

## 🔧 Configuration

### Agent-Specific Settings

**Skip Tracing Agent:**
```javascript
const skipTracingAgent = new SkipTracingAgent(dbManager, {
  batchSize: 10,              // Process 10 properties per cycle
  checkInterval: 60000,       // Check every minute
  minConfidence: 0.7,         // Minimum confidence threshold
});
```

**Enrichment Agent:**
```javascript
const enrichmentAgent = new PropertyEnrichmentAgent(dbManager, {
  batchSize: 5,               // Process 5 properties per cycle
  checkInterval: 120000,      // Check every 2 minutes
  minScore: 0.8,              // Minimum enrichment score target
});
```

**Assignment Agent:**
```javascript
const assignmentAgent = new PropertyAssignmentAgent(dbManager, {
  autoNotify: true,           // Send notifications automatically
  assignmentExpiry: 72,       // Hours until assignment expires
});
```

---

## 🚫 What You DON'T Need to Do

❌ Start agents manually
❌ Monitor for errors
❌ Process data manually
❌ Save to database manually
❌ Send notifications manually
❌ Track assignment responses
❌ Handle expired assignments
❌ Restart on failures
❌ Check if running
❌ Be available 24/7

**The autonomous agents handle ALL of this.**

---

## 🆘 Troubleshooting

### Agent Not Running

**Check status:**
```bash
curl http://localhost:3001/api/status
```

**Restart all agents:**
```bash
pm2 restart scraper-autonomous
```

### Database Connection Issues

**Test connection:**
```bash
curl http://localhost:3001/health
```

**Verify Supabase credentials in .env**

### High Processing Backlog

**Check pending work:**
```bash
curl http://localhost:3001/api/agents/stats
```

**Adjust batch sizes and intervals in agent configs**

---

## 📞 API Reference

### Skip Tracing Endpoints

```
POST   /api/agents/skip-trace           - Trigger skip trace
GET    /api/agents/skip-trace/:id       - Get results
GET    /api/agents/skip-trace/stats     - Get stats
```

### Enrichment Endpoints

```
POST   /api/agents/enrich               - Trigger enrichment
GET    /api/agents/enrichment/:id       - Get report
GET    /api/agents/enrichment/stats     - Get stats
```

### Assignment Endpoints

```
POST   /api/agents/assign               - Assign property
POST   /api/agents/assign-multiple      - Competitive assignment
POST   /api/agents/assignment/:id/accept   - Accept assignment
POST   /api/agents/assignment/:id/decline  - Decline assignment
GET    /api/agents/assignments/:userId     - Get member assignments
GET    /api/agents/assignment/stats        - Get stats
```

---

## 🎯 Summary

**Start the system:**
```bash
pm2 start ecosystem.config.js
```

**The system now runs 24/7 autonomously:**
- ✅ Scrapes property data
- ✅ Traces family members
- ✅ Validates contact info
- ✅ Builds comprehensive reports
- ✅ Assigns properties to members
- ✅ Manages member responses
- ✅ Auto-saves everything to database
- ✅ Self-heals from errors
- ✅ Zero human intervention required

**You are free to focus on other tasks. The autonomous agents handle everything.** 🚀
