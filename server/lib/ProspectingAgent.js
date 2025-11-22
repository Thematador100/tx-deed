/**
 * Prospecting & Lead Generation Agent
 *
 * This agent autonomously:
 * - Identifies high-value investment opportunities
 * - Generates prospect lists for outreach
 * - Scores leads by investment potential
 * - Creates targeted marketing campaigns
 * - Tracks conversion metrics
 * - Auto-generates reports for clients
 * - Uses data to attract new business
 *
 * Engineering as Marketing - The system sells itself through results
 */

class ProspectingAgent {
  constructor(dbManager) {
    this.dbManager = dbManager;

    // Lead scoring criteria
    this.scoringCriteria = {
      // Distressed signals (higher score = better opportunity)
      tax_delinquent: 100,
      high_equity: 80,
      absentee_owner: 60,
      estate_sale: 70,
      pre_foreclosure: 90,
      code_violations: 50,
      vacant_property: 75,
      divorce_probate: 65,
      motivated_seller_indicators: 85,

      // Financial opportunity
      below_market_value: 95,
      positive_cash_flow: 70,
      high_appreciation_area: 60,
      value_add_potential: 80,

      // Market conditions
      hot_market: 50,
      gentrifying_area: 75,
      new_development_nearby: 65,
    };

    this.stats = {
      totalProspects: 0,
      highValueLeads: 0,
      campaignsSent: 0,
      conversionRate: 0,
      lastRun: null,
    };

    this.isRunning = false;
  }

  /**
   * Start autonomous prospecting
   */
  async start() {
    console.log('[ProspectingAgent] 🎯 Starting autonomous prospecting...');
    this.isRunning = true;

    while (this.isRunning) {
      try {
        // Run prospecting cycle
        await this.runProspectingCycle();

        // Wait 1 hour between cycles
        await this.delay(3600000);

      } catch (error) {
        console.error('[ProspectingAgent] ❌ Error:', error.message);
        await this.delay(600000); // Wait 10 minutes on error
      }
    }
  }

  /**
   * Stop the agent
   */
  async stop() {
    console.log('[ProspectingAgent] 🛑 Stopping...');
    this.isRunning = false;
  }

  /**
   * Run complete prospecting cycle
   */
  async runProspectingCycle() {
    console.log('[ProspectingAgent] 🔍 Running prospecting cycle...');

    // 1. Identify high-value opportunities
    const opportunities = await this.identifyOpportunities();
    console.log(`[ProspectingAgent] 💎 Found ${opportunities.length} opportunities`);

    // 2. Score and rank leads
    const scoredLeads = await this.scoreLeads(opportunities);
    console.log(`[ProspectingAgent] ⭐ Scored ${scoredLeads.length} leads`);

    // 3. Create targeted lists
    const lists = await this.createTargetedLists(scoredLeads);
    console.log(`[ProspectingAgent] 📋 Created ${lists.length} targeted lists`);

    // 4. Generate marketing campaigns
    for (const list of lists) {
      await this.generateCampaign(list);
    }

    // 5. Create client-facing reports (Engineering as Marketing)
    await this.generateMarketReports();

    // 6. Update stats
    this.stats.totalProspects += opportunities.length;
    this.stats.highValueLeads = scoredLeads.filter(l => l.score >= 80).length;
    this.stats.lastRun = new Date();

    console.log('[ProspectingAgent] ✅ Prospecting cycle complete');
  }

  /**
   * Identify high-value opportunities
   */
  async identifyOpportunities() {
    const opportunities = [];

    // Query 1: Tax delinquent properties
    const taxDelinquent = await this.findTaxDelinquentProperties();
    opportunities.push(...taxDelinquent.map(p => ({
      ...p,
      opportunity_type: 'tax_delinquent',
    })));

    // Query 2: High equity properties
    const highEquity = await this.findHighEquityProperties();
    opportunities.push(...highEquity.map(p => ({
      ...p,
      opportunity_type: 'high_equity',
    })));

    // Query 3: Absentee owners
    const absentee = await this.findAbsenteeOwners();
    opportunities.push(...absentee.map(p => ({
      ...p,
      opportunity_type: 'absentee_owner',
    })));

    // Query 4: Estate sales
    const estates = await this.findEstateProperties();
    opportunities.push(...estates.map(p => ({
      ...p,
      opportunity_type: 'estate_sale',
    })));

    // Query 5: Below market value
    const undervalued = await this.findUndervaluedProperties();
    opportunities.push(...undervalued.map(p => ({
      ...p,
      opportunity_type: 'below_market_value',
    })));

    // Query 6: Positive cash flow opportunities
    const cashFlow = await this.findCashFlowProperties();
    opportunities.push(...cashFlow.map(p => ({
      ...p,
      opportunity_type: 'positive_cash_flow',
    })));

    // Deduplicate
    const unique = this.deduplicateOpportunities(opportunities);

    return unique;
  }

