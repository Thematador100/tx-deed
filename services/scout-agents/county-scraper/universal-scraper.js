import { BaseAgent } from '../../shared/base-agent.js';
import { supabase } from '../../shared/supabase-client.js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Universal County Scraper
 *
 * Handles 3000+ US counties using configuration-driven approach
 * Supports: CSV, PDF, HTML, Database, and API sources
 */
class UniversalCountyScraperAgent extends BaseAgent {
  constructor() {
    super('Universal County Scraper', 'County Scraper');

    // Load county configurations
    const configPath = join(__dirname, 'county-configs.json');
    this.config = JSON.parse(readFileSync(configPath, 'utf-8'));

    this.stats = {
      totalCounties: 0,
      processedCounties: 0,
      failedCounties: 0,
      leadsFound: 0
    };
  }

  async run() {
    await this.log('🚀 Starting Universal County Scraper');
    await this.log(`📊 Monitoring ${this.getEnabledCountyCount()} counties across ${Object.keys(this.config.counties).length} states`);

    try {
      // Process each state
      for (const [state, counties] of Object.entries(this.config.counties)) {
        await this.log(`\n📍 Processing ${state}...`);

        for (const [countyName, countyConfig] of Object.entries(counties)) {
          if (!countyConfig.enabled) {
            await this.log(`⏭️  Skipping ${countyName} (disabled)`);
            continue;
          }

          await this.processCounty(state, countyName, countyConfig);
        }
      }

      await this.logStats();
      await this.updateStatus('Active');
    } catch (error) {
      await this.log(`❌ Fatal error: ${error.message}`, 'error');
      await this.updateStatus('Error');
    }
  }

  async processCounty(state, countyName, config) {
    this.stats.totalCounties++;

    try {
      await this.log(`🔍 Scraping ${countyName}, ${state}...`);

      let leads = [];

      // Route to appropriate scraper based on data source type
      switch (config.dataSource) {
        case 'csv':
          leads = await this.scrapeCSV(state, countyName, config);
          break;
        case 'pdf':
          leads = await this.scrapePDF(state, countyName, config);
          break;
        case 'database':
          leads = await this.scrapeDatabase(state, countyName, config);
          break;
        case 'api':
          leads = await this.scrapeAPI(state, countyName, config);
          break;
        case 'html':
          leads = await this.scrapeHTML(state, countyName, config);
          break;
        default:
          await this.log(`⚠️  Unknown data source: ${config.dataSource}`, 'warning');
          return;
      }

      // Store leads in database
      let storedCount = 0;
      for (const lead of leads) {
        const stored = await this.storeLead(lead, state, countyName);
        if (stored) storedCount++;
      }

      this.stats.processedCounties++;
      this.stats.leadsFound += storedCount;

      await this.log(`✅ ${countyName}: ${storedCount}/${leads.length} leads saved`);

    } catch (error) {
      this.stats.failedCounties++;
      await this.log(`❌ ${countyName} failed: ${error.message}`, 'error');
    }
  }

