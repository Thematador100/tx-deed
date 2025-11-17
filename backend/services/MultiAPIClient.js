/**
 * Multi-API Client with Cost Optimization
 * Intelligently routes requests to the least expensive API
 * Implements fallback mechanisms for reliability
 */

import config from '../config/config.js';
import httpClient from './AntiBlockingHttpClient.js';

class MultiAPIClient {
  constructor() {
    this.apiProviders = this.initializeProviders();
    this.costOptimization = config.get('costOptimization');
    this.fallbackOrder = this.costOptimization.fallbackOrder;

    this.stats = {
      requestsByProvider: {},
      failuresByProvider: {},
      totalCost: 0,
      costByProvider: {},
    };
  }

  initializeProviders() {
    const apis = config.get('apis');

    return {
      melissa: {
        name: 'Melissa Data',
        enabled: !!config.get('melissaData.licenseKey'),
        costPerRequest: parseFloat(config.get('API_COST_MELISSA') || '0.10'),
        priority: 1, // Highest priority (prepaid license)
        client: this.createMelissaClient(),
      },
      attom: {
        name: 'Attom Data',
        enabled: !!apis.attom.apiKey,
        costPerRequest: apis.attom.costPerRequest,
        priority: 2,
        client: this.createAttomClient(),
      },
      corelogic: {
        name: 'CoreLogic',
        enabled: !!apis.coreLogic.apiKey,
        costPerRequest: apis.coreLogic.costPerRequest,
        priority: 3,
        client: this.createCoreLogicClient(),
      },
      propstream: {
        name: 'PropStream',
        enabled: !!apis.propStream.apiKey,
        costPerRequest: apis.propStream.costPerRequest,
        priority: 4,
        client: this.createPropStreamClient(),
      },
      regrid: {
        name: 'Regrid',
        enabled: !!apis.regrid.apiKey,
        costPerRequest: apis.regrid.costPerRequest,
        priority: 5,
        client: this.createRegridClient(),
      },
    };
  }

  createMelissaClient() {
    return {
      getPropertyData: async (address) => {
        // Will be implemented in MelissaDataClient.js
        const MelissaDataClient = (await import('./MelissaDataClient.js')).default;
        return MelissaDataClient.getPropertyData(address);
      },
    };
  }

  createAttomClient() {
    const apiKey = config.get('apis.attom.apiKey');
    const apiUrl = config.get('apis.attom.apiUrl');

    return {
      getPropertyData: async (address) => {
        try {
          const response = await httpClient.get(`${apiUrl}/property/basicprofile`, {
            headers: {
              'apikey': apiKey,
              'Accept': 'application/json',
            },
            params: {
              address: address,
            },
          });

          const data = await response.json();
          return this.normalizeAttomResponse(data);
        } catch (error) {
          throw new Error(`Attom API error: ${error.message}`);
        }
      },
    };
  }

