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

import ScraperManager from './lib/ScraperManager.js';
import DatabaseManager from './lib/DatabaseManager.js';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize managers
const dbManager = new DatabaseManager(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const scraperManager = new ScraperManager({
  maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SCRAPERS) || 3,
  scheduleCron: process.env.SCRAPER_SCHEDULE || '0 2 * * *',
  autoStart: process.env.AUTO_START_SCHEDULER === 'true',

  // Callback when data is scraped
  onDataScraped: async (data) => {
    try {
      await dbManager.saveProperty(data);
    } catch (error) {
      console.error('[Server] Error saving scraped data:', error);
    }
  },

  // Callback for errors
  onError: async (error, context) => {
    console.error('[Server] Scraper error:', error.message, context);
  },
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
 * Get scraper status
 */
app.get('/api/scrapers/status', (req, res) => {
  res.json(scraperManager.getStatus());
});

/**
 * Get scraper statistics
 */
app.get('/api/scrapers/stats', async (req, res) => {
  try {
    const managerStats = scraperManager.getStats();
    const dbStats = await dbManager.getScraperStats();

    res.json({
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
    scraperManager.scrapeAllCounties();
    res.json({
      message: 'Scraping started for all active counties',
      status: scraperManager.getStatus(),
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
    const { countyId } = req.params;
    const result = await scraperManager.scrapeCounty(countyId);
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
    scraperManager.startScheduler();
    res.json({
      message: 'Scheduler started',
      schedule: scraperManager.config.scheduleCron,
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
    scraperManager.stopScheduler();
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
    scraperManager.clearHistory();
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
    const limit = parseInt(req.query.limit) || 10;
    const runs = await dbManager.getRecentRuns(limit);
    res.json(runs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Initialize and start server
async function start() {
  try {
    console.log('[Server] Starting scraper server...');

    // Initialize scraper manager
    await scraperManager.initialize();

    // Start Express server
    app.listen(PORT, () => {
      console.log(`[Server] API server listening on port ${PORT}`);
      console.log(`[Server] Health check: http://localhost:${PORT}/health`);
      console.log(`[Server] Status: http://localhost:${PORT}/api/scrapers/status`);
    });

  } catch (error) {
    console.error('[Server] Failed to start:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('[Server] SIGTERM received, shutting down...');
  await scraperManager.stopAll();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('[Server] SIGINT received, shutting down...');
  await scraperManager.stopAll();
  process.exit(0);
});

// Start the server
start();

export { scraperManager, dbManager };
