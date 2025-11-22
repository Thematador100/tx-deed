// County Finder - Discovers tax deed and delinquent property websites for any US county

export interface CountyInfo {
  county: string;
  state: string;
  stateAbbr: string;
  taxDeedUrl?: string;
  delinquentUrl?: string;
  assessorUrl?: string;
  scrapingMethod: 'web_scrape' | 'api' | 'manual';
  notes?: string;
}

// Database of county websites (this will be expanded over time)
const KNOWN_COUNTIES: Record<string, CountyInfo> = {
  // Texas
  'harris-tx': {
    county: 'Harris',
    state: 'Texas',
    stateAbbr: 'TX',
    taxDeedUrl: 'https://www.hctax.net/Property/PropertyTax',
    delinquentUrl: 'https://www.hctax.net/Delinquent/DelinquentTaxSearch',
    assessorUrl: 'https://publicdata.hcad.org/',
    scrapingMethod: 'web_scrape',
  },
  'travis-tx': {
    county: 'Travis',
    state: 'Texas',
    stateAbbr: 'TX',
    taxDeedUrl: 'https://tax-office.traviscountytx.gov/',
    delinquentUrl: 'https://tax-office.traviscountytx.gov/delinquent-tax-sales',
    scrapingMethod: 'web_scrape',
  },
  'bexar-tx': {
    county: 'Bexar',
    state: 'Texas',
    stateAbbr: 'TX',
    taxDeedUrl: 'https://bexar.trueautomation.com/clientdb/Property.aspx',
    delinquentUrl: 'https://www.bexar.org/1925/Tax-Sales',
    scrapingMethod: 'web_scrape',
  },
  // Georgia
  'fulton-ga': {
    county: 'Fulton',
    state: 'Georgia',
    stateAbbr: 'GA',
    taxDeedUrl: 'https://www.fultoncountyga.gov/services/taxes/tax-commissioner/tax-sales',
    delinquentUrl: 'https://www.fultoncountyga.gov/services/taxes/tax-commissioner/tax-sales',
    scrapingMethod: 'web_scrape',
  },
  'dekalb-ga': {
    county: 'DeKalb',
    state: 'Georgia',
    stateAbbr: 'GA',
    taxDeedUrl: 'https://www.dekalbcountyga.gov/tax-commissioner/tax-sales',
    delinquentUrl: 'https://www.dekalbcountyga.gov/tax-commissioner/tax-sales',
    scrapingMethod: 'web_scrape',
  },
  'chatham-ga': {
    county: 'Chatham',
    state: 'Georgia',
    stateAbbr: 'GA',
    taxDeedUrl: 'https://www.chathamcountyga.gov/departments/tax-commissioner',
    delinquentUrl: 'https://www.chathamcountyga.gov/departments/tax-commissioner',
    scrapingMethod: 'web_scrape',
  },
  // Florida
  'miami-dade-fl': {
    county: 'Miami-Dade',
    state: 'Florida',
    stateAbbr: 'FL',
    taxDeedUrl: 'https://www.miamidade.gov/global/service.page?Mduid_service=ser1489687901036675',
    delinquentUrl: 'https://www.miamidade.gov/taxcollector/tax-certificate-sales.asp',
    scrapingMethod: 'web_scrape',
  },
  'orange-fl': {
    county: 'Orange',
    state: 'Florida',
    stateAbbr: 'FL',
    taxDeedUrl: 'https://www.octaxcol.com/eservices/tax_deed.cfm',
    delinquentUrl: 'https://www.octaxcol.com/eservices/tax_deed.cfm',
    scrapingMethod: 'web_scrape',
  },
  // California
  'los-angeles-ca': {
    county: 'Los Angeles',
    state: 'California',
    stateAbbr: 'CA',
    taxDeedUrl: 'https://ttc.lacounty.gov/property-tax-defaulted-property-tax-sales/',
    delinquentUrl: 'https://ttc.lacounty.gov/property-tax-defaulted-property-tax-sales/',
    scrapingMethod: 'web_scrape',
  },
  'san-diego-ca': {
    county: 'San Diego',
    state: 'California',
    stateAbbr: 'CA',
    taxDeedUrl: 'https://arcc.sdcounty.ca.gov/Pages/tax-sale.aspx',
    delinquentUrl: 'https://arcc.sdcounty.ca.gov/Pages/tax-sale.aspx',
    scrapingMethod: 'web_scrape',
  },
  // Arizona
  'maricopa-az': {
    county: 'Maricopa',
    state: 'Arizona',
    stateAbbr: 'AZ',
    taxDeedUrl: 'https://treasurer.maricopa.gov/Home/TaxLienSale',
    delinquentUrl: 'https://treasurer.maricopa.gov/Home/TaxLienSale',
    scrapingMethod: 'web_scrape',
  },
  // Nevada
  'clark-nv': {
    county: 'Clark',
    state: 'Nevada',
    stateAbbr: 'NV',
    taxDeedUrl: 'https://www.clarkcountynv.gov/government/departments/finance/treasurer/tax_sales/index.php',
    delinquentUrl: 'https://www.clarkcountynv.gov/government/departments/finance/treasurer/tax_sales/index.php',
    scrapingMethod: 'web_scrape',
  },
  // Add more counties as needed
};

/**
 * Find county information by county name and state
 */
export function findCountyInfo(county: string, state: string): CountyInfo | null {
  const key = `${county.toLowerCase().replace(/\s+/g, '-')}-${getStateAbbr(state).toLowerCase()}`;
  return KNOWN_COUNTIES[key] || null;
}

/**
 * Search for county information using web search
 * This is a fallback when county is not in our database
 */
export async function discoverCountyInfo(county: string, state: string): Promise<CountyInfo> {
  // Try to find in known counties first
  const knownInfo = findCountyInfo(county, state);
  if (knownInfo) {
    return knownInfo;
  }

  // Generate common patterns for county websites
  const stateAbbr = getStateAbbr(state).toLowerCase();
  const countyClean = county.toLowerCase().replace(/\s+/g, '');

  const commonPatterns = [
    `https://www.${countyClean}county${stateAbbr}.gov/tax-sales`,
    `https://${countyClean}.${stateAbbr}.gov/tax-sales`,
    `https://www.${countyClean}county.gov/tax-sales`,
    `https://${countyClean}county.com/tax-sales`,
  ];

  // Return a basic structure with guessed URLs
  // In production, this could make actual HTTP requests to verify
  return {
    county,
    state,
    stateAbbr: getStateAbbr(state),
    taxDeedUrl: commonPatterns[0],
    delinquentUrl: commonPatterns[0],
    scrapingMethod: 'manual',
    notes: 'Auto-discovered - verification needed',
  };
}

/**
 * Get all known counties
 */
export function getAllKnownCounties(): CountyInfo[] {
  return Object.values(KNOWN_COUNTIES);
}

/**
 * Get state abbreviation from full state name
 */
export function getStateAbbr(state: string): string {
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
  };

  const normalized = state.toLowerCase().trim();

  // If already an abbreviation, return it
  if (normalized.length === 2) {
    return state.toUpperCase();
  }

  return stateMap[normalized] || state.toUpperCase().substring(0, 2);
}

/**
 * Add a new county to the database
 */
export function addCountyInfo(info: CountyInfo): void {
  const key = `${info.county.toLowerCase().replace(/\s+/g, '-')}-${info.stateAbbr.toLowerCase()}`;
  KNOWN_COUNTIES[key] = info;
}
