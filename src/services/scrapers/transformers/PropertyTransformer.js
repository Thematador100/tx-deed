/**
 * Property Data Transformer
 * Normalizes property data from various sources to a consistent schema
 */

import { supabase } from '../../../lib/customSupabaseClient.js';

export class PropertyTransformer {
  constructor(config = {}) {
    this.config = {
      validateAddresses: config.validateAddresses !== false,
      enrichData: config.enrichData !== false,
      calculateScores: config.calculateScores !== false,
      ...config
    };
  }

  /**
   * Transform scraped records to database schema
   */
  async transformToDatabase(records, source = 'unknown') {
    const transformed = [];

    for (const record of records) {
      try {
        const property = await this.transformSingleRecord(record, source);
        if (property) {
          transformed.push(property);
        }
      } catch (error) {
        console.error('Error transforming record:', error, record);
      }
    }

    return transformed;
  }

  /**
   * Transform a single record
   */
  async transformSingleRecord(record, source) {
    // Base property data matching database schema
    const property = {
      // Address
      address: record.address?.street || record.address?.full || '',
      city: record.address?.city || '',
      state: record.address?.state || '',
      zip_code: record.address?.zip || '',
      county: record.address?.county || '',

      // Geographic coordinates (to be enriched)
      lat: record.lat || null,
      lng: record.lng || null,

      // Property details
      bedrooms: record.property?.bedrooms || null,
      bathrooms: record.property?.bathrooms || null,
      sqft: record.property?.sqft || null,
      lot_size: record.property?.lotSize || null,
      year_built: record.property?.yearBuilt || null,
      property_type: record.property?.propertyType || 'Unknown',

      // Financial data
      price: record.financials?.openingBid || record.financials?.taxAmount || null,
      assessed_value: record.financials?.assessedValue || null,
      estimated_value: record.financials?.estimatedValue || null,
      tax_amount: record.financials?.taxAmount || null,

      // Sale information
      sale_date: record.sale?.date || null,
      sale_type: record.sale?.type || 'tax-deed',
      sale_status: record.sale?.status || 'upcoming',
      sale_location: record.sale?.location || '',

      // Property identification
      parcel_id: record.property?.parcelId || '',
      owner_name: record.property?.ownerName || '',

      // Investment metrics (to be calculated)
      roi: null,
      profit_potential: null,
      market_comparison: null,

      // Opportunity scores (to be calculated)
      opportunity_score: null,
      location_score: null,
      value_score: null,
      competition_score: null,

      // Images (to be populated)
      image_url: record.imageUrl || null,
      images: record.images || [],

      // Description
      description: this.generateDescription(record),

      // Metadata
      source: source || record.source || 'taxsaleresources',
      source_id: record.sourceId || '',
      source_url: record.sourceUrl || '',
      scraped_at: record.scrapedAt || new Date().toISOString(),

      // Status
      status: 'active',
      featured: false,

      // Additional data as JSONB
      metadata: {
        legal: record.legal,
        notes: record.notes,
        rawData: record.rawData
      }
    };

    // Enrich data if enabled
    if (this.config.enrichData) {
      await this.enrichProperty(property);
    }

    // Calculate scores if enabled
    if (this.config.calculateScores) {
      this.calculateOpportunityScores(property);
    }

    // Calculate ROI
    this.calculateROI(property);

    return property;
  }

  /**
   * Enrich property data with additional information
   */
  async enrichProperty(property) {
    // Geocode address if coordinates not available
    if (!property.lat || !property.lng) {
      const coords = await this.geocodeAddress(property);
      if (coords) {
        property.lat = coords.lat;
        property.lng = coords.lng;
      }
    }

    // Fetch neighborhood data
    if (property.lat && property.lng) {
      const neighborhood = await this.getNeighborhoodData(property.lat, property.lng);
      if (neighborhood) {
        property.metadata = {
          ...property.metadata,
          neighborhood
        };
      }
    }

    // Estimate market value if not provided
    if (!property.estimated_value && property.address) {
      property.estimated_value = await this.estimateMarketValue(property);
    }
  }

