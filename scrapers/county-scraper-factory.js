/**
 * COUNTY SCRAPER FACTORY
 *
 * Creates appropriate scraper instances based on county configuration
 * Supports multiple scraper types:
 * - API-based scrapers (for counties with public APIs)
 * - Configured scrapers (using known patterns)
 * - AI discovery scrapers (learns new patterns)
 * - Hybrid scrapers (combines multiple approaches)
 */

import { APICountyScraper } from './scrapers/api-scraper.js';
import { ConfiguredCountyScraper } from './scrapers/configured-scraper.js';
import { AIDiscoveryCountyScraper } from './scrapers/ai-discovery-scraper.js';
import { HybridCountyScraper } from './scrapers/hybrid-scraper.js';

export class CountyScraperFactory {
    /**
     * Create an API-based scraper for counties with public APIs
     */
    static createAPIScraper(county) {
        return new APICountyScraper(county);
    }

    /**
     * Create a configured scraper using known patterns
     */
    static createConfiguredScraper(county) {
        return new ConfiguredCountyScraper(county);
    }

    /**
     * Create an AI-powered discovery scraper
     */
    static createAIDiscoveryScraper(county, aiDetector) {
        return new AIDiscoveryCountyScraper(county, aiDetector);
    }

    /**
     * Create a hybrid scraper that tries multiple approaches
     */
    static createHybridScraper(county, aiDetector) {
        return new HybridCountyScraper(county, aiDetector);
    }

    /**
     * Auto-select the best scraper type for a county
     */
    static createBestScraper(county, aiDetector) {
        if (county.has_api && county.scraper_type === 'api') {
            return this.createAPIScraper(county);
        } else if (county.scraper_config && county.scraper_status === 'active') {
            return this.createConfiguredScraper(county);
        } else if (county.scraper_status === 'failed') {
            // Try hybrid approach for previously failed scrapers
            return this.createHybridScraper(county, aiDetector);
        } else {
            // Default to AI discovery for new counties
            return this.createAIDiscoveryScraper(county, aiDetector);
        }
    }
}

export default CountyScraperFactory;
