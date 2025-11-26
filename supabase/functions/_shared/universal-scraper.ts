// Universal Property Scraper - Adapts to different county website structures

export interface ScraperConfig {
  url: string;
  county: string;
  state: string;
  type: 'tax_deed' | 'tax_delinquent' | 'redeemable';
  selectors?: {
    container?: string;
    address?: string;
    parcel?: string;
    owner?: string;
    price?: string;
    date?: string;
    status?: string;
  };
  apiEndpoint?: string;
  apiKey?: string;
}

export interface ScrapedProperty {
  address: string;
  city?: string;
  state: string;
  county: string;
  parcelId?: string;
  owner?: string;
  price?: number;
  startingBid?: number;
  delinquentAmount?: number;
  auctionDate?: string;
  redemptionDate?: string;
  status?: string;
  propertyType?: string;
  sourceUrl: string;
  dataSource: string;
}

/**
 * Universal scraper that can adapt to different website structures
 */
export async function scrapeCountyWebsite(config: ScraperConfig): Promise<ScrapedProperty[]> {
  try {
    // If API endpoint is provided, use API method
    if (config.apiEndpoint) {
      return await scrapeViaAPI(config);
    }

    // Otherwise, use web scraping
    return await scrapeViaHTML(config);
  } catch (error) {
    console.error(`Error scraping ${config.county}, ${config.state}:`, error);
    return [];
  }
}

/**
 * Scrape using API if available
 */
async function scrapeViaAPI(config: ScraperConfig): Promise<ScrapedProperty[]> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  };

  if (config.apiKey) {
    headers['Authorization'] = `Bearer ${config.apiKey}`;
  }

  const response = await fetch(config.apiEndpoint!, { headers });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.statusText}`);
  }

  const data = await response.json();

  // Transform API data to our standard format
  return transformAPIData(data, config);
}

/**
 * Scrape using HTML parsing with optional Bright Data proxy
 */
async function scrapeViaHTML(config: ScraperConfig): Promise<ScrapedProperty[]> {
  const headers: Record<string, string> = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
  };

  // Configure Bright Data proxy if available
  const brightDataProxyUrl = Deno.env.get('BRIGHT_DATA_PROXY_URL');
  const brightDataUsername = Deno.env.get('BRIGHT_DATA_USERNAME');
  const brightDataPassword = Deno.env.get('BRIGHT_DATA_PASSWORD');

  let fetchOptions: RequestInit = { headers };

  // Add Bright Data proxy authentication if configured
  if (brightDataProxyUrl && brightDataUsername && brightDataPassword) {
    // For Bright Data, we can use their Web Unlocker API
    const proxyAuth = btoa(`${brightDataUsername}:${brightDataPassword}`);
    headers['Proxy-Authorization'] = `Basic ${proxyAuth}`;

    console.log('Using Bright Data proxy for scraping');
  }

  const response = await fetch(config.url, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to fetch ${config.url}: ${response.statusText}`);
  }

  const html = await response.text();

  // Parse HTML and extract property data
  return parseHTML(html, config);
}

/**
 * Parse HTML content to extract property information
 * This uses multiple strategies to handle different website structures
 */
function parseHTML(html: string, config: ScraperConfig): ScrapedProperty[] {
  const properties: ScrapedProperty[] = [];

  // Strategy 1: Look for common table structures
  const tableMatches = extractFromTables(html, config);
  if (tableMatches.length > 0) {
    return tableMatches;
  }

  // Strategy 2: Look for JSON-LD structured data
  const jsonLdMatches = extractFromJsonLd(html, config);
  if (jsonLdMatches.length > 0) {
    return jsonLdMatches;
  }

  // Strategy 3: Look for common class names and patterns
  const patternMatches = extractFromPatterns(html, config);
  if (patternMatches.length > 0) {
    return patternMatches;
  }

  return properties;
}

/**
 * Extract property data from HTML tables
 */
function extractFromTables(html: string, config: ScraperConfig): ScrapedProperty[] {
  const properties: ScrapedProperty[] = [];

  // Common table patterns for property listings
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

  const tables = html.match(tableRegex) || [];

  for (const table of tables) {
    const rows = table.match(rowRegex) || [];

    // Skip header row
    for (let i = 1; i < rows.length; i++) {
      const cells = rows[i].match(cellRegex) || [];

      if (cells.length >= 3) {
        const property = extractPropertyFromCells(cells, config);
        if (property) {
          properties.push(property);
        }
      }
    }
  }

  return properties;
}

