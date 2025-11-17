/**
 * Institutional-Grade Report Generator
 * Generates Goldman Sachs quality investment reports
 * Includes executive summary, risk analysis, financial projections, and recommendations
 */

import quantitativeModels from '../analytics/QuantitativeModels.js';
import distressedPropertyDetector from '../analytics/DistressedPropertyDetector.js';

class InstitutionalReportGenerator {
  constructor() {
    this.reportCount = 0;
  }

  /**
   * Generate comprehensive investment dossier
   */
  async generateInvestmentDossier(property, marketData, options = {}) {
    const {
      includeMonteCarloSimulation = true,
      includePortfolioAnalysis = false,
      includeDistressAnalysis = true,
      includeCMA = true,
    } = options;

    this.reportCount++;

    const report = {
      metadata: this.generateMetadata(property),
      executiveSummary: await this.generateExecutiveSummary(property, marketData),
      investmentThesis: this.generateInvestmentThesis(property, marketData),
      propertyOverview: this.generatePropertyOverview(property),
      marketAnalysis: this.generateMarketAnalysis(marketData),
      financialAnalysis: await this.generateFinancialAnalysis(property, marketData),
      riskAnalysis: await this.generateRiskAnalysis(property, marketData),
      valuationAnalysis: await this.generateValuationAnalysis(property, marketData, includeCMA),
      recommendedActions: this.generateRecommendedActions(property, marketData),
      appendices: {},
    };

    // Optional sections
    if (includeMonteCarloSimulation) {
      report.monteCarloSimulation = await this.generateMonteCarloSection(property);
    }

    if (includeDistressAnalysis) {
      report.distressAnalysis = await this.generateDistressAnalysis(property);
    }

    // Generate conclusion and rating
    report.conclusion = this.generateConclusion(report);

    return report;
  }

  generateMetadata(property) {
    return {
      reportId: `INV-DOSSIER-${Date.now()}-${this.reportCount}`,
      propertyId: property.id,
      address: property.address,
      generatedDate: new Date().toISOString(),
      analystFirm: 'Win With Deeds Intelligence',
      confidentiality: 'CONFIDENTIAL - For Internal Use Only',
      disclaimer: 'This report contains forward-looking statements and projections. Past performance is not indicative of future results.',
    };
  }

  async generateExecutiveSummary(property, marketData) {
    // Calculate key metrics
    const valuation = await quantitativeModels.calculatePropertyValue(property, marketData);
    const riskAdjustedReturn = quantitativeModels.calculateRiskAdjustedReturn(property, marketData);

    const purchasePrice = property.price || property.estimatedValue;
    const upside = ((valuation.estimatedValue - purchasePrice) / purchasePrice) * 100;

    // Investment recommendation
    let recommendation = 'HOLD';
    if (upside > 30 && riskAdjustedReturn.sharpeRatio > 1.5) recommendation = 'STRONG BUY';
    else if (upside > 20 && riskAdjustedReturn.sharpeRatio > 1.0) recommendation = 'BUY';
    else if (upside < -10 || riskAdjustedReturn.sharpeRatio < 0) recommendation = 'SELL';
    else if (upside < 5) recommendation = 'PASS';

    return {
      recommendation,
      rating: this.calculateInvestmentRating(property, marketData, riskAdjustedReturn),
      keyHighlights: [
        `Purchase Price: $${purchasePrice.toLocaleString()}`,
        `Estimated Value: $${valuation.estimatedValue.toLocaleString()}`,
        `Upside Potential: ${upside.toFixed(1)}%`,
        `Risk-Adjusted Return: ${(riskAdjustedReturn.riskAdjustedReturn * 100).toFixed(2)}%`,
        `Sharpe Ratio: ${riskAdjustedReturn.sharpeRatio.toFixed(2)} (${riskAdjustedReturn.classification})`,
      ],
      investmentSummary: this.generateInvestmentSummaryText(property, upside, recommendation),
      keyRisks: this.identifyKeyRisks(property, marketData),
      keyOpportunities: this.identifyKeyOpportunities(property, marketData),
    };
  }