  /**
   * Geocode address using Smarty API or fallback
   */
  async geocodeAddress(property) {
    const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip_code}`;

    try {
      // Try Smarty API first
      const smartyKey = await this.getApiKey('smarty');
      if (smartyKey) {
        return await this.geocodeWithSmarty(fullAddress, smartyKey);
      }

      // Fallback to OpenStreetMap Nominatim (free, but rate limited)
      return await this.geocodeWithNominatim(fullAddress);

    } catch (error) {
      console.error('Geocoding error:', error);
      return null;
    }
  }

  /**
   * Geocode with Smarty API
   */
  async geocodeWithSmarty(address, apiKey) {
    const url = `https://us-street.api.smartystreets.com/street-address?auth-id=${apiKey}&street=${encodeURIComponent(address)}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data && data.length > 0) {
        const result = data[0];
        return {
          lat: parseFloat(result.metadata?.latitude),
          lng: parseFloat(result.metadata?.longitude)
        };
      }
    } catch (error) {
      console.error('Smarty geocoding error:', error);
    }

    return null;
  }

  /**
   * Geocode with OpenStreetMap Nominatim (fallback)
   */
  async geocodeWithNominatim(address) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}`;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'WinWithDeeds/1.0'
        }
      });

      const data = await response.json();

      if (data && data.length > 0) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    } catch (error) {
      console.error('Nominatim geocoding error:', error);
    }

    return null;
  }

  /**
   * Get API key from database
   */
  async getApiKey(service) {
    try {
      const { data, error } = await supabase
        .rpc('get_api_key', { key_name: service });

      if (error) throw error;
      return data?.decrypted_value;
    } catch (error) {
      console.warn(`Could not retrieve ${service} API key:`, error);
      return null;
    }
  }

  /**
   * Get neighborhood data
   */
  async getNeighborhoodData(lat, lng) {
    // Placeholder - would integrate with real estate APIs
    return {
      crime_rate: null,
      school_rating: null,
      walkability: null,
      transit_score: null
    };
  }

  /**
   * Estimate market value using comparables
   */
  async estimateMarketValue(property) {
    try {
      // Find similar properties in database
      const { data: comparables } = await supabase
        .from('properties')
        .select('estimated_value, assessed_value')
        .eq('city', property.city)
        .eq('state', property.state)
        .not('estimated_value', 'is', null)
        .limit(10);

      if (comparables && comparables.length > 0) {
        const avgValue = comparables.reduce((sum, p) =>
          sum + (p.estimated_value || p.assessed_value || 0), 0
        ) / comparables.length;

        return Math.round(avgValue);
      }

      // Fallback: use assessed value with multiplier
      if (property.assessed_value) {
        return Math.round(property.assessed_value * 1.1); // 10% above assessed
      }

    } catch (error) {
      console.error('Market value estimation error:', error);
    }

    return null;
  }

  /**
   * Calculate opportunity scores
   */
  calculateOpportunityScores(property) {
    // Location score (0-100)
    property.location_score = this.calculateLocationScore(property);

    // Value score (0-100)
    property.value_score = this.calculateValueScore(property);

    // Competition score (0-100)
    property.competition_score = this.calculateCompetitionScore(property);

    // Overall opportunity score (weighted average)
    property.opportunity_score = Math.round(
      (property.location_score * 0.3) +
      (property.value_score * 0.5) +
      (property.competition_score * 0.2)
    );
  }

  /**
   * Calculate location score
   */
  calculateLocationScore(property) {
    let score = 50; // Base score

    // Major markets get higher scores
    const majorMarkets = ['Atlanta', 'Miami', 'Tampa', 'Orlando', 'Jacksonville', 'Phoenix', 'Dallas', 'Houston'];
    if (majorMarkets.includes(property.city)) {
      score += 20;
    }

    // Populated areas are better
    if (property.city) score += 10;
    if (property.county) score += 5;

    // Geographic data available
    if (property.lat && property.lng) score += 15;

    return Math.min(100, score);
  }

  /**
   * Calculate value score
   */
  calculateValueScore(property) {
    let score = 50; // Base score

    if (property.price && property.estimated_value) {
      // Calculate discount percentage
      const discount = ((property.estimated_value - property.price) / property.estimated_value) * 100;

      if (discount >= 50) score += 40;
      else if (discount >= 30) score += 30;
      else if (discount >= 20) score += 20;
      else if (discount >= 10) score += 10;
      else score -= 10;
    }

    // Property has complete data
    if (property.bedrooms && property.bathrooms) score += 5;
    if (property.sqft) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate competition score
   */
  calculateCompetitionScore(property) {
    // Higher score = less competition (better opportunity)
    let score = 70; // Assume moderate competition

    // Rural areas typically have less competition
    const ruralKeywords = ['County', 'Township', 'Rural'];
    if (ruralKeywords.some(kw => property.city?.includes(kw))) {
      score += 15;
    }

    // Smaller properties may have less competition
    if (property.price && property.price < 50000) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate ROI
   */
  calculateROI(property) {
    if (!property.price || !property.estimated_value) {
      property.roi = null;
      property.profit_potential = null;
      return;
    }

    const purchaseCost = property.price;
    const estimatedValue = property.estimated_value;

    // Assume 10% renovation costs and 8% closing costs
    const renovationCosts = estimatedValue * 0.10;
    const closingCosts = purchaseCost * 0.08;
    const totalInvestment = purchaseCost + renovationCosts + closingCosts;

    // Profit potential
    property.profit_potential = Math.round(estimatedValue - totalInvestment);

    // ROI percentage
    if (totalInvestment > 0) {
      property.roi = Math.round((property.profit_potential / totalInvestment) * 100);
    }

    // Market comparison
    if (estimatedValue > 0) {
      property.market_comparison = Math.round((purchaseCost / estimatedValue) * 100);
    }
  }

  /**
   * Generate property description
   */
  generateDescription(record) {
    const parts = [];

    if (record.sale?.type) {
      parts.push(`${record.sale.type.replace('-', ' ').toUpperCase()} opportunity`);
    }

    if (record.address?.city && record.address?.state) {
      parts.push(`in ${record.address.city}, ${record.address.state}`);
    }

    if (record.property?.bedrooms && record.property?.bathrooms) {
      parts.push(`featuring ${record.property.bedrooms} bed, ${record.property.bathrooms} bath`);
    }

    if (record.financials?.openingBid) {
      parts.push(`with an opening bid of $${record.financials.openingBid.toLocaleString()}`);
    }

    if (record.sale?.date) {
      parts.push(`scheduled for ${record.sale.date}`);
    }

    return parts.join(' ') || 'Tax sale property opportunity';
  }

  /**
   * Validate transformed property
   */
  validateProperty(property) {
    const errors = [];

    // Required fields
    if (!property.address) errors.push('Address is required');
    if (!property.city) errors.push('City is required');
    if (!property.state) errors.push('State is required');

    // Data quality
    if (property.price && property.price < 0) errors.push('Price cannot be negative');
    if (property.bedrooms && property.bedrooms < 0) errors.push('Bedrooms cannot be negative');

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Batch transform and insert to database
   */
  async transformAndSave(records, source = 'taxsaleresources') {
    console.log(`Transforming ${records.length} records...`);

    const transformed = await this.transformToDatabase(records, source);
    const valid = transformed.filter(p => this.validateProperty(p).isValid);

    console.log(`${valid.length} valid records ready for database`);

    if (valid.length > 0) {
      return await this.saveToDatabase(valid);
    }

    return { success: false, count: 0 };
  }

  /**
   * Save properties to database
   */
  async saveToDatabase(properties) {
    try {
      const { data, error } = await supabase
        .from('properties')
        .upsert(properties, {
          onConflict: 'source,source_id',
          ignoreDuplicates: false
        })
        .select();

      if (error) throw error;

      console.log(`Successfully saved ${data?.length || 0} properties to database`);

      return {
        success: true,
        count: data?.length || 0,
        data
      };

    } catch (error) {
      console.error('Database save error:', error);
      return {
        success: false,
        error: error.message,
        count: 0
      };
    }
  }
}

export default PropertyTransformer;