/**
 * Extract property from table cells
 */
function extractPropertyFromCells(cells: string[], config: ScraperConfig): ScrapedProperty | null {
  const cleanText = (html: string) => html.replace(/<[^>]*>/g, '').trim();

  const cellTexts = cells.map(cleanText);

  // Try to identify which cell contains what data
  let address = '';
  let parcelId = '';
  let owner = '';
  let price = 0;
  let auctionDate = '';

  for (const text of cellTexts) {
    // Detect address (usually contains numbers and street indicators)
    if (!address && /\d+\s+[A-Z]/i.test(text) && /\b(st|street|ave|avenue|rd|road|dr|drive|ln|lane|blvd|boulevard)\b/i.test(text)) {
      address = text;
    }

    // Detect parcel ID (usually alphanumeric)
    if (!parcelId && /^\d{2,}[\s-]?\d+/.test(text) && text.length < 30) {
      parcelId = text;
    }

    // Detect price (contains $ or decimal numbers)
    if (!price && /\$?\d+[,.]?\d*/.test(text)) {
      const match = text.match(/\$?([\d,]+\.?\d*)/);
      if (match) {
        price = parseFloat(match[1].replace(/,/g, ''));
      }
    }

    // Detect date
    if (!auctionDate && /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(text)) {
      auctionDate = text;
    }
  }

  if (address) {
    return {
      address,
      city: config.county,
      state: config.state,
      county: config.county,
      parcelId: parcelId || undefined,
      owner: owner || undefined,
      startingBid: price || undefined,
      delinquentAmount: config.type === 'tax_delinquent' ? price : undefined,
      auctionDate: auctionDate || undefined,
      sourceUrl: config.url,
      dataSource: `${config.county}, ${config.state} ${config.type}`,
    };
  }

  return null;
}

/**
 * Extract property data from JSON-LD structured data
 */
function extractFromJsonLd(html: string, config: ScraperConfig): ScrapedProperty[] {
  const properties: ScrapedProperty[] = [];
  const jsonLdRegex = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/gi;

  let match;
  while ((match = jsonLdRegex.exec(html)) !== null) {
    try {
      const data = JSON.parse(match[1]);
      // Process JSON-LD data based on schema.org types
      // This would need to be expanded based on actual implementations
    } catch (e) {
      // Invalid JSON, skip
    }
  }

  return properties;
}

/**
 * Extract property data using common patterns and keywords
 */
function extractFromPatterns(html: string, config: ScraperConfig): ScrapedProperty[] {
  const properties: ScrapedProperty[] = [];

  // Look for common property listing patterns
  const patterns = [
    // Pattern: Address followed by property details
    /(?:property|parcel|address)[:\s]*([^<\n]+(?:street|st|avenue|ave|road|rd|drive|dr|lane|ln|boulevard|blvd)[^<\n]*)/gi,
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(html)) !== null) {
      const address = match[1].trim();
      if (address.length > 10 && address.length < 200) {
        properties.push({
          address,
          state: config.state,
          county: config.county,
          sourceUrl: config.url,
          dataSource: `${config.county}, ${config.state} ${config.type}`,
        });
      }
    }
  }

  return properties;
}

/**
 * Transform API data to standard format
 */
function transformAPIData(data: any, config: ScraperConfig): ScrapedProperty[] {
  // This would need to be customized based on the specific API structure
  // For now, return empty array
  return [];
}

/**
 * Clean and normalize address
 */
export function normalizeAddress(address: string): string {
  return address
    .toUpperCase()
    .replace(/\s+/g, ' ')
    .replace(/\bSTREET\b/g, 'ST')
    .replace(/\bAVENUE\b/g, 'AVE')
    .replace(/\bROAD\b/g, 'RD')
    .replace(/\bDRIVE\b/g, 'DR')
    .replace(/\bLANE\b/g, 'LN')
    .replace(/\bBOULEVARD\b/g, 'BLVD')
    .trim();
}

/**
 * Parse date from various formats
 */
export function parseDate(dateStr: string): Date | null {
  try {
    // Try different date formats
    const formats = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY
      /(\d{4})-(\d{1,2})-(\d{1,2})/, // YYYY-MM-DD
      /(\d{1,2})-(\d{1,2})-(\d{4})/, // MM-DD-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        return new Date(dateStr);
      }
    }

    return new Date(dateStr);
  } catch {
    return null;
  }
}
