/**
 * Backend Entry Point
 * Main orchestrator for all backend services
 */

import config from './config/config.js';
import proxyManager from './services/ProxyManager.js';
import userAgentRotator from './services/UserAgentRotator.js';
import rateLimiter from './services/RateLimiter.js';
import httpClient from './services/AntiBlockingHttpClient.js';
import multiAPIClient from './services/MultiAPIClient.js';
import melissaDataClient from './services/MelissaDataClient.js';
import distressedPropertyDetector from './analytics/DistressedPropertyDetector.js';
import quantitativeModels from './analytics/QuantitativeModels.js';
import reportGenerator from './reports/InstitutionalReportGenerator.js';
import webScraperEngine from './scrapers/WebScraperEngine.js';

class BackendOrchestrator {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) {
      console.log('[BackendOrchestrator] Already initialized');
      return;
    }

    console.log('[BackendOrchestrator] Initializing backend services...');

    // Display configuration summary
    console.log('\n=== CONFIGURATION SUMMARY ===');
    console.log(`Environment: ${config.get('env')}`);
    console.log(`Proxy Provider: ${config.get('proxy.provider')}`);
    console.log(`Proxy Rotation: ${config.get('proxy.rotationEnabled') ? 'Enabled' : 'Disabled'}`);
    console.log(`Rate Limiting: ${config.get('rateLimit.requestsPerMinute')}/min, ${config.get('rateLimit.requestsPerHour')}/hour`);
    console.log(`Scraping: ${config.get('scraping.enabled') ? 'Enabled' : 'Disabled'}`);

    // Feature flags
    console.log('\n=== FEATURE FLAGS ===');
    console.log(`Advanced Analytics: ${config.get('features.advancedAnalytics')}`);
    console.log(`Quant Models: ${config.get('features.quantModels')}`);
    console.log(`PDF Reports: ${config.get('features.pdfReports')}`);
    console.log(`Distressed Detection: ${config.get('features.distressedDetection')}`);

    // API status
    console.log('\n=== API INTEGRATIONS ===');
    const apiStats = multiAPIClient.getStats();
    console.log(`Enabled Providers: ${apiStats.enabledProviders.length}`);
    apiStats.enabledProviders.forEach(provider => {
      console.log(`  - ${provider.name}: $${provider.cost} per request`);
    });

    this.initialized = true;
    console.log('\n[BackendOrchestrator] Backend services initialized successfully\n');
  }

  /**
   * Complete property analysis workflow
   */
  async analyzeProperty(address, options = {}) {
    await this.initialize();

    console.log(`\n=== ANALYZING PROPERTY: ${address} ===\n`);

    try {
      // Step 1: Get property data from cheapest available API
      console.log('[1/5] Fetching property data...');
      const propertyResult = await multiAPIClient.getPropertyData(address, options);
      const property = propertyResult.data;

      console.log(`✓ Data retrieved from ${propertyResult.provider} ($${propertyResult.cost})`);

      // Step 2: Enrich with Melissa Data if available
      if (config.get('melissaData.licenseKey')) {
        console.log('[2/5] Enriching with Melissa Data...');
        try {
          const enrichedProperty = await melissaDataClient.enrichPropertyData(property);
          Object.assign(property, enrichedProperty);
          console.log('✓ Property data enriched');
        } catch (error) {
          console.warn(`⚠ Melissa Data enrichment failed: ${error.message}`);
        }
      } else {
        console.log('[2/5] Skipping Melissa Data (no license key)');
      }

      // Step 3: Detect distress signals
      console.log('[3/5] Analyzing distress signals...');
      const distressAnalysis = await distressedPropertyDetector.analyzeProperty(property);
      console.log(`✓ Distress score: ${distressAnalysis.distressScore}/100 (${distressAnalysis.classification})`);

      // Step 4: Run quantitative models
      console.log('[4/5] Running quantitative models...');
      const marketData = this.getMarketData(property); // Would fetch real market data
      const valuation = await quantitativeModels.calculatePropertyValue(property, marketData);
      const riskAdjusted = quantitativeModels.calculateRiskAdjustedReturn(property, marketData);
      const monteCarlo = await quantitativeModels.runMonteCarloSimulation(property, {
        purchasePrice: property.price || property.estimatedValue,
        holdingPeriod: 24,
        monthlyRent: property.monthlyRent || 2000,
      });

      console.log(`✓ Estimated value: $${valuation.estimatedValue.toLocaleString()}`);
      console.log(`✓ Sharpe ratio: ${riskAdjusted.sharpeRatio.toFixed(2)} (${riskAdjusted.classification})`);

      // Step 5: Generate institutional report
      console.log('[5/5] Generating investment dossier...');
      const report = await reportGenerator.generateInvestmentDossier(property, marketData, {
        includeMonteCarloSimulation: true,
        includeDistressAnalysis: true,
        includeCMA: true,
      });

      console.log(`✓ Investment rating: ${report.executiveSummary.rating}/5`);
      console.log(`✓ Recommendation: ${report.executiveSummary.recommendation}\n`);

      return {
        property,
        distressAnalysis,
        valuation,
        riskAdjusted,
        monteCarlo,
        report,
      };
    } catch (error) {
      console.error(`✗ Analysis failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Scrape county tax sales
   */
  async scrapeCountyTaxSales(countyName, stateCode) {
    await this.initialize();

    console.log(`\n=== SCRAPING TAX SALES: ${countyName}, ${stateCode} ===\n`);

    try {
      const result = await webScraperEngine.scrapeCountyTaxSales(countyName, stateCode);

      console.log(`✓ Found ${result.properties.length} properties`);
      console.log(`✓ Scraped at: ${result.scrapedAt}\n`);

      return result;
    } catch (error) {
      console.error(`✗ Scraping failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Batch analyze multiple properties
   */
  async batchAnalyzeProperties(addresses, options = {}) {
    await this.initialize();

    console.log(`\n=== BATCH ANALYSIS: ${addresses.length} properties ===\n`);

    const results = [];
    const errors = [];

    for (let i = 0; i < addresses.length; i++) {
      const address = addresses[i];

      console.log(`[${i + 1}/${addresses.length}] Processing: ${address}`);

      try {
        const analysis = await this.analyzeProperty(address, options);
        results.push({ address, ...analysis });
      } catch (error) {
        errors.push({ address, error: error.message });
        console.error(`✗ Failed: ${error.message}`);
      }

      // Delay between properties to avoid rate limiting
      if (i < addresses.length - 1) {
        await this.sleep(2000);
      }
    }

    console.log(`\n✓ Batch analysis complete: ${results.length} successful, ${errors.length} failed\n`);

    return { results, errors };
  }

  /**
   * Get system statistics
   */
  getSystemStats() {
    return {
      proxy: proxyManager.getStats(),
      userAgent: userAgentRotator.getStats(),
      rateLimiter: rateLimiter.getStats(),
      httpClient: httpClient.getStats(),
      multiAPI: multiAPIClient.getStats(),
      melissaData: melissaDataClient.getStats(),
      distressDetector: distressedPropertyDetector.getStats(),
      webScraper: webScraperEngine.getStats(),
    };
  }

  /**
   * Reset all statistics
   */
  resetAllStats() {
    proxyManager.reset();
    userAgentRotator.reset();
    rateLimiter.reset();
    httpClient.resetStats();
    multiAPIClient.resetStats();
    melissaDataClient.resetStats();
    distressedPropertyDetector.resetStats();
    webScraperEngine.resetStats();

    console.log('[BackendOrchestrator] All statistics reset');
  }

  /**
   * Shutdown all services
   */
  async shutdown() {
    console.log('[BackendOrchestrator] Shutting down services...');

    await webScraperEngine.shutdown();

    console.log('[BackendOrchestrator] Shutdown complete');
  }

  // Helper methods

  getMarketData(property) {
    // In production, this would fetch real market data
    // For now, return mock data
    return {
      medianHomePrice: 350000,
      avgPricePerSqft: 200,
      avgCapRate: 0.08,
      appreciationRate: 0.05,
      rentGrowth: 0.03,
      inventoryLevel: 4.5,
      avgDaysOnMarket: 45,
      medianIncome: 75000,
      populationGrowth: 0.015,
      populationDensity: 2500,
      schoolRating: 7,
      crimeIndex: 100,
      walkScore: 65,
      unemploymentRate: 0.04,
      interestRate: 0.07,
      gdpGrowth: 0.025,
      inflation: 0.03,
      marketTrend: 'Appreciating',
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
const backend = new BackendOrchestrator();

// Export for use in Supabase Functions or other contexts
export default backend;

// Example usage
export async function exampleUsage() {
  try {
    // Initialize
    await backend.initialize();

    // Analyze a property
    const analysis = await backend.analyzeProperty('123 Main St, Austin, TX 78701');

    console.log('Analysis Result:', analysis.report.executiveSummary);

    // Get system stats
    const stats = backend.getSystemStats();
    console.log('System Stats:', stats);

    // Shutdown
    await backend.shutdown();
  } catch (error) {
    console.error('Error:', error);
  }
}
