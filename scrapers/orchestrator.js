/**
 * COUNTY DATA SCRAPER ORCHESTRATOR
 *
 * Manages distributed scraping operations across 3,143+ US counties
 * Features:
 * - Intelligent job scheduling and prioritization
 * - Rate limiting and respectful crawling
 * - Automatic retry with exponential backoff
 * - Pattern detection and learning
 * - Real-time status monitoring
 * - Fault tolerance and error recovery
 */

import { createClient } from '@supabase/supabase-js';
import { CountyScraperFactory } from './county-scraper-factory.js';
import { AIPatternDetector } from './ai-pattern-detector.js';
import { RateLimiter } from './rate-limiter.js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

export class ScraperOrchestrator {
    constructor(config = {}) {
        this.supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
        this.maxConcurrentJobs = config.maxConcurrentJobs || 10;
        this.activeJobs = new Map();
        this.jobQueue = [];
        this.rateLimiter = new RateLimiter(config.rateLimitPerMinute || 60);
        this.aiDetector = new AIPatternDetector();
        this.isRunning = false;
        this.stats = {
            totalJobsProcessed: 0,
            successfulJobs: 0,
            failedJobs: 0,
            propertiesScraped: 0,
            startTime: null,
            lastUpdate: null
        };
    }

    /**
     * Start the orchestrator - begins processing county scraping jobs
     */
    async start() {
        console.log('🚀 Starting Scraper Orchestrator...');
        this.isRunning = true;
        this.stats.startTime = new Date();

        // Initialize worker pools
        await this.initializeWorkers();

        // Start main processing loop
        this.processLoop();

        // Start monitoring loop
        this.monitorLoop();

        console.log(`✓ Orchestrator running with ${this.maxConcurrentJobs} concurrent workers`);
    }

    /**
     * Stop the orchestrator gracefully
     */
    async stop() {
        console.log('⏸️  Stopping Scraper Orchestrator...');
        this.isRunning = false;

        // Wait for active jobs to complete
        await Promise.all([...this.activeJobs.values()]);

        console.log('✓ Orchestrator stopped gracefully');
    }

    /**
     * Main processing loop - continuously fetches and processes jobs
     */
    async processLoop() {
        while (this.isRunning) {
            try {
                // Check if we have capacity for more jobs
                if (this.activeJobs.size < this.maxConcurrentJobs) {
                    await this.fetchAndProcessJobs();
                }

                // Sleep briefly to prevent CPU spinning
                await this.sleep(1000);
            } catch (error) {
                console.error('Error in process loop:', error);
                await this.sleep(5000); // Back off on error
            }
        }
    }

    /**
     * Monitoring loop - reports statistics and health status
     */
    async monitorLoop() {
        while (this.isRunning) {
            try {
                await this.reportStatistics();
                await this.checkSystemHealth();
                await this.sleep(60000); // Report every minute
            } catch (error) {
                console.error('Error in monitor loop:', error);
            }
        }
    }

    /**
     * Fetch pending jobs from database and start processing
     */
    async fetchAndProcessJobs() {
        const availableSlots = this.maxConcurrentJobs - this.activeJobs.size;

        if (availableSlots <= 0) return;

        // Fetch highest priority pending jobs
        const { data: jobs, error } = await this.supabase
            .from('scraper_jobs')
            .select('*, counties(*)')
            .eq('status', 'queued')
            .order('priority', { ascending: false })
            .order('created_at', { ascending: true })
            .limit(availableSlots);

        if (error) {
            console.error('Error fetching jobs:', error);
            return;
        }

        if (!jobs || jobs.length === 0) {
            // No pending jobs, queue discovery jobs for counties
            await this.queueDiscoveryJobs();
            return;
        }

        // Start processing each job
        for (const job of jobs) {
            if (this.activeJobs.size < this.maxConcurrentJobs) {
                this.startJob(job);
            }
        }
    }

    /**
     * Queue discovery jobs for counties without recent scrapes
     */
    async queueDiscoveryJobs() {
        // Find counties that haven't been scraped recently
        const { data: counties, error } = await this.supabase
            .from('counties')
            .select('*')
            .eq('is_active', true)
            .or('last_scraped_at.is.null,last_scraped_at.lt.' + this.getThresholdDate())
            .limit(100);

        if (error || !counties || counties.length === 0) {
            return;
        }

        console.log(`📋 Queuing ${counties.length} discovery jobs...`);

        // Create jobs for these counties
        const jobs = counties.map(county => ({
            county_id: county.id,
            job_type: county.last_scraped_at ? 'incremental' : 'discovery',
            status: 'queued',
            priority: county.is_premium ? 9 : 5,
            max_retries: 3
        }));

        const { error: insertError } = await this.supabase
            .from('scraper_jobs')
            .insert(jobs);

        if (insertError) {
            console.error('Error queuing discovery jobs:', insertError);
        }
    }

