/**
 * Autonomous Agent System
 *
 * This agent operates 24/7 without human intervention:
 * - Auto-starts on system boot
 * - Self-heals from errors
 * - Manages database automatically
 * - Monitors system health
 * - Auto-recovers from failures
 * - Makes intelligent decisions
 */

import ScraperManager from './ScraperManager.js';
import DatabaseManager from './DatabaseManager.js';
import SkipTracingAgent from './SkipTracingAgent.js';
import PropertyEnrichmentAgent from './PropertyEnrichmentAgent.js';
import PropertyAssignmentAgent from './PropertyAssignmentAgent.js';
import IntelligentDataParser from './IntelligentDataParser.js';
import AdvancedValuationEngine from './AdvancedValuationEngine.js';
import ProspectingAgent from './ProspectingAgent.js';
import MLDecisionEngine from './MLDecisionEngine.js';
import { getActiveCounties } from '../config/counties.config.js';

class AutonomousAgent {
  constructor(config = {}) {
    this.config = {
      checkInterval: config.checkInterval || 60000, // Check health every minute
      maxRetries: config.maxRetries || 5,
      retryDelay: config.retryDelay || 300000, // 5 minutes
      autoRestart: config.autoRestart !== false,
      maxConsecutiveFailures: config.maxConsecutiveFailures || 3,
      healthCheckTimeout: config.healthCheckTimeout || 30000,
      ...config
    };

    this.dbManager = null;
    this.scraperManager = null;
    this.skipTracingAgent = null;
    this.enrichmentAgent = null;
    this.assignmentAgent = null;
    this.dataParser = null;
    this.valuationEngine = null;
    this.prospectingAgent = null;
    this.mlDecisionEngine = null;
    this.isRunning = false;
    this.consecutiveFailures = 0;
    this.lastSuccessfulRun = null;
    this.healthCheckInterval = null;
    this.retryQueue = [];
    this.stats = {
      startTime: null,
      totalRuns: 0,
      successfulRuns: 0,
      failedRuns: 0,
      autoRecoveries: 0,
      uptime: 0,
    };
  }

  /**
   * Start the autonomous agent
   */
  async start() {
    console.log('[AutonomousAgent] 🤖 Starting autonomous operation...');
    this.stats.startTime = new Date();
    this.isRunning = true;

    try {
      // Step 1: Ensure database is ready
      await this.ensureDatabaseReady();

      // Step 2: Initialize all managers and agents
      await this.initializeManagers();

      // Step 3: Start all autonomous agents
      await this.startAllAgents();

      // Step 4: Start health monitoring
      this.startHealthMonitoring();

      // Step 5: Start scheduled scraping
      this.scraperManager.startScheduler();

      // Step 6: Run initial scrape if configured
      if (this.config.runInitialScrape) {
        console.log('[AutonomousAgent] Running initial scrape...');
        await this.runScrapingCycle();
      }

      console.log('[AutonomousAgent] ✅ Autonomous agent is now operational');
      console.log('[AutonomousAgent] 🔄 Scheduler active - will run automatically');
      console.log('[AutonomousAgent] 🏥 Health monitoring enabled');

    } catch (error) {
      console.error('[AutonomousAgent] ❌ Failed to start:', error.message);
      await this.handleCriticalFailure(error);
    }
  }

  /**
   * Ensure database is ready and create tables if needed
   */
  async ensureDatabaseReady() {
    console.log('[AutonomousAgent] 🗄️ Checking database...');

    try {
      this.dbManager = new DatabaseManager(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY
      );

      // Test connection
      await this.testDatabaseConnection();

      // Create tables if they don't exist
      await this.createTablesIfNeeded();

      console.log('[AutonomousAgent] ✅ Database is ready');

    } catch (error) {
      console.error('[AutonomousAgent] ❌ Database setup failed:', error.message);

      // Auto-retry database setup
      if (this.consecutiveFailures < this.config.maxRetries) {
        console.log(`[AutonomousAgent] 🔄 Retrying database setup in ${this.config.retryDelay/1000}s...`);
        this.consecutiveFailures++;
        await this.delay(this.config.retryDelay);
        return this.ensureDatabaseReady();
      }

      throw new Error('Database setup failed after maximum retries');
    }
  }

