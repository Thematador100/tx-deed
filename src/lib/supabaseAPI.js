import { supabase } from './customSupabaseClient';

/**
 * Fetch properties from the database
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of properties
 */
export async function getProperties(filters = {}) {
  const {
    type = 'all',
    state,
    county,
    minPrice,
    maxPrice,
    limit = 50,
    offset = 0,
  } = filters;

  try {
    const { data, error } = await supabase.functions.invoke('get-properties', {
      body: { type, state, county, minPrice, maxPrice, limit, offset },
    });

    if (error) throw error;
    return data?.properties || [];
  } catch (error) {
    console.error('Error fetching properties:', error);

    // Fallback to direct database query
    let query = supabase
      .from('properties')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type !== 'all') {
      query = query.eq('listing_type', type);
    }

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (county) {
      query = query.ilike('county', county);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error('Database query error:', dbError);
      return [];
    }

    return data || [];
  }
}

/**
 * Fetch tax delinquent leads from the database
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of tax delinquent leads
 */
export async function getTaxDelinquentLeads(filters = {}) {
  const { state, county, status, limit = 50, offset = 0 } = filters;

  try {
    const { data, error } = await supabase.functions.invoke('get-tax-delinquent-leads', {
      body: { state, county, status, limit, offset },
    });

    if (error) throw error;
    return data?.leads || [];
  } catch (error) {
    console.error('Error fetching tax delinquent leads:', error);

    // Fallback to direct database query
    let query = supabase
      .from('tax_delinquent_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (county) {
      query = query.ilike('county', county);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error('Database query error:', dbError);
      return [];
    }

    return data || [];
  }
}

/**
 * Fetch redeemable deeds from the database
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>} Array of redeemable deeds
 */
export async function getRedeemableDeeds(filters = {}) {
  const { state, status = 'Redeemable', limit = 50, offset = 0 } = filters;

  try {
    const { data, error } = await supabase.functions.invoke('get-redeemable-deeds', {
      body: { state, status, limit, offset },
    });

    if (error) throw error;
    return data?.deeds || [];
  } catch (error) {
    console.error('Error fetching redeemable deeds:', error);

    // Fallback to direct database query
    let query = supabase
      .from('redeemable_deeds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (state) {
      query = query.eq('state', state.toUpperCase());
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error: dbError } = await query;

    if (dbError) {
      console.error('Database query error:', dbError);
      return [];
    }

    return data || [];
  }
}

/**
 * Lookup a specific property by address
 * @param {string} address - Property address
 * @returns {Promise<Object>} Property lookup result with AI analysis
 */
export async function lookupProperty(address) {
  try {
    const { data, error } = await supabase.functions.invoke('property-lookup', {
      body: { address },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error looking up property:', error);
    throw error;
  }
}

/**
 * Scrape a specific county
 * @param {string} county - County name
 * @param {string} state - State name or abbreviation
 * @param {string} type - Scraper type (tax_deed, tax_delinquent, redeemable)
 * @returns {Promise<Object>} Scrape results
 */
export async function scrapeCounty(county, state, type = 'tax_deed') {
  try {
    const { data, error } = await supabase.functions.invoke('scrape-county', {
      body: { county, state, type },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error scraping county:', error);
    throw error;
  }
}

/**
 * Batch scrape multiple counties
 * @param {Object} params - Batch scrape parameters
 * @returns {Promise<Object>} Batch scrape results
 */
export async function batchScrape(params) {
  try {
    const { data, error } = await supabase.functions.invoke('batch-scrape', {
      body: params,
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error batch scraping:', error);
    throw error;
  }
}

/**
 * Get address suggestions for autocomplete
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of address suggestions
 */
export async function getAddressSuggestions(query) {
  if (!query || query.length < 3) {
    return [];
  }

  try {
    const { data, error } = await supabase.functions.invoke('smarty-autocomplete', {
      body: { query },
    });

    if (error) throw error;
    return data?.suggestions || [];
  } catch (error) {
    console.error('Error fetching address suggestions:', error);
    return [];
  }
}

/**
 * Save a property to user's saved list
 * @param {string} propertyId - Property ID
 * @param {string} notes - Optional notes
 * @returns {Promise<Object>} Result
 */
export async function saveProperty(propertyId, notes = '') {
  try {
    const { data, error } = await supabase
      .from('user_saved_properties')
      .insert({
        property_id: propertyId,
        notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error saving property:', error);
    throw error;
  }
}

/**
 * Get user's saved properties
 * @returns {Promise<Array>} Array of saved properties
 */
export async function getSavedProperties() {
  try {
    const { data, error } = await supabase
      .from('user_saved_properties')
      .select(`
        *,
        property:properties(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching saved properties:', error);
    return [];
  }
}

/**
 * Remove a property from user's saved list
 * @param {string} propertyId - Property ID
 * @returns {Promise<void>}
 */
export async function unsaveProperty(propertyId) {
  try {
    const { error } = await supabase
      .from('user_saved_properties')
      .delete()
      .eq('property_id', propertyId);

    if (error) throw error;
  } catch (error) {
    console.error('Error unsaving property:', error);
    throw error;
  }
}

/**
 * Get scraper configurations (admin only)
 * @returns {Promise<Array>} Array of scraper configs
 */
export async function getScraperConfigs() {
  try {
    const { data, error } = await supabase
      .from('scraper_configs')
      .select('*')
      .order('state', { ascending: true })
      .order('county', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching scraper configs:', error);
    return [];
  }
}

/**
 * Get scraper logs (admin only)
 * @param {number} limit - Number of logs to fetch
 * @returns {Promise<Array>} Array of scraper logs
 */
export async function getScraperLogs(limit = 50) {
  try {
    const { data, error } = await supabase
      .from('scraper_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching scraper logs:', error);
    return [];
  }
}
