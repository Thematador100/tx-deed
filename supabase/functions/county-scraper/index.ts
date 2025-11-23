// =====================================================
// COUNTY TAX DEED SCRAPER - Supabase Edge Function
// Configurable scraper for 300+ US counties
// =====================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScraperConfig {
  id: string;
  county_id: string;
  scraper_type: string;
  target_url: string;
  selectors: {
    property_row?: string;
    parcel_id?: string;
    address?: string;
    owner?: string;
    starting_bid?: string;
    auction_date?: string;
    status?: string;
    property_type?: string;
    assessed_value?: string;
    pagination_next?: string;
  };
  authentication_required: boolean;
  auth_config?: any;
  proxy_required: boolean;
  javascript_required: boolean;
  timeout_seconds: number;
  max_retries: number;
}

interface County {
  id: string;
  state_code: string;
  state_name: string;
  county_name: string;
}

// =====================================================
// UNIVERSAL SCRAPER ENGINE
// =====================================================

class CountyScraper {
  private supabase: any;
  private config: ScraperConfig;
  private county: County;
  private browser: any;
  private runId: string;

  constructor(supabase: any, config: ScraperConfig, county: County) {
    this.supabase = supabase;
    this.config = config;
    this.county = county;
    this.runId = crypto.randomUUID();
  }

  async scrape(): Promise<any> {
    console.log(`🚀 Starting scrape for ${this.county.county_name}, ${this.county.state_code}`);

    // Create scraper run record
    await this.createScraperRun('running');

    try {
      let properties = [];

      if (this.config.scraper_type === 'puppeteer') {
        properties = await this.scrapePuppeteer();
      } else if (this.config.scraper_type === 'api') {
        properties = await this.scrapeAPI();
      } else {
        throw new Error(`Unsupported scraper type: ${this.config.scraper_type}`);
      }

      // Process and save properties
      const result = await this.saveProperties(properties);

      await this.updateScraperRun('completed', result);

      console.log(`✅ Scrape completed: ${result.new} new, ${result.updated} updated`);

      return {
        success: true,
        county: `${this.county.county_name}, ${this.county.state_code}`,
        properties_found: properties.length,
        properties_new: result.new,
        properties_updated: result.updated,
        run_id: this.runId
      };

    } catch (error) {
      console.error('❌ Scrape failed:', error);
      await this.updateScraperRun('failed', null, error.message);
      throw error;
    } finally {
      if (this.browser) {
        await this.browser.close();
      }
    }
  }

