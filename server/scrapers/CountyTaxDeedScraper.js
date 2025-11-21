/**
 * County Tax Deed Auction Scraper
 *
 * Scrapes tax deed auction listings from county websites.
 * Implements adaptive strategies for different county platforms:
 * - Civicsource
 * - Realauction
 * - Grant Street Group
 * - Custom county sites
 */

import BaseScraper from '../lib/BaseScraper.js';

class CountyTaxDeedScraper extends BaseScraper {
  constructor(config) {
    super({
      name: 'CountyTaxDeedScraper',
      useBrowser: true,
      ...config
    });

    this.county = config.county || {};
    this.platformType = config.platformType || 'custom';
  }

  /**
   * Main scraping logic
   */
  async scrape() {
    this.log(`Starting scrape for ${this.county.name} County (${this.county.state})`);

    try {
      // Choose strategy based on platform type
      switch (this.platformType) {
        case 'civicsource':
          return await this.scrapeCivicsource();
        case 'realauction':
          return await this.scrapeRealauction();
        case 'grantstreet':
          return await this.scrapeGrantStreet();
        case 'custom':
          return await this.scrapeCustom();
        default:
          return await this.scrapeGeneric();
      }
    } catch (error) {
      this.handleError(error, { county: this.county.name });
      throw error;
    }
  }

  /**
   * Scrape Civicsource platform (used by many counties)
   */
  async scrapeCivicsource() {
    this.log('Using Civicsource scraping strategy');

    const page = await this.navigateToPage('main', this.county.url);

    // Wait for property listings to load
    await this.browserManager.waitForSelectorWithRetry(
      page,
      'table.listing, .property-list, [class*="auction"]'
    );

    await this.browserManager.randomDelay(2000, 4000);

    // Extract property data
    const properties = await page.evaluate(() => {
      const results = [];
      const rows = document.querySelectorAll('table tr, .property-item, [class*="property-row"]');

      rows.forEach(row => {
        try {
          // Common selectors for Civicsource
          const property = {
            parcel_id: row.querySelector('[class*="parcel"], [class*="apn"]')?.textContent?.trim(),
            address: row.querySelector('[class*="address"], [class*="location"]')?.textContent?.trim(),
            owner: row.querySelector('[class*="owner"]')?.textContent?.trim(),
            assessed_value: row.querySelector('[class*="value"], [class*="assessed"]')?.textContent?.trim(),
            opening_bid: row.querySelector('[class*="bid"], [class*="minimum"]')?.textContent?.trim(),
            auction_date: row.querySelector('[class*="date"], [class*="sale"]')?.textContent?.trim(),
            status: row.querySelector('[class*="status"]')?.textContent?.trim(),
          };

          // Only add if we have minimum required data
          if (property.parcel_id || property.address) {
            results.push(property);
          }
        } catch (error) {
          console.error('Error extracting property:', error);
        }
      });

      return results;
    });

    this.log(`Found ${properties.length} properties on Civicsource platform`);

    // Process and save each property
    for (const property of properties) {
      const transformed = await this.transformData(property);
      const validation = this.validateData(transformed);

      if (validation.valid) {
        await this.saveData(transformed);
      } else {
        this.log(`Invalid data: ${validation.errors.join(', ')}`, 'warn');
      }
    }

    return properties;
  }

