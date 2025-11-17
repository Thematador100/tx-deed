/**
 * Distressed Property Detection Engine
 * Analyzes multiple data signals to identify distressed properties
 * Uses machine learning-style scoring with weighted factors
 */

class DistressedPropertyDetector {
  constructor() {
    this.distressSignals = this.initializeDistressSignals();
    this.stats = {
      propertiesAnalyzed: 0,
      distressedFound: 0,
      averageDistressScore: 0,
    };
  }

  initializeDistressSignals() {
    return {
      // Financial distress signals
      taxDelinquency: {
        weight: 0.25,
        description: 'Property has delinquent taxes',
        threshold: 0.7,
      },
      foreclosure: {
        weight: 0.30,
        description: 'Property is in foreclosure',
        threshold: 0.9,
      },
      lienRecorded: {
        weight: 0.15,
        description: 'Tax lien has been recorded',
        threshold: 0.8,
      },
      mortgageDefault: {
        weight: 0.20,
        description: 'Mortgage in default',
        threshold: 0.85,
      },

      // Owner distress signals
      ownerDeath: {
        weight: 0.18,
        description: 'Owner deceased (probate)',
        threshold: 0.75,
      },
      ownerDivorce: {
        weight: 0.12,
        description: 'Owner divorce proceedings',
        threshold: 0.65,
      },
      ownerBankruptcy: {
        weight: 0.20,
        description: 'Owner bankruptcy filing',
        threshold: 0.80,
      },
      absenteeOwner: {
        weight: 0.10,
        description: 'Owner address differs from property',
        threshold: 0.60,
      },
      elderlyOwner: {
        weight: 0.08,
        description: 'Elderly owner (potential assisted living move)',
        threshold: 0.50,
      },

      // Property condition signals
      codeViolations: {
        weight: 0.15,
        description: 'Code violations on record',
        threshold: 0.70,
      },
      deferredMaintenance: {
        weight: 0.10,
        description: 'Evidence of deferred maintenance',
        threshold: 0.60,
      },
      vacancy: {
        weight: 0.12,
        description: 'Property appears vacant',
        threshold: 0.65,
      },
      waterShutoff: {
        weight: 0.10,
        description: 'Utility shutoff notices',
        threshold: 0.70,
      },

      // Market signals
      highDaysOnMarket: {
        weight: 0.08,
        description: 'Listed for extended period',
        threshold: 0.55,
      },
      multiplePriceReductions: {
        weight: 0.10,
        description: 'Multiple price reductions',
        threshold: 0.60,
      },
      belowMarketPrice: {
        weight: 0.15,
        description: 'Listed significantly below market value',
        threshold: 0.70,
      },
      failedSale: {
        weight: 0.08,
        description: 'Previous sale fell through',
        threshold: 0.55,
      },

      // Neighborhood decline
      neighborhoodDeclining: {
        weight: 0.07,
        description: 'Neighborhood showing decline indicators',
        threshold: 0.50,
      },
      nearbyForeclosures: {
        weight: 0.06,
        description: 'Multiple foreclosures nearby',
        threshold: 0.55,
      },
    };
  }

  async analyzeProperty(propertyData) {
    this.stats.propertiesAnalyzed++;

    const signals = this.detectDistressSignals(propertyData);
    const score = this.calculateDistressScore(signals);
    const classification = this.classifyDistressLevel(score);
    const recommendations = this.generateRecommendations(signals, score);
    const urgency = this.calculateUrgency(signals, propertyData);

    // Update stats
    if (classification !== 'none') {
      this.stats.distressedFound++;
    }
    this.stats.averageDistressScore = (
      (this.stats.averageDistressScore * (this.stats.propertiesAnalyzed - 1) + score) /
      this.stats.propertiesAnalyzed
    );

    return {
      propertyId: propertyData.id,
      address: propertyData.address,
      distressScore: score,
      classification,
      urgency,
      signals: signals.filter(s => s.detected),
      recommendations,
      analyzedAt: new Date().toISOString(),
    };
  }

