/**
 * Tracerfy API Service
 * Skip tracing service for finding property owner contact information
 * API Documentation: https://tracerfy.com/api-docs
 */

const TRACERFY_API_BASE_URL = import.meta.env.VITE_TRACERFY_API_URL || 'https://api.tracerfy.com/v1';
const TRACERFY_API_KEY = import.meta.env.VITE_TRACERFY_API_KEY;

/**
 * Skip trace a single property address
 * @param {Object} propertyData - Property information
 * @param {string} propertyData.address - Street address
 * @param {string} propertyData.city - City name
 * @param {string} propertyData.state - State abbreviation
 * @param {string} propertyData.zip - ZIP code
 * @returns {Promise<Object>} Skip trace results with contact information
 */
export async function skipTraceSingle(propertyData) {
  try {
    if (!TRACERFY_API_KEY) {
      throw new Error('Tracerfy API key is not configured. Please add VITE_TRACERFY_API_KEY to your .env file');
    }

    const response = await fetch(`${TRACERFY_API_BASE_URL}/skip-trace`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRACERFY_API_KEY}`,
      },
      body: JSON.stringify({
        address: propertyData.address,
        city: propertyData.city,
        state: propertyData.state,
        zip: propertyData.zip,
        firstName: propertyData.firstName || '',
        lastName: propertyData.lastName || '',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tracerfy API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        phones: data.phones || [],
        emails: data.emails || [],
        addresses: data.addresses || [],
        relatives: data.relatives || [],
        propertyInfo: data.propertyInfo || {},
        confidence: data.confidence || 0,
      },
    };
  } catch (error) {
    console.error('Tracerfy skip trace error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Skip trace multiple properties in bulk
 * @param {Array<Object>} properties - Array of property data objects
 * @returns {Promise<Object>} Bulk skip trace results
 */
export async function skipTraceBulk(properties) {
  try {
    if (!TRACERFY_API_KEY) {
      throw new Error('Tracerfy API key is not configured. Please add VITE_TRACERFY_API_KEY to your .env file');
    }

    const response = await fetch(`${TRACERFY_API_BASE_URL}/skip-trace/bulk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TRACERFY_API_KEY}`,
      },
      body: JSON.stringify({
        properties: properties.map(prop => ({
          address: prop.address,
          city: prop.city,
          state: prop.state,
          zip: prop.zip,
          firstName: prop.firstName || '',
          lastName: prop.lastName || '',
        })),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `Tracerfy API error: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        results: data.results || [],
        totalProcessed: data.totalProcessed || 0,
        totalSuccessful: data.totalSuccessful || 0,
        jobId: data.jobId || null,
      },
    };
  } catch (error) {
    console.error('Tracerfy bulk skip trace error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get pricing information for skip tracing
 * @returns {Promise<Object>} Pricing details
 */
export async function getPricing() {
  try {
    if (!TRACERFY_API_KEY) {
      throw new Error('Tracerfy API key is not configured');
    }

    const response = await fetch(`${TRACERFY_API_BASE_URL}/pricing`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TRACERFY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch pricing: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Tracerfy pricing error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Get account balance and credits
 * @returns {Promise<Object>} Account balance information
 */
export async function getAccountBalance() {
  try {
    if (!TRACERFY_API_KEY) {
      throw new Error('Tracerfy API key is not configured');
    }

    const response = await fetch(`${TRACERFY_API_BASE_URL}/account/balance`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${TRACERFY_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch balance: ${response.status}`);
    }

    const data = await response.json();
    return {
      success: true,
      data: {
        credits: data.credits || 0,
        balance: data.balance || 0,
        currency: data.currency || 'USD',
      },
    };
  } catch (error) {
    console.error('Tracerfy balance error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}
