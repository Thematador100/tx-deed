import ScrapingEngine from '../index.js';
import dotenv from 'dotenv';

dotenv.config();

async function main() {
  const engine = new ScrapingEngine({
    // Custom configuration
    browser: {
      maxConcurrent: 3,
      headless: true,
      proxyRotation: true
    },
    queue: {
      concurrency: 5
    }
  });

  await engine.start();

  try {
    // Advanced Example 1: Custom selectors extraction
    console.log('=== Custom Selectors Extraction ===');
    const job1 = await engine.scrape('https://example.com/products', {
      extractionMethod: 'selectors',
      selectors: {
        title: 'h1.product-title',
        price: '.price',
        description: '.product-description',
        images: {
          selector: 'img.product-image',
          multiple: true,
          attribute: 'src'
        }
      },
      save: true,
      collection: 'products'
    });

    // Advanced Example 2: Custom schema extraction with AI
    console.log('\n=== Custom Schema AI Extraction ===');
    const job2 = await engine.scrape('https://example.com/real-estate', {
      extractionMethod: 'ai',
      schema: {
        property: {
          address: 'string',
          price: 'number',
          bedrooms: 'number',
          bathrooms: 'number',
          sqft: 'number',
          yearBuilt: 'number',
          description: 'string',
          features: ['string'],
          images: ['string']
        },
        agent: {
          name: 'string',
          phone: 'string',
          email: 'string'
        },
        listing: {
          listingDate: 'string',
          status: 'string',
          daysOnMarket: 'number'
        }
      },
      save: true,
      collection: 'real-estate'
    });

    // Advanced Example 3: Scrape with custom wait conditions
    console.log('\n=== Dynamic Content Scraping ===');
    const job3 = await engine.scrape('https://example.com/dynamic', {
      waitFor: '.dynamic-content-loaded',
      jsWaitTime: 5000,
      beforeExtract: function() {
        // Custom JavaScript to run before extraction
        window.scrollTo(0, document.body.scrollHeight);
      },
      extractionMethod: 'ai'
    });

    // Advanced Example 4: Scrape entire sitemap
    console.log('\n=== Sitemap Scraping ===');
    const job4 = await engine.scrapeSitemap(
      'https://example.com/sitemap.xml',
      {
        urlFilter: (url) => url.includes('/blog/'),
        concurrency: 3,
        extractionMethod: 'ai',
        extractionType: 'contact'
      }
    );

    // Advanced Example 5: Batch property data extraction
    console.log('\n=== Batch Property Extraction ===');
    const propertyUrls = [
      'https://county.example.com/property/1',
      'https://county.example.com/property/2',
      'https://county.example.com/property/3',
      // ... more URLs
    ];

    const jobs = await Promise.all(
      propertyUrls.map(url =>
        engine.extractPropertyData(url, {
          save: true,
          collection: 'tax-deeds',
          priority: 'high'
        })
      )
    );

    console.log(`Queued ${jobs.length} property extraction jobs`);

    // Advanced Example 6: Monitor completion and handle results
    console.log('\n=== Monitoring Jobs ===');

    const pollJob = async (jobId, maxWait = 60000) => {
      const startTime = Date.now();

      while (Date.now() - startTime < maxWait) {
        const status = await engine.getJobStatus(jobId);

        if (status.state === 'completed') {
          console.log(`Job ${jobId} completed!`);
          console.log('Result:', JSON.stringify(status.returnvalue, null, 2));
          return status.returnvalue;
        } else if (status.state === 'failed') {
          console.error(`Job ${jobId} failed:`, status.failedReason);
          throw new Error(status.failedReason);
        }

        console.log(`Job ${jobId} status: ${status.state}, progress: ${status.progress}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      throw new Error('Job timeout');
    };

    // Wait for first job
    await pollJob(job1.id);

    // Get statistics
    const stats = await engine.getQueueStats();
    console.log('\n=== Queue Statistics ===');
    console.log(JSON.stringify(stats, null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await engine.stop();
  }
}

main();