  /**
   * Find tax delinquent properties
   */
  async findTaxDelinquentProperties() {
    try {
      const { data, error } = await this.dbManager.supabase
        .from('property_enrichment')
        .select(`
          *,
          properties (*)
        `)
        .eq('tax_delinquent', true)
        .gte('years_delinquent', 2)
        .limit(100);

      return error ? [] : data.map(d => ({ ...d.properties, enrichment: d }));

    } catch (error) {
      return [];
    }
  }

  /**
   * Find high equity properties
   */
  async findHighEquityProperties() {
    try {
      // Properties with low debt and high value
      const { data, error } = await this.dbManager.supabase
        .from('property_enrichment')
        .select(`
          *,
          properties (*)
        `)
        .gte('estimated_market_value', 200000)
        .limit(100);

      if (error) return [];

      // Filter for high equity (would need lien data)
      return data
        .filter(d => {
          const liens = d.liens || [];
          const totalLiens = liens.reduce((sum, lien) => sum + (lien.amount || 0), 0);
          const equity = d.estimated_market_value - totalLiens;
          const equityPercent = equity / d.estimated_market_value;
          return equityPercent > 0.60; // 60%+ equity
        })
        .map(d => ({
          ...d.properties,
          enrichment: d,
          equity_percent: ((d.estimated_market_value - d.total_lien_amount) / d.estimated_market_value * 100).toFixed(1),
        }));

    } catch (error) {
      return [];
    }
  }

  /**
   * Find absentee owners
   */
  async findAbsenteeOwners() {
    try {
      // Owner address different from property address
      const { data, error } = await this.dbManager.supabase
        .from('properties')
        .select('*')
        .neq('owner_city', 'city')
        .limit(100);

      return error ? [] : data.map(p => ({
        ...p,
        distance_from_property: 'out_of_town',
      }));

    } catch (error) {
      return [];
    }
  }

  /**
   * Find estate properties
   */
  async findEstateProperties() {
    try {
      const { data, error } = await this.dbManager.supabase
        .from('skip_trace_results')
        .select(`
          *,
          properties (*)
        `)
        .eq('is_deceased', true)
        .limit(100);

      return error ? [] : data.map(d => ({
        ...d.properties,
        skip_trace: d,
      }));

    } catch (error) {
      return [];
    }
  }

  /**
   * Find undervalued properties
   */
  async findUndervaluedProperties() {
    try {
      // Properties where valuation >> market price
      const { data, error } = await this.dbManager.supabase
        .from('property_valuations')
        .select(`
          *,
          properties (*)
        `)
        .limit(100);

      if (error) return [];

      return data
        .filter(d => {
          const valuation = d.final_valuation?.value;
          const marketPrice = d.properties?.market_value || d.properties?.assessed_value;
          if (!valuation || !marketPrice) return false;
          return valuation > marketPrice * 1.15; // 15%+ undervalued
        })
        .map(d => ({
          ...d.properties,
          valuation: d,
          discount_percent: ((1 - (d.properties.market_value / d.final_valuation.value)) * 100).toFixed(1),
        }));

    } catch (error) {
      return [];
    }
  }

  /**
   * Find positive cash flow properties
   */
  async findCashFlowProperties() {
    try {
      const { data, error } = await this.dbManager.supabase
        .from('property_enrichment')
        .select(`
          *,
          properties (*)
        `)
        .gte('cap_rate', 0.08) // 8%+ cap rate
        .limit(100);

      return error ? [] : data.map(d => ({
        ...d.properties,
        enrichment: d,
      }));

    } catch (error) {
      return [];
    }
  }

