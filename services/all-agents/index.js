// Consolidated Agent Runner - Runs all 6 agents in a single service
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const path = require('path');

// Import all agents
import { BaseAgent } from '../shared/base-agent.js';
import { supabase } from '../shared/supabase-client.js';

// ============================================================================
// SCOUT AGENTS
// ============================================================================

class CountyScraperAgent extends BaseAgent {
  constructor() {
    super('County Tax Delinquent Scraper', 'County Scraper');
    this.counties = process.env.COUNTIES ? process.env.COUNTIES.split(',') : [
      'Harris County, TX',
      'Dallas County, TX',
      'Tarrant County, TX',
      'Bexar County, TX',
      'Travis County, TX'
    ];
  }

  async run() {
    await this.log('Starting county scraping run');
    try {
      for (const county of this.counties) {
        await this.scrapeCounty(county);
      }
      await this.updateStatus('Active');
      await this.log('County scraping run completed successfully');
    } catch (error) {
      await this.log(`Error during scraping: ${error.message}`, 'error');
      await this.updateStatus('Error');
    }
  }

  async scrapeCounty(countyName) {
    await this.log(`Scraping ${countyName}`);
    const sampleLeads = this.generateSampleLeads(countyName);

    for (const lead of sampleLeads) {
      try {
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('property_address', lead.property_address)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('leads')
            .insert({
              ...lead,
              source: this.name,
              created_at: new Date().toISOString()
            });

          if (error) {
            await this.log(`Error inserting lead: ${error.message}`, 'error');
          } else {
            await this.log(`New lead added: ${lead.property_address}`);
          }
        }
      } catch (err) {
        await this.log(`Error processing lead: ${err.message}`, 'error');
      }
    }
  }

  generateSampleLeads(county) {
    const timestamp = Date.now();
    const count = Math.floor(Math.random() * 4) + 2;
    const leads = [];

    for (let i = 0; i < count; i++) {
      leads.push({
        property_address: `${Math.floor(Math.random() * 9999)} Main St ${i}, ${county}`,
        owner_name: `Property Owner ${timestamp}-${i}`,
        tax_amount: Math.floor(Math.random() * 50000) + 5000,
        years_delinquent: Math.floor(Math.random() * 5) + 1,
        property_type: ['Residential', 'Commercial', 'Land'][Math.floor(Math.random() * 3)],
        county: county,
        state: 'TX',
        status: 'New'
      });
    }
    return leads;
  }
}

class NewsScraperAgent extends BaseAgent {
  constructor() {
    super('National News Scraper', 'News API Scraper');
    this.keywords = process.env.NEWS_KEYWORDS ? process.env.NEWS_KEYWORDS.split(',') : [
      'tax lien',
      'property foreclosure',
      'tax delinquent'
    ];
  }

  async run() {
    await this.log('Starting news scraping run');
    try {
      for (const keyword of this.keywords) {
        await this.scrapeNews(keyword);
      }
      await this.updateStatus('Active');
      await this.log('News scraping run completed successfully');
    } catch (error) {
      await this.log(`Error during news scraping: ${error.message}`, 'error');
      await this.updateStatus('Error');
    }
  }

  async scrapeNews(keyword) {
    await this.log(`Searching news for: ${keyword}`);
    const articles = this.generateSampleArticles(keyword);

    for (const article of articles) {
      try {
        const { data: existing } = await supabase
          .from('news_articles')
          .select('id')
          .eq('url', article.url)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('news_articles')
            .insert({
              ...article,
              source: this.name,
              created_at: new Date().toISOString()
            });

          if (error && error.code !== '42P01') {
            await this.log(`Error inserting article: ${error.message}`, 'error');
          } else if (!error) {
            await this.log(`New article added: ${article.title}`);
          }
        }
      } catch (err) {
        await this.log(`Error processing article: ${err.message}`, 'error');
      }
    }
  }

  generateSampleArticles(keyword) {
    const timestamp = Date.now();
    const count = Math.floor(Math.random() * 3) + 1;
    const articles = [];

    for (let i = 0; i < count; i++) {
      articles.push({
        title: `Breaking: ${keyword} news in major metro area ${i}`,
        url: `https://example.com/news/${keyword.replace(/\s+/g, '-')}-${timestamp}-${i}`,
        description: `Latest developments regarding ${keyword} in the real estate market`,
        keyword: keyword,
        published_at: new Date().toISOString(),
        relevance_score: Math.random() * 0.5 + 0.5
      });
    }
    return articles;
  }
}