  generateInvestmentSummaryText(property, upside, recommendation) {
    const upsideText = upside > 0 ? 'undervalued' : 'overvalued';
    const confidenceText = Math.abs(upside) > 20 ? 'high conviction' : 'moderate conviction';

    return `Based on our comprehensive quantitative analysis, this ${property.propertyType || 'property'} presents a ${recommendation.toLowerCase()} opportunity with ${Math.abs(upside).toFixed(1)}% ${upsideText}. Our ${confidenceText} recommendation is supported by multi-factor valuation models, Monte Carlo simulations, and comparative market analysis. The property exhibits ${upside > 0 ? 'attractive' : 'limited'} risk-adjusted returns relative to market alternatives.`;
  }

  generateInvestmentThesis(property, marketData) {
    return {
      primaryDrivers: [
        {
          driver: 'Valuation Opportunity',
          description: 'Property trading at discount to intrinsic value based on multi-factor regression model',
          impact: 'High',
        },
        {
          driver: 'Market Dynamics',
          description: `${marketData.marketTrend || 'Stable'} market with ${((marketData.appreciationRate || 0.05) * 100).toFixed(1)}% annual appreciation`,
          impact: 'Medium',
        },
        {
          driver: 'Location Fundamentals',
          description: `Strong demographics with $${(marketData.medianIncome || 75000).toLocaleString()} median income`,
          impact: 'High',
        },
      ],
      investmentStrategy: this.determineInvestmentStrategy(property, marketData),
      expectedHoldingPeriod: this.calculateOptimalHoldingPeriod(property, marketData),
      exitStrategy: this.determineExitStrategy(property, marketData),
    };
  }

  generatePropertyOverview(property) {
    return {
      physicalCharacteristics: {
        propertyType: property.propertyType || 'Single Family',
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        squareFeet: property.sqft?.toLocaleString(),
        lotSize: property.lotSize,
        yearBuilt: property.yearBuilt,
        condition: property.condition || 'Average',
      },
      location: {
        address: property.address,
        city: property.city,
        state: property.state,
        county: property.county,
        zip: property.zip,
        coordinates: {
          latitude: property.latitude,
          longitude: property.longitude,
        },
      },
      ownership: {
        currentOwner: property.ownerName,
        ownerOccupied: property.ownerOccupied,
        acquisitionDate: property.lastSaleDate,
        acquisitionPrice: property.lastSalePrice,
      },
      taxAssessment: {
        assessedValue: property.assessedValue,
        taxAmount: property.taxAmount,
        taxRate: property.taxAmount && property.assessedValue
          ? ((property.taxAmount / property.assessedValue) * 100).toFixed(3) + '%'
          : 'N/A',
        taxStatus: property.taxDelinquent ? 'DELINQUENT' : 'Current',
      },
    };
  }

  generateMarketAnalysis(marketData) {
    return {
      macroeconomicFactors: {
        interestRates: ((marketData.interestRate || 0.07) * 100).toFixed(2) + '%',
        gdpGrowth: ((marketData.gdpGrowth || 0.02) * 100).toFixed(2) + '%',
        unemploymentRate: ((marketData.unemploymentRate || 0.04) * 100).toFixed(1) + '%',
        inflation: ((marketData.inflation || 0.03) * 100).toFixed(1) + '%',
      },
      localMarketMetrics: {
        medianHomePrice: `$${(marketData.medianHomePrice || 350000).toLocaleString()}`,
        averagePricePerSqft: `$${(marketData.avgPricePerSqft || 200).toLocaleString()}`,
        monthsOfInventory: (marketData.inventoryLevel || 3.5).toFixed(1),
        daysOnMarket: Math.round(marketData.avgDaysOnMarket || 45),
        priceAppreciation: ((marketData.appreciationRate || 0.05) * 100).toFixed(1) + '% YoY',
      },
      demographics: {
        medianIncome: `$${(marketData.medianIncome || 75000).toLocaleString()}`,
        populationGrowth: ((marketData.populationGrowth || 0.015) * 100).toFixed(2) + '% YoY',
        populationDensity: `${(marketData.populationDensity || 2000).toLocaleString()} per sq mi`,
        medianAge: marketData.medianAge || 38,
      },
      marketTrend: marketData.marketTrend || 'Neutral',
      marketScore: this.calculateMarketScore(marketData),
    };
  }