  private async scrapePuppeteer(): Promise<any[]> {
    const properties = [];

    console.log(`🌐 Launching browser for ${this.config.target_url}`);

    this.browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu'
      ]
    });

    const page = await this.browser.newPage();

    // Set user agent to avoid bot detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    await page.goto(this.config.target_url, {
      waitUntil: 'networkidle2',
      timeout: this.config.timeout_seconds * 1000
    });

    // Handle authentication if required
    if (this.config.authentication_required && this.config.auth_config) {
      await this.handleAuthentication(page);
    }

    // Extract properties using selectors
    let currentPage = 1;
    let hasNextPage = true;

    while (hasNextPage && currentPage <= 100) { // Max 100 pages
      console.log(`📄 Scraping page ${currentPage}`);

      const pageProperties = await page.evaluate((selectors: any) => {
        const rows = Array.from(document.querySelectorAll(selectors.property_row || 'tr'));

        return rows.map((row: any) => {
          try {
            return {
              parcel_id: row.querySelector(selectors.parcel_id)?.textContent?.trim() || '',
              address: row.querySelector(selectors.address)?.textContent?.trim() || '',
              owner_name: row.querySelector(selectors.owner)?.textContent?.trim() || '',
              starting_bid: row.querySelector(selectors.starting_bid)?.textContent?.trim() || '',
              auction_date: row.querySelector(selectors.auction_date)?.textContent?.trim() || '',
              status: row.querySelector(selectors.status)?.textContent?.trim() || 'Active',
              property_type: row.querySelector(selectors.property_type)?.textContent?.trim() || '',
              assessed_value: row.querySelector(selectors.assessed_value)?.textContent?.trim() || ''
            };
          } catch (e) {
            return null;
          }
        }).filter((p: any) => p && p.address);
      }, this.config.selectors);

      properties.push(...pageProperties);

      // Check for next page
      if (this.config.selectors.pagination_next) {
        hasNextPage = await page.evaluate((selector: string) => {
          const nextButton = document.querySelector(selector);
          return nextButton && !nextButton.hasAttribute('disabled');
        }, this.config.selectors.pagination_next);

        if (hasNextPage) {
          await page.click(this.config.selectors.pagination_next);
          await page.waitForTimeout(2000); // Wait for page to load
          currentPage++;
        }
      } else {
        hasNextPage = false;
      }
    }

    console.log(`✨ Extracted ${properties.length} properties`);

    return properties;
  }

  private async scrapeAPI(): Promise<any[]> {
    // API-based scraping for counties with official APIs
    const response = await fetch(this.config.target_url, {
      headers: this.config.custom_headers || {}
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    const data = await response.json();

    // Transform API response to standard format
    return this.transformAPIData(data);
  }

  private async handleAuthentication(page: any): Promise<void> {
    const { username_selector, password_selector, submit_selector, username, password } = this.config.auth_config;

    await page.type(username_selector, username);
    await page.type(password_selector, password);
    await page.click(submit_selector);
    await page.waitForNavigation();
  }

  private transformAPIData(data: any): any[] {
    // Transform API response based on county-specific format
    // This would be customized per county
    return data;
  }

  private async saveProperties(properties: any[]): Promise<{ new: number; updated: number }> {
    let newCount = 0;
    let updatedCount = 0;

    for (const prop of properties) {
      // Parse and clean data
      const cleanedProp = this.cleanProperty(prop);

      // Check if property exists
      const { data: existing } = await this.supabase
        .from('properties')
        .select('id')
        .eq('parcel_id', cleanedProp.parcel_id)
        .eq('county', this.county.county_name)
        .eq('state', this.county.state_code)
        .single();

      if (existing) {
        // Update existing property
        await this.supabase
          .from('properties')
          .update(cleanedProp)
          .eq('id', existing.id);
        updatedCount++;
      } else {
        // Insert new property
        await this.supabase
          .from('properties')
          .insert(cleanedProp);
        newCount++;
      }
    }

    return { new: newCount, updated: updatedCount };
  }

  private cleanProperty(prop: any): any {
    return {
      parcel_id: prop.parcel_id,
      address: prop.address,
      city: this.county.county_name,
      state: this.county.state_code,
      county: this.county.county_name,
      owner_name: prop.owner_name,
      starting_bid: this.parsePrice(prop.starting_bid),
      auction_date: this.parseDate(prop.auction_date),
      status: prop.status || 'Active',
      property_type: prop.property_type,
      assessed_value: this.parsePrice(prop.assessed_value),
      source: 'scraper',
      source_url: this.config.target_url,
      scraped_at: new Date().toISOString(),
      listing_type: 'auction'
    };
  }

  private parsePrice(priceStr: string): number | null {
    if (!priceStr) return null;
    const cleaned = priceStr.replace(/[$,\s]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }

  private parseDate(dateStr: string): string | null {
    if (!dateStr) return null;
    try {
      const date = new Date(dateStr);
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  private async createScraperRun(status: string): Promise<void> {
    await this.supabase
      .from('scraper_runs')
      .insert({
        id: this.runId,
        county_id: this.county.id,
        scraper_config_id: this.config.id,
        status,
        started_at: new Date().toISOString()
      });
  }

  private async updateScraperRun(status: string, result: any, error?: string): Promise<void> {
    await this.supabase
      .from('scraper_runs')
      .update({
        status,
        completed_at: new Date().toISOString(),
        properties_found: result?.new + result?.updated || 0,
        properties_new: result?.new || 0,
        properties_updated: result?.updated || 0,
        error_message: error
      })
      .eq('id', this.runId);
  }
}

// =====================================================
// EDGE FUNCTION HANDLER
// =====================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { county_id, scraper_config_id } = await req.json();

    if (!county_id) {
      throw new Error('county_id is required');
    }

    // Fetch county data
    const { data: county, error: countyError } = await supabase
      .from('us_counties')
      .select('*')
      .eq('id', county_id)
      .single();

    if (countyError || !county) {
      throw new Error('County not found');
    }

    // Fetch scraper config
    const { data: config, error: configError } = await supabase
      .from('scraper_configs')
      .select('*')
      .eq('county_id', county_id)
      .single();

    if (configError || !config) {
      throw new Error('Scraper configuration not found for this county');
    }

    if (!config.enabled) {
      throw new Error('Scraper is disabled for this county');
    }

    // Run scraper
    const scraper = new CountyScraper(supabase, config, county);
    const result = await scraper.scrape();

    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400
      }
    );
  }
});
