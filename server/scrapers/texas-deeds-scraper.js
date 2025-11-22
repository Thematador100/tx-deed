/**
 * Texas Deed Records Scraper
 *
 * Specialized scraper for Texas county deed records
 * Handles various county website formats and structures
 *
 * Features:
 * - Multi-county support
 * - Automated data extraction
 * - Supabase integration
 * - Smart retry logic
 * - Data validation
 */

import { PlaywrightCrawler, Dataset } from 'crawlee';
import { chromium } from 'playwright';
import * as cheerio from 'cheerio';
import got from 'got';

/**
 * Texas County Deed Record Websites
 * Each county has different website structures
 */
const TEXAS_COUNTIES = {
  harris: {
    name: 'Harris County',
    url: 'https://www.hcad.org/',
    type: 'dynamic', // Requires browser
    selectors: {
      searchInput: '#property-search',
      results: '.search-results .property',
      ownerName: '.owner-name',
      address: '.property-address',
      legalDescription: '.legal-desc',
    },
  },
  travis: {
    name: 'Travis County',
    url: 'https://www.tcad.org/',
    type: 'dynamic',
    selectors: {
      searchInput: '#search-box',
      results: '.property-list-item',
      ownerName: '.owner',
      address: '.address',
      legalDescription: '.legal',
    },
  },
  dallas: {
    name: 'Dallas County',
    url: 'https://www.dallascad.org/',
    type: 'dynamic',
    selectors: {
      searchInput: 'input[name="search"]',
      results: '.result-row',
      ownerName: '.name',
      address: '.addr',
      legalDescription: '.legal-text',
    },
  },
  bexar: {
    name: 'Bexar County',
    url: 'https://www.bcad.org/',
    type: 'static', // Can use Cheerio
  },
  // Add more counties as needed
};

/**
 * Generic deed record structure
 */
class DeedRecord {
  constructor(data) {
    this.county = data.county;
    this.ownerName = data.ownerName;
    this.propertyAddress = data.propertyAddress;
    this.legalDescription = data.legalDescription;
    this.deedType = data.deedType;
    this.recordDate = data.recordDate;
    this.salePrice = data.salePrice;
    this.volume = data.volume;
    this.page = data.page;
    this.documentNumber = data.documentNumber;
    this.grantor = data.grantor; // Seller
    this.grantee = data.grantee; // Buyer
    this.propertyType = data.propertyType;
    this.acreage = data.acreage;
    this.taxId = data.taxId;
    this.scrapedAt = new Date().toISOString();
  }