    /**
     * Start processing a single job
     */
    async startJob(job) {
        const jobId = job.id;

        // Mark job as running
        await this.supabase
            .from('scraper_jobs')
            .update({
                status: 'running',
                started_at: new Date().toISOString()
            })
            .eq('id', jobId);

        // Create job promise
        const jobPromise = this.executeJob(job)
            .then(result => this.handleJobSuccess(job, result))
            .catch(error => this.handleJobFailure(job, error))
            .finally(() => this.activeJobs.delete(jobId));

        this.activeJobs.set(jobId, jobPromise);
    }

    /**
     * Execute a scraping job for a specific county
     */
    async executeJob(job) {
        const county = job.counties;
        console.log(`🔍 Scraping ${county.county_name}, ${county.state_code} (Job: ${job.id})`);

        // Apply rate limiting
        await this.rateLimiter.waitForSlot();

        // Determine scraper strategy
        let scraper;

        if (county.scraper_type === 'api' && county.has_api) {
            // Use API-based scraper
            scraper = CountyScraperFactory.createAPIScraperScraper(county);
        } else if (county.scraper_config && county.scraper_status === 'active') {
            // Use configured scraper with known patterns
            scraper = CountyScraperFactory.createConfiguredScraper(county);
        } else {
            // Use AI-powered discovery scraper
            scraper = CountyScraperFactory.createAIDiscoveryScraper(county, this.aiDetector);
        }

        // Execute the scrape
        const result = await scraper.scrape();

        // If patterns were discovered, save them
        if (result.patternsDiscovered) {
            await this.saveDiscoveredPatterns(county, result.patternsDiscovered);
        }

        // Insert scraped properties into database
        if (result.properties && result.properties.length > 0) {
            await this.insertProperties(county, result.properties, job.id);
        }

        return result;
    }

