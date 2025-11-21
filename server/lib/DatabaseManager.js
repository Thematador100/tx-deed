/**
 * Database Manager for Scraped Data
 *
 * Handles saving scraped property data to Supabase with:
 * - Duplicate detection
 * - Data validation
 * - Batch inserts
 * - Error handling
 */

import { createClient } from '@supabase/supabase-js';

class DatabaseManager {
  constructor(supabaseUrl, supabaseKey) {
    this.supabase = createClient(supabaseUrl, supabaseKey);
    this.batchSize = 50;
    this.batch = [];
  }

  /**
   * Save property to database
   */
  async saveProperty(propertyData) {
    try {
      // Check if property already exists (by parcel_id or address)
      const existing = await this.findExistingProperty(
        propertyData.parcel_id,
        propertyData.address
      );

      if (existing) {
        // Update existing property
        return await this.updateProperty(existing.id, propertyData);
      } else {
        // Insert new property
        return await this.insertProperty(propertyData);
      }
    } catch (error) {
      console.error('[DatabaseManager] Error saving property:', error.message);
      throw error;
    }
  }

  /**
   * Find existing property by parcel ID or address
   */
  async findExistingProperty(parcelId, address) {
    if (!parcelId && !address) return null;

    let query = this.supabase
      .from('properties')
      .select('id, parcel_id, address');

    if (parcelId) {
      query = query.eq('parcel_id', parcelId);
    } else if (address) {
      query = query.eq('address', address);
    }

    const { data, error } = await query.maybeSingle();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Insert new property
   */
  async insertProperty(propertyData) {
    const { data, error } = await this.supabase
      .from('properties')
      .insert(this.formatPropertyForDB(propertyData))
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`[DatabaseManager] Inserted property: ${propertyData.address || propertyData.parcel_id}`);
    return data;
  }

  /**
   * Update existing property
   */
  async updateProperty(id, propertyData) {
    const { data, error } = await this.supabase
      .from('properties')
      .update({
        ...this.formatPropertyForDB(propertyData),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    console.log(`[DatabaseManager] Updated property: ${propertyData.address || propertyData.parcel_id}`);
    return data;
  }

  /**
   * Format property data for database
   */
  formatPropertyForDB(propertyData) {
    return {
      parcel_id: propertyData.parcel_id,
      address: propertyData.address,
      city: propertyData.city,
      state: propertyData.state,
      zip: propertyData.zip,
      owner: propertyData.owner,
      price: propertyData.starting_bid || propertyData.opening_bid,
      starting_bid: propertyData.starting_bid || propertyData.opening_bid,
      estimated_value: propertyData.assessed_value || propertyData.estimated_value,
      auction_date: propertyData.auction_date,
      property_type: propertyData.property_type,
      bedrooms: propertyData.bedrooms,
      bathrooms: propertyData.bathrooms,
      sqft: propertyData.sqft,
      status: propertyData.status || 'Upcoming',
      listing_type: propertyData.listing_type || 'auction',
      source: propertyData.source,
      source_state: propertyData.source_state,
      scraped_at: propertyData.scraped_at || new Date().toISOString(),
      // Store raw data for reference
      metadata: {
        platform_type: propertyData.platform_type,
        raw_data: propertyData.raw_data,
      },
    };
  }

  /**
   * Add property to batch
   */
  addToBatch(propertyData) {
    this.batch.push(propertyData);

    if (this.batch.length >= this.batchSize) {
      return this.flushBatch();
    }
  }

  /**
   * Flush batch to database
   */
  async flushBatch() {
    if (this.batch.length === 0) return;

    console.log(`[DatabaseManager] Flushing batch of ${this.batch.length} properties`);

    const results = {
      inserted: 0,
      updated: 0,
      failed: 0,
      errors: [],
    };

    for (const propertyData of this.batch) {
      try {
        const result = await this.saveProperty(propertyData);
        if (result) {
          results.inserted++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          property: propertyData.address || propertyData.parcel_id,
          error: error.message,
        });
      }
    }

    this.batch = [];
    return results;
  }

  /**
   * Save scrape run metadata
   */
  async saveScraperRun(runData) {
    const { data, error } = await this.supabase
      .from('scraper_runs')
      .insert({
        county: runData.county,
        state: runData.state,
        platform_type: runData.platformType,
        started_at: runData.startedAt,
        completed_at: runData.completedAt,
        status: runData.status,
        items_scraped: runData.itemsScraped,
        items_saved: runData.itemsSaved,
        errors: runData.errors,
        duration_ms: runData.duration,
        stats: runData.stats,
      })
      .select()
      .single();

    if (error) {
      console.error('[DatabaseManager] Error saving scraper run:', error);
    }

    return data;
  }

  /**
   * Get recent scraper runs
   */
  async getRecentRuns(limit = 10) {
    const { data, error } = await this.supabase
      .from('scraper_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Get scraper statistics
   */
  async getScraperStats() {
    // Total properties by source
    const { data: propertiesBySource, error: error1 } = await this.supabase
      .from('properties')
      .select('source, state')
      .not('scraped_at', 'is', null);

    // Recent scraper runs
    const { data: recentRuns, error: error2 } = await this.supabase
      .from('scraper_runs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    // Properties scraped in last 24 hours
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentlyScraped, error: error3 } = await this.supabase
      .from('properties')
      .select('*', { count: 'exact', head: true })
      .gte('scraped_at', yesterday);

    if (error1 || error2 || error3) {
      console.error('[DatabaseManager] Error fetching stats');
    }

    // Count by source
    const sourceStats = {};
    propertiesBySource?.forEach(prop => {
      const key = `${prop.source}, ${prop.state}`;
      sourceStats[key] = (sourceStats[key] || 0) + 1;
    });

    return {
      totalScraped: propertiesBySource?.length || 0,
      recentlyScraped: recentlyScraped || 0,
      bySource: sourceStats,
      recentRuns: recentRuns || [],
    };
  }

  /**
   * Delete old properties
   */
  async deleteOldProperties(daysOld = 90) {
    const cutoffDate = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await this.supabase
      .from('properties')
      .delete()
      .lt('scraped_at', cutoffDate)
      .eq('status', 'Expired');

    if (error) {
      throw error;
    }

    console.log(`[DatabaseManager] Deleted ${data?.length || 0} old properties`);
    return data;
  }
}

export default DatabaseManager;
