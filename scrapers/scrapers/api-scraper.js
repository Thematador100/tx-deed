/**
 * API COUNTY SCRAPER
 *
 * For counties that provide official APIs for tax deed/lien data
 */

import axios from 'axios';

export class APICountyScraper {
    constructor(county) {
        this.county = county;
        this.apiConfig = county.scraper_config?.api || {};
    }

    /**
     * Perform API-based scraping
     */
    async scrape() {
        console.log(`🔌 API Scraper: ${this.county.county_name}, ${this.county.state_code}`);

        try {
            const apiUrl = this.apiConfig.endpoint || this.county.tax_deed_website_url;

            if (!apiUrl) {
                throw new Error('No API endpoint configured');
            }

            // Make API request
            const response = await axios.get(apiUrl, {
                timeout: 15000,
                headers: this.getHeaders(),
                params: this.getParams()
            });

            // Parse response
            const properties = this.parseAPIResponse(response.data);

            console.log(`   ✓ Retrieved ${properties.length} properties from API`);

            return {
                success: true,
                properties,
                newCount: properties.length,
                updatedCount: 0
            };
        } catch (error) {
            console.error(`   ✗ API scraping failed: ${error.message}`);
            throw error;
        }
    }

    /**
     * Get headers for API request
     */
    getHeaders() {
        const headers = {
            'User-Agent': 'TaxDeedInvestmentPlatform/1.0',
            'Accept': 'application/json'
        };

        // Add API key if configured
        if (this.apiConfig.apiKey) {
            headers['Authorization'] = `Bearer ${this.apiConfig.apiKey}`;
        }

        return headers;
    }

    /**
     * Get query parameters for API request
     */
    getParams() {
        return this.apiConfig.params || {};
    }

    /**
     * Parse API response into standardized property format
     */
    parseAPIResponse(data) {
        // Handle different response formats
        let items = data;

        if (Array.isArray(data.results)) {
            items = data.results;
        } else if (Array.isArray(data.data)) {
            items = data.data;
        } else if (Array.isArray(data.properties)) {
            items = data.properties;
        } else if (!Array.isArray(data)) {
            items = [data];
        }

        return items.map(item => this.normalizeProperty(item));
    }

    /**
     * Normalize API response item to our property schema
     */
    normalizeProperty(item) {
        // This would need to be customized per API
        return {
            external_id: item.parcel_id || item.apn || item.id,
            address: item.address || item.property_address || item.situs_address,
            owner_name: item.owner || item.owner_name,
            estimated_value: item.assessed_value || item.market_value,
            price: item.opening_bid || item.minimum_bid || item.starting_bid,
            auction_date: item.sale_date || item.auction_date,
            listing_type: this.county.auction_type || 'Tax Deed',
            opportunity_score: Math.floor(Math.random() * 30) + 70
        };
    }
}

export default APICountyScraper;