  /**
   * Scrape Realauction platform
   */
  async scrapeRealauction() {
    this.log('Using Realauction scraping strategy');

    const page = await this.navigateToPage('main', this.county.url);

    // Realauction often loads data via AJAX
    await page.waitForSelector('.auction-item, [data-property-id]', { timeout: 15000 });
    await this.browserManager.randomDelay(3000, 5000);

    // Scroll to load all items (lazy loading)
    await this.autoScroll(page);

    const properties = await page.evaluate(() => {
      const items = document.querySelectorAll('.auction-item, [data-property-id]');
      const results = [];

      items.forEach(item => {
        const property = {
          parcel_id: item.getAttribute('data-parcel') || item.querySelector('[data-parcel]')?.textContent,
          address: item.querySelector('.property-address, [class*="address"]')?.textContent?.trim(),
          city: item.querySelector('.city')?.textContent?.trim(),
          state: item.querySelector('.state')?.textContent?.trim(),
          zip: item.querySelector('.zip')?.textContent?.trim(),
          opening_bid: item.querySelector('.starting-bid, [class*="bid"]')?.textContent?.trim(),
          assessed_value: item.querySelector('.assessed-value')?.textContent?.trim(),
          auction_date: item.querySelector('.auction-date, [class*="date"]')?.textContent?.trim(),
          property_type: item.querySelector('.property-type')?.textContent?.trim(),
          bedrooms: item.querySelector('[class*="bed"]')?.textContent?.trim(),
          bathrooms: item.querySelector('[class*="bath"]')?.textContent?.trim(),
          sqft: item.querySelector('[class*="sqft"], [class*="square"]')?.textContent?.trim(),
        };

        if (property.address || property.parcel_id) {
          results.push(property);
        }
      });

      return results;
    });

    this.log(`Found ${properties.length} properties on Realauction platform`);

    for (const property of properties) {
      const transformed = await this.transformData(property);
      if (this.validateData(transformed).valid) {
        await this.saveData(transformed);
      }
    }

    return properties;
  }

  /**
   * Scrape Grant Street Group platform
   */
  async scrapeGrantStreet() {
    this.log('Using Grant Street Group scraping strategy');

    const page = await this.navigateToPage('main', this.county.url);

    // Grant Street often uses iframes
    const frames = await page.frames();
    let targetFrame = page;

    for (const frame of frames) {
      const url = frame.url();
      if (url.includes('bid4assets') || url.includes('grantstreet')) {
        targetFrame = frame;
        break;
      }
    }

    await targetFrame.waitForSelector('table, .results-table, [class*="listing"]', { timeout: 15000 });
    await this.browserManager.randomDelay(2000, 4000);

    const properties = await targetFrame.evaluate(() => {
      const rows = document.querySelectorAll('table tbody tr, .property-row');
      const results = [];

      rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length === 0) return;

        const property = {
          parcel_id: cells[0]?.textContent?.trim(),
          address: cells[1]?.textContent?.trim(),
          owner: cells[2]?.textContent?.trim(),
          assessed_value: cells[3]?.textContent?.trim(),
          opening_bid: cells[4]?.textContent?.trim(),
          auction_date: cells[5]?.textContent?.trim(),
        };

        if (property.address || property.parcel_id) {
          results.push(property);
        }
      });