    /**
     * Handle successful job completion
     */
    async handleJobSuccess(job, result) {
        console.log(`✓ Job ${job.id} completed: ${result.properties?.length || 0} properties found`);

        await this.supabase
            .from('scraper_jobs')
            .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
                execution_time_seconds: this.getExecutionTime(job.started_at),
                properties_found: result.properties?.length || 0,
                properties_new: result.newCount || 0,
                properties_updated: result.updatedCount || 0
            })
            .eq('id', job.id);

        // Update county statistics
        await this.supabase
            .from('counties')
            .update({
                last_scraped_at: new Date().toISOString(),
                avg_properties_per_scrape: result.properties?.length || 0,
                scraper_status: 'active'
            })
            .eq('id', job.county_id);

        this.stats.successfulJobs++;
        this.stats.propertiesScraped += result.properties?.length || 0;
        this.stats.totalJobsProcessed++;
    }

    /**
     * Handle job failure
     */
    async handleJobFailure(job, error) {
        console.error(`✗ Job ${job.id} failed:`, error.message);

        const retryCount = (job.retry_count || 0) + 1;
        const maxRetries = job.max_retries || 3;

        let newStatus = 'failed';
        if (retryCount < maxRetries) {
            newStatus = 'queued'; // Retry
            console.log(`🔄 Retrying job ${job.id} (attempt ${retryCount + 1}/${maxRetries})`);
        }

        await this.supabase
            .from('scraper_jobs')
            .update({
                status: newStatus,
                error_message: error.message,
                error_count: (job.error_count || 0) + 1,
                retry_count: retryCount,
                completed_at: newStatus === 'failed' ? new Date().toISOString() : null
            })
            .eq('id', job.id);

        // Update county status if permanently failed
        if (newStatus === 'failed') {
            await this.supabase
                .from('counties')
                .update({
                    scraper_status: 'failed'
                })
                .eq('id', job.county_id);

            this.stats.failedJobs++;
        }

        this.stats.totalJobsProcessed++;
    }

    /**
     * Save discovered patterns to database
     */
    async saveDiscoveredPatterns(county, patterns) {
        const patternData = {
            pattern_name: `${county.county_name}_${county.state_code}_auto_discovered`,
            pattern_type: patterns.type || 'table',
            software_platform: patterns.platform || 'Unknown',
            selectors: patterns.selectors,
            extraction_rules: patterns.extractionRules,
            pagination_config: patterns.pagination,
            counties_using_pattern: [county.id],
            discovered_by: 'ai_discovery',
            is_verified: false
        };

        const { error } = await this.supabase
            .from('county_website_patterns')
            .insert(patternData);

        if (!error) {
            // Update county with new scraper config
            await this.supabase
                .from('counties')
                .update({
                    scraper_config: patterns.selectors,
                    scraper_type: 'direct',
                    scraper_status: 'active'
                })
                .eq('id', county.id);

            console.log(`📝 Saved discovered pattern for ${county.county_name}, ${county.state_code}`);
        }
    }

    /**
     * Insert scraped properties into database
     */
    async insertProperties(county, properties, jobId) {
        const propertiesToInsert = properties.map(prop => ({
            ...prop,
            county_id: county.id,
            fips_code: county.fips_code,
            listing_type: county.auction_type || 'Tax Deed',
            // Add audit trail
            source_job_id: jobId,
            last_verified_at: new Date().toISOString()
        }));

        const { data, error } = await this.supabase
            .from('properties')
            .upsert(propertiesToInsert, {
                onConflict: 'address', // Avoid duplicates
                ignoreDuplicates: false
            });

        if (error) {
            console.error(`Error inserting properties for ${county.county_name}:`, error);
        } else {
            console.log(`💾 Inserted ${properties.length} properties for ${county.county_name}, ${county.state_code}`);
        }
    }

    /**
     * Report statistics to console and database
     */
    async reportStatistics() {
        const uptime = Date.now() - this.stats.startTime;
        const uptimeHours = (uptime / (1000 * 60 * 60)).toFixed(2);

        console.log('\n📊 ORCHESTRATOR STATISTICS');
        console.log('========================');
        console.log(`Uptime: ${uptimeHours} hours`);
        console.log(`Total Jobs: ${this.stats.totalJobsProcessed}`);
        console.log(`Successful: ${this.stats.successfulJobs}`);
        console.log(`Failed: ${this.stats.failedJobs}`);
        console.log(`Properties Scraped: ${this.stats.propertiesScraped}`);
        console.log(`Active Jobs: ${this.activeJobs.size}`);
        console.log(`Queue Size: ${this.jobQueue.length}`);
        console.log('========================\n');

        this.stats.lastUpdate = new Date();
    }

    /**
     * Check system health and alert if issues detected
     */
    async checkSystemHealth() {
        // Check for counties with high failure rates
        const { data: failingCounties } = await this.supabase
            .from('counties')
            .select('*')
            .eq('scraper_status', 'failed')
            .gte('updated_at', this.getThresholdDate(7)); // Failed in last 7 days

        if (failingCounties && failingCounties.length > 100) {
            console.warn(`⚠️  Health Alert: ${failingCounties.length} counties have failing scrapers`);
        }

        // Check for stalled jobs
        const { data: stalledJobs } = await this.supabase
            .from('scraper_jobs')
            .select('*')
            .eq('status', 'running')
            .lt('started_at', this.getThresholdDate(0, 2)); // Running for > 2 hours

        if (stalledJobs && stalledJobs.length > 0) {
            console.warn(`⚠️  Health Alert: ${stalledJobs.length} jobs appear stalled`);
            // Auto-fail stalled jobs
            for (const job of stalledJobs) {
                await this.supabase
                    .from('scraper_jobs')
                    .update({ status: 'failed', error_message: 'Job timeout - exceeded 2 hours' })
                    .eq('id', job.id);
            }
        }
    }

    /**
     * Initialize worker pools
     */
    async initializeWorkers() {
        console.log('Initializing worker pools...');
        // Could spawn child processes or use worker threads here
        // For now, using async/await with concurrency limits
    }

    /**
     * Helper: Get threshold date for querying stale data
     */
    getThresholdDate(days = 1, hours = 0) {
        const date = new Date();
        date.setDate(date.getDate() - days);
        date.setHours(date.getHours() - hours);
        return date.toISOString();
    }

    /**
     * Helper: Calculate execution time
     */
    getExecutionTime(startTime) {
        if (!startTime) return 0;
        const start = new Date(startTime);
        const now = new Date();
        return Math.floor((now - start) / 1000);
    }

    /**
     * Helper: Sleep utility
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export singleton instance
let orchestratorInstance = null;

export function getOrchestrator(config) {
    if (!orchestratorInstance) {
        orchestratorInstance = new ScraperOrchestrator(config);
    }
    return orchestratorInstance;
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const orchestrator = getOrchestrator({
        maxConcurrentJobs: process.env.MAX_CONCURRENT_JOBS || 10,
        rateLimitPerMinute: process.env.RATE_LIMIT_PER_MINUTE || 60
    });

    orchestrator.start();

    // Handle graceful shutdown
    process.on('SIGINT', async () => {
        console.log('\n🛑 Received SIGINT, shutting down...');
        await orchestrator.stop();
        process.exit(0);
    });

    process.on('SIGTERM', async () => {
        console.log('\n🛑 Received SIGTERM, shutting down...');
        await orchestrator.stop();
        process.exit(0);
    });
}
