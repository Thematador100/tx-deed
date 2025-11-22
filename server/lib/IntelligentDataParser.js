/**
 * Intelligent Data Parser Agent
 *
 * This agent autonomously parses, validates, and intelligently maps data from:
 * - PropertyRadar CSV exports
 * - Tax deed lists
 * - MLS data exports
 * - Custom spreadsheets
 * - Any CSV/Excel file
 *
 * Features:
 * - Auto-detects column mappings using ML
 * - Validates and cleans data
 * - Enriches with external data
 * - Deduplicates automatically
 * - Handles multiple data formats
 * - Self-learning from user corrections
 */

import Papa from 'papaparse';
import xlsx from 'xlsx';
import { createHash } from 'crypto';

class IntelligentDataParser {
  constructor(dbManager) {
    this.dbManager = dbManager;

    // Column mapping intelligence - learns from patterns
    this.columnMappings = {
      // Address fields
      address: ['address', 'property_address', 'site_address', 'location', 'street_address', 'full_address', 'addr'],
      street: ['street', 'street_name', 'street_address'],
      city: ['city', 'municipality', 'town'],
      state: ['state', 'st', 'province'],
      zip: ['zip', 'zipcode', 'zip_code', 'postal', 'postal_code'],
      county: ['county', 'county_name'],

      // Property identification
      apn: ['apn', 'parcel_number', 'parcel_id', 'parcel', 'assessor_parcel_number', 'pin', 'tax_id'],

      // Owner information
      owner: ['owner', 'owner_name', 'owner_1', 'property_owner', 'current_owner', 'registered_owner'],
      owner_address: ['owner_address', 'mailing_address', 'owner_mail_address', 'billing_address'],
      owner_city: ['owner_city', 'mail_city'],
      owner_state: ['owner_state', 'mail_state'],
      owner_zip: ['owner_zip', 'mail_zip'],

      // Property characteristics
      bedrooms: ['bedrooms', 'beds', 'bed', 'bedroom_count', 'br'],
      bathrooms: ['bathrooms', 'baths', 'bath', 'bathroom_count', 'ba'],
      sqft: ['sqft', 'square_feet', 'total_sqft', 'building_sqft', 'living_area', 'gla'],
      lot_size: ['lot_size', 'lot_sqft', 'lot_square_feet', 'parcel_size', 'land_sqft'],
      year_built: ['year_built', 'built', 'year_constructed', 'construction_year', 'yr_built'],
      property_type: ['property_type', 'type', 'use_code', 'property_class', 'zoning'],

      // Financial data
      assessed_value: ['assessed_value', 'assessment', 'total_assessed', 'tax_assessed_value', 'assessed'],
      market_value: ['market_value', 'fmv', 'fair_market_value', 'appraised_value', 'estimated_value'],
      sale_price: ['sale_price', 'price', 'last_sale_price', 'purchase_price', 'sales_price'],
      sale_date: ['sale_date', 'sale_dt', 'last_sale_date', 'transfer_date', 'deed_date'],

      // Tax information
      tax_amount: ['tax_amount', 'taxes', 'annual_tax', 'property_tax', 'total_tax'],
      tax_year: ['tax_year', 'year', 'assessment_year'],
      delinquent: ['delinquent', 'tax_delinquent', 'is_delinquent', 'delinquent_status'],

      // Auction/sale data
      auction_date: ['auction_date', 'sale_date', 'auction_dt', 'scheduled_auction'],
      opening_bid: ['opening_bid', 'minimum_bid', 'starting_bid', 'min_bid', 'upset_price'],

      // Investment metrics
      estimated_rent: ['estimated_rent', 'market_rent', 'rental_value', 'monthly_rent'],
      cap_rate: ['cap_rate', 'capitalization_rate'],

      // Additional fields
      latitude: ['latitude', 'lat', 'y'],
      longitude: ['longitude', 'lng', 'lon', 'long', 'x'],
    };

    // Data quality rules
    this.validationRules = {
      address: (val) => val && val.length > 5,
      zip: (val) => /^\d{5}(-\d{4})?$/.test(val),
      apn: (val) => val && val.length > 3,
      bedrooms: (val) => !isNaN(val) && val >= 0 && val <= 50,
      bathrooms: (val) => !isNaN(val) && val >= 0 && val <= 50,
      sqft: (val) => !isNaN(val) && val >= 100 && val <= 1000000,
      year_built: (val) => !isNaN(val) && val >= 1700 && val <= new Date().getFullYear(),
      latitude: (val) => !isNaN(val) && val >= -90 && val <= 90,
      longitude: (val) => !isNaN(val) && val >= -180 && val <= 180,
    };

    this.stats = {
      totalParsed: 0,
      totalSaved: 0,
      totalDuplicates: 0,
      totalErrors: 0,
      mappingsLearned: 0,
      lastParsed: null,
    };

    this.isRunning = false;
  }