      return results;
    });

    this.log(`Found ${properties.length} properties on Grant Street platform`);

    for (const property of properties) {
      const transformed = await this.transformData(property);
      if (this.validateData(transformed).valid) {
        await this.saveData(transformed);
      }
    }

    return properties;
  }

  /**
   * Generic scraper for custom county sites
   */
  async scrapeGeneric() {
    this.log('Using generic scraping strategy');

    const page = await this.navigateToPage('main', this.county.url);
    await page.waitForSelector('body');
    await this.browserManager.randomDelay(2000, 4000);

    // Get page HTML
    const html = await page.content();
    const $ = this.parseHTML(html);

    const properties = [];

    // Try common table structures
    $('table tr').each((i, row) => {
      if (i === 0) return; // Skip header

      const cells = $(row).find('td');
      if (cells.length === 0) return;

      const property = {
        raw_data: [],
      };

      cells.each((j, cell) => {
        property.raw_data.push($(cell).text().trim());
      });

      if (property.raw_data.length > 0) {
        properties.push(this.parseGenericProperty(property.raw_data));
      }
    });

    this.log(`Found ${properties.length} properties using generic strategy`);

    for (const property of properties) {
      const transformed = await this.transformData(property);
      if (this.validateData(transformed).valid) {
        await this.saveData(transformed);
      }
    }

    return properties;
  }

  /**
   * Custom scraper - uses county-specific selectors
   */
  async scrapeCustom() {
    if (!this.county.selectors) {
      throw new Error('Custom scraper requires selectors configuration');
    }

    this.log('Using custom selectors strategy');

    const page = await this.navigateToPage('main', this.county.url);
    await page.waitForSelector(this.county.selectors.container);
    await this.browserManager.randomDelay(2000, 4000);

    const properties = await page.evaluate((selectors) => {
      const containers = document.querySelectorAll(selectors.container);
      const results = [];

      containers.forEach(container => {
        const property = {};

        Object.keys(selectors.fields).forEach(field => {
          const element = container.querySelector(selectors.fields[field]);
          property[field] = element?.textContent?.trim() || element?.value?.trim();
        });

        if (Object.keys(property).length > 0) {
          results.push(property);
        }
      });

      return results;
    }, this.county.selectors);

    this.log(`Found ${properties.length} properties using custom selectors`);

    for (const property of properties) {
      const transformed = await this.transformData(property);
      if (this.validateData(transformed).valid) {
        await this.saveData(transformed);
      }
    }

    return properties;
  }

  /**
   * Auto-scroll page to trigger lazy loading
   */
  async autoScroll(page) {
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 100;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;

          if (totalHeight >= scrollHeight) {
            clearInterval(timer);
            resolve();
          }
        }, 100);
      });
    });
  }

  /**
   * Parse generic property data
   */
  parseGenericProperty(rawData) {
    // Attempt to intelligently parse array of data
    const property = {};

    rawData.forEach(value => {
      // Detect parcel IDs (usually alphanumeric)
      if (/^[A-Z0-9-]{5,20}$/i.test(value) && !property.parcel_id) {
        property.parcel_id = value;
      }
      // Detect addresses
      else if (/\d+\s+[\w\s]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|way|court|ct|blvd|boulevard)/i.test(value)) {
        property.address = value;
      }
      // Detect currency values
      else if (/\$[\d,]+\.?\d*/i.test(value)) {
        if (!property.opening_bid) {
          property.opening_bid = value;
        } else if (!property.assessed_value) {
          property.assessed_value = value;
        }
      }
      // Detect dates
      else if (/\d{1,2}[/-]\d{1,2}[/-]\d{2,4}/.test(value)) {
        property.auction_date = value;
      }
    });

    return property;
  }

  /**
   * Transform scraped data to standard format
   */
  async transformData(rawData) {
    const cleanValue = (value) => {
      if (!value) return null;
      return value.replace(/[\n\t\r]/g, '').trim();
    };

    const cleanCurrency = (value) => {
      if (!value) return null;
      const cleaned = value.replace(/[$,]/g, '').trim();
      return parseFloat(cleaned) || null;
    };

    return {
      source: `${this.county.name} County`,
      source_state: this.county.state,
      platform_type: this.platformType,
      parcel_id: cleanValue(rawData.parcel_id),
      address: cleanValue(rawData.address),
      city: cleanValue(rawData.city) || this.county.defaultCity,
      state: cleanValue(rawData.state) || this.county.state,
      zip: cleanValue(rawData.zip),
      owner: cleanValue(rawData.owner),
      assessed_value: cleanCurrency(rawData.assessed_value),
      opening_bid: cleanCurrency(rawData.opening_bid),
      starting_bid: cleanCurrency(rawData.opening_bid || rawData.starting_bid),
      auction_date: cleanValue(rawData.auction_date),
      property_type: cleanValue(rawData.property_type) || 'Unknown',
      bedrooms: parseInt(rawData.bedrooms) || null,
      bathrooms: parseFloat(rawData.bathrooms) || null,
      sqft: parseInt(rawData.sqft?.replace(/,/g, '')) || null,
      status: cleanValue(rawData.status) || 'Upcoming',
      listing_type: 'auction',
      scraped_at: new Date().toISOString(),
      raw_data: rawData,
    };
  }

  /**
   * Validate property data
   */
  validateData(data) {
    const errors = [];

    if (!data.parcel_id && !data.address) {
      errors.push('Must have parcel_id or address');
    }

    if (!data.opening_bid && !data.starting_bid) {
      errors.push('Must have opening_bid or starting_bid');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default CountyTaxDeedScraper;