  /**
   * CSV Scraper - Downloads and parses CSV files
   */
  async scrapeCSV(state, countyName, config) {
    const csvUrl = config.csvUrl || config.url;

    try {
      const response = await fetch(csvUrl, {
        headers: {
          'User-Agent': this.config.settings.userAgent
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const csvText = await response.text();
      return this.parseCSV(csvText, state, countyName);
    } catch (error) {
      throw new Error(`CSV download failed: ${error.message}`);
    }
  }

  /**
   * PDF Scraper - Downloads and extracts data from PDFs
   */
  async scrapePDF(state, countyName, config) {
    const pdfUrl = config.pdfUrl || config.url;

    await this.log(`⚠️  PDF scraping requires pdf-parse library`);
    await this.log(`   Run: npm install pdf-parse`);

    // TODO: Implement PDF parsing
    // const pdfParse = await import('pdf-parse');
    // const response = await fetch(pdfUrl);
    // const buffer = await response.arrayBuffer();
    // const data = await pdfParse(Buffer.from(buffer));
    // return this.parsePDFText(data.text, state, countyName);

    return [];
  }

  /**
   * Database Scraper - Interacts with online searchable databases
   */
  async scrapeDatabase(state, countyName, config) {
    await this.log(`⚠️  Database scraping requires Puppeteer`);
    await this.log(`   Run: npm install puppeteer`);

    // TODO: Implement Puppeteer-based scraping
    // const puppeteer = await import('puppeteer');
    // const browser = await puppeteer.launch();
    // const page = await browser.newPage();
    // await page.goto(config.searchUrl || config.url);
    // ... interact with database
    // await browser.close();

    return [];
  }

  /**
   * API Scraper - Calls official county APIs
   */
  async scrapeAPI(state, countyName, config) {
    const apiUrl = config.apiUrl || config.url;

    try {
      const response = await fetch(apiUrl, {
        headers: {
          'User-Agent': this.config.settings.userAgent,
          'Accept': 'application/json',
          ...(config.apiKey && { 'Authorization': `Bearer ${config.apiKey}` })
        }
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      return this.parseAPIResponse(data, state, countyName, config);
    } catch (error) {
      throw new Error(`API call failed: ${error.message}`);
    }
  }

  /**
   * HTML Scraper - Parses HTML tables
   */
  async scrapeHTML(state, countyName, config) {
    await this.log(`⚠️  HTML scraping requires Cheerio`);
    await this.log(`   Run: npm install cheerio`);

    // TODO: Implement Cheerio-based scraping
    // const cheerio = await import('cheerio');
    // const response = await fetch(config.url);
    // const html = await response.text();
    // const $ = cheerio.load(html);
    // ... parse tables

    return [];
  }

  /**
   * Parse CSV text into lead objects
   */
  parseCSV(csvText, state, countyName) {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const leads = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',');
      if (values.length < headers.length) continue;

      const lead = {};
      headers.forEach((header, index) => {
        lead[header] = values[index]?.trim();
      });

      // Map common CSV headers to our schema
      const normalized = {
        property_address: lead.address || lead['property address'] || lead.location,
        owner_name: lead.owner || lead['owner name'] || lead.taxpayer,
        tax_amount: this.parseAmount(lead['tax amount'] || lead.amount || lead.owed),
        years_delinquent: parseInt(lead.years || lead['years delinquent']) || 1,
        property_type: lead.type || lead['property type'] || 'Unknown',
        apn: lead.apn || lead['parcel number'] || lead['account number']
      };

      if (normalized.property_address) {
        leads.push(normalized);
      }
    }

    return leads;
  }

  /**
   * Parse API response
   */
  parseAPIResponse(data, state, countyName, config) {
    // Handle different API response formats
    const records = Array.isArray(data) ? data : (data.records || data.properties || data.results || []);

    return records.map(record => ({
      property_address: record.address || record.property_address,
      owner_name: record.owner || record.owner_name,
      tax_amount: this.parseAmount(record.tax_amount || record.amount_owed),
      years_delinquent: parseInt(record.years_delinquent) || 1,
      property_type: record.property_type || 'Unknown',
      apn: record.apn || record.parcel_id
    })).filter(lead => lead.property_address);
  }

  /**
   * Helper: Parse dollar amounts
   */
  parseAmount(value) {
    if (!value) return null;
    const cleaned = value.toString().replace(/[$,]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  /**
   * Store lead in database (avoid duplicates)
   */
  async storeLead(lead, state, countyName) {
    try {
      // Check for duplicate
      const { data: existing } = await supabase
        .from('leads')
        .select('id')
        .eq('property_address', lead.property_address)
        .eq('county', countyName)
        .eq('state', state)
        .single();

      if (existing) {
        return false; // Already exists
      }

      // Insert new lead
      const { error } = await supabase
        .from('leads')
        .insert({
          ...lead,
          county: countyName,
          state: state,
          source: this.name,
          status: 'New',
          created_at: new Date().toISOString()
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      await this.log(`Error storing lead: ${error.message}`, 'error');
      return false;
    }
  }

  /**
   * Get count of enabled counties
   */
  getEnabledCountyCount() {
    let count = 0;
    for (const state of Object.values(this.config.counties)) {
      for (const county of Object.values(state)) {
        if (county.enabled) count++;
      }
    }
    return count;
  }

  /**
   * Log run statistics
   */
  async logStats() {
    await this.log('\n📊 Run Statistics:');
    await this.log(`   Total Counties: ${this.stats.totalCounties}`);
    await this.log(`   ✅ Processed: ${this.stats.processedCounties}`);
    await this.log(`   ❌ Failed: ${this.stats.failedCounties}`);
    await this.log(`   🎯 Leads Found: ${this.stats.leadsFound}`);
  }
}

export default UniversalCountyScraperAgent;