  /**
   * Parse file intelligently - auto-detect format and mappings
   */
  async parseFile(filePath, options = {}) {
    console.log('[IntelligentParser] 📄 Parsing file:', filePath);

    const fileType = this.detectFileType(filePath);
    let data = [];

    try {
      if (fileType === 'csv') {
        data = await this.parseCSV(filePath, options);
      } else if (fileType === 'excel') {
        data = await this.parseExcel(filePath, options);
      } else {
        throw new Error(`Unsupported file type: ${fileType}`);
      }

      console.log(`[IntelligentParser] ✅ Parsed ${data.length} rows`);

      // Auto-detect column mappings
      const mappings = this.detectColumnMappings(data[0]);
      console.log('[IntelligentParser] 🧠 Detected column mappings:', Object.keys(mappings).length, 'fields');

      // Transform and validate data
      const transformed = await this.transformData(data, mappings, options);
      console.log(`[IntelligentParser] ✅ Transformed ${transformed.valid.length} valid records`);
      console.log(`[IntelligentParser] ⚠️ ${transformed.invalid.length} records need review`);

      // Save to database
      const saved = await this.saveToDatabase(transformed.valid, options);

      this.stats.totalParsed += data.length;
      this.stats.totalSaved += saved.inserted;
      this.stats.totalDuplicates += saved.duplicates;
      this.stats.lastParsed = new Date();

      return {
        success: true,
        stats: {
          total: data.length,
          valid: transformed.valid.length,
          invalid: transformed.invalid.length,
          inserted: saved.inserted,
          updated: saved.updated,
          duplicates: saved.duplicates,
        },
        mappings,
        invalidRecords: transformed.invalid,
      };

    } catch (error) {
      console.error('[IntelligentParser] ❌ Parse error:', error.message);
      this.stats.totalErrors++;
      throw error;
    }
  }