  detectDistressSignals(propertyData) {
    const detectedSignals = [];

    // Financial distress
    if (propertyData.taxDelinquent || propertyData.taxStatus === 'delinquent') {
      detectedSignals.push({
        type: 'taxDelinquency',
        detected: true,
        confidence: 0.95,
        ...this.distressSignals.taxDelinquency,
      });
    }

    if (propertyData.foreclosureStatus === 'active' || propertyData.isForeclosure) {
      detectedSignals.push({
        type: 'foreclosure',
        detected: true,
        confidence: 0.98,
        ...this.distressSignals.foreclosure,
      });
    }

    if (propertyData.lienAmount > 0 || propertyData.hasLien) {
      detectedSignals.push({
        type: 'lienRecorded',
        detected: true,
        confidence: 0.90,
        ...this.distressSignals.lienRecorded,
      });
    }

    // Owner distress
    if (propertyData.ownerName?.toLowerCase().includes('estate of') ||
        propertyData.ownerName?.toLowerCase().includes('deceased')) {
      detectedSignals.push({
        type: 'ownerDeath',
        detected: true,
        confidence: 0.85,
        ...this.distressSignals.ownerDeath,
      });
    }

    if (propertyData.ownerOccupied === false || propertyData.mailingAddress !== propertyData.address) {
      detectedSignals.push({
        type: 'absenteeOwner',
        detected: true,
        confidence: 0.75,
        ...this.distressSignals.absenteeOwner,
      });
    }

    // Property condition
    if (propertyData.codeViolations?.length > 0) {
      detectedSignals.push({
        type: 'codeViolations',
        detected: true,
        confidence: 0.92,
        count: propertyData.codeViolations.length,
        ...this.distressSignals.codeViolations,
      });
    }

    if (propertyData.vacant || propertyData.occupancyStatus === 'vacant') {
      detectedSignals.push({
        type: 'vacancy',
        detected: true,
        confidence: 0.80,
        ...this.distressSignals.vacancy,
      });
    }

    // Market signals
    if (propertyData.daysOnMarket > 180) {
      detectedSignals.push({
        type: 'highDaysOnMarket',
        detected: true,
        confidence: 0.70,
        days: propertyData.daysOnMarket,
        ...this.distressSignals.highDaysOnMarket,
      });
    }

    if (propertyData.priceReductions >= 2) {
      detectedSignals.push({
        type: 'multiplePriceReductions',
        detected: true,
        confidence: 0.75,
        reductions: propertyData.priceReductions,
        ...this.distressSignals.multiplePriceReductions,
      });
    }

    // Below market value
    if (propertyData.price && propertyData.estimatedValue) {
      const priceRatio = propertyData.price / propertyData.estimatedValue;
      if (priceRatio < 0.8) {
        detectedSignals.push({
          type: 'belowMarketPrice',
          detected: true,
          confidence: 0.85,
          discount: ((1 - priceRatio) * 100).toFixed(1) + '%',
          ...this.distressSignals.belowMarketPrice,
        });
      }
    }

    return detectedSignals;
  }