  createCoreLogicClient() {
    const apiKey = config.get('apis.coreLogic.apiKey');
    const apiUrl = config.get('apis.coreLogic.apiUrl');

    return {
      getPropertyData: async (address) => {
        try {
          const response = await httpClient.get(`${apiUrl}/search`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json',
            },
            params: {
              address: address,
            },
          });

          const data = await response.json();
          return this.normalizeCoreLogicResponse(data);
        } catch (error) {
          throw new Error(`CoreLogic API error: ${error.message}`);
        }
      },
    };
  }

  createPropStreamClient() {
    const apiKey = config.get('apis.propStream.apiKey');
    const apiUrl = config.get('apis.propStream.apiUrl');

    return {
      getPropertyData: async (address) => {
        try {
          const response = await httpClient.get(`${apiUrl}/property`, {
            headers: {
              'X-API-Key': apiKey,
              'Accept': 'application/json',
            },
            params: {
              address: address,
            },
          });

          const data = await response.json();
          return this.normalizePropStreamResponse(data);
        } catch (error) {
          throw new Error(`PropStream API error: ${error.message}`);
        }
      },
    };
  }

  createRegridClient() {
    const apiKey = config.get('apis.regrid.apiKey');
    const apiUrl = config.get('apis.regrid.apiUrl');

    return {
      getPropertyData: async (address) => {
        try {
          const response = await httpClient.get(`${apiUrl}/parcel`, {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'Accept': 'application/json',
            },
            params: {
              query: address,
            },
          });

          const data = await response.json();
          return this.normalizeRegridResponse(data);
        } catch (error) {
          throw new Error(`Regrid API error: ${error.message}`);
        }
      },
    };
  }

  async getPropertyData(address, options = {}) {
    const {
      preferredProvider = null,
      skipCostOptimization = false,
    } = options;

    // Determine provider order
    let providerOrder;

    if (preferredProvider && this.apiProviders[preferredProvider]?.enabled) {
      // Use preferred provider first
      providerOrder = [preferredProvider, ...this.fallbackOrder.filter(p => p !== preferredProvider)];
    } else if (skipCostOptimization) {
      // Use fallback order as-is
      providerOrder = this.fallbackOrder;
    } else {
      // Sort by cost (cheapest first)
      providerOrder = this.getSortedProvidersByCost();
    }

    let lastError = null;

    // Try each provider in order
    for (const providerKey of providerOrder) {
      const provider = this.apiProviders[providerKey];

      if (!provider || !provider.enabled) {
        continue;
      }

      try {
        console.log(`[MultiAPIClient] Attempting ${provider.name} for address: ${address}`);

        const data = await provider.client.getPropertyData(address);

        // Record success
        this.recordSuccess(providerKey, provider.costPerRequest);

        console.log(`[MultiAPIClient] Successfully retrieved data from ${provider.name}`);

        return {
          data,
          provider: provider.name,
          providerKey,
          cost: provider.costPerRequest,
        };
      } catch (error) {
        lastError = error;
        this.recordFailure(providerKey);

        console.warn(`[MultiAPIClient] ${provider.name} failed: ${error.message}`);
      }
    }

    // All providers failed
    throw new Error(`All API providers failed. Last error: ${lastError?.message || 'Unknown error'}`);
  }

  async getPropertyDataBulk(addresses, options = {}) {
    const results = [];
    const errors = [];

    for (const address of addresses) {
      try {
        const result = await this.getPropertyData(address, options);
        results.push({ address, ...result });
      } catch (error) {
        errors.push({ address, error: error.message });
      }

      // Add delay between requests to avoid rate limiting
      await this.sleep(1000);
    }

    return { results, errors };
  }

  getSortedProvidersByCost() {
    const enabledProviders = Object.entries(this.apiProviders)
      .filter(([_, provider]) => provider.enabled)
      .sort(([_, a], [__, b]) => a.costPerRequest - b.costPerRequest);

    return enabledProviders.map(([key, _]) => key);
  }

  recordSuccess(providerKey, cost) {
    if (!this.stats.requestsByProvider[providerKey]) {
      this.stats.requestsByProvider[providerKey] = 0;
      this.stats.costByProvider[providerKey] = 0;
    }

    this.stats.requestsByProvider[providerKey]++;
    this.stats.costByProvider[providerKey] += cost;
    this.stats.totalCost += cost;
  }

  recordFailure(providerKey) {
    if (!this.stats.failuresByProvider[providerKey]) {
      this.stats.failuresByProvider[providerKey] = 0;
    }

    this.stats.failuresByProvider[providerKey]++;
  }

  normalizeAttomResponse(data) {
    // Normalize Attom Data response to common format
    return {
      address: data.property?.address?.oneLine,
      city: data.property?.address?.locality,
      state: data.property?.address?.countrySubd,
      zip: data.property?.address?.postal1,
      county: data.property?.address?.country,
      latitude: data.property?.location?.latitude,
      longitude: data.property?.location?.longitude,
      assessedValue: data.assessment?.assessed?.assdTtlValue,
      marketValue: data.assessment?.market?.mktTtlValue,
      taxAmount: data.assessment?.tax?.taxAmt,
      yearBuilt: data.building?.summary?.yearBuilt,
      bedrooms: data.building?.rooms?.beds,
      bathrooms: data.building?.rooms?.bathsFull + (data.building?.rooms?.bathsHalf || 0) * 0.5,
      sqft: data.building?.size?.grossSize,
      lotSize: data.lot?.lotSize1,
      propertyType: data.summary?.propType,
      lastSaleDate: data.sale?.saleTransDate,
      lastSalePrice: data.sale?.saleAmt,
      ownerName: data.owner?.owner1?.name,
      ownerOccupied: data.owner?.ownerOccupied,
      source: 'attom',
    };
  }

  normalizeCoreLogicResponse(data) {
    // Normalize CoreLogic response to common format
    return {
      address: data.address?.formatted,
      city: data.address?.city,
      state: data.address?.state,
      zip: data.address?.zip,
      county: data.address?.county,
      latitude: data.location?.latitude,
      longitude: data.location?.longitude,
      assessedValue: data.valuation?.assessedValue,
      marketValue: data.valuation?.marketValue,
      taxAmount: data.tax?.annualAmount,
      yearBuilt: data.characteristics?.yearBuilt,
      bedrooms: data.characteristics?.bedrooms,
      bathrooms: data.characteristics?.bathrooms,
      sqft: data.characteristics?.squareFeet,
      lotSize: data.lot?.size,
      propertyType: data.characteristics?.propertyType,
      lastSaleDate: data.salesHistory?.[0]?.saleDate,
      lastSalePrice: data.salesHistory?.[0]?.salePrice,
      ownerName: data.owner?.name,
      source: 'corelogic',
    };
  }

  normalizePropStreamResponse(data) {
    // Normalize PropStream response to common format
    return {
      address: data.PropertyAddress,
      city: data.PropertyCity,
      state: data.PropertyState,
      zip: data.PropertyZip,
      county: data.PropertyCounty,
      latitude: data.Latitude,
      longitude: data.Longitude,
      assessedValue: data.AssessedValue,
      marketValue: data.EstimatedValue,
      taxAmount: data.TaxAmount,
      yearBuilt: data.YearBuilt,
      bedrooms: data.Bedrooms,
      bathrooms: data.Bathrooms,
      sqft: data.LivingSquareFeet,
      lotSize: data.LotSquareFeet,
      propertyType: data.PropertyType,
      lastSaleDate: data.LastSaleDate,
      lastSalePrice: data.LastSalePrice,
      ownerName: data.OwnerName,
      source: 'propstream',
    };
  }

  normalizeRegridResponse(data) {
    // Normalize Regrid response to common format
    const fields = data.properties?.[0]?.fields || {};

    return {
      address: fields.address,
      city: fields.city,
      state: fields.state,
      zip: fields.zip,
      county: fields.county,
      latitude: data.properties?.[0]?.geometry?.coordinates?.[1],
      longitude: data.properties?.[0]?.geometry?.coordinates?.[0],
      assessedValue: fields.assessedvalue,
      marketValue: fields.marketvalue,
      taxAmount: fields.taxamount,
      yearBuilt: fields.yearbuilt,
      bedrooms: fields.bedrooms,
      bathrooms: fields.bathrooms,
      sqft: fields.sqft,
      lotSize: fields.lotsize,
      propertyType: fields.usecode,
      lastSaleDate: fields.saledate,
      lastSalePrice: fields.saleprice,
      ownerName: fields.owner,
      source: 'regrid',
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats() {
    return {
      ...this.stats,
      totalRequests: Object.values(this.stats.requestsByProvider).reduce((sum, count) => sum + count, 0),
      totalFailures: Object.values(this.stats.failuresByProvider).reduce((sum, count) => sum + count, 0),
      averageCost: this.stats.totalCost > 0
        ? (this.stats.totalCost / Object.values(this.stats.requestsByProvider).reduce((sum, count) => sum + count, 0)).toFixed(4)
        : 0,
      enabledProviders: Object.entries(this.apiProviders)
        .filter(([_, provider]) => provider.enabled)
        .map(([key, provider]) => ({ key, name: provider.name, cost: provider.costPerRequest })),
    };
  }

  resetStats() {
    this.stats = {
      requestsByProvider: {},
      failuresByProvider: {},
      totalCost: 0,
      costByProvider: {},
    };
    console.log('[MultiAPIClient] Reset statistics');
  }
}

// Export singleton instance
const multiAPIClient = new MultiAPIClient();
export default multiAPIClient;