  /**
   * Score leads based on multiple criteria
   */
  async scoreLeads(opportunities) {
    const scored = opportunities.map(opp => {
      let score = 0;
      const signals = [];

      // Base score from opportunity type
      if (this.scoringCriteria[opp.opportunity_type]) {
        score += this.scoringCriteria[opp.opportunity_type];
        signals.push(opp.opportunity_type);
      }

      // Additional scoring factors
      if (opp.enrichment) {
        // Tax delinquency
        if (opp.enrichment.tax_delinquent) {
          score += 20;
          signals.push('tax_delinquent');
        }

        // High cap rate
        if (opp.enrichment.cap_rate >= 0.10) {
          score += 25;
          signals.push('high_cap_rate');
        }

        // Value-add potential
        if (opp.enrichment.estimated_market_value > opp.enrichment.property_details?.assessed_value * 1.2) {
          score += 20;
          signals.push('value_add');
        }
      }

      // Skip trace signals
      if (opp.skip_trace) {
        if (opp.skip_trace.is_deceased) {
          score += 15;
          signals.push('deceased_owner');
        }

        if (opp.skip_trace.family_members?.length > 0) {
          score += 10;
          signals.push('family_contacts_found');
        }
      }

      // Valuation signals
      if (opp.valuation) {
        if (opp.valuation.confidence > 0.80) {
          score += 15;
          signals.push('high_confidence_valuation');
        }

        if (opp.discount_percent > 20) {
          score += 30;
          signals.push('deep_discount');
        }
      }

      // Property characteristics
      if (opp.bedrooms >= 3 && opp.bathrooms >= 2) {
        score += 10;
        signals.push('good_layout');
      }

      if (opp.year_built >= 2000) {
        score += 10;
        signals.push('newer_construction');
      }

      return {
        ...opp,
        lead_score: Math.min(score, 100), // Cap at 100
        signals,
        grade: this.getLeadGrade(score),
      };
    });

    // Sort by score
    return scored.sort((a, b) => b.lead_score - a.lead_score);
  }

