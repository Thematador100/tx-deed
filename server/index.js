/**
 * Scraper Server Entry Point
 *
 * Initializes and manages the scraper system.
 * This should be run as a separate Node.js process.
 *
 * Usage:
 *   node server/index.js
 *
 * Environment Variables:
 *   SUPABASE_URL - Your Supabase project URL
 *   SUPABASE_SERVICE_KEY - Your Supabase service role key (not anon key!)
 *   SCRAPER_SCHEDULE - Cron schedule (default: '0 2 * * *' - 2 AM daily)
 *   MAX_CONCURRENT_SCRAPERS - Max concurrent scrapers (default: 3)
 *   PORT - API server port (default: 3001)
 */

import AutonomousAgent from './lib/AutonomousAgent.js';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Autonomous Agent - handles everything automatically
const agent = new AutonomousAgent({
  checkInterval: 60000, // Health check every minute
  maxRetries: 5,
  retryDelay: 300000, // 5 minutes
  autoRestart: true, // Auto-restart on critical failures
  runInitialScrape: process.env.RUN_INITIAL_SCRAPE === 'true',
});

// API Routes

/**
 * Health check
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
});

/**
 * Get agent status (includes scraper status)
 */
app.get('/api/scrapers/status', (req, res) => {
  res.json(agent.getStatus());
});

/**
 * Get scraper statistics
 */
app.get('/api/scrapers/stats', async (req, res) => {
  try {
    const managerStats = agent.scraperManager?.getStats() || {};
    const dbStats = await agent.dbManager?.getScraperStats() || {};

    res.json({
      agent: agent.getStatus(),
      manager: managerStats,
      database: dbStats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start scraping all counties
 */
app.post('/api/scrapers/scrape-all', async (req, res) => {
  try {
    if (!agent.scraperManager) {
      return res.status(503).json({ error: 'Scraper not initialized' });
    }

    agent.scraperManager.scrapeAllCounties();
    res.json({
      message: 'Scraping started for all active counties',
      status: agent.getStatus(),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Scrape specific county
 */
app.post('/api/scrapers/scrape/:countyId', async (req, res) => {
  try {
    if (!agent.scraperManager) {
      return res.status(503).json({ error: 'Scraper not initialized' });
    }

    const { countyId } = req.params;
    const result = await agent.scraperManager.scrapeCounty(countyId);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Start scheduler
 */
app.post('/api/scrapers/scheduler/start', (req, res) => {
  try {
    if (!agent.scraperManager) {
      return res.status(503).json({ error: 'Scraper not initialized' });
    }

    agent.scraperManager.startScheduler();
    res.json({
      message: 'Scheduler started',
      schedule: agent.scraperManager.config.scheduleCron,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Stop scheduler
 */
app.post('/api/scrapers/scheduler/stop', (req, res) => {
  try {
    if (!agent.scraperManager) {
      return res.status(503).json({ error: 'Scraper not initialized' });
    }

    agent.scraperManager.stopScheduler();
    res.json({ message: 'Scheduler stopped' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Clear scraper history
 */
app.post('/api/scrapers/clear-history', (req, res) => {
  try {
    if (!agent.scraperManager) {
      return res.status(503).json({ error: 'Scraper not initialized' });
    }

    agent.scraperManager.clearHistory();
    res.json({ message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Get recent scraper runs from database
 */
app.get('/api/scrapers/runs', async (req, res) => {
  try {
    if (!agent.dbManager) {
      return res.status(503).json({ error: 'Database not initialized' });
    }

    const limit = parseInt(req.query.limit) || 10;
    const runs = await agent.dbManager.getRecentRuns(limit);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start server
async function start() {
  try {
    console.log('[Server] 🚀 Starting autonomous scraper system...');
    console.log('[Server] 🤖 Mode: Fully Autonomous (24/7)');

    // Start autonomous agent - it handles everything automatically
    await agent.start();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`[Server] ✅ API server listening on port ${PORT}`);
      console.log(`[Server] 🏥 Health check: http://localhost:${PORT}/health`);
      console.log(`[Server] 📊 Status: http://localhost:${PORT}/api/scrapers/status`);
      console.log(`[Server] 🤖 Autonomous agent is managing all operations`);
      console.log(`[Server] 💾 Database operations are automatic`);
      console.log(`[Server] 🔄 System will self-heal from errors`);
    });

  } catch (error) {
    console.error('[Server] ❌ Failed to start:', error);

    // Autonomous agent will auto-restart
    console.log('[Server] 🔄 Auto-restart will trigger in 5 minutes...');
    setTimeout(start, 300000);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down gracefully...');
  await agent.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, shutting down gracefully...');
  await agent.stop();
  process.exit(0);
});

// Handle uncaught errors - agent will auto-recover
process.on('uncaughtException', (error) => {
  console.error('[Server] 💥 Uncaught exception:', error);
  console.log('[Server] 🔄 Autonomous agent will handle recovery...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('[Server] 💥 Unhandled rejection at:', promise, 'reason:', reason);
  console.log('[Server] 🔄 Autonomous agent will handle recovery...');
});

// Start the server
start();

export { agent };
