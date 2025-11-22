# TX Deed Autonomous Agents

This directory contains all autonomous agent services for the TX Deed platform.

## 📁 Structure

```
services/
├── shared/                    # Shared utilities used by all agents
│   ├── supabase-client.js    # Supabase connection
│   ├── base-agent.js         # Base agent class
│   └── package.json
│
├── scout-agents/             # Data collection agents
│   ├── county-scraper/       # Scrapes county tax records
│   ├── news-scraper/         # Monitors news sources
│   └── legislation-monitor/  # Tracks legislation changes
│
└── analyst-agents/           # Data processing agents
    ├── openai-analyst/       # Investment scoring with OpenAI
    ├── google-analyst/       # Market analysis with Google AI
    └── deepseek-analyst/     # Compliance analysis with DeepSeek
```

## 🤖 Agent Types

### Scout Agents (Data Collection)

**County Scraper Agent**
- Scrapes tax delinquent properties from county websites
- Runs every 60 minutes (configurable)
- Stores leads in Supabase `leads` table

**News Scraper Agent**
- Monitors news for real estate opportunities
- Runs every 180 minutes (configurable)
- Stores articles in Supabase `news_articles` table

**Legislation Monitor Agent**
- Tracks state legislation affecting property taxes
- Runs every 360 minutes (configurable)
- Stores bills in Supabase `legislation_updates` table

### Analyst Agents (Data Processing)

**OpenAI Analyst Agent**
- Analyzes leads for investment potential
- Generates investment scores and risk assessments
- Runs every 30 minutes (configurable)
- Processes unanalyzed leads from `leads` table

**Google AI Analyst Agent**
- Performs market analysis and property valuations
- Estimates market values and trends
- Runs every 45 minutes (configurable)
- Processes leads needing market analysis

**DeepSeek Analyst Agent**
- Conducts compliance and legal risk assessments
- Identifies regulatory issues
- Runs every 60 minutes (configurable)
- Processes leads needing compliance review

## 🚀 Running Locally

### Prerequisites
- Node.js 20+
- Supabase account with configured tables

### Setup

1. **Install dependencies for an agent:**
```bash
cd services/scout-agents/county-scraper
npm install
```

2. **Set environment variables:**
```bash
export SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
export SUPABASE_SERVICE_KEY=your-service-key
export RUN_INTERVAL_MINUTES=60
```

3. **Run the agent:**
```bash
npm start
```

### Testing All Agents

```bash
# Terminal 1 - County Scraper
cd services/scout-agents/county-scraper && npm install && npm start

# Terminal 2 - News Scraper
cd services/scout-agents/news-scraper && npm install && npm start

# Terminal 3 - Legislation Monitor
cd services/scout-agents/legislation-monitor && npm install && npm start

# Terminal 4 - OpenAI Analyst
cd services/analyst-agents/openai-analyst && npm install && npm start

# Terminal 5 - Google Analyst
cd services/analyst-agents/google-analyst && npm install && npm start

# Terminal 6 - DeepSeek Analyst
cd services/analyst-agents/deepseek-analyst && npm install && npm start
```

## 🏗️ How Agents Work

### Base Agent Class

All agents extend `BaseAgent` which provides:
- Status updates to Supabase
- Logging functionality
- Automatic interval-based execution
- Graceful shutdown handling

### Lifecycle

1. Agent starts and updates status to "Active"
2. Runs immediately on startup
3. Schedules recurring runs based on `RUN_INTERVAL_MINUTES`
4. Each run:
   - Executes the agent's specific task
   - Updates status in database
   - Logs progress
5. Handles SIGTERM/SIGINT for graceful shutdown

## 📊 Database Schema

Agents interact with these Supabase tables:

- `leads` - Property leads with analysis data
- `lead_sources` - Agent status tracking
- `news_articles` - News scraped by News Agent
- `legislation_updates` - Bills tracked by Legislation Monitor

See `DEPLOYMENT.md` for complete schema.

## 🔧 Configuration

Each agent can be configured via environment variables:

### Shared Variables
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_KEY` - Service role key for full access
- `RUN_INTERVAL_MINUTES` - How often agent runs

### Agent-Specific Variables
- `COUNTIES` - Counties to scrape (County Scraper)
- `NEWS_API_KEY` - News API key (News Scraper)
- `NEWS_KEYWORDS` - Keywords to search (News Scraper)
- `MONITOR_STATES` - States to monitor (Legislation Monitor)
- `OPENAI_API_KEY` - OpenAI key (OpenAI Analyst)
- `GOOGLE_AI_API_KEY` - Google AI key (Google Analyst)
- `DEEPSEEK_API_KEY` - DeepSeek key (DeepSeek Analyst)

## 🐳 Docker Deployment

Each agent has its own Dockerfile for containerized deployment.

Build an agent:
```bash
docker build -f services/scout-agents/county-scraper/Dockerfile -t county-scraper .
```

Run an agent:
```bash
docker run -e SUPABASE_URL=... -e SUPABASE_SERVICE_KEY=... county-scraper
```

## 📈 Monitoring

Agents report their status to the `lead_sources` table:
- `source_name` - Agent name
- `source_type` - Agent type
- `status` - Current status (Active/Inactive/Error)
- `last_run_at` - Last execution timestamp

View in the app at `/ai-workforce`

## 🛠️ Development

### Adding a New Agent

1. Create new directory in `scout-agents/` or `analyst-agents/`
2. Copy structure from existing agent
3. Extend `BaseAgent` class
4. Implement `run()` method
5. Add Dockerfile and package.json
6. Update this README

### Modifying Agent Behavior

Edit the `run()` method in the agent's `index.js` file.

### Testing

Agents generate sample data by default. To connect to real data sources:
- Implement actual API calls in `run()` method
- Add API credentials to environment variables
- Update error handling as needed

## 🎯 Best Practices

1. **Idempotent Operations** - Agents should handle re-running safely
2. **Error Handling** - Always catch and log errors
3. **Rate Limiting** - Respect API rate limits
4. **Data Validation** - Validate before inserting into database
5. **Graceful Shutdown** - Handle SIGTERM/SIGINT properly

## 📝 Logs

Agents log to stdout with format:
```
[timestamp] [agent-name] [level] message
```

View logs:
- **Local**: Check terminal output
- **Railway**: View in Railway dashboard logs
- **Docker**: `docker logs <container-id>`

---

Built with ❤️ for automated real estate lead generation