  calculateDistressScore(signals) {
    if (signals.length === 0) {
      return 0;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    for (const signal of signals) {
      if (signal.detected) {
        const contribution = signal.weight * signal.confidence;
        weightedSum += contribution;
        totalWeight += signal.weight;
      }
    }

    // Normalize to 0-100 scale
    const score = totalWeight > 0 ? (weightedSum / totalWeight) * 100 : 0;

    return Math.min(100, Math.round(score));
  }

  classifyDistressLevel(score) {
    if (score >= 80) return 'severe';
    if (score >= 60) return 'high';
    if (score >= 40) return 'moderate';
    if (score >= 20) return 'low';
    return 'none';
  }

  calculateUrgency(signals, propertyData) {
    let urgencyScore = 0;

    // High urgency factors
    const highUrgencySignals = ['foreclosure', 'taxDelinquency', 'lienRecorded'];
    const hasHighUrgency = signals.some(s =>
      s.detected && highUrgencySignals.includes(s.type)
    );

    if (hasHighUrgency) {
      urgencyScore += 40;
    }

    // Auction date proximity
    if (propertyData.auctionDate) {
      const daysUntilAuction = Math.floor(
        (new Date(propertyData.auctionDate) - new Date()) / (1000 * 60 * 60 * 24)
      );

      if (daysUntilAuction <= 30) urgencyScore += 30;
      else if (daysUntilAuction <= 60) urgencyScore += 20;
      else if (daysUntilAuction <= 90) urgencyScore += 10;
    }

    // Multiple signals
    if (signals.length >= 5) urgencyScore += 20;
    else if (signals.length >= 3) urgencyScore += 10;

    if (urgencyScore >= 70) return 'critical';
    if (urgencyScore >= 50) return 'high';
    if (urgencyScore >= 30) return 'medium';
    return 'low';
  }

  generateRecommendations(signals, score) {
    const recommendations = [];

    if (score >= 60) {
      recommendations.push({
        priority: 'high',
        action: 'Immediate Investigation',
        description: 'Property shows strong distress signals. Investigate immediately for potential acquisition.',
        timeline: 'Within 48 hours',
      });
    }

    // Specific signal-based recommendations
    const signalTypes = signals.map(s => s.type);

    if (signalTypes.includes('foreclosure')) {
      recommendations.push({
        priority: 'critical',
        action: 'Contact Foreclosure Attorney',
        description: 'Property is in foreclosure. Consult with attorney about pre-foreclosure purchase options.',
        timeline: 'Immediate',
      });
    }

    if (signalTypes.includes('taxDelinquency')) {
      recommendations.push({
        priority: 'high',
        action: 'Research Tax Sale Date',
        description: 'Check county records for upcoming tax sale date and redemption period.',
        timeline: 'Within 1 week',
      });
    }

    if (signalTypes.includes('ownerDeath')) {
      recommendations.push({
        priority: 'medium',
        action: 'Locate Executor/Heirs',
        description: 'Property in probate. Contact executor or heirs about potential sale.',
        timeline: 'Within 2 weeks',
      });
    }

    if (signalTypes.includes('absenteeOwner')) {
      recommendations.push({
        priority: 'medium',
        action: 'Direct Mail Campaign',
        description: 'Absentee owner may be motivated to sell. Send personalized letter.',
        timeline: 'Within 1 week',
      });
    }

    if (signalTypes.includes('codeViolations')) {
      recommendations.push({
        priority: 'medium',
        action: 'Estimate Repair Costs',
        description: 'Code violations present. Get contractor estimates before making offer.',
        timeline: 'Before making offer',
      });
    }

    if (signalTypes.includes('belowMarketPrice')) {
      recommendations.push({
        priority: 'high',
        action: 'Verify Listing Details',
        description: 'Listed below market value. Verify property condition and title status.',
        timeline: 'Within 3 days',
      });
    }

    return recommendations;
  }

  async batchAnalysis(properties) {
    const results = [];

    for (const property of properties) {
      try {
        const analysis = await this.analyzeProperty(property);
        results.push(analysis);
      } catch (error) {
        console.error(`Error analyzing property ${property.id}:`, error.message);
      }
    }

    // Sort by distress score (highest first)
    results.sort((a, b) => b.distressScore - a.distressScore);

    return {
      totalAnalyzed: results.length,
      distressedProperties: results.filter(r => r.classification !== 'none'),
      criticalUrgency: results.filter(r => r.urgency === 'critical'),
      highDistress: results.filter(r => r.classification === 'severe' || r.classification === 'high'),
      results,
    };
  }

  getStats() {
    return {
      ...this.stats,
      distressRate: this.stats.propertiesAnalyzed > 0
        ? ((this.stats.distressedFound / this.stats.propertiesAnalyzed) * 100).toFixed(2) + '%'
        : '0%',
    };
  }

  resetStats() {
    this.stats = {
      propertiesAnalyzed: 0,
      distressedFound: 0,
      averageDistressScore: 0,
    };
    console.log('[DistressedPropertyDetector] Reset statistics');
  }
}

// Export singleton instance
const distressedPropertyDetector = new DistressedPropertyDetector();
export default distressedPropertyDetector;
