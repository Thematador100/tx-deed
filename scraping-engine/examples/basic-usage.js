import ScrapingEngine from '../index.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const engine = new ScrapingEngine();

  try {
    // Start the engine
    console.log('Starting scraping engine...');
    await engine.start();

    // Example 1: Scrape a single page with AI extraction
    console.log('\n=== Example 1: Single Page Scraping ===');
    const job1 = await engine.scrape('https://example.com', {
      extractionMethod: 'ai',
      screenshot: true,
      save: true,
      collection: 'examples'
    });
    console.log(`Job queued: ${job1.id}`);

    // Example 2: Scrape multiple pages
    console.log('\n=== Example 2: Multiple Pages ===');
    const job2 = await engine.scrapeMultiple([
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3'
    ], {
      concurrency: 2,
      extractionMethod: 'ai',
      batchDelay: 3000
    });
    console.log(`Batch job queued: ${job2.id}`);

    // Example 3: Extract property data
    console.log('\n=== Example 3: Property Data Extraction ===');
    const job3 = await engine.extractPropertyData(
      'https://example-county.com/property/12345',
      {
        save: true,
        collection: 'properties',
        screenshot: true
      }
    );
    console.log(`Property extraction job queued: ${job3.id}`);

    // Example 4: Schedule recurring scraping
    console.log('\n=== Example 4: Scheduled Scraping ===');
    const job4 = await engine.scheduleRecurring(
      {
        type: 'scrape_single',
        url: 'https://example.com/daily-updates',
        config: {
          extractionMethod: 'ai',
          save: true
        }
      },
      '0 9 * * *', // Every day at 9 AM
      {
        priority: 'normal'
      }
    );
    console.log(`Recurring job scheduled: ${job4.id}`);

    // Wait for jobs to complete (for demo purposes)
    console.log('\nWaiting for jobs to complete...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Get job status
    const status = await engine.getJobStatus(job1.id);
    console.log('\nJob 1 Status:', status.state);

    // Display statistics
    console.log('\n=== Engine Statistics ===');
    await engine.displayStats();

  } catch (error) {
    console.error('Error:', error);
  } finally {
    // Stop the engine
    console.log('\nStopping engine...');
    await engine.stop();
  }
}

main();