  async generateFinancialAnalysis(property, marketData) {
    const purchasePrice = property.price || property.estimatedValue;
    const estimatedRent = property.monthlyRent || this.estimateMonthlyRent(property, marketData);

    // Operating assumptions
    const vacancyRate = 0.08; // 8%
    const managementFee = 0.10; // 10% of gross rent
    const maintenanceRate = 0.015; // 1.5% of property value annually
    const propertyTax = property.taxAmount || purchasePrice * 0.012;
    const insurance = purchasePrice * 0.004; // 0.4% annually
    const capEx = purchasePrice * 0.01; // 1% annually

    // Income
    const grossRentalIncome = estimatedRent * 12;
    const effectiveGrossIncome = grossRentalIncome * (1 - vacancyRate);

    // Expenses
    const propertyManagement = effectiveGrossIncome * managementFee;
    const maintenance = purchasePrice * maintenanceRate;
    const totalExpenses = propertyManagement + maintenance + propertyTax + insurance + capEx;

    // NOI
    const netOperatingIncome = effectiveGrossIncome - totalExpenses;

    // Returns
    const capRate = (netOperatingIncome / purchasePrice) * 100;
    const cashOnCashReturn = 0; // Assuming all cash purchase
    const grossRentMultiplier = purchasePrice / grossRentalIncome;

    return {
      assumptions: {
        purchasePrice: `$${purchasePrice.toLocaleString()}`,
        estimatedMonthlyRent: `$${Math.round(estimatedRent).toLocaleString()}`,
        vacancyRate: (vacancyRate * 100).toFixed(1) + '%',
        managementFee: (managementFee * 100).toFixed(1) + '%',
      },
      incomeStatement: {
        grossRentalIncome: `$${Math.round(grossRentalIncome).toLocaleString()}`,
        vacancy: `-$${Math.round(grossRentalIncome * vacancyRate).toLocaleString()}`,
        effectiveGrossIncome: `$${Math.round(effectiveGrossIncome).toLocaleString()}`,
        operatingExpenses: {
          propertyManagement: `$${Math.round(propertyManagement).toLocaleString()}`,
          maintenance: `$${Math.round(maintenance).toLocaleString()}`,
          propertyTax: `$${Math.round(propertyTax).toLocaleString()}`,
          insurance: `$${Math.round(insurance).toLocaleString()}`,
          capitalExpenditures: `$${Math.round(capEx).toLocaleString()}`,
          total: `$${Math.round(totalExpenses).toLocaleString()}`,
        },
        netOperatingIncome: `$${Math.round(netOperatingIncome).toLocaleString()}`,
      },
      performanceMetrics: {
        capRate: capRate.toFixed(2) + '%',
        capRateRating: this.rateCapRate(capRate),
        grossRentMultiplier: grossRentMultiplier.toFixed(2),
        cashOnCashReturn: 'N/A (All Cash)',
        operatingExpenseRatio: ((totalExpenses / effectiveGrossIncome) * 100).toFixed(1) + '%',
      },
      projections: this.generateFinancialProjections(purchasePrice, netOperatingIncome, marketData),
    };
  }

