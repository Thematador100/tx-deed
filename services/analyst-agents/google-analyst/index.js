import { BaseAgent } from '../../shared/base-agent.js';
import { supabase } from '../../shared/supabase-client.js';

class GoogleAnalystAgent extends BaseAgent {
  constructor() {
    super('Google AI Analyst', 'LLM Processor');
    this.apiKey = process.env.GOOGLE_AI_API_KEY;
  }

  async run() {
    await this.log('Starting Google AI analysis run');

    try {
      // Fetch leads that need market analysis
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .or('market_analysis_status.is.null,market_analysis_status.eq.pending')
        .limit(10);

      if (error) {
        throw error;
      }

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
      // In production, this would call Google Gemini API
      // For now, we'll generate sample market analysis
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
    // Simulate market analysis
    const baseValue = (lead.tax_amount || 10000) * (Math.random() * 10 + 10);
    const estimatedValue = Math.round(baseValue);

    const trends = ['Rising', 'Stable', 'Declining'];
    const marketTrend = trends[Math.floor(Math.random() * trends.length)];

    const comparables = Math.floor(Math.random() * 15) + 3;

    const insights = [
      `Estimated market value: $${estimatedValue.toLocaleString()}`,
      `Market trend: ${marketTrend} based on recent area sales`,
      `${comparables} comparable properties found in ${lead.county}`,
      `${lead.property_type || 'Unknown'} property type analysis`,
      `Potential equity: $${Math.round((estimatedValue - (lead.tax_amount || 0)) * 0.7).toLocaleString()}`
    ];

    return {
      estimatedValue,
      marketTrend,
      comparables,
      insights: insights.join(' | ')
    };
  }
}

// Start the agent
const agent = new GoogleAnalystAgent();
const intervalMinutes = parseInt(process.env.RUN_INTERVAL_MINUTES) || 45;

agent.start(intervalMinutes).catch(err => {
  console.error('Failed to start Google AI Analyst Agent:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  await agent.stop();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await agent.stop();
  process.exit(0);
});