  /**
   * Test database connection
   */
  async testDatabaseConnection() {
    try {
      const { data, error } = await this.dbManager.supabase
        .from('properties')
        .select('id')
        .limit(1);

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      console.log('[AutonomousAgent] ✅ Database connection successful');
      return true;

    } catch (error) {
      console.error('[AutonomousAgent] ❌ Database connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Create necessary database tables automatically
   */
  async createTablesIfNeeded() {
    console.log('[AutonomousAgent] 📋 Checking required tables...');

    const createScraperRunsSQL = `
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
    `;

    try {
      // Note: Supabase doesn't support raw SQL via client library
      // Tables should be created via Supabase dashboard or migrations
      // This is a placeholder - in production, use Supabase migrations

      console.log('[AutonomousAgent] ℹ️ Ensure scraper_runs table exists in Supabase');
      console.log('[AutonomousAgent] ℹ️ Run SQL from SCRAPER_SETUP.md if not created');

      // Verify table exists by querying it
      const { error } = await this.dbManager.supabase
        .from('scraper_runs')
        .select('id')
        .limit(1);

      if (error) {
        console.warn('[AutonomousAgent] ⚠️ scraper_runs table may not exist');
        console.warn('[AutonomousAgent] ⚠️ Continuing anyway - will create records when possible');
      } else {
        console.log('[AutonomousAgent] ✅ scraper_runs table exists');
      }

    } catch (error) {
      console.warn('[AutonomousAgent] ⚠️ Table verification failed:', error.message);
      // Don't throw - continue operation
    }
  }

  /**
   * Initialize scraper manager
   */
  async initializeManagers() {
    console.log('[AutonomousAgent] 🔧 Initializing scraper manager...');

    this.scraperManager = new ScraperManager({
      maxConcurrent: parseInt(process.env.MAX_CONCURRENT_SCRAPERS) || 3,
      scheduleCron: process.env.SCRAPER_SCHEDULE || '0 2 * * *',
      autoStart: false, // We'll start it manually

      // Callback when data is scraped
      onDataScraped: async (data) => {
        await this.handleScrapedData(data);
      },

      // Callback for errors
      onError: async (error, context) => {
        await this.handleScraperError(error, context);
      },
    });

    await this.scraperManager.initialize();
    console.log('[AutonomousAgent] ✅ Scraper manager initialized');

    // Initialize core autonomous agents
    this.skipTracingAgent = new SkipTracingAgent(this.dbManager);
    this.enrichmentAgent = new PropertyEnrichmentAgent(this.dbManager);
    this.assignmentAgent = new PropertyAssignmentAgent(this.dbManager);

    // Initialize enterprise-level agents
    this.dataParser = new IntelligentDataParser(this.dbManager);
    this.valuationEngine = new AdvancedValuationEngine(this.dbManager);
    this.prospectingAgent = new ProspectingAgent(this.dbManager);
    this.mlDecisionEngine = new MLDecisionEngine(this.dbManager);

    console.log('[AutonomousAgent] ✅ All agents initialized');
    console.log('[AutonomousAgent] 🏢 Enterprise features: Data Parser, Valuation Engine, Prospecting, ML Decisions');
  }

  /**
   * Start all autonomous agents
   */
  async startAllAgents() {
    console.log('[AutonomousAgent] 🚀 Starting all autonomous agents...');

    // Start core autonomous agents
    this.skipTracingAgent.start().catch(error => {
      console.error('[AutonomousAgent] Skip tracing agent error:', error);
    });

    this.enrichmentAgent.start().catch(error => {
      console.error('[AutonomousAgent] Enrichment agent error:', error);
    });

    this.assignmentAgent.start().catch(error => {
      console.error('[AutonomousAgent] Assignment agent error:', error);
    });

    // Start enterprise-level autonomous agents
    this.prospectingAgent.start().catch(error => {
      console.error('[AutonomousAgent] Prospecting agent error:', error);
    });

    this.mlDecisionEngine.start().catch(error => {
      console.error('[AutonomousAgent] ML decision engine error:', error);
    });

    console.log('[AutonomousAgent] ✅ All agents started');
    console.log('[AutonomousAgent] 🕵️ Skip Tracing: Finding family members & contacts');
    console.log('[AutonomousAgent] 📊 Enrichment: Building comprehensive property reports');
    console.log('[AutonomousAgent] 🎯 Assignment: Managing property assignments to members');
    console.log('[AutonomousAgent] 🎯 Prospecting: Generating leads and business opportunities');
    console.log('[AutonomousAgent] 🧠 ML Decisions: Making intelligent investment decisions');
  }

  /**
   * Handle scraped data - save to database automatically
   */
  async handleScrapedData(data) {
    try {
      await this.dbManager.saveProperty(data);
      console.log(`[AutonomousAgent] 💾 Saved: ${data.address || data.parcel_id}`);
    } catch (error) {
      console.error('[AutonomousAgent] ❌ Failed to save property:', error.message);

      // Add to retry queue
      this.retryQueue.push({
        type: 'save_property',
        data,
        attempts: 0,
        addedAt: new Date(),
      });

      // Auto-retry
      await this.processRetryQueue();
    }
  }

  /**
   * Handle scraper errors with intelligent recovery
   */
  async handleScraperError(error, context) {
    console.error('[AutonomousAgent] ⚠️ Scraper error:', error.message, context);

    this.consecutiveFailures++;

    // Auto-recovery strategies
    if (this.consecutiveFailures >= this.config.maxConsecutiveFailures) {
      console.log('[AutonomousAgent] 🔄 Too many failures, initiating auto-recovery...');
      await this.autoRecover();
    }
  }

  /**
   * Process retry queue
   */
  async processRetryQueue() {
    if (this.retryQueue.length === 0) return;

    console.log(`[AutonomousAgent] 🔄 Processing retry queue (${this.retryQueue.length} items)...`);

    const toRetry = [...this.retryQueue];
    this.retryQueue = [];

    for (const item of toRetry) {
      try {
        if (item.type === 'save_property') {
          await this.dbManager.saveProperty(item.data);
          console.log(`[AutonomousAgent] ✅ Retry successful: ${item.data.address}`);
        }
      } catch (error) {
        item.attempts++;

        if (item.attempts < this.config.maxRetries) {
          console.log(`[AutonomousAgent] 🔄 Retry failed, will try again (${item.attempts}/${this.config.maxRetries})`);
          this.retryQueue.push(item);
        } else {
          console.error(`[AutonomousAgent] ❌ Max retries exceeded for ${item.data.address}`);
        }
      }
    }
  }

  /**
   * Run a complete scraping cycle
   */
  async runScrapingCycle() {
    console.log('[AutonomousAgent] 🚀 Starting scraping cycle...');
    this.stats.totalRuns++;

    try {
      const counties = getActiveCounties();
      console.log(`[AutonomousAgent] 📍 Queuing ${counties.length} counties...`);

      for (const county of counties) {
        this.scraperManager.addToQueue({
          type: 'county',
          county,
        });
      }

      const results = await this.scraperManager.processQueue();

      this.consecutiveFailures = 0; // Reset on success
      this.lastSuccessfulRun = new Date();
      this.stats.successfulRuns++;

      console.log('[AutonomousAgent] ✅ Scraping cycle completed:', results);

      // Process any retries
      await this.processRetryQueue();

      return results;

    } catch (error) {
      this.stats.failedRuns++;
      console.error('[AutonomousAgent] ❌ Scraping cycle failed:', error.message);
      await this.handleScraperError(error, { phase: 'scraping_cycle' });
      throw error;
    }
  }

  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    console.log('[AutonomousAgent] 🏥 Starting health monitoring...');

    this.healthCheckInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.config.checkInterval);
  }

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    try {
      const health = {
        timestamp: new Date(),
        database: await this.checkDatabaseHealth(),
        scraper: this.checkScraperHealth(),
        skipTracing: this.checkAgentHealth(this.skipTracingAgent, 'SkipTracing'),
        enrichment: this.checkAgentHealth(this.enrichmentAgent, 'Enrichment'),
        assignment: this.checkAgentHealth(this.assignmentAgent, 'Assignment'),
        prospecting: this.checkAgentHealth(this.prospectingAgent, 'Prospecting'),
        mlDecisions: this.checkAgentHealth(this.mlDecisionEngine, 'MLDecisions'),
        system: this.checkSystemHealth(),
      };

      // Auto-recovery if needed
      if (!health.database.healthy || !health.scraper.healthy) {
        console.log('[AutonomousAgent] ⚠️ Health check failed, initiating recovery...');
        await this.autoRecover();
      }

      // Update uptime
      this.stats.uptime = Date.now() - this.stats.startTime;

    } catch (error) {
      console.error('[AutonomousAgent] ❌ Health check failed:', error.message);
    }
  }