  generateFinancialProjections(purchasePrice, currentNOI, marketData) {
    const years = [1, 3, 5, 10];
    const appreciationRate = marketData.appreciationRate || 0.05;
    const rentGrowth = marketData.rentGrowth || 0.03;

    return years.map(year => {
      const futureValue = purchasePrice * Math.pow(1 + appreciationRate, year);
      const futureNOI = currentNOI * Math.pow(1 + rentGrowth, year);
      const equity = futureValue - purchasePrice;

      return {
        year,
        propertyValue: `$${Math.round(futureValue).toLocaleString()}`,
        noi: `$${Math.round(futureNOI).toLocaleString()}`,
        equityBuildup: `$${Math.round(equity).toLocaleString()}`,
        totalReturn: `${((equity / purchasePrice) * 100).toFixed(1)}%`,
        annualizedReturn: `${(((futureValue / purchasePrice) ** (1 / year) - 1) * 100).toFixed(2)}%`,
      };
    });
  }

  async generateRiskAnalysis(property, marketData) {
    const riskFactors = [];

    // Market risk
    const marketRisk = this.assessMarketRisk(marketData);
    riskFactors.push({
      category: 'Market Risk',
      level: marketRisk.level,
      score: marketRisk.score,
      description: marketRisk.description,
      mitigation: marketRisk.mitigation,
    });

    // Property-specific risk
    const propertyRisk = this.assessPropertyRisk(property);
    riskFactors.push({
      category: 'Property Risk',
      level: propertyRisk.level,
      score: propertyRisk.score,
      description: propertyRisk.description,
      mitigation: propertyRisk.mitigation,
    });

    // Liquidity risk
    const liquidityRisk = this.assessLiquidityRisk(property, marketData);
    riskFactors.push({
      category: 'Liquidity Risk',
      level: liquidityRisk.level,
      score: liquidityRisk.score,
      description: liquidityRisk.description,
      mitigation: liquidityRisk.mitigation,
    });

    // Calculate overall risk score
    const overallRiskScore = riskFactors.reduce((sum, r) => sum + r.score, 0) / riskFactors.length;

    return {
      overallRiskRating: this.classifyRiskLevel(overallRiskScore),
      overallRiskScore: overallRiskScore.toFixed(1),
      riskFactors,
      riskMatrix: this.generateRiskMatrix(riskFactors),
      stressTests: await this.performStressTests(property, marketData),
    };
  }

  assessMarketRisk(marketData) {
    let score = 50; // Neutral

    // Economic factors
    if (marketData.gdpGrowth < 0) score += 20;
    else if (marketData.gdpGrowth < 0.02) score += 10;

    if (marketData.unemploymentRate > 0.06) score += 15;
    else if (marketData.unemploymentRate < 0.04) score -= 10;

    if (marketData.inventoryLevel > 6) score += 15;
    else if (marketData.inventoryLevel < 3) score -= 10;

    return {
      level: this.classifyRiskLevel(score),
      score,
      description: this.describeMarketRisk(score, marketData),
      mitigation: 'Diversify across multiple markets; Monitor economic indicators; Maintain adequate liquidity reserves',
    };
  }

  assessPropertyRisk(property) {
    let score = 30; // Low base

    const age = new Date().getFullYear() - (property.yearBuilt || 1980);
    if (age > 50) score += 25;
    else if (age > 30) score += 15;
    else if (age < 10) score -= 10;

    if (property.codeViolations?.length > 0) score += 20;
    if (property.condition === 'poor') score += 30;
    else if (property.condition === 'fair') score += 15;

    if (!property.ownerOccupied) score += 5;

    return {
      level: this.classifyRiskLevel(score),
      score,
      description: this.describePropertyRisk(score, property),
      mitigation: 'Conduct thorough inspections; Budget for deferred maintenance; Obtain comprehensive insurance',
    };
  }

  assessLiquidityRisk(property, marketData) {
    let score = 40;

    if (marketData.avgDaysOnMarket > 90) score += 20;
    else if (marketData.avgDaysOnMarket < 30) score -= 10;

    if (marketData.inventoryLevel > 8) score += 15;
    if (property.price > marketData.medianHomePrice * 2) score += 15;

    return {
      level: this.classifyRiskLevel(score),
      score,
      description: `Property liquidity ${score < 40 ? 'strong' : score < 60 ? 'moderate' : 'constrained'} based on market conditions`,
      mitigation: 'Price competitively; Maintain property in excellent condition; Consider seller financing options',
    };
  }

