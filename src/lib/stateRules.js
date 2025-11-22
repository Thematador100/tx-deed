/**
 * Comprehensive 50-State Tax Lien and Tax Deed Rules Library
 * Enterprise-grade distressed real estate investment data
 * All information based on current state statutes and regulations
 */

export const STATE_SALE_TYPES = {
  TAX_LIEN: 'tax_lien',
  TAX_DEED: 'tax_deed',
  HYBRID: 'hybrid',
  REDEEMABLE_DEED: 'redeemable_deed'
};

export const stateRules = {
  AL: {
    state: 'Alabama',
    abbreviation: 'AL',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '3 years',
    redemptionPeriodDays: 1095,
    interestRate: '12% per annum',
    interestRatePercent: 12,
    minimumBid: 'Taxes owed plus costs',
    biddingProcess: 'Competitive public auction',
    saleFrequency: 'Annual (May)',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'High redemption interest rate (12%)',
      'Clear deed after 3 years',
      'Surplus bid opportunities'
    ],
    investorRisks: [
      '3-year redemption period',
      'Title issues possible',
      'Property condition unknown'
    ],
    notableFeatures: [
      'Tax deed state with redemption rights',
      'Annual county sales in May',
      'Probate judge conducts sales'
    ],
    statutoryReference: 'Code of Alabama § 40-10-1 et seq.',
    profitPotential: 'Medium-High',
    competitionLevel: 'Medium',
    avgROI: '12-18%'
  },

  AK: {
    state: 'Alaska',
    abbreviation: 'AK',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '15% per annum',
    interestRatePercent: 15,
    minimumBid: 'Full assessed value',
    biddingProcess: 'Sealed bid auction',
    saleFrequency: 'Varies by borough',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Highest redemption rate in US (15%)',
      'Limited competition',
      'Unique market opportunities'
    ],
    investorRisks: [
      'Remote property locations',
      'High minimum bids',
      'Extreme weather/access issues'
    ],
    notableFeatures: [
      'Boroughs conduct own sales',
      'Often requires full assessed value bid',
      'Very low inventory'
    ],
    statutoryReference: 'Alaska Stat. § 29.45.300',
    profitPotential: 'High',
    competitionLevel: 'Low',
    avgROI: '15-25%'
  },

  AZ: {
    state: 'Arizona',
    abbreviation: 'AZ',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '3 years (lien), 0 years (deed)',
    redemptionPeriodDays: 1095,
    interestRate: '16% per annum',
    interestRatePercent: 16,
    minimumBid: 'Taxes, interest, and costs',
    biddingProcess: 'Bid down the interest rate',
    saleFrequency: 'Annual (February)',
    investorRequirements: 'Must be 18+, proper ID',
    overBidDistribution: 'N/A - interest rate bidding',
    rightOfRedemption: true,
    investorAdvantages: [
      'Highest statutory interest rate (16%)',
      'Can foreclose after 3 years',
      'Hot real estate market'
    ],
    investorRisks: [
      'Competitive bidding drives rates down',
      'Often bid to 0% interest',
      '3-year wait for foreclosure'
    ],
    notableFeatures: [
      'Bid down interest rate system',
      'Treasurer\'s deed after foreclosure',
      'Very competitive market'
    ],
    statutoryReference: 'ARS § 42-18101 to 42-18206',
    profitPotential: 'Medium',
    competitionLevel: 'Very High',
    avgROI: '0-16% depending on competition'
  },

  AR: {
    state: 'Arkansas',
    abbreviation: 'AR',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '30 days (occupied), 2 months (unoccupied), 1 year (military)',
    redemptionPeriodDays: 30,
    interestRate: '10% penalty on redemption',
    interestRatePercent: 10,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Public auction (online/in-person)',
    saleFrequency: 'Monthly or as needed',
    investorRequirements: 'Registration required',
    overBidDistribution: 'Surplus to former owner after claims',
    rightOfRedemption: true,
    investorAdvantages: [
      'Very short redemption period',
      'Quick turnaround possible',
      'Growing investor market'
    ],
    investorRisks: [
      'Occupied properties only 30 days',
      'Complex redemption rules',
      'Prior lien verification needed'
    ],
    notableFeatures: [
      'Shortest redemption in tax deed states',
      'Negotiated sale option available',
      'Commissioner conducts sales'
    ],
    statutoryReference: 'Ark. Code Ann. § 26-37-101',
    profitPotential: 'Medium-High',
    competitionLevel: 'Medium',
    avgROI: '10-20%'
  },

  CA: {
    state: 'California',
    abbreviation: 'CA',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: 'None after sale',
    redemptionPeriodDays: 0,
    interestRate: 'N/A',
    interestRatePercent: 0,
    minimumBid: '$100 minimum, usually much higher',
    biddingProcess: 'Public auction, highest bidder',
    saleFrequency: 'Varies by county',
    investorRequirements: 'Deposit required (varies by county)',
    overBidDistribution: 'Surplus to former owner and lienholders',
    rightOfRedemption: false,
    investorAdvantages: [
      'No redemption period',
      'Immediate ownership',
      'High value properties'
    ],
    investorRisks: [
      'Very competitive market',
      'Properties often sell at/near market value',
      'High investor population'
    ],
    notableFeatures: [
      '5-year default process before sale',
      'No redemption after sale',
      'Extremely competitive auctions'
    ],
    statutoryReference: 'California Revenue & Tax Code § 3691-3729',
    profitPotential: 'Low-Medium',
    competitionLevel: 'Extreme',
    avgROI: '5-15%'
  },

  CO: {
    state: 'Colorado',
    abbreviation: 'CO',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '3 years or until Treasurer\'s Deed',
    redemptionPeriodDays: 1095,
    interestRate: '9% above federal discount rate',
    interestRatePercent: 14.5,
    minimumBid: 'Taxes, interest, fees',
    biddingProcess: 'Public auction or online',
    saleFrequency: 'Annual (October-November)',
    investorRequirements: 'Proper identification',
    overBidDistribution: 'Premium to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Can receive deed or hold certificate',
      'Strong real estate market',
      'Good returns on redemptions'
    ],
    investorRisks: [
      'Competitive market in metro areas',
      'Complex hybrid system',
      'Extended redemption periods'
    ],
    notableFeatures: [
      'Option for certificate or deed',
      'Additional annual lien purchases',
      'Treasurer issues deeds after 3 years'
    ],
    statutoryReference: 'C.R.S. § 39-11-101 et seq.',
    profitPotential: 'Medium',
    competitionLevel: 'High',
    avgROI: '9-18%'
  },

  CT: {
    state: 'Connecticut',
    abbreviation: 'CT',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '6 months',
    redemptionPeriodDays: 180,
    interestRate: '18% per annum',
    interestRatePercent: 18,
    interestRate: '18% per annum',
    interestRatePercent: 18,
    minimumBid: 'Taxes and fees',
    biddingProcess: 'Public auction by municipality',
    saleFrequency: 'As needed by town',
    investorRequirements: 'Deposit typically required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Excellent 18% redemption interest',
      'Short 6-month redemption',
      'High-value properties available'
    ],
    investorRisks: [
      'Competitive in desirable areas',
      'Municipal liens can be complex',
      'Title examination critical'
    ],
    notableFeatures: [
      'Each municipality conducts own sales',
      'Tax deed with redemption rights',
      'Strong investor protections'
    ],
    statutoryReference: 'Conn. Gen. Stat. § 12-157',
    profitPotential: 'High',
    competitionLevel: 'Medium-High',
    avgROI: '18-30%'
  },

  DE: {
    state: 'Delaware',
    abbreviation: 'DE',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '60 days post-sale',
    redemptionPeriodDays: 60,
    interestRate: '15% penalty on redemption',
    interestRatePercent: 15,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual',
    investorRequirements: 'None specified',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Short redemption period',
      'Small state, manageable inventory',
      'Good returns'
    ],
    investorRisks: [
      'Limited inventory',
      'Small market',
      'Competition in New Castle County'
    ],
    notableFeatures: [
      'Sheriff conducts tax sales',
      '60-day redemption window',
      'Tax-friendly state overall'
    ],
    statutoryReference: '9 Del. C. § 8725',
    profitPotential: 'Medium',
    competitionLevel: 'Medium',
    avgROI: '15-25%'
  },

  FL: {
    state: 'Florida',
    abbreviation: 'FL',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '2 years',
    redemptionPeriodDays: 730,
    interestRate: '18% per annum (0.25% per month minimum)',
    interestRatePercent: 18,
    minimumBid: '0.25% monthly interest',
    biddingProcess: 'Bid down the interest rate',
    saleFrequency: 'Annual (May/June)',
    investorRequirements: 'Deposit required, proper ID',
    overBidDistribution: 'N/A - interest bidding',
    rightOfRedemption: true,
    investorAdvantages: [
      'Large inventory statewide',
      'Can foreclose after 2 years',
      'Strong real estate market'
    ],
    investorRisks: [
      'Highly competitive',
      'Often bid to minimum (0.25%)',
      'Title issues in older properties'
    ],
    notableFeatures: [
      'Bid down interest from 18%',
      'Tax deed after 2-year application',
      'Huge investor market'
    ],
    statutoryReference: 'Fla. Stat. § 197.432',
    profitPotential: 'Low-Medium',
    competitionLevel: 'Extreme',
    avgROI: '0.25-18% (typically under 5%)'
  },

  GA: {
    state: 'Georgia',
    abbreviation: 'GA',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '20% per annum (most states)',
    interestRatePercent: 20,
    minimumBid: 'Taxes, interest, costs',
    biddingProcess: 'Competitive auction',
    saleFrequency: 'First Tuesday of month',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Highest redemption rate (20%)',
      'Monthly sales (first Tuesday)',
      'Large inventory',
      'Clear statutory framework'
    ],
    investorRisks: [
      '1-year redemption period',
      'Competitive in metro Atlanta',
      'Extensive due diligence needed'
    ],
    notableFeatures: [
      'Famous "First Tuesday" sales',
      'County courthouse steps',
      'Premier tax deed state'
    ],
    statutoryReference: 'O.C.G.A. § 48-4-1 et seq.',
    profitPotential: 'Very High',
    competitionLevel: 'High',
    avgROI: '20-40%'
  },

  HI: {
    state: 'Hawaii',
    abbreviation: 'HI',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '12% per annum',
    interestRatePercent: 12,
    minimumBid: 'Minimum set by county',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual or as needed',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'High property values',
      'Limited supply',
      'Unique market'
    ],
    investorRisks: [
      'Extremely expensive properties',
      'Limited inventory',
      'Complex land ownership (leasehold common)',
      'Travel costs'
    ],
    notableFeatures: [
      'Very few tax sales',
      'Leasehold vs fee simple issues',
      'Each county different'
    ],
    statutoryReference: 'HRS § 246-55 to 246-72',
    profitPotential: 'High (if you can afford entry)',
    competitionLevel: 'Low-Medium',
    avgROI: '12-20%'
  },

  ID: {
    state: 'Idaho',
    abbreviation: 'ID',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '2 years',
    redemptionPeriodDays: 730,
    interestRate: '12% per annum',
    interestRatePercent: 12,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Sealed bid',
    saleFrequency: 'Annual (usually December)',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good redemption rate',
      'Growing market',
      'Less competition than neighboring states'
    ],
    investorRisks: [
      '2-year redemption',
      'Sealed bid can be challenging',
      'Rural property access'
    ],
    notableFeatures: [
      'County assessor conducts sales',
      'Sealed bid process',
      'Tax deed with redemption'
    ],
    statutoryReference: 'Idaho Code § 63-1001 et seq.',
    profitPotential: 'Medium-High',
    competitionLevel: 'Low-Medium',
    avgROI: '12-22%'
  },

  IL: {
    state: 'Illinois',
    abbreviation: 'IL',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '2.5 to 3 years',
    redemptionPeriodDays: 912,
    interestRate: 'Penalty bid system',
    interestRatePercent: 18,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Bid penalty percentage',
    saleFrequency: 'Annual',
    investorRequirements: 'Registration required',
    overBidDistribution: 'Penalty to investor',
    rightOfRedemption: true,
    investorAdvantages: [
      'Can earn 18%+ on redemption',
      'Large Cook County market',
      'Established processes'
    ],
    investorRisks: [
      'Complex penalty bid system',
      'Long redemption periods',
      'Scavenger sales can be unpredictable'
    ],
    notableFeatures: [
      'Annual and scavenger sales',
      'Penalty bid system',
      'Can petition for deed after 2.5 years'
    ],
    statutoryReference: '35 ILCS 200/21-1',
    profitPotential: 'Medium-High',
    competitionLevel: 'Very High (Cook County)',
    avgROI: '12-24%'
  },

  IN: {
    state: 'Indiana',
    abbreviation: 'IN',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '10-15% depending on county',
    interestRatePercent: 12.5,
    minimumBid: 'Minimum set by county',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual (varies by county)',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Reasonable redemption period',
      'Good inventory',
      'Moderate competition'
    ],
    investorRisks: [
      'County variations',
      'Some complex title issues',
      'Verify tax sale validity critical'
    ],
    notableFeatures: [
      'County auditor manages sales',
      'Certificate of sale issued',
      'Tax deed after redemption expires'
    ],
    statutoryReference: 'IC 6-1.1-24',
    profitPotential: 'Medium',
    competitionLevel: 'Medium',
    avgROI: '10-18%'
  },

  IA: {
    state: 'Iowa',
    abbreviation: 'IA',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '1.75 years (occupied), 2 months (vacant)',
    redemptionPeriodDays: 639,
    interestRate: '2% monthly (24% annual)',
    interestRatePercent: 24,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Public sale',
    saleFrequency: 'Third Monday in June',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to county',
    rightOfRedemption: true,
    investorAdvantages: [
      'Excellent 24% annual return',
      'Short redemption for vacant (60 days)',
      'Good agricultural land opportunities'
    ],
    investorRisks: [
      'Long redemption for occupied',
      'Market prices for ag land',
      'Rural property challenges'
    ],
    notableFeatures: [
      'Different redemption for occupied vs vacant',
      'Tax sale certificate system',
      'Can get Treasurer\'s deed'
    ],
    statutoryReference: 'Iowa Code § 446',
    profitPotential: 'High',
    competitionLevel: 'Low-Medium',
    avgROI: '24% on redemptions'
  },

  KS: {
    state: 'Kansas',
    abbreviation: 'KS',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '3 years',
    redemptionPeriodDays: 1095,
    interestRate: 'Premium bid amount',
    interestRatePercent: 0,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Sealed bid',
    saleFrequency: 'Annual (September)',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Sealed bid less pressure',
      'Large agricultural parcels',
      'Lower competition'
    ],
    investorRisks: [
      'Long 3-year redemption',
      'No interest on redemption',
      'Sealed bid uncertainty'
    ],
    notableFeatures: [
      'Sealed bid system',
      'Sheriff\'s tax deed',
      '3-year redemption period'
    ],
    statutoryReference: 'K.S.A. § 79-2301 et seq.',
    profitPotential: 'Low-Medium',
    competitionLevel: 'Low',
    avgROI: '5-15%'
  },

  KY: {
    state: 'Kentucky',
    abbreviation: 'KY',
    saleType: STATE_SALE_TYPES.TAX_LIEN,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '12% per annum',
    interestRatePercent: 12,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction or negotiated sale',
    saleFrequency: 'As needed',
    investorRequirements: 'None',
    overBidDistribution: 'N/A',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good 12% return',
      'Can negotiate direct purchases',
      'Master Commissioner sales'
    ],
    investorRisks: [
      'Complex lien process',
      'Property condition issues',
      'Lengthy foreclosure possible'
    ],
    notableFeatures: [
      'Hybrid system with liens and deeds',
      'Sheriff conducts some sales',
      'Master Commissioner involved'
    ],
    statutoryReference: 'KRS § 134.490',
    profitPotential: 'Medium',
    competitionLevel: 'Low-Medium',
    avgROI: '12-20%'
  },

  LA: {
    state: 'Louisiana',
    abbreviation: 'LA',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '3 years',
    redemptionPeriodDays: 1095,
    interestRate: '12% per annum plus 5% penalty',
    interestRatePercent: 17,
    minimumBid: '5% of assessed value or taxes',
    biddingProcess: 'Bid premium over minimum',
    saleFrequency: 'Annual (varies by parish)',
    investorRequirements: 'None',
    overBidDistribution: 'Premium to tax collector',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good combined return (17%)',
      'Tax sale title is strong',
      'Can quiet title after 3 years'
    ],
    investorRisks: [
      '3-year wait',
      'Complex Louisiana law',
      'Parish variations'
    ],
    notableFeatures: [
      'Tax sale certificate issued',
      'Can file to annul tax title',
      'Tax deed after 3 years'
    ],
    statutoryReference: 'La. R.S. 47:2121 et seq.',
    profitPotential: 'Medium-High',
    competitionLevel: 'Medium',
    avgROI: '17% plus property appreciation'
  },

  ME: {
    state: 'Maine',
    abbreviation: 'ME',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '18 months',
    redemptionPeriodDays: 547,
    interestRate: '12% per annum',
    interestRatePercent: 12,
    minimumBid: 'Varies by municipality',
    biddingProcess: 'Public auction',
    saleFrequency: 'As needed by municipality',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good redemption rate',
      'Seasonal property opportunities',
      'Lower competition'
    ],
    investorRisks: [
      'Remote locations common',
      'Seasonal access issues',
      'Title examination critical'
    ],
    notableFeatures: [
      'Each municipality conducts own',
      'Automatic foreclosure process',
      'Tax acquired property'
    ],
    statutoryReference: '36 M.R.S. § 943',
    profitPotential: 'Medium',
    competitionLevel: 'Low-Medium',
    avgROI: '12-18%'
  },

  MD: {
    state: 'Maryland',
    abbreviation: 'MD',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '6 months to 2 years',
    redemptionPeriodDays: 180,
    interestRate: '6-24% depending on county',
    interestRatePercent: 15,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Bid premium percentage',
    saleFrequency: 'Annual (varies by county)',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Premium to investor',
    rightOfRedemption: true,
    investorAdvantages: [
      'High-value properties',
      'Bid premium system',
      'Strong foreclosure process'
    ],
    investorRisks: [
      'Very competitive',
      'High property prices',
      'Complex county variations'
    ],
    notableFeatures: [
      'Certificate of sale issued',
      'Can foreclose after redemption',
      'Each county different rules'
    ],
    statutoryReference: 'Md. Tax-Prop. Code Ann. § 14-808',
    profitPotential: 'Medium',
    competitionLevel: 'Very High',
    avgROI: '10-20%'
  },

  MA: {
    state: 'Massachusetts',
    abbreviation: 'MA',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '6 months',
    redemptionPeriodDays: 180,
    interestRate: '16% per annum',
    interestRatePercent: 16,
    minimumBid: 'Varies by municipality',
    biddingProcess: 'Public auction',
    saleFrequency: 'As needed by city/town',
    investorRequirements: 'Deposit typically required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Excellent 16% redemption rate',
      'Short 6-month period',
      'High-value markets'
    ],
    investorRisks: [
      'Extremely competitive',
      'High property values',
      'Limited inventory'
    ],
    notableFeatures: [
      'Collector of taxes conducts',
      'Land court registration helpful',
      'Strong title after redemption'
    ],
    statutoryReference: 'M.G.L. c. 60, § 45',
    profitPotential: 'Medium-High',
    competitionLevel: 'Very High',
    avgROI: '16% on redemptions'
  },

  MI: {
    state: 'Michigan',
    abbreviation: 'MI',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: 'None after auction',
    redemptionPeriodDays: 0,
    interestRate: 'N/A',
    interestRatePercent: 0,
    minimumBid: 'Varies by county',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual (September/October)',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: false,
    investorAdvantages: [
      'No redemption period',
      'Immediate ownership',
      'Large inventory (especially Detroit)'
    ],
    investorRisks: [
      'Property condition often poor',
      'Demolition liens possible',
      'Detroit market challenges'
    ],
    notableFeatures: [
      'No redemption after sale',
      'County treasurer conducts',
      'Online auctions common'
    ],
    statutoryReference: 'MCL 211.78 et seq.',
    profitPotential: 'Medium',
    competitionLevel: 'High',
    avgROI: '15-30% (varies greatly)'
  },

  MN: {
    state: 'Minnesota',
    abbreviation: 'MN',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '3 years (or 5 weeks if vacant)',
    redemptionPeriodDays: 1095,
    interestRate: 'Not applicable',
    interestRatePercent: 0,
    minimumBid: 'Appraised value usually',
    biddingProcess: 'Public auction',
    saleFrequency: 'As needed',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Vacant properties only 5 weeks',
      'Good markets in urban areas',
      'Lower competition than neighbors'
    ],
    investorRisks: [
      'High minimum bids',
      '3-year redemption for occupied',
      'Limited inventory'
    ],
    notableFeatures: [
      'County auditor manages',
      'Different redemption periods',
      'Tax forfeited land'
    ],
    statutoryReference: 'Minn. Stat. § 282.01',
    profitPotential: 'Medium',
    competitionLevel: 'Medium',
    avgROI: '10-20%'
  },

  MS: {
    state: 'Mississippi',
    abbreviation: 'MS',
    saleType: STATE_SALE_TYPES.TAX_LIEN,
    redemptionPeriod: '2 years',
    redemptionPeriodDays: 730,
    interestRate: '18% per annum (1.5% per month)',
    interestRatePercent: 18,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual (August-September)',
    investorRequirements: 'None',
    overBidDistribution: 'N/A',
    rightOfRedemption: true,
    investorAdvantages: [
      'Excellent 18% interest',
      'Can foreclose after 2 years',
      'Lower competition'
    ],
    investorRisks: [
      'Limited inventory',
      'Rural properties common',
      '2-year wait'
    ],
    notableFeatures: [
      'Tax lien certificate state',
      'Chancery clerk manages',
      'Can sue to foreclose'
    ],
    statutoryReference: 'Miss. Code Ann. § 27-41-1',
    profitPotential: 'High',
    competitionLevel: 'Low-Medium',
    avgROI: '18% annual'
  },

  MO: {
    state: 'Missouri',
    abbreviation: 'MO',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '10% per annum',
    interestRatePercent: 10,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual (August)',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good redemption rate',
      'Large inventory',
      'Trustee\'s deed available'
    ],
    investorRisks: [
      '1-year redemption',
      'Some title issues',
      'Competitive in metro areas'
    ],
    notableFeatures: [
      'Collector conducts sales',
      'Fourth Monday in August',
      'Certificate then deed'
    ],
    statutoryReference: 'Mo. Rev. Stat. § 140.010 et seq.',
    profitPotential: 'Medium',
    competitionLevel: 'Medium-High',
    avgROI: '10-18%'
  },

  MT: {
    state: 'Montana',
    abbreviation: 'MT',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '3 years',
    redemptionPeriodDays: 1095,
    interestRate: '10% penalty plus 2% monthly',
    interestRatePercent: 34,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Assigned by rotation',
    saleFrequency: 'Annual',
    investorRequirements: 'Registration in county',
    overBidDistribution: 'N/A - assigned not bid',
    rightOfRedemption: true,
    investorAdvantages: [
      'Excellent combined rate (34%)',
      'Assignment system (less competitive)',
      'Can get tax deed'
    ],
    investorRisks: [
      'Long 3-year redemption',
      'Rural properties',
      'Limited inventory'
    ],
    notableFeatures: [
      'Unique assignment rotation',
      'Not competitive bidding',
      'Treasurer assigns to investors'
    ],
    statutoryReference: 'MCA § 15-18-111',
    profitPotential: 'Very High',
    competitionLevel: 'Low',
    avgROI: '34% on redemptions'
  },

  NE: {
    state: 'Nebraska',
    abbreviation: 'NE',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '3 years',
    redemptionPeriodDays: 1095,
    interestRate: '14% per annum',
    interestRatePercent: 14,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual (varies by county)',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good 14% interest',
      'Can foreclose after 3 years',
      'Agricultural opportunities'
    ],
    investorRisks: [
      'Long redemption',
      'Rural properties predominate',
      'Limited urban inventory'
    ],
    notableFeatures: [
      'Certificate of tax sale',
      'Treasurer\'s deed available',
      'Agricultural land common'
    ],
    statutoryReference: 'Neb. Rev. Stat. § 77-1801',
    profitPotential: 'Medium',
    competitionLevel: 'Low-Medium',
    avgROI: '14% annually'
  },

  NV: {
    state: 'Nevada',
    abbreviation: 'NV',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '2 years (occupied), 120 days (vacant)',
    redemptionPeriodDays: 730,
    interestRate: '10% penalty',
    interestRatePercent: 10,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction',
    saleFrequency: 'As needed',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Short redemption for vacant (120 days)',
      'Las Vegas market opportunities',
      'Tax-friendly state'
    ],
    investorRisks: [
      'Competitive in Las Vegas',
      'Long occupied redemption',
      'HOA liens can be senior'
    ],
    notableFeatures: [
      'HOA lien sales very active',
      'Different periods occupied vs vacant',
      'County treasurer conducts'
    ],
    statutoryReference: 'NRS § 361.565 et seq.',
    profitPotential: 'High',
    competitionLevel: 'Very High',
    avgROI: '10-25%'
  },

  NH: {
    state: 'New Hampshire',
    abbreviation: 'NH',
    saleType: STATE_SALE_TYPES.TAX_LIEN,
    redemptionPeriod: '2 years',
    redemptionPeriodDays: 730,
    interestRate: '18% per annum',
    interestRatePercent: 18,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction',
    saleFrequency: 'As needed by municipality',
    investorRequirements: 'None',
    overBidDistribution: 'N/A',
    rightOfRedemption: true,
    investorAdvantages: [
      'Excellent 18% rate',
      'Can execute deed after 2 years',
      'No state income tax'
    ],
    investorRisks: [
      '2-year wait',
      'Competitive market',
      'Complex municipal variations'
    ],
    notableFeatures: [
      'Each municipality conducts',
      'Tax collector\'s deed',
      'Must execute deed properly'
    ],
    statutoryReference: 'RSA 80',
    profitPotential: 'High',
    competitionLevel: 'Medium-High',
    avgROI: '18% annually'
  },

  NJ: {
    state: 'New Jersey',
    abbreviation: 'NJ',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '2 years (most), 6 months (special)',
    redemptionPeriodDays: 730,
    interestRate: '18% per annum',
    interestRatePercent: 18,
    minimumBid: 'Varies',
    biddingProcess: 'Bid down interest rate',
    saleFrequency: 'As needed',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'N/A - interest bidding',
    rightOfRedemption: true,
    investorAdvantages: [
      'Statutory 18% rate',
      'Can foreclose after 2 years',
      'High property values'
    ],
    investorRisks: [
      'Extremely competitive',
      'Often bid to 0%',
      'Complex regulations'
    ],
    notableFeatures: [
      'Bid down from 18%',
      'Subsequent taxes important',
      'In rem foreclosure available'
    ],
    statutoryReference: 'N.J.S.A. 54:5-1 et seq.',
    profitPotential: 'Low-Medium',
    competitionLevel: 'Extreme',
    avgROI: '0-18% (typically under 5%)'
  },

  NM: {
    state: 'New Mexico',
    abbreviation: 'NM',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '3 years',
    redemptionPeriodDays: 1095,
    interestRate: 'Premium bid',
    interestRatePercent: 0,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual (varies)',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Lower competition',
      'Unique southwestern market',
      'Some bargain opportunities'
    ],
    investorRisks: [
      'Long 3-year redemption',
      'No interest on redemption',
      'Title issues common',
      'Water rights complexities'
    ],
    notableFeatures: [
      'Treasurer conducts sales',
      'State involvement',
      'Water rights critical'
    ],
    statutoryReference: 'NMSA § 7-38-1 et seq.',
    profitPotential: 'Medium',
    competitionLevel: 'Low-Medium',
    avgROI: '10-20%'
  },

  NY: {
    state: 'New York',
    abbreviation: 'NY',
    saleType: STATE_SALE_TYPES.TAX_LIEN,
    redemptionPeriod: '2-4 years depending on class',
    redemptionPeriodDays: 730,
    interestRate: '14% per annum (some lower)',
    interestRatePercent: 14,
    minimumBid: 'Varies by municipality',
    biddingProcess: 'Public auction or assigned',
    saleFrequency: 'Varies widely',
    investorRequirements: 'Registration often required',
    overBidDistribution: 'Varies',
    rightOfRedemption: true,
    investorAdvantages: [
      'High property values',
      'Large market',
      'Good returns possible'
    ],
    investorRisks: [
      'Extremely complex variations',
      'Each county/city different',
      'Long foreclosure process',
      'Very competitive NYC'
    ],
    notableFeatures: [
      '62 counties, 62+ different systems',
      'In rem foreclosure in some areas',
      'NYC very unique process'
    ],
    statutoryReference: 'NY Real Prop. Tax Law § 1100',
    profitPotential: 'Medium-High',
    competitionLevel: 'Very High',
    avgROI: '10-20%'
  },

  NC: {
    state: 'North Carolina',
    abbreviation: 'NC',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: 'None after foreclosure',
    redemptionPeriodDays: 0,
    interestRate: 'N/A',
    interestRatePercent: 0,
    minimumBid: 'Usually appraised value',
    biddingProcess: 'Upset bid process',
    saleFrequency: 'As needed',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: false,
    investorAdvantages: [
      'No redemption',
      'Clear title after sale',
      'Growing market'
    ],
    investorRisks: [
      'High minimum bids',
      'Upset bid process extends sale',
      'Competitive markets'
    ],
    notableFeatures: [
      'Judicial foreclosure first',
      'Then upset bid period',
      'Lengthy overall process'
    ],
    statutoryReference: 'N.C.G.S. § 105-374',
    profitPotential: 'Low-Medium',
    competitionLevel: 'High',
    avgROI: '5-15%'
  },

  ND: {
    state: 'North Dakota',
    abbreviation: 'ND',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '3 years',
    redemptionPeriodDays: 1095,
    interestRate: '12% per annum',
    interestRatePercent: 12,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Assignment or auction',
    saleFrequency: 'Annual',
    investorRequirements: 'None',
    overBidDistribution: 'Varies',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good 12% rate',
      'Lower competition',
      'Agricultural opportunities'
    ],
    investorRisks: [
      'Long redemption',
      'Very rural properties',
      'Limited inventory',
      'Harsh climate'
    ],
    notableFeatures: [
      'County auditor manages',
      'Certificate system',
      'Tax deed after 3 years'
    ],
    statutoryReference: 'N.D.C.C. § 57-24-01',
    profitPotential: 'Medium',
    competitionLevel: 'Low',
    avgROI: '12% annually'
  },

  OH: {
    state: 'Ohio',
    abbreviation: 'OH',
    saleType: STATE_SALE_TYPES.TAX_LIEN,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '18% per annum',
    interestRatePercent: 18,
    minimumBid: 'Varies',
    biddingProcess: 'Bid down rate or sealed bid',
    saleFrequency: 'Varies by county',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Varies by county',
    rightOfRedemption: true,
    investorAdvantages: [
      'Excellent 18% statutory rate',
      'Large inventory',
      'Can foreclose after 1 year'
    ],
    investorRisks: [
      'Very competitive',
      'Often bid to low rates',
      '88 counties, many variations'
    ],
    notableFeatures: [
      'Each county different',
      'Bid down or premium systems',
      'Foreclosure required for deed'
    ],
    statutoryReference: 'O.R.C. § 5721.01 et seq.',
    profitPotential: 'Medium',
    competitionLevel: 'Very High',
    avgROI: '5-18% depending on competition'
  },

  OK: {
    state: 'Oklahoma',
    abbreviation: 'OK',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '2 years',
    redemptionPeriodDays: 730,
    interestRate: '8% per annum',
    interestRatePercent: 8,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Public auction',
    saleFrequency: 'Varies by county',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Moderate competition',
      'Good inventory',
      'Growing markets (OKC, Tulsa)'
    ],
    investorRisks: [
      '2-year redemption',
      'Modest interest rate',
      'Title examination critical'
    ],
    notableFeatures: [
      'Resale by county treasurer',
      'Tax deed with redemption',
      'Sheriff\'s deed in some cases'
    ],
    statutoryReference: '68 Okl. St. § 3101',
    profitPotential: 'Medium',
    competitionLevel: 'Medium',
    avgROI: '8-16%'
  },

  OR: {
    state: 'Oregon',
    abbreviation: 'OR',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '2 years',
    redemptionPeriodDays: 730,
    interestRate: '16% first year, 12% second year',
    interestRatePercent: 14,
    minimumBid: 'Minimum set by county',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual or as needed',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good redemption rates',
      'Strong real estate markets',
      'Clear process'
    ],
    investorRisks: [
      '2-year redemption',
      'High property prices',
      'Competitive in Portland area'
    ],
    notableFeatures: [
      'Tax collector conducts',
      'Sheriff\'s deed issued',
      'Declining interest rate'
    ],
    statutoryReference: 'ORS § 312.010 et seq.',
    profitPotential: 'Medium',
    competitionLevel: 'High',
    avgROI: '12-16%'
  },

  PA: {
    state: 'Pennsylvania',
    abbreviation: 'PA',
    saleType: STATE_SALE_TYPES.TAX_LIEN,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: 'No interest (only premium bid)',
    interestRatePercent: 0,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Bid premium over taxes',
    saleFrequency: 'Annual (September)',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Distributed per statute',
    rightOfRedemption: true,
    investorAdvantages: [
      'Can bid high premiums',
      'Large inventory',
      'Can petition for deed after 1 year'
    ],
    investorRisks: [
      'No interest earned',
      'Premium can be excessive',
      'Competitive markets',
      'Repository sales different'
    ],
    notableFeatures: [
      'Premium bid system',
      'Upset sale, then judicial',
      'Repository for unsold properties'
    ],
    statutoryReference: '72 P.S. § 5860.101 et seq.',
    profitPotential: 'Low-Medium',
    competitionLevel: 'Very High',
    avgROI: '5-15%'
  },

  RI: {
    state: 'Rhode Island',
    abbreviation: 'RI',
    saleType: STATE_SALE_TYPES.TAX_LIEN,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '16% per annum',
    interestRatePercent: 16,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction',
    saleFrequency: 'As needed by municipality',
    investorRequirements: 'None',
    overBidDistribution: 'N/A',
    rightOfRedemption: true,
    investorAdvantages: [
      'Excellent 16% rate',
      'Short 1-year redemption',
      'Small state, manageable market'
    ],
    investorRisks: [
      'Very limited inventory',
      'Competitive',
      'Small market overall'
    ],
    notableFeatures: [
      'Each municipality conducts',
      'Tax collector\'s deed',
      'Petition land court for foreclosure'
    ],
    statutoryReference: 'R.I. Gen. Laws § 44-9-1',
    profitPotential: 'High',
    competitionLevel: 'High',
    avgROI: '16% on redemptions'
  },

  SC: {
    state: 'South Carolina',
    abbreviation: 'SC',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '3% penalty plus bid premium',
    interestRatePercent: 3,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction, bid premium',
    saleFrequency: 'Annual (varies by county)',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Premium to tax collector',
    rightOfRedemption: true,
    investorAdvantages: [
      'Short 1-year redemption',
      'Growing real estate market',
      'Clear process'
    ],
    investorRisks: [
      'Low redemption penalty',
      'Competitive coastal areas',
      'Title examination needed'
    ],
    notableFeatures: [
      'Delinquent tax collector',
      'Tax sale deed issued',
      ' 1-year redemption only'
    ],
    statutoryReference: 'S.C. Code Ann. § 12-51-40',
    profitPotential: 'Medium',
    competitionLevel: 'Medium-High',
    avgROI: '8-18%'
  },

  SD: {
    state: 'South Dakota',
    abbreviation: 'SD',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '3-4 years depending on type',
    redemptionPeriodDays: 1095,
    interestRate: '10% per annum',
    interestRatePercent: 10,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Assigned by county',
    saleFrequency: 'Annual',
    investorRequirements: 'Registration required',
    overBidDistribution: 'N/A - assigned not bid',
    rightOfRedemption: true,
    investorAdvantages: [
      'Assignment system (no bidding wars)',
      'Good 10% return',
      'Agricultural land opportunities'
    ],
    investorRisks: [
      'Long redemption periods',
      'Rural properties predominate',
      'Limited inventory'
    ],
    notableFeatures: [
      'County treasurer assigns',
      'No competitive bidding',
      'Certificate then deed'
    ],
    statutoryReference: 'SDCL § 10-23-1',
    profitPotential: 'Medium',
    competitionLevel: 'Low',
    avgROI: '10% annually'
  },

  TN: {
    state: 'Tennessee',
    abbreviation: 'TN',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '10% per annum',
    interestRatePercent: 10,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Public auction',
    saleFrequency: 'Varies by county',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Short 1-year redemption',
      'Good 10% rate',
      'Strong markets (Nashville, Memphis)'
    ],
    investorRisks: [
      'Competitive in urban areas',
      'Title examination critical',
      'Clerk & Master sales vary'
    ],
    notableFeatures: [
      'Clerk & Master conducts',
      'Tax deed with redemption',
      'Growing investor interest'
    ],
    statutoryReference: 'Tenn. Code Ann. § 67-5-2401',
    profitPotential: 'Medium-High',
    competitionLevel: 'Medium-High',
    avgROI: '10-20%'
  },

  TX: {
    state: 'Texas',
    abbreviation: 'TX',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '6 months (most), 2 years (ag/homestead)',
    redemptionPeriodDays: 180,
    interestRate: '25% penalty on redemption',
    interestRatePercent: 25,
    minimumBid: 'Usually minimum established',
    biddingProcess: 'Public auction',
    saleFrequency: 'First Tuesday of month',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Highest redemption penalty (25%)',
      'Monthly sales (first Tuesday)',
      'Huge market and inventory',
      'Strong economy'
    ],
    investorRisks: [
      'Very competitive',
      'Different redemption periods',
      'HOA/other liens can be issues'
    ],
    notableFeatures: [
      'First Tuesday sales',
      'Constable or Sheriff conducts',
      'Premier tax deed state'
    ],
    statutoryReference: 'Tex. Tax Code § 33.01 et seq.',
    profitPotential: 'Very High',
    competitionLevel: 'Very High',
    avgROI: '25%+ on redemptions'
  },

  UT: {
    state: 'Utah',
    abbreviation: 'UT',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '4 years',
    redemptionPeriodDays: 1460,
    interestRate: 'Premium bid amount',
    interestRatePercent: 0,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual (May)',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Hot real estate market',
      'Clear process',
      'Good inventory'
    ],
    investorRisks: [
      'Longest redemption (4 years)',
      'No interest on redemption',
      'Very competitive'
    ],
    notableFeatures: [
      'County auditor conducts',
      'Sheriff\'s tax deed',
      'Longest redemption in US'
    ],
    statutoryReference: 'Utah Code § 59-2-1351',
    profitPotential: 'Low-Medium',
    competitionLevel: 'Very High',
    avgROI: '5-12%'
  },

  VT: {
    state: 'Vermont',
    abbreviation: 'VT',
    saleType: STATE_SALE_TYPES.TAX_LIEN,
    redemptionPeriod: '1 year',
    redemptionPeriodDays: 365,
    interestRate: '12% per annum',
    interestRatePercent: 12,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction',
    saleFrequency: 'As needed by municipality',
    investorRequirements: 'None',
    overBidDistribution: 'N/A',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good 12% rate',
      'Short 1-year period',
      'Less competition'
    ],
    investorRisks: [
      'Limited inventory',
      'Rural properties common',
      'Seasonal access issues'
    ],
    notableFeatures: [
      'Each town conducts sales',
      'Tax collector\'s deed',
      'Quiet title action available'
    ],
    statutoryReference: '32 V.S.A. § 5061',
    profitPotential: 'Medium',
    competitionLevel: 'Low-Medium',
    avgROI: '12-18%'
  },

  VA: {
    state: 'Virginia',
    abbreviation: 'VA',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: 'None after sale',
    redemptionPeriodDays: 0,
    interestRate: 'N/A',
    interestRatePercent: 0,
    minimumBid: 'Usually assessed value',
    biddingProcess: 'Public auction',
    saleFrequency: 'As needed',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: false,
    investorAdvantages: [
      'No redemption period',
      'Immediate ownership',
      'Strong markets (NoVA, Richmond)'
    ],
    investorRisks: [
      'High minimum bids',
      'Very competitive',
      'Judicial process can be lengthy'
    ],
    notableFeatures: [
      'Judicial sale required',
      'No post-sale redemption',
      'Circuit court involved'
    ],
    statutoryReference: 'Va. Code Ann. § 58.1-3965',
    profitPotential: 'Low-Medium',
    competitionLevel: 'Very High',
    avgROI: '5-15%'
  },

  WA: {
    state: 'Washington',
    abbreviation: 'WA',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: '3 years',
    redemptionPeriodDays: 1095,
    interestRate: '12% per annum',
    interestRatePercent: 12,
    minimumBid: 'Taxes and costs',
    biddingProcess: 'Public auction',
    saleFrequency: 'Annual or as needed',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Good 12% rate',
      'Strong real estate markets',
      'Clear process'
    ],
    investorRisks: [
      'Long 3-year redemption',
      'Very competitive (Seattle area)',
      'High property values'
    ],
    notableFeatures: [
      'County treasurer conducts',
      'Treasurer\'s deed issued',
      'Foreclosure process clear'
    ],
    statutoryReference: 'RCW § 84.64.050',
    profitPotential: 'Medium',
    competitionLevel: 'Very High',
    avgROI: '12-20%'
  },

  WV: {
    state: 'West Virginia',
    abbreviation: 'WV',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '18 months',
    redemptionPeriodDays: 547,
    interestRate: '12% per annum',
    interestRatePercent: 12,
    minimumBid: 'Varies',
    biddingProcess: 'Bid down purchase price',
    saleFrequency: 'Annual (October)',
    investorRequirements: 'Proper ID',
    overBidDistribution: 'Bid down system',
    rightOfRedemption: true,
    investorAdvantages: [
      'Unique bid down system',
      'Good 12% rate',
      'Lower competition'
    ],
    investorRisks: [
      'Complex bidding process',
      'Coal/mineral rights issues',
      'Title examination critical'
    ],
    notableFeatures: [
      'Bid down the purchase price',
      'Sheriff conducts sales',
      'Deputy commissioner system'
    ],
    statutoryReference: 'W. Va. Code § 11A-3-1',
    profitPotential: 'Medium-High',
    competitionLevel: 'Low-Medium',
    avgROI: '12-25%'
  },

  WI: {
    state: 'Wisconsin',
    abbreviation: 'WI',
    saleType: STATE_SALE_TYPES.TAX_DEED,
    redemptionPeriod: 'Varies (typically none after sale)',
    redemptionPeriodDays: 0,
    interestRate: 'N/A',
    interestRatePercent: 0,
    minimumBid: 'Varies by county',
    biddingProcess: 'Public auction',
    saleFrequency: 'As needed',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: false,
    investorAdvantages: [
      'No redemption typically',
      'Immediate ownership',
      'Good Midwest markets'
    ],
    investorRisks: [
      'County variations',
      'Complex local rules',
      'Due diligence critical'
    ],
    notableFeatures: [
      'In rem tax foreclosure',
      'County treasurer manages',
      '72 counties, many variations'
    ],
    statutoryReference: 'Wis. Stat. § 75.14',
    profitPotential: 'Medium',
    competitionLevel: 'Medium-High',
    avgROI: '10-20%'
  },

  WY: {
    state: 'Wyoming',
    abbreviation: 'WY',
    saleType: STATE_SALE_TYPES.HYBRID,
    redemptionPeriod: '4 years',
    redemptionPeriodDays: 1460,
    interestRate: '15% first year, 10% thereafter',
    interestRatePercent: 12.5,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Public auction or assignment',
    saleFrequency: 'Annual',
    investorRequirements: 'None',
    overBidDistribution: 'Surplus to former owner',
    rightOfRedemption: true,
    investorAdvantages: [
      'Excellent first year rate (15%)',
      'Lower competition',
      'Mineral rights opportunities'
    ],
    investorRisks: [
      'Longest redemption (4 years)',
      'Very rural properties',
      'Limited inventory',
      'Mineral/surface rights split common'
    ],
    notableFeatures: [
      'County treasurer conducts',
      'Certificate then deed',
      'Declining interest rate'
    ],
    statutoryReference: 'Wyo. Stat. § 39-13-108',
    profitPotential: 'Medium-High',
    competitionLevel: 'Low',
    avgROI: '12.5% average'
  },

  DC: {
    state: 'District of Columbia',
    abbreviation: 'DC',
    saleType: STATE_SALE_TYPES.TAX_LIEN,
    redemptionPeriod: '6 months',
    redemptionPeriodDays: 180,
    interestRate: '18% per annum (1.5% monthly)',
    interestRatePercent: 18,
    minimumBid: 'Taxes owed',
    biddingProcess: 'Bid down interest rate',
    saleFrequency: 'Annual (July)',
    investorRequirements: 'Deposit required',
    overBidDistribution: 'N/A - interest bidding',
    rightOfRedemption: true,
    investorAdvantages: [
      'Statutory 18% rate',
      'Short 6-month redemption',
      'High property values'
    ],
    investorRisks: [
      'Extremely competitive',
      'Often bid to very low rates',
      'Can foreclose but expensive'
    ],
    notableFeatures: [
      'Bid down from 18%',
      'CFO conducts sales',
      'Online auction platform'
    ],
    statutoryReference: 'D.C. Code § 47-1301 et seq.',
    profitPotential: 'Low-Medium',
    competitionLevel: 'Extreme',
    avgROI: '0-18% (typically under 6%)'
  }
};