  /**
   * Check database health
   */
  async checkDatabaseHealth() {
    try {
      const { data, error } = await this.dbManager.supabase
        .from('properties')
        .select('id')
        .limit(1);

      if (error) throw error;

      return { healthy: true, message: 'Database connection OK' };
    } catch (error) {
      return { healthy: false, message: error.message };
    }
  }

  /**
   * Check scraper health
   */
  checkScraperHealth() {
    if (!this.scraperManager || !this.scraperManager.isRunning) {
      return { healthy: true, message: 'Scraper idle (normal)' };
    }

    const status = this.scraperManager.getStatus();

    return {
      healthy: true,
      message: 'Scraper operational',
      details: status,
    };
  }

  /**
   * Check individual agent health
   */
  checkAgentHealth(agent, name) {
    if (!agent) {
      return { healthy: false, message: `${name} agent not initialized` };
    }

    if (!agent.isRunning) {
      return { healthy: false, message: `${name} agent not running` };
    }

    return {
      healthy: true,
      message: `${name} agent operational`,
      stats: agent.getStats(),
    };
  }

  /**
   * Check system health
   */
  checkSystemHealth() {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      healthy: true,
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB',
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
      },
      uptime: Math.round(uptime / 60) + ' minutes',
    };
  }

  /**
   * Auto-recovery mechanism
   */
  async autoRecover() {
    console.log('[AutonomousAgent] 🔄 Starting auto-recovery...');
    this.stats.autoRecoveries++;

    try {
      // Step 1: Clear retry queue
      console.log('[AutonomousAgent] 1/4 Clearing retry queue...');
      this.retryQueue = [];

      // Step 2: Reinitialize database connection
      console.log('[AutonomousAgent] 2/4 Reinitializing database...');
      await this.ensureDatabaseReady();

      // Step 3: Restart scraper manager
      console.log('[AutonomousAgent] 3/4 Restarting scraper manager...');
      if (this.scraperManager) {
        await this.scraperManager.stopAll();
      }
      await this.initializeManagers();
      this.scraperManager.startScheduler();

      // Step 4: Reset failure counter
      console.log('[AutonomousAgent] 4/4 Resetting counters...');
      this.consecutiveFailures = 0;

      console.log('[AutonomousAgent] ✅ Auto-recovery completed successfully');

    } catch (error) {
      console.error('[AutonomousAgent] ❌ Auto-recovery failed:', error.message);

      // Wait and try again
      if (this.config.autoRestart) {
        console.log('[AutonomousAgent] 🔄 Will retry recovery in 5 minutes...');
        await this.delay(300000);
        await this.autoRecover();
      }
    }
  }

  /**
   * Handle critical failure
   */
  async handleCriticalFailure(error) {
    console.error('[AutonomousAgent] 💥 CRITICAL FAILURE:', error.message);

    if (this.config.autoRestart) {
      console.log('[AutonomousAgent] 🔄 Auto-restart enabled, restarting in 5 minutes...');
      await this.delay(300000);

      // Clear state and restart
      this.consecutiveFailures = 0;
      await this.start();
    } else {
      console.error('[AutonomousAgent] ❌ Auto-restart disabled, exiting...');
      process.exit(1);
    }
  }

  /**
   * Get agent status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      stats: {
        ...this.stats,
        uptime: Date.now() - this.stats.startTime,
        uptimeFormatted: this.formatUptime(Date.now() - this.stats.startTime),
      },
      health: {
        consecutiveFailures: this.consecutiveFailures,
        lastSuccessfulRun: this.lastSuccessfulRun,
        retryQueueLength: this.retryQueue.length,
      },
      agents: {
        scraper: this.scraperManager?.getStatus() || null,
        skipTracing: this.skipTracingAgent?.getStats() || null,
        enrichment: this.enrichmentAgent?.getStats() || null,
        assignment: this.assignmentAgent?.getStats() || null,
        dataParser: this.dataParser?.getStats() || null,
        valuation: this.valuationEngine?.getStats() || null,
        prospecting: this.prospectingAgent?.getStats() || null,
        mlDecisions: this.mlDecisionEngine?.getStats() || null,
      },
    };
  }

  /**
   * Format uptime
   */
  formatUptime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Stop the autonomous agent
   */
  async stop() {
    console.log('[AutonomousAgent] 🛑 Stopping autonomous agent...');

    this.isRunning = false;

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Stop all agents
    if (this.scraperManager) {
      await this.scraperManager.stopAll();
    }

    if (this.skipTracingAgent) {
      await this.skipTracingAgent.stop();
    }

    if (this.enrichmentAgent) {
      await this.enrichmentAgent.stop();
    }

    if (this.assignmentAgent) {
      await this.assignmentAgent.stop();
    }

    if (this.prospectingAgent) {
      await this.prospectingAgent.stop();
    }

    if (this.mlDecisionEngine) {
      await this.mlDecisionEngine.stop();
    }

    console.log('[AutonomousAgent] ✅ All agents stopped gracefully');
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default AutonomousAgent;
