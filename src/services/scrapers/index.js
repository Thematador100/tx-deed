/**
 * Scraper Services Entry Point
 * Main orchestrator for all scraping operations
 */

import TaxSaleResourcesScraper from './sources/TaxSaleResourcesScraper.js';
import PropertyTransformer from './transformers/PropertyTransformer.js';
import { defaultScheduler, ScraperScheduler } from './scheduler/ScraperScheduler.js';

/**
 * Execute TaxSaleResources scrape manually
 */
export async function scrapeTaxSaleResources(params = {}) {
  const {
    username,
    password,
    states = [],
    counties = [],
    saleTypes = ['tax-deed', 'tax-lien', 'redeemable-deed'],
    maxPages = 10
  } = params;

  if (!username || !password) {
    throw new Error('TaxSaleResources credentials required');
  }

  console.log('Starting TaxSaleResources scrape...');

  try {
    // Initialize scraper
    const scraper = new TaxSaleResourcesScraper();

    // Authenticate
    const authenticated = await scraper.authenticate({ username, password });
    if (!authenticated) {
      throw new Error('Authentication failed');
    }

    // Scrape data
    const records = await scraper.scrape({
      states,
      counties,
      saleTypes,
      maxPages
    });

    console.log(`Scraped ${records.length} records`);

    // Transform and save
    const transformer = new PropertyTransformer();
    const result = await transformer.transformAndSave(records, 'taxsaleresources');

    return {
      success: true,
      recordsScraped: records.length,
      recordsSaved: result.count || 0,
      message: `Successfully scraped and saved ${result.count || 0} properties`
    };

  } catch (error) {
    console.error('Scrape failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get scraper status
 */
export function getScraperStatus() {
  return defaultScheduler.getAllJobsStatus();
}

/**
 * Execute scheduled scraper job
 */
export async function executeScheduledJob(jobName, params = {}) {
  return await defaultScheduler.executeJob(jobName, params);
}

/**
 * Start automated scheduler
 */
export function startScheduler() {
  return defaultScheduler.start();
}

/**
 * Stop automated scheduler
 */
export function stopScheduler() {
  return defaultScheduler.stop();
}

/**
 * Enable/disable a scraper job
 */
export function setJobEnabled(jobName, enabled) {
  return defaultScheduler.setJobEnabled(jobName, enabled);
}

/**
 * Quick test function
 */
export async function testScraper() {
  console.log('Testing scraper (mock mode)...');

  const mockRecords = [
    {
      sourceId: 'TEST-001',
      address: { street: '123 Main St', city: 'Atlanta', state: 'GA', zip: '30301', county: 'Fulton' },
      sale: { type: 'tax-deed', date: '2025-12-01', status: 'upcoming' },
      financials: { openingBid: 50000, assessedValue: 150000, estimatedValue: 175000 },
      property: { parcelId: 'TEST-PARCEL-001', bedrooms: 3, bathrooms: 2, sqft: 1500 }
    }
  ];

  const transformer = new PropertyTransformer();
  const result = await transformer.transformAndSave(mockRecords, 'test');

  return result;
}

export {
  TaxSaleResourcesScraper,
  PropertyTransformer,
  ScraperScheduler,
  defaultScheduler
};
