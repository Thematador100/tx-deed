/**
 * Command-line script to scrape county tax sales
 * Usage: node scripts/scrape-county.js Travis TX
 */

import backend from '../index.js';

async function main() {
  const countyName = process.argv[2];
  const stateCode = process.argv[3];

  if (!countyName || !stateCode) {
    console.error('Error: Please provide county name and state code');
    console.log('Usage: node scripts/scrape-county.js Travis TX');
    process.exit(1);
  }

  try {
    const result = await backend.scrapeCountyTaxSales(countyName, stateCode);

    console.log('\n=== SCRAPING COMPLETE ===\n');
    console.log(`County: ${result.county}, ${result.state}`);
    console.log(`Properties found: ${result.properties.length}`);
    console.log(`Scraped at: ${result.scrapedAt}`);

    console.log('\n\nSample properties:');
    result.properties.slice(0, 5).forEach((prop, i) => {
      console.log(`\n${i + 1}. ${prop.address}`);
      console.log(`   Owner: ${prop.owner}`);
      console.log(`   Tax Amount: $${prop.taxAmount?.toLocaleString() || 'N/A'}`);
      console.log(`   Auction Date: ${prop.auctionDate || 'N/A'}`);
    });

    await backend.shutdown();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

main();
