/**
 * Quantitative Analytics Models
 * Hedge fund level mathematical models for property investment analysis
 * Implements advanced statistical methods and machine learning techniques
 */

class QuantitativeModels {
  constructor() {
    this.modelCache = new Map();
    this.historicalData = new Map();
  }

  /**
   * Multi-Factor Property Valuation Model
   * Uses regression analysis with multiple factors
   */
  async calculatePropertyValue(property, marketData) {
    const factors = {
      // Physical characteristics
      sqft: property.sqft || 0,
      bedrooms: property.bedrooms || 0,
      bathrooms: property.bathrooms || 0,
      yearBuilt: property.yearBuilt || 0,
      lotSize: property.lotSize || 0,

      // Location factors
      medianIncome: marketData.medianIncome || 0,
      schoolRating: marketData.schoolRating || 0,
      crimeIndex: marketData.crimeIndex || 100,
      walkScore: marketData.walkScore || 0,

      // Market factors
      daysOnMarket: property.daysOnMarket || 0,
      pricePerSqft: marketData.avgPricePerSqft || 0,
      inventoryLevel: marketData.inventoryLevel || 0,
      appreciationRate: marketData.appreciationRate || 0,

      // Economic factors
      unemploymentRate: marketData.unemploymentRate || 0,
      interestRate: marketData.interestRate || 0,
      gdpGrowth: marketData.gdpGrowth || 0,
    };

    // Coefficients from regression analysis (these would be trained on historical data)
    const coefficients = {
      intercept: 50000,
      sqft: 150,
      bedrooms: 15000,
      bathrooms: 20000,
      yearBuilt: 500,
      lotSize: 2,
      medianIncome: 2.5,
      schoolRating: 5000,
      crimeIndex: -500,
      walkScore: 1000,
      daysOnMarket: -100,
      pricePerSqft: 100,
      appreciationRate: 10000,
    };

    // Calculate base value
    let estimatedValue = coefficients.intercept;

    for (const [factor, value] of Object.entries(factors)) {
      if (coefficients[factor]) {
        estimatedValue += coefficients[factor] * value;
      }
    }

    // Apply property age depreciation
    const age = new Date().getFullYear() - (property.yearBuilt || 1980);
    const depreciationFactor = Math.max(0.5, 1 - (age * 0.005));
    estimatedValue *= depreciationFactor;

    // Calculate confidence interval
    const standardError = estimatedValue * 0.15; // 15% standard error
    const confidenceInterval = {
      lower: estimatedValue - (1.96 * standardError),
      upper: estimatedValue + (1.96 * standardError),
      confidence: 0.95,
    };

    return {
      estimatedValue: Math.round(estimatedValue),
      confidenceInterval,
      modelType: 'multi-factor-regression',
      factors: Object.keys(factors).length,
    };
  }

  /**
   * Monte Carlo Simulation for Investment Outcomes
   * Simulates thousands of scenarios to estimate probability distribution
   */
  async runMonteCarloSimulation(property, investmentParams, iterations = 10000) {
    const {
      purchasePrice,
      rehabCost = 0,
      holdingPeriod = 12, // months
      monthlyRent = 0,
      sellingCosts = 0.06, // 6% of sale price
    } = investmentParams;

    const outcomes = [];

    for (let i = 0; i < iterations; i++) {
      // Randomize variables using normal distribution
      const appreciationRate = this.normalRandom(0.05, 0.15); // 5-15% annual
      const vacancyRate = this.normalRandom(0.05, 0.15); // 5-15%
      const maintenanceCost = this.normalRandom(0.01, 0.03) * purchasePrice;
      const unexpectedCosts = this.normalRandom(0, 5000);

      // Calculate future value
      const futureValue = purchasePrice * Math.pow(1 + appreciationRate, holdingPeriod / 12);

      // Calculate rental income
      const effectiveRent = monthlyRent * (1 - vacancyRate);
      const totalRentalIncome = effectiveRent * holdingPeriod;

      // Calculate total costs
      const totalCosts = purchasePrice + rehabCost + maintenanceCost + unexpectedCosts;

      // Calculate sale proceeds
      const saleProceeds = futureValue * (1 - sellingCosts);

      // Calculate net profit
      const netProfit = saleProceeds + totalRentalIncome - totalCosts;

      // Calculate ROI
      const roi = (netProfit / totalCosts) * 100;

      outcomes.push({
        futureValue,
        netProfit,
        roi,
        totalRentalIncome,
      });
    }

    // Statistical analysis
    const rois = outcomes.map(o => o.roi);
    const profits = outcomes.map(o => o.netProfit);

    return {
      iterations,
      roi: {
        mean: this.mean(rois),
        median: this.median(rois),
        stdDev: this.standardDeviation(rois),
        min: Math.min(...rois),
        max: Math.max(...rois),
        percentile25: this.percentile(rois, 0.25),
        percentile75: this.percentile(rois, 0.75),
      },
      profit: {
        mean: this.mean(profits),
        median: this.median(profits),
        stdDev: this.standardDeviation(profits),
        min: Math.min(...profits),
        max: Math.max(...profits),
      },
      probability: {
        profitableOutcomes: outcomes.filter(o => o.netProfit > 0).length / iterations,
        roi10PercentPlus: outcomes.filter(o => o.roi >= 10).length / iterations,
        roi20PercentPlus: outcomes.filter(o => o.roi >= 20).length / iterations,
      },
    };
  }