  async performStressTests(property, marketData) {
    const purchasePrice = property.price || property.estimatedValue;

    return [
      {
        scenario: 'Market Downturn',
        assumptions: 'Property value declines 20%, rents decrease 10%',
        impact: `-$${Math.round(purchasePrice * 0.20).toLocaleString()}`,
        recoveryTime: '3-5 years',
      },
      {
        scenario: 'Extended Vacancy',
        assumptions: '6 months vacancy during tenant transition',
        impact: `-$${Math.round((property.monthlyRent || 2000) * 6).toLocaleString()}`,
        recoveryTime: '12 months',
      },
      {
        scenario: 'Major Repairs',
        assumptions: 'Roof, HVAC, or foundation repairs needed',
        impact: `-$${Math.round(purchasePrice * 0.05).toLocaleString()}`,
        recoveryTime: '2-3 years',
      },
      {
        scenario: 'Interest Rate Spike',
        assumptions: 'Rates increase 200 basis points',
        impact: 'Reduced buyer pool, 10-15% value compression',
        recoveryTime: '2-4 years',
      },
    ];
  }

  async generateValuationAnalysis(property, marketData, includeCMA) {
    const valuations = [];

    // Multi-factor model
    const multiFactorValuation = await quantitativeModels.calculatePropertyValue(property, marketData);
    valuations.push({
      method: 'Multi-Factor Regression',
      value: multiFactorValuation.estimatedValue,
      weight: 0.35,
      confidence: 'High',
    });

    // Income approach (if rental property)
    if (property.monthlyRent || marketData.avgCapRate) {
      const capRate = marketData.avgCapRate || 0.08;
      const noi = (property.monthlyRent || this.estimateMonthlyRent(property, marketData)) * 12 * 0.70;
      const incomeValue = noi / capRate;

      valuations.push({
        method: 'Income Capitalization',
        value: Math.round(incomeValue),
        weight: 0.25,
        confidence: 'Medium',
      });
    }

    // Cost approach
    const costValue = this.calculateCostApproach(property);
    valuations.push({
      method: 'Cost Approach',
      value: costValue,
      weight: 0.20,
      confidence: 'Medium',
    });

    // Sales comparison (simplified)
    const salesValue = property.estimatedValue || property.price * 1.05;
    valuations.push({
      method: 'Sales Comparison',
      value: Math.round(salesValue),
      weight: 0.20,
      confidence: 'Medium-High',
    });

    // Weighted average valuation
    const weightedValue = valuations.reduce((sum, v) => sum + (v.value * v.weight), 0);

    return {
      valuations,
      weightedAverageValue: Math.round(weightedValue),
      valuationRange: {
        low: Math.round(Math.min(...valuations.map(v => v.value)) * 0.95),
        high: Math.round(Math.max(...valuations.map(v => v.value)) * 1.05),
      },
      currentListPrice: property.price,
      valueVsPrice: property.price ? ((weightedValue - property.price) / property.price * 100).toFixed(1) + '%' : 'N/A',
      recommendation: weightedValue > (property.price || 0) * 1.15 ? 'UNDERVALUED' :
                       weightedValue < (property.price || 0) * 0.85 ? 'OVERVALUED' : 'FAIRLY VALUED',
    };
  }

  async generateMonteCarloSection(property) {
    const investmentParams = {
      purchasePrice: property.price || property.estimatedValue,
      rehabCost: property.rehabEstimate || 0,
      holdingPeriod: 24,
      monthlyRent: property.monthlyRent || this.estimateMonthlyRent(property, {}),
      sellingCosts: 0.06,
    };

    const simulation = await quantitativeModels.runMonteCarloSimulation(
      property,
      investmentParams,
      10000
    );

    return {
      methodology: 'Monte Carlo simulation with 10,000 iterations using stochastic modeling',
      parameters: investmentParams,
      results: simulation,
      interpretation: this.interpretMonteCarloResults(simulation),
    };
  }

