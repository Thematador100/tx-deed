import { BaseAgent } from '../../shared/base-agent.js';
import { supabase } from '../../shared/supabase-client.js';

class OpenAIAnalystAgent extends BaseAgent {
  constructor() {
    super('OpenAI Analyst', 'LLM Processor');
    this.apiKey = process.env.OPENAI_API_KEY;
  }

  async run() {
    await this.log('Starting OpenAI analysis run');

    try {
      // Fetch unprocessed leads
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .or('analysis_status.is.null,analysis_status.eq.pending')
        .limit(10);

      if (error) {
        throw error;
      }

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
      // In production, this would call OpenAI API
      // For now, we'll generate sample analysis
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
    // Simulate AI analysis scoring
    const baseScore = Math.random() * 40 + 30; // 30-70 base
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
      `Located in ${lead.county}, ${lead.state} - market analysis pending`,
      `Investment score: ${Math.round(investmentScore)}/100`,
      `Risk assessment: ${riskLevel} risk based on current data`
    ];

    return {
      investmentScore: Math.round(investmentScore),
      riskLevel,
      recommendedAction,
      insights: insights.join(' | ')
    };
  }
}

// Start the agent
const agent = new OpenAIAnalystAgent();
const intervalMinutes = parseInt(process.env.RUN_INTERVAL_MINUTES) || 30;

agent.start(intervalMinutes).catch(err => {
  console.error('Failed to start OpenAI Analyst Agent:', err);
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