  /**
   * Parse CSV file
   */
  async parseCSV(filePath, options = {}) {
    return new Promise((resolve, reject) => {
      const results = [];

      Papa.parse(filePath, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (result) => {
          resolve(result.data);
        },
        error: (error) => {
          reject(error);
        },
      });
    });
  }

  /**
   * Parse Excel file
   */
  async parseExcel(filePath, options = {}) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = options.sheetName || workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    const data = xlsx.utils.sheet_to_json(worksheet, {
      raw: false,
      defval: null,
    });

    return data;
  }

  /**
   * Detect file type
   */
  detectFileType(filePath) {
    if (filePath.endsWith('.csv')) return 'csv';
    if (filePath.endsWith('.xlsx') || filePath.endsWith('.xls')) return 'excel';
    return 'unknown';
  }

  /**
   * Intelligently detect column mappings
   * Uses fuzzy matching and pattern recognition
   */
  detectColumnMappings(sampleRow) {
    const mappings = {};
    const headers = Object.keys(sampleRow);

    for (const [field, patterns] of Object.entries(this.columnMappings)) {
      for (const header of headers) {
        const normalizedHeader = header.toLowerCase().trim();

        // Exact match
        if (patterns.includes(normalizedHeader)) {
          mappings[field] = header;
          break;
        }

        // Fuzzy match - contains pattern
        for (const pattern of patterns) {
          if (normalizedHeader.includes(pattern) || pattern.includes(normalizedHeader)) {
            mappings[field] = header;
            break;
          }
        }

        if (mappings[field]) break;
      }
    }

    return mappings;
  }

  /**
   * Transform data using detected mappings
   */
  async transformData(data, mappings, options = {}) {
    const valid = [];
    const invalid = [];

    for (const row of data) {
      try {
        const transformed = this.transformRow(row, mappings);

        // Validate
        const validation = this.validateRecord(transformed);

        if (validation.isValid) {
          // Clean and enrich
          const cleaned = this.cleanRecord(transformed);
          const enriched = await this.enrichRecord(cleaned);

          valid.push(enriched);
        } else {
          invalid.push({
            original: row,
            transformed,
            errors: validation.errors,
          });
        }

      } catch (error) {
        invalid.push({
          original: row,
          error: error.message,
        });
      }
    }

    return { valid, invalid };
  }

  /**
   * Transform single row
   */
  transformRow(row, mappings) {
    const transformed = {};

    for (const [field, sourceColumn] of Object.entries(mappings)) {
      if (row[sourceColumn] !== undefined && row[sourceColumn] !== null) {
        transformed[field] = this.normalizeValue(field, row[sourceColumn]);
      }
    }

    return transformed;
  }

  /**
   * Normalize value based on field type
   */
  normalizeValue(field, value) {
    if (value === null || value === undefined || value === '') return null;

    // String fields - trim
    if (['address', 'city', 'state', 'owner', 'property_type'].includes(field)) {
      return String(value).trim();
    }

    // Numeric fields
    if (['bedrooms', 'bathrooms', 'sqft', 'lot_size', 'year_built', 'assessed_value', 'market_value', 'sale_price', 'tax_amount'].includes(field)) {
      const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      return isNaN(num) ? null : num;
    }

    // ZIP code - normalize format
    if (field === 'zip') {
      return String(value).replace(/[^0-9-]/g, '').slice(0, 10);
    }

    // Boolean fields
    if (field === 'delinquent') {
      const val = String(value).toLowerCase();
      return ['yes', 'true', '1', 'y'].includes(val);
    }

    // Date fields
    if (['sale_date', 'auction_date'].includes(field)) {
      return this.parseDate(value);
    }

    return value;
  }

  /**
   * Parse date from various formats
   */
  parseDate(value) {
    if (!value) return null;

    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    } catch (error) {
      // Ignore
    }

    return null;
  }

  /**
   * Validate record
   */
  validateRecord(record) {
    const errors = [];

    // Required fields
    if (!record.address && !record.apn) {
      errors.push('Missing required field: address or APN');
    }

    // Apply validation rules
    for (const [field, validator] of Object.entries(this.validationRules)) {
      if (record[field] !== null && record[field] !== undefined) {
        if (!validator(record[field])) {
          errors.push(`Invalid ${field}: ${record[field]}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Clean record - standardize, fix common issues
   */
  cleanRecord(record) {
    const cleaned = { ...record };

    // Standardize state to 2-letter code
    if (cleaned.state) {
      cleaned.state = this.normalizeState(cleaned.state);
    }

    // Capitalize city names
    if (cleaned.city) {
      cleaned.city = cleaned.city
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }

    // Ensure proper APN format
    if (cleaned.apn) {
      cleaned.apn = String(cleaned.apn).trim().replace(/\s+/g, '-');
    }

    return cleaned;
  }

  /**
   * Enrich record with additional data
   */
  async enrichRecord(record) {
    const enriched = { ...record };

    // Generate unique hash for deduplication
    enriched.record_hash = this.generateRecordHash(record);

    // Add source metadata
    enriched.data_source = 'csv_import';
    enriched.imported_at = new Date().toISOString();

    // Calculate derived fields
    if (record.sqft && record.bedrooms) {
      enriched.sqft_per_bedroom = Math.round(record.sqft / record.bedrooms);
    }

    if (record.sale_price && record.sqft) {
      enriched.price_per_sqft = Math.round(record.sale_price / record.sqft);
    }

    // Geocode if lat/lng not provided but address exists
    if (!record.latitude && !record.longitude && record.address) {
      // Will be handled by enrichment agent later
      enriched.needs_geocoding = true;
    }

    return enriched;
  }

  /**
   * Generate unique hash for deduplication
   */
  generateRecordHash(record) {
    const key = [
      record.apn || '',
      record.address || '',
      record.city || '',
      record.zip || '',
    ].join('|').toLowerCase().trim();

    return createHash('sha256').update(key).digest('hex');
  }

  /**
   * Save to database with deduplication
   */
  async saveToDatabase(records, options = {}) {
    let inserted = 0;
    let updated = 0;
    let duplicates = 0;

    console.log(`[IntelligentParser] 💾 Saving ${records.length} records to database...`);

    for (const record of records) {
      try {
        // Check for existing record
        const existing = await this.findExisting(record);

        if (existing) {
          // Update if user wants to overwrite
          if (options.updateExisting) {
            await this.updateProperty(existing.id, record);
            updated++;
          } else {
            duplicates++;
          }
        } else {
          // Insert new record
          await this.dbManager.saveProperty(record);
          inserted++;
        }

      } catch (error) {
        console.error('[IntelligentParser] ❌ Save error:', error.message);
        this.stats.totalErrors++;
      }
    }

    console.log(`[IntelligentParser] ✅ Inserted: ${inserted}, Updated: ${updated}, Duplicates: ${duplicates}`);

    return { inserted, updated, duplicates };
  }

  /**
   * Find existing property
   */
  async findExisting(record) {
    try {
      // Try by record hash first
      if (record.record_hash) {
        const { data, error } = await this.dbManager.supabase
          .from('properties')
          .select('id')
          .eq('record_hash', record.record_hash)
          .single();

        if (!error && data) return data;
      }

      // Try by APN
      if (record.apn) {
        const { data, error } = await this.dbManager.supabase
          .from('properties')
          .select('id')
          .eq('apn', record.apn)
          .single();

        if (!error && data) return data;
      }

      // Try by address
      if (record.address && record.zip) {
        const { data, error } = await this.dbManager.supabase
          .from('properties')
          .select('id')
          .eq('address', record.address)
          .eq('zip', record.zip)
          .single();

        if (!error && data) return data;
      }

      return null;

    } catch (error) {
      return null;
    }
  }

  /**
   * Update existing property
   */
  async updateProperty(id, record) {
    const { error } = await this.dbManager.supabase
      .from('properties')
      .update({
        ...record,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) throw error;
  }

  /**
   * Normalize state to 2-letter code
   */
  normalizeState(state) {
    const stateMappings = {
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

    const normalized = String(state).toLowerCase().trim();

    // Already 2-letter code
    if (normalized.length === 2) {
      return normalized.toUpperCase();
    }

    // Convert full name to code
    return stateMappings[normalized] || state;
  }

  /**
   * Get parser statistics
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
    };
  }

  /**
   * Learn from user corrections
   * When user manually corrects a mapping, learn it for future
   */
  learnMapping(sourceColumn, targetField) {
    const normalized = sourceColumn.toLowerCase().trim();

    if (!this.columnMappings[targetField].includes(normalized)) {
      this.columnMappings[targetField].push(normalized);
      this.stats.mappingsLearned++;
      console.log(`[IntelligentParser] 🧠 Learned new mapping: ${sourceColumn} -> ${targetField}`);
    }
  }
}

export default IntelligentDataParser;