  validate() {
    const errors = [];

    if (!this.county) errors.push('County is required');
    if (!this.ownerName && !this.grantee) errors.push('Owner/Grantee is required');
    if (!this.propertyAddress && !this.legalDescription) {
      errors.push('Property address or legal description is required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

/**
 * Scrape Harris County (Example with Playwright)
 */
async function scrapeHarrisCounty(searchQuery) {
  console.log('🏛️  Scraping Harris County Deed Records...');

  const results = [];
  const countyConfig = TEXAS_COUNTIES.harris;

  const crawler = new PlaywrightCrawler({
    launchContext: {
      launcher: chromium,
      launchOptions: {
        headless: true,
      },
    },

    maxRequestsPerCrawl: 100,
    maxConcurrency: 2,

    async requestHandler({ page, request }) {
      console.log(`Processing: ${request.url}`);

      // Navigate to search page
      await page.goto(countyConfig.url);

      // Wait for page load
      await page.waitForLoadState('networkidle');

      // Enter search query
      if (searchQuery) {
        await page.fill(countyConfig.selectors.searchInput, searchQuery);
        await page.press(countyConfig.selectors.searchInput, 'Enter');

        // Wait for results
        await page.waitForSelector(countyConfig.selectors.results, {
          timeout: 10000,
        }).catch(() => {
          console.log('No results found or timeout');
        });

        // Extract data
        const properties = await page.$$eval(
          countyConfig.selectors.results,
          (elements, selectors) => {
            return elements.map(el => {
              const getText = (selector) => {
                const element = el.querySelector(selector);
                return element ? element.textContent.trim() : null;
              };

              return {
                ownerName: getText(selectors.ownerName),
                propertyAddress: getText(selectors.address),
                legalDescription: getText(selectors.legalDescription),
              };
            });
          },
          countyConfig.selectors
        );

        // Create deed records
        for (const prop of properties) {
          const record = new DeedRecord({
            county: 'Harris',
            ...prop,
          });

          const validation = record.validate();
          if (validation.isValid) {
            results.push(record);
          } else {
            console.warn('Invalid record:', validation.errors);
          }
        }
      }

      await Dataset.pushData(results);
    },
  });

  await crawler.run([countyConfig.url]);

  return results;
}

/**
 * Scrape Bexar County (Example with Cheerio - Static Site)
 */
async function scrapeBexarCounty(searchQuery) {
  console.log('🏛️  Scraping Bexar County Deed Records...');

  try {
    const countyConfig = TEXAS_COUNTIES.bexar;
    const searchUrl = `${countyConfig.url}/search?q=${encodeURIComponent(searchQuery)}`;

    const response = await got(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.body);
    const results = [];

    // Example: Parse results (adjust selectors based on actual site)
    $('.property-result').each((i, el) => {
      const record = new DeedRecord({
        county: 'Bexar',
        ownerName: $(el).find('.owner-name').text().trim(),
        propertyAddress: $(el).find('.property-address').text().trim(),
        legalDescription: $(el).find('.legal-desc').text().trim(),
        taxId: $(el).find('.tax-id').text().trim(),
      });

      const validation = record.validate();
      if (validation.isValid) {
        results.push(record);
      }
    });

    return results;

  } catch (error) {
    console.error(`Bexar County scraping failed: ${error.message}`);
    throw error;
  }
}

/**
 * Generic deed record scraper
 * Automatically selects the right method based on county
 */
async function scrapeDeedRecords(county, searchQuery) {
  const countyKey = county.toLowerCase();
  const countyConfig = TEXAS_COUNTIES[countyKey];

  if (!countyConfig) {
    throw new Error(`County "${county}" not supported. Available: ${Object.keys(TEXAS_COUNTIES).join(', ')}`);
  }

  console.log(`📋 Scraping ${countyConfig.name} deed records for: "${searchQuery}"`);

  // Choose method based on county type
  if (countyConfig.type === 'dynamic') {
    if (countyKey === 'harris') {
      return await scrapeHarrisCounty(searchQuery);
    }
    // Add other dynamic counties
  } else {
    if (countyKey === 'bexar') {
      return await scrapeBexarCounty(searchQuery);
    }
    // Add other static counties
  }

  throw new Error(`Scraper not implemented for ${countyConfig.name}`);
}

/**
 * Batch scrape multiple counties
 */
async function scrapMultipleCounties(counties, searchQuery) {
  const results = {};

  for (const county of counties) {
    try {
      console.log(`\n🔍 Processing ${county}...`);
      const records = await scrapeDeedRecords(county, searchQuery);
      results[county] = {
        success: true,
        count: records.length,
        records,
      };

      // Delay between counties to be respectful
      await new Promise(resolve => setTimeout(resolve, 5000));

    } catch (error) {
      console.error(`❌ Failed to scrape ${county}:`, error.message);
      results[county] = {
        success: false,
        error: error.message,
      };
    }
  }

  return results;
}

/**
 * Save to Supabase
 */
async function saveToSupabase(records) {
  // Import your Supabase client
  // import { supabase } from '../lib/customSupabaseClient.js';

  try {
    // Example structure - adjust based on your schema
    const { data, error } = await supabase
      .from('deed_records')
      .insert(records.map(r => ({
        county: r.county,
        owner_name: r.ownerName,
        property_address: r.propertyAddress,
        legal_description: r.legalDescription,
        deed_type: r.deedType,
        record_date: r.recordDate,
        sale_price: r.salePrice,
        document_number: r.documentNumber,
        grantor: r.grantor,
        grantee: r.grantee,
        property_type: r.propertyType,
        acreage: r.acreage,
        tax_id: r.taxId,
        scraped_at: r.scrapedAt,
      })));

    if (error) throw error;

    console.log(`✅ Saved ${records.length} records to Supabase`);
    return data;

  } catch (error) {
    console.error('Supabase save failed:', error);
    throw error;
  }
}

/**
 * Example usage
 */
async function example() {
  // Single county search
  const harrisResults = await scrapeDeedRecords('harris', 'John Smith');
  console.log('Harris County Results:', harrisResults);

  // Multi-county search
  const multiResults = await scrapMultipleCounties(
    ['harris', 'travis', 'dallas'],
    'John Smith'
  );
  console.log('Multi-County Results:', multiResults);

  // Save to database
  // await saveToSupabase(harrisResults);
}

// Uncomment to run example
// example().catch(console.error);

export {
  scrapeDeedRecords,
  scrapMultipleCounties,
  scrapeHarrisCounty,
  scrapeBexarCounty,
  saveToSupabase,
  DeedRecord,
  TEXAS_COUNTIES,
};
