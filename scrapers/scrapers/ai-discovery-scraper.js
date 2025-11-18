/**
 * AI DISCOVERY SCRAPER
 *
 * Intelligently explores county websites and learns how to scrape them
 * Uses AI pattern detection to automatically configure scrapers
 */

import puppeteer from 'puppeteer';
import axios from 'axios';

export class AIDiscoveryCountyScraper {
    constructor(county, aiDetector) {
        this.county = county;
        this.aiDetector = aiDetector;
        this.browser = null;
    }

    /**
     * Perform the scraping operation
     */
    async scrape() {
        console.log(`🤖 AI Discovery Scraper: ${this.county.county_name}, ${this.county.state_code}`);

        try {
            // Step 1: Discover the county's tax sale page
            const taxSaleUrl = await this.discoverTaxSalePage();

            if (!taxSaleUrl) {
                throw new Error('Could not discover tax sale page');
            }

            console.log(`   Found tax sale page: ${taxSaleUrl}`);

            // Step 2: Fetch and analyze the page
            const html = await this.fetchPage(taxSaleUrl);

            // Step 3: Use AI to detect patterns
            const patterns = await this.aiDetector.detectPatterns(html, taxSaleUrl);

            if (patterns.confidence < 0.5) {
                console.warn(`   Low confidence (${(patterns.confidence * 100).toFixed(1)}%) - may need manual review`);
            }

            // Step 4: Extract data using detected patterns
            const properties = await this.extractDataWithPatterns(html, patterns);

            console.log(`   ✓ Extracted ${properties.length} properties`);

            return {
                success: true,
                properties,
                patternsDiscovered: patterns,
                confidence: patterns.confidence
            };
        } catch (error) {
            console.error(`   ✗ Discovery failed: ${error.message}`);
            throw error;
        } finally {
            if (this.browser) {
                await this.browser.close();
            }
        }
    }

    /**
     * Discover the county's tax sale/deed page through intelligent search
     */
    async discoverTaxSalePage() {
        // Try known URL patterns first
        const urlPatterns = [
            this.county.tax_deed_website_url,
            this.county.auction_calendar_url,
            `https://www.${this.sanitizeCountyName()}.gov/tax-deed`,
            `https://www.${this.sanitizeCountyName()}.gov/tax-sale`,
            `https://www.${this.sanitizeCountyName()}.gov/auctions`,
            `https://www.${this.sanitizeCountyName()}.gov/treasurer/tax-sale`,
            `https://${this.sanitizeCountyName()}.gov/departments/tax-collector`,
            `https://treasurer.${this.sanitizeCountyName()}.gov`
        ];

        for (const url of urlPatterns) {
            if (!url) continue;

            try {
                const response = await axios.head(url, {
                    timeout: 5000,
                    validateStatus: status => status < 500
                });

                if (response.status === 200) {
                    return url;
                }
            } catch (error) {
                // URL doesn't exist, try next
                continue;
            }
        }

        // If no direct URLs work, try searching
        return await this.searchForTaxSalePage();
    }

    /**
     * Search for the county's tax sale page using search engines or site crawling
     */
    async searchForTaxSalePage() {
        // In a production system, you would:
        // 1. Use Google Search API or SerpAPI
        // 2. Search for "{county} {state} tax deed sale auction"
        // 3. Filter results for .gov domains
        // 4. Return the most relevant URL

        // For now, return null if discovery fails
        console.warn(`   Could not auto-discover tax sale page for ${this.county.county_name}`);
        return null;
    }

    /**
     * Fetch page content (with JavaScript rendering if needed)
     */
    async fetchPage(url) {
        try {
            // Try simple HTTP request first
            const response = await axios.get(url, {
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });

            const html = response.data;

            // Check if page likely needs JavaScript rendering
            if (html.includes('id="root"') || html.includes('data-reactroot') || html.length < 1000) {
                console.log('   Page requires JavaScript rendering, using Puppeteer...');
                return await this.fetchPageWithPuppeteer(url);
            }

            return html;
        } catch (error) {
            // Fallback to Puppeteer if axios fails
            return await this.fetchPageWithPuppeteer(url);
        }
    }

    /**
     * Fetch page using headless browser (for JavaScript-heavy sites)
     */
    async fetchPageWithPuppeteer(url) {
        this.browser = await puppeteer.launch({
            headless: 'new',
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await this.browser.newPage();

        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

        await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
        });

        // Wait a bit for any dynamic content to load
        await page.waitForTimeout(2000);

        const html = await page.content();

        return html;
    }

    /**
     * Extract property data using detected patterns
     */
    async extractDataWithPatterns(html, patterns) {
        const cheerio = await import('cheerio');
        const $ = cheerio.load(html);

        const properties = [];

        if (patterns.type === 'table' && patterns.selectors.rowSelector) {
            // Extract from table structure
            const rows = $(patterns.selectors.rowSelector);

            rows.each((i, row) => {
                const property = this.extractPropertyFromElement($, row, patterns.selectors);
                if (property && property.address) {
                    properties.push(property);
                }
            });
        } else if (patterns.type === 'list' && patterns.selectors.itemSelector) {
            // Extract from list structure
            const items = $(patterns.selectors.itemSelector);

            items.each((i, item) => {
                const property = this.extractPropertyFromElement($, item, patterns.selectors);
                if (property && property.address) {
                    properties.push(property);
                }
            });
        } else if (patterns.type === 'cards' && patterns.selectors.cardSelector) {
            // Extract from card layout
            const cards = $(patterns.selectors.cardSelector);

            cards.each((i, card) => {
                const property = this.extractPropertyFromElement($, card, patterns.selectors);
                if (property && property.address) {
                    properties.push(property);
                }
            });
        }

        return properties;
    }

    /**
     * Extract a single property from an element using selectors
     */
    extractPropertyFromElement($, element, selectors) {
        const $el = $(element);
        const property = {};

        // Map selectors to property fields
        const selectorMap = {
            propertyId: 'external_id',
            address: 'address',
            owner: 'owner_name',
            assessedValue: 'estimated_value',
            taxAmount: 'tax_amount',
            saleDate: 'auction_date',
            openingBid: 'price'
        };

        for (const [selectorKey, propertyKey] of Object.entries(selectorMap)) {
            if (selectors[selectorKey]) {
                const value = $el.find(selectors[selectorKey]).first().text().trim();
                if (value) {
                    property[propertyKey] = this.cleanValue(value, propertyKey);
                }
            }
        }

        // Set defaults
        property.listing_type = this.county.auction_type || 'Tax Deed';
        property.opportunity_score = Math.floor(Math.random() * 30) + 70; // Placeholder

        return property;
    }

    /**
     * Clean and format extracted values
     */
    cleanValue(value, fieldType) {
        // Remove extra whitespace
        value = value.replace(/\s+/g, ' ').trim();

        // Format based on field type
        if (fieldType === 'price' || fieldType === 'estimated_value' || fieldType === 'tax_amount') {
            // Extract numeric value from currency strings
            const match = value.match(/[\d,]+\.?\d*/);
            if (match) {
                return parseFloat(match[0].replace(/,/g, ''));
            }
        } else if (fieldType === 'auction_date') {
            // Try to parse date
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                return date.toISOString();
            }
        }

        return value;
    }

    /**
     * Sanitize county name for URL construction
     */
    sanitizeCountyName() {
        return this.county.county_name
            .toLowerCase()
            .replace(/\s+/g, '')
            .replace(/[^a-z0-9]/g, '') + this.county.state_code.toLowerCase();
    }
}

export default AIDiscoveryCountyScraper;
