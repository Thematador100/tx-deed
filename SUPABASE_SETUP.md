# Supabase Setup Guide - 100% Configuration

Complete guide to set up Supabase for the enterprise autonomous platform.

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project (or use existing)
3. Go to **Settings** → **API**
4. Copy these values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Service Role Key** (secret key - keep it safe!)

### Step 2: Set Environment Variables

Create or update your `.env` file:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key-here

# Optional: Frontend key (anon/public key)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important:** Use the **Service Role Key** (not the anon key) for the backend!

### Step 3: Run Automated Setup

```bash
npm run setup:supabase
```

This script will:
- ✅ Verify your credentials
- ✅ Test database connection
- ✅ Create the base properties table
- ✅ Check which tables exist
- ✅ Show you what migrations to run

### Step 4: Run SQL Migrations

You have 3 options:

#### Option A: Supabase Dashboard (Easiest)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy/paste the contents of `supabase-migrations.sql`
5. Click **Run**
6. Repeat with `supabase-enterprise-migrations.sql`

#### Option B: Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push
```

#### Option C: Command Line (psql)

```bash
# Get your database URL from Supabase Settings → Database
psql "postgresql://..." < supabase-migrations.sql
psql "postgresql://..." < supabase-enterprise-migrations.sql
```

### Step 5: Verify Setup

```bash
npm run verify:supabase
```

This will check all 20+ tables and confirm 100% setup.

---

## 📊 Database Schema Overview

### Core Tables (2)
- `properties` - All property records
- `profiles` - User profiles

### Autonomous Agent Tables (7)
- `scraper_runs` - Web scraping operation logs
- `skip_trace_results` - Family member & contact info
- `property_enrichment` - Comprehensive property reports
- `pipeline_stages` - Deal pipeline stages
- `saved_properties` - Member property pipeline
- `property_assignments` - Property-to-member assignments
- `notifications` - User notifications

### Enterprise Tables (12)
- `property_valuations` - Hedge fund-level valuations (7 methods)
- `ml_decisions` - ML-powered investment decisions
- `decision_outcomes` - Actual results for learning
- `prospect_lists` - Targeted lead lists
- `marketing_campaigns` - Auto-generated campaigns
- `market_reports` - Engineering as marketing content
- `offers` - Property offers tracking
- `due_diligence_tasks` - DD workflow
- `watchlist` - Properties being monitored
- `review_queue` - Human review queue
- `data_import_log` - CSV upload tracking
- `system_analytics` - Platform metrics

**Total: 21 tables** for complete autonomous operation

---

## 🔒 Security Configuration

All tables have Row Level Security (RLS) enabled with proper policies:

- **Admins** can access all data
- **Members** can only access their own data
- **Public** can view published market reports

Authentication is handled via Supabase Auth.

---

## ✅ Verification Checklist

After setup, verify each component:

### Database Connection
```bash
npm run verify:supabase
```
Should show: **✅ 21/21 tables found**

### Test Insert
```bash
curl -X POST http://localhost:3001/api/test/db
```

### Agent Status
```bash
curl http://localhost:3001/api/status
```

Should show all agents initialized.

---

## 🛠️ Troubleshooting

### "Connection Error"
- Check SUPABASE_URL is correct
- Verify SUPABASE_SERVICE_KEY (not anon key!)
- Ensure project isn't paused

### "Table does not exist"
- Run SQL migrations (Step 4 above)
- Check you're using correct project

### "Permission Denied"
- Using Service Role Key? (not anon key)
- RLS policies configured correctly?

### "Some tables missing"
- Run both migration files in order:
  1. `supabase-migrations.sql` (core + agents)
  2. `supabase-enterprise-migrations.sql` (enterprise)

---

## 🔄 Reset Database (If Needed)

To start fresh:

```sql
-- Run in Supabase SQL Editor
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
```

Then run migrations again.

---

## 📈 Performance Optimization

### Indexes
All tables have proper indexes for:
- Primary keys
- Foreign keys
- Frequently queried fields
- Sort/filter fields

### Connection Pooling
Supabase handles this automatically. For high volume:
- Use Supabase Connection Pooler
- Enable statement timeout
- Monitor query performance

### Partitioning (Optional)
For 1M+ properties, consider partitioning:
```sql
-- Partition properties by state
CREATE TABLE properties_partitioned (LIKE properties)
PARTITION BY LIST (state);
```

---

## 🚀 What Happens After Setup

Once Supabase is 100% configured:

1. **Autonomous Agents Start**
   ```bash
   npm run start:autonomous
   # or
   pm2 start ecosystem.config.js
   ```

2. **Data Collection Begins**
   - Scraper runs at 2 AM daily
   - Saves properties to database
   - Triggers enrichment pipeline

3. **Processing Pipeline**
   - Skip tracing finds contacts (every minute)
   - Enrichment builds reports (every 2 min)
   - Valuations run (on-demand or scheduled)
   - ML makes decisions (every 30 min)
   - Prospecting generates leads (every hour)

4. **Business Generation**
   - Lead lists created automatically
   - Marketing campaigns generated
   - Market reports published
   - All tracked in analytics

---

## 📊 Monitoring Database Health

### View System Analytics
```sql
SELECT * FROM system_analytics
ORDER BY timestamp DESC
LIMIT 10;
```

### Check Recent Properties
```sql
SELECT COUNT(*), data_source, created_at::date
FROM properties
GROUP BY data_source, created_at::date
ORDER BY created_at::date DESC;
```

### ML Decision Performance
```sql
SELECT
  action,
  COUNT(*) as total,
  AVG(overall_score) as avg_score,
  AVG(confidence) as avg_confidence
FROM ml_decisions
GROUP BY action
ORDER BY total DESC;
```

### Prospecting Metrics
```sql
SELECT * FROM prospecting_performance;
```

---

## 🎯 Next Steps After Setup

1. **Upload First Data**
   ```bash
   curl -X POST http://localhost:3001/api/data/upload \
     -F "file=@propertyradar.csv"
   ```

2. **Review Dashboards**
   - Go to http://localhost:3000/admin
   - Check agent status
   - View analytics

3. **Configure Scrapers**
   - Add your target counties
   - Set schedule (default: 2 AM daily)

4. **Test ML Decisions**
   - System will auto-analyze new properties
   - Review recommendations

5. **Launch Prospecting**
   - Auto-generates leads hourly
   - Creates marketing campaigns

---

## 💡 Best Practices

### Regular Maintenance
- Monitor disk usage (properties table grows)
- Review slow queries
- Check error logs
- Verify backups

### Backups
Supabase automatically backs up your data. For extra safety:
```bash
# Export full database
pg_dump $DATABASE_URL > backup.sql
```

### Scaling
When you hit 100k+ properties:
- Enable connection pooling
- Add read replicas (Supabase Pro)
- Consider partitioning large tables
- Optimize indexes based on query patterns

---

## ✅ Setup Complete!

When verification shows **21/21 tables**, you're 100% ready!

The enterprise autonomous platform is now operational:
- 🤖 All agents initialized
- 📊 Database fully configured
- 🔒 Security enabled
- 📈 Analytics tracking
- 🚀 Ready to process properties

**Start the platform:**
```bash
pm2 start ecosystem.config.js
```

**Monitor status:**
```bash
pm2 logs scraper-autonomous
curl http://localhost:3001/api/status
```

**You're live!** 🎉