/**
 * Utility functions for state rules
 */

export const getStateByAbbreviation = (abbreviation) => {
  return stateRules[abbreviation.toUpperCase()] || null;
};

export const getStatesByType = (saleType) => {
  return Object.values(stateRules).filter(state => state.saleType === saleType);
};

export const getTaxLienStates = () => {
  return getStatesByType(STATE_SALE_TYPES.TAX_LIEN);
};

export const getTaxDeedStates = () => {
  return getStatesByType(STATE_SALE_TYPES.TAX_DEED);
};

export const getHybridStates = () => {
  return getStatesByType(STATE_SALE_TYPES.HYBRID);
};

export const getStatesByRedemptionPeriod = (maxDays) => {
  return Object.values(stateRules).filter(
    state => state.redemptionPeriodDays <= maxDays && state.redemptionPeriodDays > 0
  );
};

export const getStatesByMinimumInterest = (minRate) => {
  return Object.values(stateRules).filter(
    state => state.interestRatePercent >= minRate
  );
};

export const getTopROIStates = (count = 10) => {
  return Object.values(stateRules)
    .sort((a, b) => {
      const aROI = parseFloat(a.avgROI.split('-')[1] || a.avgROI.split('-')[0]) || 0;
      const bROI = parseFloat(b.avgROI.split('-')[1] || b.avgROI.split('-')[0]) || 0;
      return bROI - aROI;
    })
    .slice(0, count);
};

export const getBestStatesForBeginners = () => {
  return Object.values(stateRules).filter(state =>
    state.competitionLevel !== 'Extreme' &&
    state.competitionLevel !== 'Very High' &&
    state.redemptionPeriodDays <= 730 &&
    state.interestRatePercent >= 10
  );
};

export const getCompetitionLevelStats = () => {
  const levels = {
    'Low': 0,
    'Low-Medium': 0,
    'Medium': 0,
    'Medium-High': 0,
    'High': 0,
    'Very High': 0,
    'Extreme': 0
  };

  Object.values(stateRules).forEach(state => {
    levels[state.competitionLevel]++;
  });

  return levels;
};

export const getSaleTypeDistribution = () => {
  return {
    taxLien: getTaxLienStates().length,
    taxDeed: getTaxDeedStates().length,
    hybrid: getStatesByType(STATE_SALE_TYPES.HYBRID).length + getStatesByType(STATE_SALE_TYPES.REDEEMABLE_DEED).length
  };
};

export default stateRules;