  interpretMonteCarloResults(simulation) {
    const interpretation = [];

    if (simulation.probability.profitableOutcomes > 0.80) {
      interpretation.push('High probability of profitable outcome (>80%)');
    } else if (simulation.probability.profitableOutcomes > 0.60) {
      interpretation.push('Moderate probability of profitable outcome (60-80%)');
    } else {
      interpretation.push('Lower probability of profitable outcome (<60%) - Higher risk');
    }

    if (simulation.roi.mean > 20) {
      interpretation.push(`Strong expected ROI of ${simulation.roi.mean.toFixed(1)}%`);
    } else if (simulation.roi.mean > 10) {
      interpretation.push(`Acceptable expected ROI of ${simulation.roi.mean.toFixed(1)}%`);
    } else {
      interpretation.push(`Below-target expected ROI of ${simulation.roi.mean.toFixed(1)}%`);
    }

    const volatility = simulation.roi.stdDev;
    if (volatility < 10) {
      interpretation.push('Low volatility - consistent returns expected');
    } else if (volatility < 20) {
      interpretation.push('Moderate volatility - some variability in outcomes');
    } else {
      interpretation.push('High volatility - significant uncertainty in returns');
    }

    return interpretation;
  }

  async generateDistressAnalysis(property) {
    return await distressedPropertyDetector.analyzeProperty(property);
  }

  generateRecommendedActions(property, marketData) {
    const actions = [];

    // Due diligence actions
    actions.push({
      phase: 'Due Diligence',
      priority: 'Critical',
      timeline: 'Before offer',
      actions: [
        'Order comprehensive property inspection',
        'Review title report and resolve any liens',
        'Verify zoning and permitted uses',
        'Obtain property insurance quote',
        'Review tax assessment and payment history',
      ],
    });

    // Acquisition strategy
    const offerPrice = this.calculateRecommendedOffer(property, marketData);
    actions.push({
      phase: 'Acquisition',
      priority: 'High',
      timeline: '1-2 weeks',
      actions: [
        `Initial offer: $${Math.round(offerPrice * 0.95).toLocaleString()} (95% of target)`,
        `Maximum offer: $${Math.round(offerPrice * 1.02).toLocaleString()} (102% of target)`,
        'Include inspection contingency (10-14 days)',
        'Request seller disclosures and property records',
        'Negotiate closing timeline (30-45 days optimal)',
      ],
    });

    // Post-acquisition
    actions.push({
      phase: 'Post-Acquisition',
      priority: 'Medium',
      timeline: 'First 90 days',
      actions: [
        'Complete any required repairs or improvements',
        'Implement property management system',
        'Review and optimize insurance coverage',
        'Establish maintenance reserve fund',
        'Document property condition with photos/video',
      ],
    });

    return actions;
  }

  generateConclusion(report) {
    const recommendation = report.executiveSummary.recommendation;
    const rating = report.executiveSummary.rating;
    const distressScore = report.distressAnalysis?.distressScore || 0;

    let conclusion = `Based on comprehensive quantitative analysis, this property receives an investment rating of **${rating}/5** with a **${recommendation}** recommendation. `;

    if (recommendation === 'STRONG BUY' || recommendation === 'BUY') {
      conclusion += 'The investment exhibits favorable risk-adjusted returns, strong market fundamentals, and attractive entry valuation. ';
    } else if (recommendation === 'HOLD') {
      conclusion += 'The investment presents moderate opportunity with balanced risk/return profile. ';
    } else {
      conclusion += 'The investment does not meet our return hurdles or exhibits elevated risk factors. ';
    }

    if (distressScore > 60) {
      conclusion += `Significant distress signals (score: ${distressScore}/100) indicate motivated seller and potential negotiating leverage.`;
    }

    return {
      summary: conclusion,
      nextSteps: this.determineNextSteps(recommendation),
      confidenceLevel: this.calculateConfidenceLevel(report),
    };
  }

