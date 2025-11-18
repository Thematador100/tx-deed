/**
 * CONFIGURED COUNTY SCRAPER
 *
 * Uses pre-configured selectors and patterns for counties
 * with known website structures
 */

import axios from 'axios';
import * as cheerio from 'cheerio';

export class ConfiguredCountyScraper {
    constructor(county) {
        this.county = county;
        this.config = county.scraper_config || {};
    }

    /**
     * Perform the scraping operation using configured patterns
     */
    async scrape() {
        console.log(`⚙️  Configured Scraper: ${this.county.county_name}, ${this.county.state_code}`);

        try {
            const url = this.county.tax_deed_website_url || this.county.auction_calendar_url;

            if (!url) {
                throw new Error('No website URL configured');
            }

            // Fetch the page
            const html = await this.fetchPage(url);

            // Extract data using configured selectors
            const properties = await this.extractData(html);

            console.log(`   ✓ Extracted ${properties.length} properties`);

            return {
                success: true,
                properties,
                newCount: properties.length,
                updatedCount: 0
            };
        } catch (error) {
            console.error(`   ✗ Scraping failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Fetch page content
     */
    async fetchPage(url) {
        const response = await axios.get(url, {
            timeout: 10000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        return response.data;
    }

    /**
     * Extract property data using configured selectors
     */
    async extractData(html) {
        const $ = cheerio.load(html);
        const properties = [];
        const selectors = this.config.selectors || {};

        // Determine row/item selector
        const itemSelector = selectors.rowSelector || selectors.itemSelector || selectors.cardSelector;

        if (!itemSelector) {
            throw new Error('No item selector configured');
        }

        const items = $(itemSelector);

        items.each((i, item) => {
            const $item = $(item);
            const property = {};

            // Extract each field using configured selectors
            if (selectors.propertyId) {
                property.external_id = $item.find(selectors.propertyId).first().text().trim();
            }

            if (selectors.address) {
                property.address = $item.find(selectors.address).first().text().trim();
            }

            if (selectors.owner) {
                property.owner_name = $item.find(selectors.owner).first().text().trim();
            }

            if (selectors.assessedValue) {
                const value = $item.find(selectors.assessedValue).first().text().trim();
                property.estimated_value = this.parseNumber(value);
            }

            if (selectors.openingBid) {
                const bid = $item.find(selectors.openingBid).first().text().trim();
                property.price = this.parseNumber(bid);
            }

            if (selectors.saleDate) {
                const date = $item.find(selectors.saleDate).first().text().trim();
                property.auction_date = this.parseDate(date);
            }

            // Set defaults
            property.listing_type = this.county.auction_type || 'Tax Deed';
            property.opportunity_score = Math.floor(Math.random() * 30) + 70;

            // Only add if we have minimum required fields
            if (property.address) {
                properties.push(property);
            }
        });

        return properties;
    }

    /**
     * Parse numeric value from text
     */
    parseNumber(text) {
        const match = text.match(/[\d,]+\.?\d*/);
        if (match) {
            return parseFloat(match[0].replace(/,/g, ''));
        }
        return null;
    }

    /**
     * Parse date from text
     */
    parseDate(text) {
        const date = new Date(text);
        if (!isNaN(date.getTime())) {
            return date.toISOString();
        }
        return null;
    }
}

export default ConfiguredCountyScraper;