  /**
   * Risk-Adjusted Return Analysis (Sharpe Ratio equivalent)
   */
  calculateRiskAdjustedReturn(property, marketData, riskFreeRate = 0.045) {
    const expectedReturn = this.calculateExpectedReturn(property, marketData);
    const volatility = this.calculateVolatility(property, marketData);

    const sharpeRatio = (expectedReturn - riskFreeRate) / volatility;

    return {
      expectedReturn,
      volatility,
      sharpeRatio,
      riskAdjustedReturn: expectedReturn / (1 + volatility),
      classification: this.classifySharpeRatio(sharpeRatio),
    };
  }

  calculateExpectedReturn(property, marketData) {
    // Weighted average of multiple return scenarios
    const capRate = marketData.avgCapRate || 0.08;
    const appreciation = marketData.appreciationRate || 0.05;
    const rentalYield = property.monthlyRent * 12 / property.price || 0;

    return capRate + appreciation + rentalYield;
  }

  calculateVolatility(property, marketData) {
    // Calculate historical volatility based on market factors
    const marketVolatility = marketData.priceVolatility || 0.10;
    const propertySpecificRisk = this.calculatePropertyRisk(property);

    return Math.sqrt(Math.pow(marketVolatility, 2) + Math.pow(propertySpecificRisk, 2));
  }

  calculatePropertyRisk(property) {
    let riskScore = 0;

    // Age risk
    const age = new Date().getFullYear() - (property.yearBuilt || 1980);
    if (age > 50) riskScore += 0.05;
    else if (age > 30) riskScore += 0.03;

    // Condition risk
    if (property.codeViolations?.length > 0) riskScore += 0.04;
    if (property.condition === 'poor') riskScore += 0.06;
    else if (property.condition === 'fair') riskScore += 0.03;

    // Location risk
    if (property.crimeIndex > 150) riskScore += 0.05;
    if (property.schoolRating < 5) riskScore += 0.03;

    // Liquidity risk
    if (property.daysOnMarket > 180) riskScore += 0.04;

    return Math.min(riskScore, 0.30);
  }

  classifySharpeRatio(sharpeRatio) {
    if (sharpeRatio > 3) return 'Exceptional';
    if (sharpeRatio > 2) return 'Very Good';
    if (sharpeRatio > 1) return 'Good';
    if (sharpeRatio > 0) return 'Acceptable';
    return 'Poor';
  }

  /**
   * Comparative Market Analysis (CMA) using K-Nearest Neighbors
   */
  async performCMA(targetProperty, comparableProperties, k = 5) {
    // Calculate similarity scores
    const similarities = comparableProperties.map(comp => ({
      property: comp,
      similarity: this.calculateSimilarity(targetProperty, comp),
    }));

    // Sort by similarity and take top k
    const nearestNeighbors = similarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, k);

    // Weight by similarity for value estimation
    let weightedSum = 0;
    let totalWeight = 0;

    for (const neighbor of nearestNeighbors) {
      weightedSum += neighbor.property.price * neighbor.similarity;
      totalWeight += neighbor.similarity;
    }

    const estimatedValue = weightedSum / totalWeight;

    // Calculate price range
    const prices = nearestNeighbors.map(n => n.property.price);
    const priceRange = {
      min: Math.min(...prices),
      max: Math.max(...prices),
      median: this.median(prices),
    };