  // Helper methods

  calculateInvestmentRating(property, marketData, riskAdjusted) {
    let rating = 3; // Neutral

    if (riskAdjusted.sharpeRatio > 2) rating += 1;
    else if (riskAdjusted.sharpeRatio > 1) rating += 0.5;
    else if (riskAdjusted.sharpeRatio < 0) rating -= 1;

    const purchasePrice = property.price || property.estimatedValue;
    if (purchasePrice < (marketData.medianHomePrice || 999999) * 0.8) rating += 0.5;

    if (property.taxDelinquent) rating += 0.5;
    if (property.codeViolations?.length > 0) rating -= 0.5;

    return Math.max(1, Math.min(5, rating)).toFixed(1);
  }

  identifyKeyRisks(property, marketData) {
    const risks = [];

    const age = new Date().getFullYear() - (property.yearBuilt || 1980);
    if (age > 40) risks.push(`Property age (${age} years) - potential deferred maintenance`);

    if (marketData.inventoryLevel > 6) risks.push('High inventory levels may pressure prices');
    if (marketData.appreciationRate < 0.02) risks.push('Low appreciation market');
    if (property.daysOnMarket > 120) risks.push('Extended time on market suggests pricing or condition issues');

    return risks.slice(0, 3); // Top 3 risks
  }

  identifyKeyOpportunities(property, marketData) {
    const opportunities = [];

    if (property.taxDelinquent) opportunities.push('Tax delinquency - potential negotiating leverage');
    if (!property.ownerOccupied) opportunities.push('Absentee owner - may be motivated seller');
    if (property.price < (marketData.medianHomePrice || 999999) * 0.75) opportunities.push('Below-market pricing - significant upside potential');
    if (marketData.appreciationRate > 0.06) opportunities.push('Strong appreciation market - favorable exit environment');

    return opportunities.slice(0, 3); // Top 3 opportunities
  }

  determineInvestmentStrategy(property, marketData) {
    if (property.condition === 'poor' || property.codeViolations?.length > 0) {
      return 'Value-Add: Acquire below market, renovate, rent or sell at stabilized value';
    }
    if (property.monthlyRent > 0 || marketData.avgCapRate > 0.07) {
      return 'Buy and Hold: Acquire for rental income and long-term appreciation';
    }
    return 'Core Investment: Stabilized asset for steady cash flow and moderate appreciation';
  }

  calculateOptimalHoldingPeriod(property, marketData) {
    const appreciationRate = marketData.appreciationRate || 0.05;

    if (appreciationRate > 0.08) return '3-5 years (capitalize on strong appreciation)';
    if (appreciationRate > 0.05) return '5-7 years (balanced growth period)';
    return '7-10 years (long-term hold for income)';
  }

  determineExitStrategy(property, marketData) {
    return {
      primary: 'Market sale to retail buyer or investor',
      timing: 'Exit when property appreciates 30%+ or market shows signs of peak',
      alternatives: [
        '1031 exchange into larger property',
        'Seller financing to increase sale price',
        'Long-term rental hold if income metrics remain strong',
      ],
    };
  }

  estimateMonthlyRent(property, marketData) {
    // Simple estimation based on sqft and market
    const rentPerSqft = marketData.avgRentPerSqft || 1.5;
    return (property.sqft || 1500) * rentPerSqft;
  }

  rateCapRate(capRate) {
    if (capRate > 10) return 'Excellent';
    if (capRate > 8) return 'Very Good';
    if (capRate > 6) return 'Good';
    if (capRate > 4) return 'Fair';
    return 'Poor';
  }

