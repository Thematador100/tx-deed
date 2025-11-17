/**
 * Melissa Data API Client
 * Integration with Melissa Data (prepaid license)
 * Provides property data enrichment and validation
 */

import config from '../config/config.js';
import httpClient from './AntiBlockingHttpClient.js';

class MelissaDataClient {
  constructor() {
    this.licenseKey = config.get('melissaData.licenseKey');
    this.apiUrl = config.get('melissaData.apiUrl');
    this.stats = {
      requests: 0,
      successful: 0,
      failed: 0,
    };
  }

  async getPropertyData(address) {
    if (!this.licenseKey) {
      throw new Error('Melissa Data license key not configured');
    }

    try {
      this.stats.requests++;

      // Parse address components
      const addressComponents = this.parseAddress(address);

      // Build request URL
      const url = new URL(this.apiUrl);
      url.searchParams.append('id', this.licenseKey);
      url.searchParams.append('a1', addressComponents.street || '');
      url.searchParams.append('loc', addressComponents.city || '');
      url.searchParams.append('admarea', addressComponents.state || '');
      url.searchParams.append('postal', addressComponents.zip || '');
      url.searchParams.append('ctry', 'USA');
      url.searchParams.append('format', 'json');

      // Make request
      const response = await httpClient.get(url.toString(), {
        useProxy: false, // Melissa Data is a paid API, no need for proxy
        rotateUserAgent: false,
      });

      const data = await response.json();

      // Check for errors
      if (data.TransmissionResults?.toLowerCase() !== 'success') {
        throw new Error(`Melissa Data API error: ${data.TransmissionReference || 'Unknown error'}`);
      }

      // Get the first record
      const record = data.Records?.[0];

      if (!record) {
        throw new Error('No data returned from Melissa Data');
      }

      this.stats.successful++;

      // Normalize response
      return this.normalizeResponse(record);
    } catch (error) {
      this.stats.failed++;
      throw new Error(`Melissa Data API error: ${error.message}`);
    }
  }

  async validateAddress(address) {
    try {
      const data = await this.getPropertyData(address);

      return {
        isValid: data.addressValid,
        standardizedAddress: data.address,
        deliveryPoint: data.deliveryPoint,
        confidence: data.confidence,
      };
    } catch (error) {
      return {
        isValid: false,
        error: error.message,
      };
    }
  }

  async enrichPropertyData(propertyData) {
    // Enrich existing property data with Melissa Data
    try {
      const melissaData = await this.getPropertyData(propertyData.address);

      return {
        ...propertyData,
        ...melissaData,
        enrichmentSource: 'melissa',
        enrichedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.warn(`Failed to enrich property data: ${error.message}`);
      return propertyData;
    }
  }

  parseAddress(address) {
    // Simple address parser - can be enhanced with a proper library
    const parts = address.split(',').map(part => part.trim());

    let street, city, state, zip;

    if (parts.length >= 3) {
      street = parts[0];
      city = parts[1];

      const stateZip = parts[2].split(' ');
      state = stateZip[0];
      zip = stateZip[1];
    } else if (parts.length === 2) {
      street = parts[0];
      const cityState = parts[1].split(' ');
      city = cityState.slice(0, -2).join(' ');
      state = cityState[cityState.length - 2];
      zip = cityState[cityState.length - 1];
    } else {
      street = address;
    }

    return { street, city, state, zip };
  }

  normalizeResponse(record) {
    return {
      // Address information
      address: record.AddressLine1,
      addressLine2: record.AddressLine2,
      city: record.Locality,
      state: record.AdministrativeArea,
      zip: record.PostalCode,
      zipPlus4: record.Plus4,
      county: record.CountyName,
      countyFIPS: record.CountyFIPS,

      // Coordinates
      latitude: parseFloat(record.Latitude),
      longitude: parseFloat(record.Longitude),

      // Validation
      addressValid: record.Results?.includes('AS01') || record.Results?.includes('AS02'),
      deliveryPoint: record.DeliveryPointCheckDigit,
      confidence: record.AddressTypeCode,

      // Demographics (if available)
      medianIncome: record.MedianIncome,
      medianHomeValue: record.MedianHomeValue,
      population: record.Population,

      // Property characteristics (if available)
      dwellingType: record.DwellingType,
      lengthOfResidence: record.LengthOfResidence,
      maritalStatus: record.MaritalStatus,
      homeOwnerRenter: record.HomeOwnerRenter,

      // Geocoding
      censusBlock: record.CensusBlock,
      censusBlockGroup: record.CensusBlockGroup,
      censusTract: record.CensusTract,

      // Source
      source: 'melissa',
      retrievedAt: new Date().toISOString(),

      // Raw data for advanced analysis
      raw: record,
    };
  }

  getStats() {
    return {
      ...this.stats,
      successRate: this.stats.requests > 0
        ? ((this.stats.successful / this.stats.requests) * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  resetStats() {
    this.stats = {
      requests: 0,
      successful: 0,
      failed: 0,
    };
    console.log('[MelissaDataClient] Reset statistics');
  }
}

// Export singleton instance
const melissaDataClient = new MelissaDataClient();
export default melissaDataClient;
