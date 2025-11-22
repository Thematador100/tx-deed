# 🚀 TX Deed - Quick Start Guide

Get your entire AI workforce running in **15 minutes**!

---

## Step 1: Set Up Database (5 minutes)

1. Go to **https://supabase.com/dashboard**
2. Open your project: **aedapqfuegbqztuetkxd**
3. Click **SQL Editor** (left sidebar)
4. Click **"New Query"**
5. **Copy and paste** everything from `supabase-setup.sql` file
6. Click **"Run"** (or press Ctrl+Enter)
7. You should see: ✅ **"Database setup complete!"**

**Done!** Your database is ready.

---

## Step 2: Get Your Supabase Service Key (2 minutes)

1. In Supabase, click **Settings** (left sidebar)
2. Click **API**
3. Scroll to **"Project API keys"**
4. Find **"service_role"** key (the secret one)
5. Click **"Copy"** and save it somewhere safe

---

## Step 3: Deploy to Railway (8 minutes)

### Deploy the Frontend (Website)

1. Go to **https://railway.app**
2. Sign in with GitHub
3. Click **"New Project"** → **"Deploy from GitHub repo"**
4. Select **"Thematador100/tx-deed"**
5. Select branch: **"claude/complete-deployment-agents-01AqJdLasG2Jsq6NpKeXbU5D"**
6. Railway starts deploying! ⏳ Wait 2-3 minutes
7. When done, click **"Settings"** → **"Networking"** → **"Generate Domain"**
8. You now have a live website! 🎉

### Deploy the AI Agents (All 6 in One Service!)

1. In the same Railway project, click **"New"** → **"Service"**
2. Select **"GitHub Repo"** → **"Thematador100/tx-deed"**
3. Click on the new service that appeared
4. Go to **"Settings"** tab
5. Under **"Build"** section:
   - **Dockerfile Path**: `services/all-agents/Dockerfile`
   - **Docker Build Context**: `.`
6. Go to **"Variables"** tab
7. Click **"New Variable"** and add these (one by one):

```
SUPABASE_URL = https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_SERVICE_KEY = [paste the key from Step 2]
COUNTIES = Harris County, TX,Dallas County, TX,Tarrant County, TX
NEWS_KEYWORDS = tax lien,property foreclosure,tax delinquent
MONITOR_STATES = TX,FL,CA
COUNTY_SCRAPER_INTERVAL = 60
NEWS_SCRAPER_INTERVAL = 180
LEGISLATION_MONITOR_INTERVAL = 360
OPENAI_ANALYST_INTERVAL = 30
GOOGLE_ANALYST_INTERVAL = 45
DEEPSEEK_ANALYST_INTERVAL = 60
```

8. Click **"Deploy"** (top right)
9. Click **"Logs"** tab to watch your agents start! 🤖

You should see:
```
🚀 Starting TX Deed Autonomous Agent System...

Starting all 6 autonomous agents:

✓ County Tax Delinquent Scraper - Running every 60 minutes
✓ National News Scraper - Running every 180 minutes
✓ State Legislation Monitor - Running every 360 minutes
✓ OpenAI Analyst - Running every 30 minutes
✓ Google AI Analyst - Running every 45 minutes
✓ Deep Seek Analyst - Running every 60 minutes

✅ All agents are now running!
```

---

## Step 4: See It Working! (1 minute)

1. Go to your Railway frontend URL (from Step 3)
2. Navigate to **"/ai-workforce"** page
3. You'll see all 6 agents with their status:
   - **Scout Agents** (collecting data)
   - **Analyst Agents** (processing data)

Watch the "Last Sync" times update as agents run!

---

## What Just Happened?

You now have:

✅ **1 Website** - Your TX Deed dashboard
✅ **6 AI Agents** - Running autonomously 24/7
✅ **Database** - Storing all leads and analysis

### The Agents Are:

**Scout Agents** (Finding Leads):
- 🏛️ County Scraper - Finds tax delinquent properties
- 📰 News Scraper - Monitors real estate news
- ⚖️ Legislation Monitor - Tracks legal changes

**Analyst Agents** (Analyzing Leads):
- 🧠 OpenAI Analyst - Investment scoring
- 📊 Google AI Analyst - Market analysis
- ⚡ DeepSeek Analyst - Legal compliance

**All running automatically** - no manual work needed!

---

## Monitoring Your System

### Check Agent Status
- Visit: `your-railway-url.railway.app/ai-workforce`
- See when each agent last ran
- See if agents are Active or have Errors

### Check Agent Logs
1. Railway Dashboard
2. Click on "all-agents" service
3. Click "Logs" tab
4. Watch agents work in real-time!

### Check Database
1. Supabase Dashboard
2. Click "Table Editor"
3. View tables:
   - `leads` - Property leads found
   - `lead_sources` - Agent status
   - `news_articles` - News found
   - `legislation_updates` - Bills tracked

---

## Troubleshooting

### "Database setup failed"
- Make sure you copied the ENTIRE `supabase-setup.sql` file
- Run it again - it's safe to run multiple times

### "Agents not showing in /ai-workforce"
- Wait 2-3 minutes for first run
- Check Railway logs for errors
- Verify SUPABASE_SERVICE_KEY is correct

### "No leads appearing"
- Agents generate sample data on first run
- Check `leads` table in Supabase
- Wait for County Scraper to run (every 60 min)

### "Railway build failed"
- Check Dockerfile Path is exactly: `services/all-agents/Dockerfile`
- Check Docker Build Context is exactly: `.`
- Try deploying again

---

## Cost Breakdown

**Railway Pricing:**
- Free: $5/month credit
- Paid: ~$10-15/month for this setup
  - Frontend: ~$3/month
  - All Agents: ~$7/month
  - Database: Free (on Supabase)

**Optimize Costs:**
- Increase run intervals (less frequent = cheaper)
- Start with just frontend + agents
- Scale up as needed

---

## Next Steps

### Phase 1: Verify Everything Works (Today)
✅ Database setup
✅ Frontend deployed
✅ Agents running
✅ Data appearing in dashboard

### Phase 2: Customize (This Week)
- Add your actual counties to monitor
- Adjust run intervals
- Add real API keys for news/AI services

### Phase 3: Scale (Next Week)
- Monitor which leads are most valuable
- Adjust agent priorities
- Add more counties/states

### Phase 4: Automate Everything (Ongoing)
- Agents run 24/7 finding deals
- You just review the high-priority leads
- Focus on closing deals, not finding them!

---

## Support

**Something not working?**

1. Check Railway logs first (most errors show there)
2. Check Supabase table structure
3. Verify all environment variables are set
4. Try redeploying the service

**Still stuck?**
- Review `DEPLOYMENT.md` for detailed troubleshooting
- Check Railway community forum
- Verify Supabase RLS policies are set

---

## 🎉 Congratulations!

You now have a **fully autonomous AI workforce** finding and analyzing real estate deals 24/7!

**What makes this special:**
- ✨ Runs without you doing anything
- ✨ Finds deals while you sleep
- ✨ Analyzes every lead automatically
- ✨ Costs less than a coffee per day

**Your AI team never stops working!** 🚀

---

*Built with ❤️ for automated real estate investing*
