/**
 * Melissa Data API Service
 * Address verification and property data enrichment service
 * API Documentation: https://docs.melissa.com/
 */

const MELISSA_API_BASE_URL = import.meta.env.VITE_MELISSA_API_URL || 'https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress';
const MELISSA_LICENSE_KEY = import.meta.env.VITE_MELISSA_LICENSE_KEY;

/**
 * Verify and standardize a US address
 * @param {Object} addressData - Address information to verify
 * @param {string} addressData.address - Street address
 * @param {string} addressData.city - City name
 * @param {string} addressData.state - State abbreviation
 * @param {string} addressData.zip - ZIP code
 * @returns {Promise<Object>} Verified address data
 */
export async function verifyAddress(addressData) {
  try {
    if (!MELISSA_LICENSE_KEY) {
      throw new Error('Melissa Data license key is not configured. Please add VITE_MELISSA_LICENSE_KEY to your .env file');
    }

    const params = new URLSearchParams({
      id: MELISSA_LICENSE_KEY,
      a1: addressData.address || '',
      loc: addressData.city || '',
      admarea: addressData.state || '',
      postal: addressData.zip || '',
      ctry: 'USA',
      format: 'json',
    });

    const response = await fetch(`${MELISSA_API_BASE_URL}?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Melissa API error: ${response.status}`);
    }

    const data = await response.json();
    const record = data.Records?.[0];

    if (!record) {
      throw new Error('No address verification results returned');
    }

    // Parse result codes
    const resultCodes = record.Results?.split(',') || [];
    const hasError = resultCodes.some(code => code.startsWith('AE') || code.startsWith('AV3'));

    return {
      success: !hasError,
      data: {
        // Standardized address
        address: record.AddressLine1 || '',
        address2: record.AddressLine2 || '',
        city: record.Locality || '',
        state: record.AdministrativeArea || '',
        zip: record.PostalCode || '',
        zip4: record.PostalCode?.split('-')[1] || '',
        country: record.CountryName || 'USA',

        // Address quality
        deliveryPointValidation: record.DeliveryPointValidation || '',
        addressType: record.AddressType || '',

        // Geographic coordinates
        latitude: record.Latitude || '',
        longitude: record.Longitude || '',

        // Additional data
        county: record.CountyName || '',
        countyFips: record.CountyFips || '',
        timezone: record.TimeZone || '',

        // Result codes and status
        resultCodes: resultCodes,
        verificationStatus: hasError ? 'Invalid' : 'Verified',

        // Full original response for reference
        _raw: record,
      },
    };
  } catch (error) {
    console.error('Melissa address verification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Enrich address with property data
 * @param {Object} addressData - Address information
 * @returns {Promise<Object>} Property enrichment data
 */
export async function enrichPropertyData(addressData) {
  try {
    // First verify the address
    const verificationResult = await verifyAddress(addressData);

    if (!verificationResult.success) {
      return verificationResult;
    }

    // In a real implementation, you would call Melissa's Property API
    // For now, we return the verified address with placeholder property data
    return {
      success: true,
      data: {
        ...verificationResult.data,
        propertyData: {
          // These would come from Melissa's Property API
          yearBuilt: null,
          squareFootage: null,
          lotSize: null,
          bedrooms: null,
          bathrooms: null,
          propertyType: null,
          assessedValue: null,
          marketValue: null,
          lastSaleDate: null,
          lastSalePrice: null,
        },
      },
    };
  } catch (error) {
    console.error('Melissa property enrichment error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Verify multiple addresses in batch
 * @param {Array<Object>} addresses - Array of address objects
 * @returns {Promise<Object>} Batch verification results
 */
export async function verifyAddressBatch(addresses) {
  try {
    if (!MELISSA_LICENSE_KEY) {
      throw new Error('Melissa Data license key is not configured');
    }

    // Process addresses sequentially to avoid rate limiting
    // In production, you might want to use Melissa's batch API endpoint
    const results = [];

    for (const address of addresses) {
      const result = await verifyAddress(address);
      results.push({
        input: address,
        result,
      });

      // Small delay to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      success: true,
      data: {
        results,
        totalProcessed: results.length,
        totalVerified: results.filter(r => r.result.success).length,
      },
    };
  } catch (error) {
    console.error('Melissa batch verification error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Parse and format address components
 * @param {string} fullAddress - Complete address string
 * @returns {Object} Parsed address components
 */
export function parseAddress(fullAddress) {
  // Simple address parsing - in production you might want a more robust solution
  const parts = fullAddress.split(',').map(p => p.trim());

  return {
    address: parts[0] || '',
    city: parts[1] || '',
    state: parts[2]?.split(' ')[0] || '',
    zip: parts[2]?.split(' ')[1] || '',
  };
}

/**
 * Format address object into single line string
 * @param {Object} addressData - Address components
 * @returns {string} Formatted address string
 */
export function formatAddress(addressData) {
  const parts = [
    addressData.address,
    addressData.city,
    [addressData.state, addressData.zip].filter(Boolean).join(' '),
  ].filter(Boolean);

  return parts.join(', ');
}