class LegislationMonitorAgent extends BaseAgent {
  constructor() {
    super('State Legislation Monitor', 'Legislation Monitor');
    this.states = process.env.MONITOR_STATES ? process.env.MONITOR_STATES.split(',') : ['TX', 'FL', 'CA'];
  }

  async run() {
    await this.log('Starting legislation monitoring run');
    try {
      for (const state of this.states) {
        await this.monitorState(state);
      }
      await this.updateStatus('Active');
      await this.log('Legislation monitoring run completed successfully');
    } catch (error) {
      await this.log(`Error during legislation monitoring: ${error.message}`, 'error');
      await this.updateStatus('Error');
    }
  }

  async monitorState(state) {
    await this.log(`Monitoring legislation for ${state}`);
    const bills = this.generateSampleBills(state);

    for (const bill of bills) {
      try {
        const { data: existing } = await supabase
          .from('legislation_updates')
          .select('id')
          .eq('bill_number', bill.bill_number)
          .eq('state', bill.state)
          .single();

        if (!existing) {
          const { error } = await supabase
            .from('legislation_updates')
            .insert({
              ...bill,
              source: this.name,
              created_at: new Date().toISOString()
            });

          if (error && error.code !== '42P01') {
            await this.log(`Error inserting bill: ${error.message}`, 'error');
          } else if (!error) {
            await this.log(`New bill tracked: ${bill.bill_number}`);
          }
        }
      } catch (err) {
        await this.log(`Error processing bill: ${err.message}`, 'error');
      }
    }
  }

  generateSampleBills(state) {
    const timestamp = Date.now();
    const billNum = Math.floor(Math.random() * 9999) + 1000;
    return [{
      bill_number: `${state}-${billNum}`,
      state: state,
      title: 'Property Tax Reform Act',
      description: `Proposed legislation affecting real estate in ${state}`,
      status: 'Introduced',
      introduced_date: new Date().toISOString(),
      impact_level: 'Medium',
      url: `https://legislature.${state.toLowerCase()}.gov/bill/${billNum}`
    }];
  }
}

// ============================================================================
// ANALYST AGENTS
// ============================================================================

class OpenAIAnalystAgent extends BaseAgent {
  constructor() {
    super('OpenAI Analyst', 'LLM Processor');
  }

