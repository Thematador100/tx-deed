# TX Deed - Complete Deployment Guide

This guide will walk you through deploying the complete TX Deed application with all autonomous agents on Railway.

## 🏗️ Architecture Overview

The application consists of:

### Frontend
- **React/Vite Application** - User interface for managing leads and viewing AI insights

### Scout Agents (Data Collection)
1. **County Scraper Agent** - Scrapes tax delinquent properties from county websites
2. **News Scraper Agent** - Monitors news for real estate opportunities
3. **Legislation Monitor Agent** - Tracks state legislation affecting property taxes

### Analyst Agents (Data Processing)
1. **OpenAI Analyst Agent** - Analyzes leads and provides investment scores
2. **Google AI Analyst Agent** - Performs market analysis and valuations
3. **DeepSeek Analyst Agent** - Conducts compliance and legal risk assessments

---

## 🚀 Deployment Steps

### Prerequisites

1. **Railway Account** - Sign up at [railway.app](https://railway.app)
2. **GitHub Account** - Your code should be in a GitHub repository
3. **Supabase Account** - For database (already configured at https://aedapqfuegbqztuetkxd.supabase.co)

### Step 1: Deploy the Frontend

1. Go to Railway Dashboard
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your `tx-deed` repository
5. Railway will auto-detect the Dockerfile
6. Click "Deploy"

**Environment Variables for Frontend:**
```
VITE_SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Step 2: Deploy County Scraper Agent

1. In Railway, click "New Service" in your project
2. Select "Deploy from GitHub repo"
3. Choose the same `tx-deed` repository
4. Under "Settings" → "Build":
   - Set **Dockerfile Path**: `services/scout-agents/county-scraper/Dockerfile`
   - Set **Root Directory**: `.`
5. Add Environment Variables:
```
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
COUNTIES=Harris County, TX,Dallas County, TX,Tarrant County, TX
RUN_INTERVAL_MINUTES=60
```
6. Click "Deploy"

### Step 3: Deploy News Scraper Agent

1. Click "New Service" again
2. Select "Deploy from GitHub repo"
3. Choose `tx-deed` repository
4. Under "Settings" → "Build":
   - Set **Dockerfile Path**: `services/scout-agents/news-scraper/Dockerfile`
   - Set **Root Directory**: `.`
5. Add Environment Variables:
```
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
NEWS_API_KEY=your-news-api-key
NEWS_KEYWORDS=tax lien,property foreclosure,tax delinquent
RUN_INTERVAL_MINUTES=180
```
6. Click "Deploy"

### Step 4: Deploy Legislation Monitor Agent

1. Click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose `tx-deed` repository
4. Under "Settings" → "Build":
   - Set **Dockerfile Path**: `services/scout-agents/legislation-monitor/Dockerfile`
   - Set **Root Directory**: `.`
5. Add Environment Variables:
```
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
MONITOR_STATES=TX,FL,CA,NY,IL
RUN_INTERVAL_MINUTES=360
```
6. Click "Deploy"

### Step 5: Deploy OpenAI Analyst Agent

1. Click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose `tx-deed` repository
4. Under "Settings" → "Build":
   - Set **Dockerfile Path**: `services/analyst-agents/openai-analyst/Dockerfile`
   - Set **Root Directory**: `.`
5. Add Environment Variables:
```
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
OPENAI_API_KEY=your-openai-api-key
RUN_INTERVAL_MINUTES=30
```
6. Click "Deploy"

### Step 6: Deploy Google AI Analyst Agent

1. Click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose `tx-deed` repository
4. Under "Settings" → "Build":
   - Set **Dockerfile Path**: `services/analyst-agents/google-analyst/Dockerfile`
   - Set **Root Directory**: `.`
5. Add Environment Variables:
```
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
GOOGLE_AI_API_KEY=your-google-ai-api-key
RUN_INTERVAL_MINUTES=45
```
6. Click "Deploy"

### Step 7: Deploy DeepSeek Analyst Agent

1. Click "New Service"
2. Select "Deploy from GitHub repo"
3. Choose `tx-deed` repository
4. Under "Settings" → "Build":
   - Set **Dockerfile Path**: `services/analyst-agents/deepseek-analyst/Dockerfile`
   - Set **Root Directory**: `.`
5. Add Environment Variables:
```
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY=your-supabase-service-key
DEEPSEEK_API_KEY=your-deepseek-api-key
RUN_INTERVAL_MINUTES=60
```
6. Click "Deploy"

---

## 📊 Database Setup (Supabase)

You'll need to create the following tables in Supabase:

### leads table
```sql
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_address TEXT NOT NULL,
  owner_name TEXT,
  tax_amount NUMERIC,
  years_delinquent INTEGER,
  property_type TEXT,
  county TEXT,
  state TEXT,
  status TEXT DEFAULT 'New',
  source TEXT,

  -- Analysis fields
  analysis_status TEXT,
  investment_score INTEGER,
  risk_level TEXT,
  recommended_action TEXT,
  ai_insights TEXT,
  analyzed_by TEXT,
  analyzed_at TIMESTAMPTZ,

  -- Market analysis fields
  market_analysis_status TEXT,
  estimated_market_value NUMERIC,
  market_trend TEXT,
  comparable_sales INTEGER,
  market_insights TEXT,
  market_analyzed_by TEXT,
  market_analyzed_at TIMESTAMPTZ,

  -- Compliance fields
  compliance_status TEXT,
  legal_risk_score INTEGER,
  compliance_issues TEXT,
  required_actions TEXT,
  compliance_insights TEXT,
  compliance_analyzed_by TEXT,
  compliance_analyzed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_leads_status ON leads(status);
CREATE INDEX idx_leads_analysis_status ON leads(analysis_status);
CREATE INDEX idx_leads_market_analysis_status ON leads(market_analysis_status);
CREATE INDEX idx_leads_compliance_status ON leads(compliance_status);
```

### lead_sources table
```sql
CREATE TABLE lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_lead_sources_name ON lead_sources(source_name);
```

### news_articles table (optional)
```sql
CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  description TEXT,
  keyword TEXT,
  published_at TIMESTAMPTZ,
  relevance_score NUMERIC,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### legislation_updates table (optional)
```sql
CREATE TABLE legislation_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  bill_number TEXT NOT NULL,
  state TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT,
  introduced_date TIMESTAMPTZ,
  impact_level TEXT,
  url TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bill_number, state)
);
```

---

## 🔑 Environment Variables Reference

### Required for All Services
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_SERVICE_KEY` - Supabase service role key (for agents)
- `SUPABASE_ANON_KEY` - Supabase anon key (for frontend)

### Scout Agents
- `COUNTIES` - Comma-separated list of counties to monitor
- `NEWS_API_KEY` - API key for news service
- `NEWS_KEYWORDS` - Keywords to search for
- `MONITOR_STATES` - States to monitor for legislation

### Analyst Agents
- `OPENAI_API_KEY` - OpenAI API key
- `GOOGLE_AI_API_KEY` - Google AI API key
- `DEEPSEEK_API_KEY` - DeepSeek API key

### Performance Tuning
- `RUN_INTERVAL_MINUTES` - How often each agent runs (default varies by agent)

---

## 📈 Monitoring Your Agents

1. **Railway Dashboard** - View logs for each service
2. **AI Workforce Page** - View agent status in your app at `/ai-workforce`
3. **Supabase Dashboard** - Query `lead_sources` table to see last run times

---

## 🎯 Quick Railway CLI Deployment (Alternative)

If you prefer using the Railway CLI:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create new project
railway init

# Deploy frontend
railway up

# Deploy each agent (run from repository root)
railway up --service county-scraper -d services/scout-agents/county-scraper/Dockerfile
railway up --service news-scraper -d services/scout-agents/news-scraper/Dockerfile
railway up --service legislation-monitor -d services/scout-agents/legislation-monitor/Dockerfile
railway up --service openai-analyst -d services/analyst-agents/openai-analyst/Dockerfile
railway up --service google-analyst -d services/analyst-agents/google-analyst/Dockerfile
railway up --service deepseek-analyst -d services/analyst-agents/deepseek-analyst/Dockerfile

# Set environment variables for each service
railway vars set SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
railway vars set SUPABASE_SERVICE_KEY=your-key-here
# ... etc
```

---

## 🐛 Troubleshooting

### Agent Not Running
- Check Railway logs for errors
- Verify environment variables are set correctly
- Ensure Supabase credentials are valid

### No Data Being Collected
- Check agent logs for connection errors
- Verify database tables exist
- Check Supabase Row Level Security policies

### Build Failures
- Ensure Dockerfile paths are correct
- Check that all dependencies are listed in package.json
- Verify Node.js version compatibility (v20 recommended)

---

## 💡 Cost Optimization

- **Free Tier**: Railway offers $5/month free credit
- **Start Small**: Deploy 1-2 agents first, then scale up
- **Adjust Intervals**: Increase `RUN_INTERVAL_MINUTES` to reduce compute usage
- **Monitor Usage**: Check Railway dashboard for resource consumption

---

## 🚦 Next Steps

1. ✅ Deploy services to Railway
2. ✅ Configure environment variables
3. ✅ Set up database tables in Supabase
4. ✅ Monitor agent logs
5. ✅ View results in the AI Workforce dashboard
6. 🎉 Start collecting and analyzing leads automatically!

---

## 📞 Support

For issues or questions:
- Check Railway logs first
- Review Supabase table structure
- Verify all environment variables are set
- Check that shared utilities are being copied correctly in Dockerfiles

Happy deploying! 🚀