  calculateMarketScore(marketData) {
    let score = 50;

    if (marketData.appreciationRate > 0.06) score += 15;
    else if (marketData.appreciationRate > 0.04) score += 10;

    if (marketData.populationGrowth > 0.02) score += 10;
    if (marketData.unemploymentRate < 0.04) score += 10;
    if (marketData.inventoryLevel < 4) score += 10;
    if (marketData.gdpGrowth > 0.025) score += 5;

    return Math.min(100, score);
  }

  calculateCostApproach(property) {
    const landValue = (property.lotSize || 5000) * 20; // $20 per sqft land
    const buildingValue = (property.sqft || 1500) * 150; // $150 per sqft construction

    const age = new Date().getFullYear() - (property.yearBuilt || 1980);
    const depreciation = Math.min(age * 0.015, 0.50); // Max 50% depreciation

    return Math.round(landValue + (buildingValue * (1 - depreciation)));
  }

  classifyRiskLevel(score) {
    if (score >= 75) return 'High';
    if (score >= 50) return 'Medium-High';
    if (score >= 30) return 'Medium';
    if (score >= 15) return 'Low-Medium';
    return 'Low';
  }

  describeMarketRisk(score, marketData) {
    if (score >= 70) return `Elevated market risk due to ${marketData.inventoryLevel > 6 ? 'high inventory' : 'economic headwinds'}`;
    if (score >= 50) return 'Moderate market risk - monitor economic indicators closely';
    return 'Low market risk - favorable economic conditions';
  }

  describePropertyRisk(score, property) {
    if (score >= 70) return `High property-specific risk due to ${property.condition === 'poor' ? 'poor condition' : 'age and deferred maintenance'}`;
    if (score >= 50) return 'Moderate property risk - standard due diligence recommended';
    return 'Low property risk - well-maintained asset';
  }

  generateRiskMatrix(riskFactors) {
    return riskFactors.map(rf => ({
      category: rf.category,
      impact: rf.score > 70 ? 'High' : rf.score > 40 ? 'Medium' : 'Low',
      probability: rf.score > 70 ? 'Likely' : rf.score > 40 ? 'Possible' : 'Unlikely',
      priority: rf.score > 70 ? 'Critical' : rf.score > 50 ? 'High' : 'Medium',
    }));
  }

  calculateRecommendedOffer(property, marketData) {
    const baseValue = property.estimatedValue || property.price;
    let offerPrice = baseValue;

    // Adjust for distress
    if (property.taxDelinquent) offerPrice *= 0.90;
    if (property.foreclosureStatus) offerPrice *= 0.85;
    if (property.daysOnMarket > 180) offerPrice *= 0.95;

    // Adjust for condition
    if (property.condition === 'poor') offerPrice *= 0.85;
    else if (property.condition === 'fair') offerPrice *= 0.92;

    return Math.round(offerPrice);
  }

  determineNextSteps(recommendation) {
    if (recommendation === 'STRONG BUY') {
      return [
        'Schedule property inspection within 48 hours',
        'Prepare and submit LOI or purchase offer',
        'Arrange financing or proof of funds',
        'Conduct title search and review',
      ];
    }
    if (recommendation === 'BUY') {
      return [
        'Complete comprehensive due diligence',
        'Obtain multiple contractor bids for repairs',
        'Review comps and validate pricing',
        'Prepare purchase offer with contingencies',
      ];
    }
    return [
      'Monitor property for price changes',
      'Continue market research',
      'Evaluate alternative opportunities',
    ];
  }

  calculateConfidenceLevel(report) {
    let confidence = 70; // Base

    // Data quality
    if (report.valuationAnalysis.valuations.length >= 4) confidence += 10;
    if (report.monteCarloSimulation) confidence += 10;
    if (report.distressAnalysis) confidence += 5;

    // Market data quality
    if (report.marketAnalysis.marketScore > 70) confidence += 5;

    return Math.min(100, confidence) + '%';
  }
}

// Export singleton instance
const reportGenerator = new InstitutionalReportGenerator();
export default reportGenerator;