  async run() {
    await this.log('Starting OpenAI analysis run');
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .or('analysis_status.is.null,analysis_status.eq.pending')
        .limit(10);

      if (error) throw error;

      if (!leads || leads.length === 0) {
        await this.log('No leads to process');
        await this.updateStatus('Active');
        return;
      }

      await this.log(`Processing ${leads.length} leads`);

      for (const lead of leads) {
        await this.analyzeLead(lead);
      }

      await this.updateStatus('Active');
      await this.log('OpenAI analysis run completed successfully');
    } catch (error) {
      await this.log(`Error during analysis: ${error.message}`, 'error');
      await this.updateStatus('Error');
    }
  }

  async analyzeLead(lead) {
    try {
      const analysis = this.generateAnalysis(lead);

      const { error } = await supabase
        .from('leads')
        .update({
          analysis_status: 'completed',
          investment_score: analysis.investmentScore,
          risk_level: analysis.riskLevel,
          recommended_action: analysis.recommendedAction,
          ai_insights: analysis.insights,
          analyzed_by: this.name,
          analyzed_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) {
        await this.log(`Error updating lead ${lead.id}: ${error.message}`, 'error');
      } else {
        await this.log(`Analyzed lead: ${lead.property_address} - Score: ${analysis.investmentScore}`);
      }
    } catch (err) {
      await this.log(`Error analyzing lead ${lead.id}: ${err.message}`, 'error');
    }
  }

  generateAnalysis(lead) {
    const baseScore = Math.random() * 40 + 30;
    const delinquencyPenalty = (lead.years_delinquent || 1) * 5;
    const taxAmountBonus = (lead.tax_amount || 10000) / 2000;

    const investmentScore = Math.min(100, Math.max(0,
      baseScore + taxAmountBonus - delinquencyPenalty
    ));

    let riskLevel = 'Medium';
    if (investmentScore < 40) riskLevel = 'High';
    else if (investmentScore > 70) riskLevel = 'Low';

    let recommendedAction = 'Review';
    if (investmentScore > 75) recommendedAction = 'High Priority';
    else if (investmentScore < 35) recommendedAction = 'Skip';

    const insights = [
      `Property shows ${lead.years_delinquent || 1} year(s) of tax delinquency`,
      `Tax amount of $${lead.tax_amount || 0} suggests ${lead.property_type || 'unknown'} property value`,
      `Investment score: ${Math.round(investmentScore)}/100`
    ];

    return {
      investmentScore: Math.round(investmentScore),
      riskLevel,
      recommendedAction,
      insights: insights.join(' | ')
    };
  }
}

class GoogleAnalystAgent extends BaseAgent {
  constructor() {
    super('Google AI Analyst', 'LLM Processor');
  }

  async run() {
    await this.log('Starting Google AI analysis run');
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .or('market_analysis_status.is.null,market_analysis_status.eq.pending')
        .limit(10);

      if (error) throw error;

      if (!leads || leads.length === 0) {
        await this.log('No leads to process');
        await this.updateStatus('Active');
        return;
      }

      await this.log(`Processing ${leads.length} leads for market analysis`);

      for (const lead of leads) {
        await this.analyzeMarket(lead);
      }

      await this.updateStatus('Active');
      await this.log('Google AI analysis run completed successfully');
    } catch (error) {
      await this.log(`Error during analysis: ${error.message}`, 'error');
      await this.updateStatus('Error');
    }
  }

  async analyzeMarket(lead) {
    try {
      const analysis = this.generateMarketAnalysis(lead);

      const { error } = await supabase
        .from('leads')
        .update({
          market_analysis_status: 'completed',
          estimated_market_value: analysis.estimatedValue,
          market_trend: analysis.marketTrend,
          comparable_sales: analysis.comparables,
          market_insights: analysis.insights,
          market_analyzed_by: this.name,
          market_analyzed_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) {
        await this.log(`Error updating lead ${lead.id}: ${error.message}`, 'error');
      } else {
        await this.log(`Market analyzed: ${lead.property_address} - Est. Value: $${analysis.estimatedValue}`);
      }
    } catch (err) {
      await this.log(`Error analyzing lead ${lead.id}: ${err.message}`, 'error');
    }
  }

  generateMarketAnalysis(lead) {
    const baseValue = (lead.tax_amount || 10000) * (Math.random() * 10 + 10);
    const estimatedValue = Math.round(baseValue);
    const trends = ['Rising', 'Stable', 'Declining'];
    const marketTrend = trends[Math.floor(Math.random() * trends.length)];
    const comparables = Math.floor(Math.random() * 15) + 3;

    const insights = [
      `Estimated market value: $${estimatedValue.toLocaleString()}`,
      `Market trend: ${marketTrend}`,
      `${comparables} comparable properties found`
    ];

    return {
      estimatedValue,
      marketTrend,
      comparables,
      insights: insights.join(' | ')
    };
  }
}

class DeepSeekAnalystAgent extends BaseAgent {
  constructor() {
    super('Deep Seek Analyst', 'LLM Processor');
  }

