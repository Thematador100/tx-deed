/**
 * TaxSaleResources.com Scraper
 * Scrapes tax sale data from TaxSaleResources cloud platform
 */

import { BaseScraper } from '../base/BaseScraper.js';

export class TaxSaleResourcesScraper extends BaseScraper {
  constructor(config = {}) {
    super({
      baseUrl: 'https://cloud.taxsaleresources.com',
      loginUrl: 'https://cloud.taxsaleresources.com/research/login',
      dataUrl: 'https://cloud.taxsaleresources.com/research/data',
      ...config
    });

    this.sessionCookie = null;
    this.isAuthenticated = false;
  }

  /**
   * Authenticate with TaxSaleResources platform
   */
  async authenticate(credentials) {
    this.log('info', 'Authenticating with TaxSaleResources...');

    try {
      const response = await this.makeRequest(this.config.loginUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: credentials.username,
          password: credentials.password
        })
      });

      // Extract session cookie
      const cookies = response.headers.get('set-cookie');
      if (cookies) {
        this.sessionCookie = cookies.split(';')[0];
        this.isAuthenticated = true;
        this.log('info', 'Authentication successful');
        return true;
      } else {
        throw new Error('No session cookie received');
      }

    } catch (error) {
      this.log('error', 'Authentication failed', { error: error.message });
      this.isAuthenticated = false;
      return false;
    }
  }

  /**
   * Main scraping method
   */
  async scrape(params = {}) {
    this.startSession();

    const {
      states = [],
      counties = [],
      dateRange = null,
      saleTypes = ['tax-deed', 'tax-lien', 'redeemable-deed'],
      maxPages = 10
    } = params;

    if (!this.isAuthenticated) {
      throw new Error('Not authenticated. Call authenticate() first.');
    }

    this.log('info', 'Starting scrape session', { states, counties, saleTypes });

    const allRecords = [];

    try {
      // If specific states provided, scrape those; otherwise scrape all available
      const targetStates = states.length > 0 ? states : await this.getAvailableStates();

      for (const state of targetStates) {
        this.log('info', `Scraping state: ${state}`);

        for (const saleType of saleTypes) {
          const records = await this.scrapeStateData(state, saleType, counties, dateRange, maxPages);
          allRecords.push(...records);

          // Rate limiting between requests
          await this.rateLimit(2);
        }
      }

      this.stats.recordsScraped = allRecords.length;
      this.log('info', 'Scrape session complete', this.endSession());

      return allRecords;

    } catch (error) {
      this.log('error', 'Scrape session failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get list of available states from the platform
   */
  async getAvailableStates() {
    this.log('info', 'Fetching available states...');

    try {
      const response = await this.makeRequest(`${this.config.baseUrl}/api/states`, {
        headers: {
          'Cookie': this.sessionCookie
        }
      });

      const data = await this.parseResponse(response, 'json');
      return data.states || [];

    } catch (error) {
      this.log('warn', 'Could not fetch states list, using defaults');
      // Fallback to common tax sale states
      return ['FL', 'GA', 'TX', 'AZ', 'IL', 'PA', 'OH', 'MI', 'IN', 'TN'];
    }
  }

  /**
   * Scrape data for a specific state
   */
  async scrapeStateData(state, saleType, counties = [], dateRange = null, maxPages = 10) {
    const records = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= maxPages) {
      this.log('info', `Scraping ${state} ${saleType} - page ${page}`);

      try {
        const pageData = await this.fetchPage(state, saleType, counties, dateRange, page);

        if (pageData && pageData.records && pageData.records.length > 0) {
          records.push(...pageData.records);
          hasMore = pageData.hasNextPage;
          page++;

          this.log('info', `Retrieved ${pageData.records.length} records from page ${page - 1}`);
        } else {
          hasMore = false;
        }

      } catch (error) {
        this.log('error', `Error scraping page ${page}`, { error: error.message });
        hasMore = false;
      }

      // Rate limit between pages
      await this.rateLimit(2);
    }

    return records;
  }

  /**
   * Fetch a single page of data
   */
  async fetchPage(state, saleType, counties, dateRange, page) {
    const params = new URLSearchParams({
      state,
      saleType,
      page,
      limit: 100 // Request 100 records per page
    });

    if (counties && counties.length > 0) {
      params.append('counties', counties.join(','));
    }

    if (dateRange) {
      params.append('startDate', dateRange.start);
      params.append('endDate', dateRange.end);
    }

    const url = `${this.config.dataUrl}?${params.toString()}`;

    try {
      const response = await this.makeRequest(url, {
        headers: {
          'Cookie': this.sessionCookie,
          'Accept': 'application/json'
        }
      });

      const data = await this.parseResponse(response, 'json');

      // Transform the response data to our standard format
      return {
        records: this.transformRecords(data.results || data.properties || []),
        hasNextPage: data.hasMore || data.pagination?.hasNext || false,
        totalRecords: data.total || data.count || 0
      };

    } catch (error) {
      this.log('error', 'Error fetching page', { url, error: error.message });
      return { records: [], hasNextPage: false };
    }
  }

  /**
   * Transform raw records to standard format
   */
  transformRecords(rawRecords) {
    return rawRecords.map(record => ({
      // Source metadata
      source: 'taxsaleresources',
      sourceId: record.id || record.propertyId,
      scrapedAt: new Date().toISOString(),

      // Property address
      address: this.normalizeAddress({
        street: record.address || record.streetAddress,
        city: record.city,
        state: record.state,
        zip: record.zip || record.zipCode,
        county: record.county
      }),

      // Sale information
      sale: {
        type: record.saleType || record.type,
        date: record.saleDate || record.auctionDate,
        time: record.saleTime,
        location: record.saleLocation || record.venue,
        status: record.status || 'upcoming'
      },

      // Financial data
      financials: {
        assessedValue: this.parseNumber(record.assessedValue || record.appraisedValue),
        taxAmount: this.parseNumber(record.taxAmount || record.delinquentAmount),
        openingBid: this.parseNumber(record.openingBid || record.startingBid),
        estimatedValue: this.parseNumber(record.marketValue || record.estimatedValue)
      },

      // Property details
      property: {
        parcelId: record.parcelId || record.parcelNumber || record.apn,
        ownerName: record.owner || record.ownerName,
        propertyType: record.propertyType || record.useCode,
        bedrooms: this.parseNumber(record.bedrooms),
        bathrooms: this.parseNumber(record.bathrooms),
        sqft: this.parseNumber(record.squareFeet || record.livingArea),
        lotSize: this.parseNumber(record.lotSize),
        yearBuilt: this.parseNumber(record.yearBuilt)
      },

      // Additional data
      legal: record.legalDescription,
      notes: record.notes || record.comments,

      // Raw data for reference
      rawData: record
    }));
  }

  /**
   * Normalize address format
   */
  normalizeAddress(addressData) {
    return {
      street: addressData.street?.trim() || '',
      city: addressData.city?.trim() || '',
      state: addressData.state?.toUpperCase()?.trim() || '',
      zip: addressData.zip?.trim()?.replace(/[^0-9]/g, '') || '',
      county: addressData.county?.trim() || '',
      full: `${addressData.street || ''}, ${addressData.city || ''}, ${addressData.state || ''} ${addressData.zip || ''}`.trim()
    };
  }

  /**
   * Parse numeric values safely
   */
  parseNumber(value) {
    if (value === null || value === undefined || value === '') return null;

    // Remove currency symbols, commas, etc.
    const cleaned = String(value).replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);

    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Extract data using AI/LLM for dynamic pages
   */
  async extractWithAI(html, schema) {
    // This would integrate with OpenAI or similar service
    // For now, return a placeholder

    this.log('info', 'AI extraction not yet implemented, using regex fallback');

    // Fallback to regex-based extraction
    return this.extractWithRegex(html, schema);
  }

  /**
   * Fallback regex-based extraction
   */
  extractWithRegex(html, schema) {
    const extracted = {};

    for (const [field, pattern] of Object.entries(schema)) {
      const match = html.match(new RegExp(pattern, 'i'));
      extracted[field] = match ? match[1].trim() : null;
    }

    return extracted;
  }

  /**
   * Export data in various formats
   */
  async export(records, format = 'json') {
    switch (format.toLowerCase()) {
      case 'json':
        return JSON.stringify(records, null, 2);

      case 'csv':
        return this.convertToCSV(records);

      case 'markdown':
        return this.convertToMarkdown(records);

      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Convert records to CSV
   */
  convertToCSV(records) {
    if (records.length === 0) return '';

    // Flatten nested objects for CSV
    const flattened = records.map(record => ({
      'Source ID': record.sourceId,
      'Street': record.address.street,
      'City': record.address.city,
      'State': record.address.state,
      'ZIP': record.address.zip,
      'County': record.address.county,
      'Sale Type': record.sale.type,
      'Sale Date': record.sale.date,
      'Assessed Value': record.financials.assessedValue,
      'Tax Amount': record.financials.taxAmount,
      'Opening Bid': record.financials.openingBid,
      'Parcel ID': record.property.parcelId,
      'Owner': record.property.ownerName,
      'Property Type': record.property.propertyType,
      'Scraped At': record.scrapedAt
    }));

    // Generate CSV
    const headers = Object.keys(flattened[0]);
    const rows = flattened.map(row =>
      headers.map(header => `"${row[header] || ''}"`).join(',')
    );

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Convert records to Markdown table
   */
  convertToMarkdown(records) {
    if (records.length === 0) return 'No records found.';

    let md = '# Tax Sale Properties\n\n';

    records.forEach((record, idx) => {
      md += `## ${idx + 1}. ${record.address.full}\n\n`;
      md += `- **Sale Date:** ${record.sale.date}\n`;
      md += `- **Sale Type:** ${record.sale.type}\n`;
      md += `- **County:** ${record.address.county}\n`;
      md += `- **Assessed Value:** $${record.financials.assessedValue?.toLocaleString() || 'N/A'}\n`;
      md += `- **Opening Bid:** $${record.financials.openingBid?.toLocaleString() || 'N/A'}\n`;
      md += `- **Parcel ID:** ${record.property.parcelId || 'N/A'}\n\n`;
    });

    return md;
  }
}

export default TaxSaleResourcesScraper;
