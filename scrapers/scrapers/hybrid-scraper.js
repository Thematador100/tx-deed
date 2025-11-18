/**
 * HYBRID COUNTY SCRAPER
 *
 * Tries multiple scraping approaches in sequence
 * Falls back to alternative methods if primary method fails
 */

import { APICountyScraper } from './api-scraper.js';
import { ConfiguredCountyScraper } from './configured-scraper.js';
import { AIDiscoveryCountyScraper } from './ai-discovery-scraper.js';

export class HybridCountyScraper {
    constructor(county, aiDetector) {
        this.county = county;
        this.aiDetector = aiDetector;
        this.strategies = this.buildStrategies();
    }

    /**
     * Build list of strategies to try in order
     */
    buildStrategies() {
        const strategies = [];

        // Try API first if available
        if (this.county.has_api) {
            strategies.push({
                name: 'API',
                scraper: new APICountyScraper(this.county)
            });
        }

        // Try configured scraper if patterns exist
        if (this.county.scraper_config && Object.keys(this.county.scraper_config).length > 0) {
            strategies.push({
                name: 'Configured',
                scraper: new ConfiguredCountyScraper(this.county)
            });
        }

        // Always have AI discovery as fallback
        strategies.push({
            name: 'AI Discovery',
            scraper: new AIDiscoveryCountyScraper(this.county, this.aiDetector)
        });

        return strategies;
    }

    /**
     * Attempt scraping with multiple strategies
     */
    async scrape() {
        console.log(`🔀 Hybrid Scraper: ${this.county.county_name}, ${this.county.state_code}`);
        console.log(`   Trying ${this.strategies.length} strategies...`);

        let lastError = null;

        for (const strategy of this.strategies) {
            try {
                console.log(`   Attempting: ${strategy.name}`);
                const result = await strategy.scraper.scrape();

                if (result.success && result.properties && result.properties.length > 0) {
                    console.log(`   ✓ Success with ${strategy.name}`);
                    return result;
                } else {
                    console.log(`   ⚠ ${strategy.name} returned no data, trying next strategy...`);
                }
            } catch (error) {
                console.log(`   ✗ ${strategy.name} failed: ${error.message}`);
                lastError = error;
                // Continue to next strategy
            }
        }

        // All strategies failed
        throw new Error(
            `All scraping strategies failed. Last error: ${lastError?.message || 'Unknown'}`
        );
    }
}

export default HybridCountyScraper;