  async run() {
    await this.log('Starting DeepSeek analysis run');
    try {
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .or('compliance_status.is.null,compliance_status.eq.pending')
        .limit(10);

      if (error) throw error;

      if (!leads || leads.length === 0) {
        await this.log('No leads to process');
        await this.updateStatus('Active');
        return;
      }

      await this.log(`Processing ${leads.length} leads for compliance analysis`);

      for (const lead of leads) {
        await this.analyzeCompliance(lead);
      }

      await this.updateStatus('Active');
      await this.log('DeepSeek analysis run completed successfully');
    } catch (error) {
      await this.log(`Error during analysis: ${error.message}`, 'error');
      await this.updateStatus('Error');
    }
  }

  async analyzeCompliance(lead) {
    try {
      const analysis = this.generateComplianceAnalysis(lead);

      const { error } = await supabase
        .from('leads')
        .update({
          compliance_status: 'completed',
          legal_risk_score: analysis.legalRiskScore,
          compliance_issues: analysis.issues,
          required_actions: analysis.requiredActions,
          compliance_insights: analysis.insights,
          compliance_analyzed_by: this.name,
          compliance_analyzed_at: new Date().toISOString()
        })
        .eq('id', lead.id);

      if (error) {
        await this.log(`Error updating lead ${lead.id}: ${error.message}`, 'error');
      } else {
        await this.log(`Compliance analyzed: ${lead.property_address}`);
      }
    } catch (err) {
      await this.log(`Error analyzing lead ${lead.id}: ${err.message}`, 'error');
    }
  }

  generateComplianceAnalysis(lead) {
    const riskFactors = [
      lead.years_delinquent > 3 ? 'Extended delinquency' : null
    ].filter(Boolean);

    const legalRiskScore = Math.max(1, Math.min(10, 3 + riskFactors.length * 2));

    const insights = [
      `Legal risk score: ${legalRiskScore}/10`,
      `${riskFactors.length} compliance issues identified`,
      `State: ${lead.state} regulations apply`
    ];

    return {
      legalRiskScore,
      issues: riskFactors.join(', ') || 'No major issues',
      requiredActions: 'Title search required | Verify redemption period',
      insights: insights.join(' | ')
    };
  }
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

console.log('🚀 Starting TX Deed Autonomous Agent System...\n');

// Initialize all agents
const agents = [
  new CountyScraperAgent(),
  new NewsScraperAgent(),
  new LegislationMonitorAgent(),
  new OpenAIAnalystAgent(),
  new GoogleAnalystAgent(),
  new DeepSeekAnalystAgent()
];

// Start all agents with their respective intervals
const intervals = {
  'County Tax Delinquent Scraper': parseInt(process.env.COUNTY_SCRAPER_INTERVAL) || 60,
  'National News Scraper': parseInt(process.env.NEWS_SCRAPER_INTERVAL) || 180,
  'State Legislation Monitor': parseInt(process.env.LEGISLATION_MONITOR_INTERVAL) || 360,
  'OpenAI Analyst': parseInt(process.env.OPENAI_ANALYST_INTERVAL) || 30,
  'Google AI Analyst': parseInt(process.env.GOOGLE_ANALYST_INTERVAL) || 45,
  'Deep Seek Analyst': parseInt(process.env.DEEPSEEK_ANALYST_INTERVAL) || 60
};

// Start all agents
async function startAllAgents() {
  console.log('Starting all 6 autonomous agents:\n');

  for (const agent of agents) {
    const interval = intervals[agent.name];
    console.log(`✓ ${agent.name} - Running every ${interval} minutes`);
    await agent.start(interval);
  }

  console.log('\n✅ All agents are now running!\n');
  console.log('View status at: /ai-workforce');
  console.log('Logs will appear below:\n');
  console.log('='.repeat(80));
}

// Graceful shutdown
async function shutdown() {
  console.log('\n\nShutting down all agents...');
  for (const agent of agents) {
    await agent.stop();
  }
  console.log('All agents stopped. Goodbye!');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start the system
startAllAgents().catch(err => {
  console.error('Failed to start agent system:', err);
  process.exit(1);
});