  /**
   * Get lead grade
   */
  getLeadGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 80) return 'A';
    if (score >= 70) return 'B';
    if (score >= 60) return 'C';
    return 'D';
  }

  /**
   * Create targeted lists
   */
  async createTargetedLists(scoredLeads) {
    const lists = [];

    // List 1: Hot leads (A+ and A)
    const hotLeads = scoredLeads.filter(l => l.lead_score >= 80);
    if (hotLeads.length > 0) {
      lists.push({
        name: 'Hot Leads - Immediate Action',
        description: 'High-score leads requiring immediate follow-up',
        leads: hotLeads,
        priority: 'HIGH',
        action: 'direct_outreach',
      });
    }

    // List 2: Tax delinquent
    const taxLeads = scoredLeads.filter(l => l.signals.includes('tax_delinquent'));
    if (taxLeads.length > 0) {
      lists.push({
        name: 'Tax Delinquent Properties',
        description: 'Properties with 2+ years tax delinquency',
        leads: taxLeads,
        priority: 'HIGH',
        action: 'tax_relief_campaign',
      });
    }

    // List 3: Estate sales
    const estateLeads = scoredLeads.filter(l => l.signals.includes('deceased_owner'));
    if (estateLeads.length > 0) {
      lists.push({
        name: 'Estate Sale Opportunities',
        description: 'Properties with deceased owners',
        leads: estateLeads,
        priority: 'MEDIUM',
        action: 'estate_assistance_campaign',
      });
    }

    // List 4: Absentee owners
    const absenteeLeads = scoredLeads.filter(l => l.opportunity_type === 'absentee_owner');
    if (absenteeLeads.length > 0) {
      lists.push({
        name: 'Absentee Owners',
        description: 'Out-of-town property owners',
        leads: absenteeLeads,
        priority: 'MEDIUM',
        action: 'property_management_campaign',
      });
    }

    // List 5: Value-add opportunities
    const valueAddLeads = scoredLeads.filter(l => l.signals.includes('value_add'));
    if (valueAddLeads.length > 0) {
      lists.push({
        name: 'Value-Add Opportunities',
        description: 'Properties with significant upside potential',
        leads: valueAddLeads,
        priority: 'MEDIUM',
        action: 'investor_opportunity_campaign',
      });
    }

    // Save lists to database
    for (const list of lists) {
      await this.saveProspectList(list);
    }

    return lists;
  }

  /**
   * Generate marketing campaign
   */
  async generateCampaign(list) {
    console.log(`[ProspectingAgent] 📧 Generating campaign: ${list.name}`);

    const campaign = {
      list_id: list.id,
      name: list.name,
      type: list.action,
      priority: list.priority,
      total_leads: list.leads.length,
      created_at: new Date().toISOString(),

      // Campaign content
      subject_lines: this.generateSubjectLines(list),
      message_templates: this.generateMessageTemplates(list),
      call_to_action: this.generateCTA(list),

      // Targeting
      target_audience: this.analyzeAudience(list),

      // Metrics to track
      metrics: {
        sent: 0,
        opened: 0,
        clicked: 0,
        responded: 0,
        converted: 0,
      },
    };

    // Save campaign
    await this.saveCampaign(campaign);

    this.stats.campaignsSent++;

    return campaign;
  }

  /**
   * Generate subject lines
   */
  generateSubjectLines(list) {
    const templates = {
      tax_relief_campaign: [
        'Solution for Your Property Tax Situation',
        'We Can Help with Your Tax Delinquency',
        'Quick Property Tax Relief Available',
      ],
      estate_assistance_campaign: [
        'Assistance with Estate Property',
        'We Buy Inherited Properties - Fast & Fair',
        'Simplify Your Estate Property Sale',
      ],
      property_management_campaign: [
        'Professional Management for Your Investment Property',
        'Maximize Your Rental Property Returns',
        'Hassle-Free Property Management Solution',
      ],
      investor_opportunity_campaign: [
        'High-Value Investment Opportunity',
        'Property with Significant Upside Potential',
        'Exclusive Investment Deal Alert',
      ],
      direct_outreach: [
        'Interested in Your Property',
        'Fair Offer for Your Property',
        'We Want to Buy Your Property',
      ],
    };

    return templates[list.action] || templates.direct_outreach;
  }

  /**
   * Generate message templates
   */
  generateMessageTemplates(list) {
    const templates = {
      tax_relief_campaign: `
Dear Property Owner,

We understand that property tax challenges can be overwhelming. We specialize in helping property owners resolve tax delinquency situations quickly and fairly.

We can:
- Pay off back taxes immediately
- Provide a fair cash offer
- Close in as little as 7 days
- No fees or commissions

Let's discuss how we can help. Reply to this message or call us at [PHONE].

Best regards,
[YOUR COMPANY]
      `.trim(),

      estate_assistance_campaign: `
Dear [NAME],

We understand that managing an inherited property can be challenging during an already difficult time. We specialize in purchasing estate properties quickly and fairly, allowing you to settle the estate without the hassle of traditional sales.

Our process:
- Fair cash offer within 24 hours
- We handle all paperwork
- Close on your timeline
- No repairs needed

We're here to make this process as simple as possible. Let's talk.

Sincerely,
[YOUR COMPANY]
      `.trim(),

      direct_outreach: `
Dear [NAME],

We are actively investing in the [AREA] area and are interested in purchasing your property at [ADDRESS].

We offer:
- Fast, fair cash offers
- Close in 7-14 days
- No repairs or fees required
- Flexible terms to fit your needs

Would you be interested in discussing a sale? We'd love to make you an offer.

Best regards,
[YOUR COMPANY]
      `.trim(),
    };

    return templates[list.action] || templates.direct_outreach;
  }

  /**
   * Generate call-to-action
   */
  generateCTA(list) {
    const ctas = {
      tax_relief_campaign: 'Get Tax Relief Now',
      estate_assistance_campaign: 'Get Your Fair Offer',
      property_management_campaign: 'Schedule Consultation',
      investor_opportunity_campaign: 'View Investment Details',
      direct_outreach: 'Get Your Cash Offer',
    };

    return ctas[list.action] || 'Contact Us Today';
  }

  /**
   * Analyze audience
   */
  analyzeAudience(list) {
    const leads = list.leads;

    return {
      total_leads: leads.length,
      avg_lead_score: (leads.reduce((sum, l) => sum + l.lead_score, 0) / leads.length).toFixed(1),
      top_signals: this.getTopSignals(leads),
      geographic_distribution: this.getGeographicDistribution(leads),
      value_range: this.getValueRange(leads),
    };
  }

  /**
   * Get top signals
   */
  getTopSignals(leads) {
    const signalCounts = {};

    for (const lead of leads) {
      for (const signal of lead.signals || []) {
        signalCounts[signal] = (signalCounts[signal] || 0) + 1;
      }
    }

    return Object.entries(signalCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([signal, count]) => ({ signal, count }));
  }

  /**
   * Get geographic distribution
   */
  getGeographicDistribution(leads) {
    const cities = {};

    for (const lead of leads) {
      const city = lead.city || 'Unknown';
      cities[city] = (cities[city] || 0) + 1;
    }

    return Object.entries(cities)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
  }

  /**
   * Get value range
   */
  getValueRange(leads) {
    const values = leads
      .map(l => l.market_value || l.assessed_value || 0)
      .filter(v => v > 0);

    if (values.length === 0) return null;

    return {
      min: Math.min(...values),
      max: Math.max(...values),
      avg: Math.round(values.reduce((sum, v) => sum + v, 0) / values.length),
    };
  }

  /**
   * Generate market reports (Engineering as Marketing)
   */
  async generateMarketReports() {
    console.log('[ProspectingAgent] 📊 Generating market reports...');

    // These reports showcase the system's capabilities
    const reports = [
      await this.generateMarketTrendsReport(),
      await this.generateInvestmentHotSpotsReport(),
      await this.generateDealAnalysisReport(),
    ];

    // Save reports
    for (const report of reports) {
      await this.saveMarketReport(report);
    }

    return reports;
  }

  /**
   * Generate market trends report
   */
  async generateMarketTrendsReport() {
    // Aggregate market data
    const { data } = await this.dbManager.supabase
      .from('properties')
      .select('city, market_value, sale_date, sale_price')
      .not('sale_price', 'is', null)
      .gte('sale_date', new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    // Analyze trends
    const cityTrends = {};

    for (const prop of data || []) {
      if (!cityTrends[prop.city]) {
        cityTrends[prop.city] = { sales: [], prices: [] };
      }
      cityTrends[prop.city].sales.push(prop.sale_date);
      cityTrends[prop.city].prices.push(prop.sale_price);
    }

    return {
      title: 'Market Trends Report',
      type: 'market_trends',
      generated_at: new Date().toISOString(),
      data: cityTrends,
      insights: this.analyzeTrends(cityTrends),
    };
  }

  /**
   * Generate investment hot spots report
   */
  async generateInvestmentHotSpotsReport() {
    return {
      title: 'Investment Hot Spots',
      type: 'hot_spots',
      generated_at: new Date().toISOString(),
      insights: [
        'Areas with highest appreciation',
        'Neighborhoods with best cap rates',
        'Emerging markets to watch',
      ],
    };
  }

  /**
   * Generate deal analysis report
   */
  async generateDealAnalysisReport() {
    return {
      title: 'Recent Deal Analysis',
      type: 'deal_analysis',
      generated_at: new Date().toISOString(),
      insights: [
        'Best deals of the month',
        'Average discount from market value',
        'Fastest closings',
      ],
    };
  }

  /**
   * Analyze trends
   */
  analyzeTrends(cityTrends) {
    const insights = [];

    for (const [city, data] of Object.entries(cityTrends)) {
      if (data.prices.length >= 5) {
        const avgPrice = data.prices.reduce((sum, p) => sum + p, 0) / data.prices.length;
        insights.push({
          city,
          avg_price: Math.round(avgPrice),
          num_sales: data.sales.length,
          trend: 'stable', // Would calculate actual trend
        });
      }
    }

    return insights;
  }

  /**
   * Deduplicate opportunities
   */
  deduplicateOpportunities(opportunities) {
    const seen = new Set();
    const unique = [];

    for (const opp of opportunities) {
      const key = opp.id || `${opp.address}-${opp.zip}`;

      if (!seen.has(key)) {
        seen.add(key);
        unique.push(opp);
      }
    }

    return unique;
  }

  /**
   * Save prospect list
   */
  async saveProspectList(list) {
    try {
      const { data, error } = await this.dbManager.supabase
        .from('prospect_lists')
        .insert({
          name: list.name,
          description: list.description,
          priority: list.priority,
          action: list.action,
          lead_count: list.leads.length,
          leads: list.leads,
          created_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (!error && data) {
        list.id = data.id;
      }

    } catch (error) {
      console.error('[ProspectingAgent] ❌ Save list error:', error.message);
    }
  }

  /**
   * Save campaign
   */
  async saveCampaign(campaign) {
    try {
      await this.dbManager.supabase
        .from('marketing_campaigns')
        .insert(campaign);

    } catch (error) {
      console.error('[ProspectingAgent] ❌ Save campaign error:', error.message);
    }
  }

  /**
   * Save market report
   */
  async saveMarketReport(report) {
    try {
      await this.dbManager.supabase
        .from('market_reports')
        .insert(report);

    } catch (error) {
      console.error('[ProspectingAgent] ❌ Save report error:', error.message);
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      ...this.stats,
      isRunning: this.isRunning,
    };
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default ProspectingAgent;