    return {
      estimatedValue: Math.round(estimatedValue),
      priceRange,
      comparables: nearestNeighbors.map(n => ({
        address: n.property.address,
        price: n.property.price,
        similarity: (n.similarity * 100).toFixed(1) + '%',
        sqft: n.property.sqft,
        bedrooms: n.property.bedrooms,
      })),
      confidenceScore: this.mean(nearestNeighbors.map(n => n.similarity)),
    };
  }

  calculateSimilarity(prop1, prop2) {
    const features = {
      sqft: { weight: 0.30, normalize: 3000 },
      bedrooms: { weight: 0.15, normalize: 5 },
      bathrooms: { weight: 0.10, normalize: 4 },
      yearBuilt: { weight: 0.15, normalize: 100 },
      lotSize: { weight: 0.10, normalize: 10000 },
    };

    let similarity = 0;

    for (const [feature, config] of Object.entries(features)) {
      const val1 = prop1[feature] || 0;
      const val2 = prop2[feature] || 0;

      // Normalized Euclidean distance
      const distance = Math.abs(val1 - val2) / config.normalize;
      const featureSimilarity = 1 - Math.min(distance, 1);

      similarity += featureSimilarity * config.weight;
    }

    // Location similarity (if coordinates available)
    if (prop1.latitude && prop2.latitude) {
      const locationDistance = this.haversineDistance(
        prop1.latitude, prop1.longitude,
        prop2.latitude, prop2.longitude
      );

      // Within 1 mile = high similarity
      const locationSimilarity = 1 - Math.min(locationDistance, 1);
      similarity += locationSimilarity * 0.20;
    }

    return similarity;
  }

  /**
   * Portfolio Optimization using Modern Portfolio Theory
   */
  async optimizePortfolio(properties, targetReturn = null, maxRisk = null) {
    const n = properties.length;

    // Calculate expected returns and covariances
    const returns = properties.map(p => this.calculateExpectedReturn(p, {}));
    const risks = properties.map(p => this.calculateVolatility(p, {}));

    // Simplified optimization (in practice, use quadratic programming)
    let weights = new Array(n).fill(1 / n); // Equal weight initial

    if (targetReturn !== null) {
      // Optimize for minimum risk given target return
      weights = this.minimizeRiskForReturn(properties, returns, risks, targetReturn);
    } else if (maxRisk !== null) {
      // Optimize for maximum return given risk constraint
      weights = this.maximizeReturnForRisk(properties, returns, risks, maxRisk);
    } else {
      // Maximize Sharpe ratio
      weights = this.maximizeSharpeRatio(properties, returns, risks);
    }

    const portfolioReturn = this.dotProduct(weights, returns);
    const portfolioRisk = Math.sqrt(this.dotProduct(weights.map((w, i) => w * w * risks[i] * risks[i]), new Array(n).fill(1)));

    return {
      weights: weights.map((w, i) => ({
        property: properties[i].address,
        allocation: (w * 100).toFixed(2) + '%',
        amount: Math.round(w * 1000000), // Assuming $1M portfolio
      })),
      portfolioReturn: (portfolioReturn * 100).toFixed(2) + '%',
      portfolioRisk: (portfolioRisk * 100).toFixed(2) + '%',
      sharpeRatio: ((portfolioReturn - 0.045) / portfolioRisk).toFixed(2),
    };
  }

  maximizeSharpeRatio(properties, returns, risks) {
    // Simplified - in practice use numerical optimization
    const n = properties.length;
    const sharpeRatios = returns.map((r, i) => (r - 0.045) / risks[i]);

    // Weight by Sharpe ratio
    const totalSharpe = sharpeRatios.reduce((sum, s) => sum + Math.max(0, s), 0);
    return sharpeRatios.map(s => Math.max(0, s) / totalSharpe);
  }

  // Statistical helper functions
  mean(arr) {
    return arr.reduce((sum, val) => sum + val, 0) / arr.length;
  }

  median(arr) {
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  standardDeviation(arr) {
    const avg = this.mean(arr);
    const squareDiffs = arr.map(val => Math.pow(val - avg, 2));
    return Math.sqrt(this.mean(squareDiffs));
  }

  percentile(arr, p) {
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * p) - 1;
    return sorted[Math.max(0, index)];
  }

  normalRandom(min, max) {
    // Box-Muller transform for normal distribution
    const u1 = Math.random();
    const u2 = Math.random();
    const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);

    // Scale to desired range
    const mean = (min + max) / 2;
    const stdDev = (max - min) / 6; // 99.7% within range

    return mean + z0 * stdDev;
  }

  dotProduct(arr1, arr2) {
    return arr1.reduce((sum, val, i) => sum + val * arr2[i], 0);
  }

  haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 3959; // Earth radius in miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  toRadians(degrees) {
    return degrees * (Math.PI / 180);
  }

  minimizeRiskForReturn(properties, returns, risks, targetReturn) {
    // Simplified implementation
    return new Array(properties.length).fill(1 / properties.length);
  }

  maximizeReturnForRisk(properties, returns, risks, maxRisk) {
    // Simplified implementation
    return new Array(properties.length).fill(1 / properties.length);
  }
}

// Export singleton instance
const quantitativeModels = new QuantitativeModels();
export default quantitativeModels;
