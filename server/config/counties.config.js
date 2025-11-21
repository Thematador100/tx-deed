/**
 * County Scraper Configurations
 *
 * Defines scraping strategies for different counties and platforms.
 * Add new counties here with their specific configuration.
 */

export const COUNTIES = {
  // Texas Counties
  'harris-tx': {
    name: 'Harris',
    state: 'TX',
    defaultCity: 'Houston',
    url: 'https://www.hctax.net/Property/PropertyTax',
    platformType: 'custom',
    active: true,
    selectors: {
      container: '.property-row, table tr',
      fields: {
        parcel_id: '.account, [data-account]',
        address: '.property-address',
        owner: '.owner-name',
        assessed_value: '.appraised-value',
        tax_amount: '.tax-due',
      }
    }
  },

  'dallas-tx': {
    name: 'Dallas',
    state: 'TX',
    defaultCity: 'Dallas',
    url: 'https://www.dallascounty.org/government/tax/index.php',
    platformType: 'custom',
    active: true,
  },

  'tarrant-tx': {
    name: 'Tarrant',
    state: 'TX',
    defaultCity: 'Fort Worth',
    url: 'https://www.tarrantcountytx.gov/en/tax-assessor-collector.html',
    platformType: 'custom',
    active: true,
  },

  'travis-tx': {
    name: 'Travis',
    state: 'TX',
    defaultCity: 'Austin',
    url: 'https://tax-office.traviscountytx.gov/',
    platformType: 'custom',
    active: true,
  },

  'bexar-tx': {
    name: 'Bexar',
    state: 'TX',
    defaultCity: 'San Antonio',
    url: 'https://bexar.org/1951/Delinquent-Tax-Information',
    platformType: 'custom',
    active: true,
  },

  // Florida Counties
  'miami-dade-fl': {
    name: 'Miami-Dade',
    state: 'FL',
    defaultCity: 'Miami',
    url: 'https://www.miamidade.gov/pa/property_search.asp',
    platformType: 'custom',
    active: true,
  },

  'orange-fl': {
    name: 'Orange',
    state: 'FL',
    defaultCity: 'Orlando',
    url: 'https://www.ocpafl.org/searches/ParcelSearch.aspx',
    platformType: 'custom',
    active: true,
  },

  // Georgia Counties (Often use Civicsource)
  'fulton-ga': {
    name: 'Fulton',
    state: 'GA',
    defaultCity: 'Atlanta',
    url: 'https://www.qpublic.net/ga/fulton/',
    platformType: 'civicsource',
    active: true,
  },

  'dekalb-ga': {
    name: 'DeKalb',
    state: 'GA',
    defaultCity: 'Decatur',
    url: 'https://www.qpublic.net/ga/dekalb/',
    platformType: 'civicsource',
    active: true,
  },

  // California Counties
  'los-angeles-ca': {
    name: 'Los Angeles',
    state: 'CA',
    defaultCity: 'Los Angeles',
    url: 'https://portal.assessor.lacounty.gov/',
    platformType: 'custom',
    active: true,
  },

  'san-diego-ca': {
    name: 'San Diego',
    state: 'CA',
    defaultCity: 'San Diego',
    url: 'https://arcc.sdcounty.ca.gov/Pages/default.aspx',
    platformType: 'custom',
    active: true,
  },

  // Arizona Counties (Often use Realauction)
  'maricopa-az': {
    name: 'Maricopa',
    state: 'AZ',
    defaultCity: 'Phoenix',
    url: 'https://treasurer.maricopa.gov/Foreclosure',
    platformType: 'realauction',
    active: true,
  },

  'pima-az': {
    name: 'Pima',
    state: 'AZ',
    defaultCity: 'Tucson',
    url: 'https://www.auctionswithbreakfield.com/',
    platformType: 'realauction',
    active: true,
  },

  // Pennsylvania Counties (Often use Grant Street Group)
  'allegheny-pa': {
    name: 'Allegheny',
    state: 'PA',
    defaultCity: 'Pittsburgh',
    url: 'https://www.alleghenycounty.us/treasury/index.aspx',
    platformType: 'grantstreet',
    active: true,
  },

  'philadelphia-pa': {
    name: 'Philadelphia',
    state: 'PA',
    defaultCity: 'Philadelphia',
    url: 'https://www.phila.gov/departments/office-of-property-assessment/',
    platformType: 'grantstreet',
    active: true,
  },
};

/**
 * Get active counties
 */
export function getActiveCounties() {
  return Object.entries(COUNTIES)
    .filter(([_, config]) => config.active)
    .map(([id, config]) => ({ id, ...config }));
}

/**
 * Get county by ID
 */
export function getCounty(countyId) {
  return COUNTIES[countyId];
}

/**
 * Get counties by state
 */
export function getCountiesByState(state) {
  return Object.entries(COUNTIES)
    .filter(([_, config]) => config.state === state)
    .map(([id, config]) => ({ id, ...config }));
}

export default COUNTIES;
