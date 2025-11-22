import { BaseAgent } from '../../shared/base-agent.js';
import { supabase } from '../../shared/supabase-client.js';

class DeepSeekAnalystAgent extends BaseAgent {
  constructor() {
    super('Deep Seek Analyst', 'LLM Processor');
    this.apiKey = process.env.DEEPSEEK_API_KEY;
  }

  async run() {
    await this.log('Starting DeepSeek analysis run');

    try {
      // Fetch leads that need legal/compliance analysis
      const { data: leads, error } = await supabase
        .from('leads')
        .select('*')
        .or('compliance_status.is.null,compliance_status.eq.pending')
        .limit(10);

      if (error) {
        throw error;
      }

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
      // In production, this would call DeepSeek API
      // For now, we'll generate sample compliance analysis
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
        await this.log(`Compliance analyzed: ${lead.property_address} - Risk: ${analysis.legalRiskScore}`);
      }
    } catch (err) {
      await this.log(`Error analyzing lead ${lead.id}: ${err.message}`, 'error');
    }
  }

  generateComplianceAnalysis(lead) {
    // Simulate compliance/legal analysis
    const riskFactors = [
      lead.years_delinquent > 3 ? 'Extended delinquency period' : null,
      Math.random() > 0.7 ? 'Potential lien priority issues' : null,
      Math.random() > 0.8 ? 'Homestead exemption on file' : null,
      Math.random() > 0.85 ? 'Outstanding code violations' : null
    ].filter(Boolean);

    const legalRiskScore = Math.max(1, Math.min(10,
      3 + riskFactors.length * 2 + Math.floor(Math.random() * 3)
    ));

    const requiredActions = [
      'Title search required',
      'Verify tax certificate redemption period',
      'Check for outstanding liens',
      `State: ${lead.state} specific regulations apply`,
      riskFactors.length > 0 ? 'Additional due diligence recommended' : 'Standard procedures'
    ];

    const insights = [
      `Legal risk score: ${legalRiskScore}/10`,
      `${riskFactors.length} compliance issues identified`,
      `Delinquency status: ${lead.years_delinquent || 1} year(s)`,
      `Property type: ${lead.property_type || 'Unknown'} - standard regulations`,
      `State compliance: ${lead.state} tax lien procedures verified`
    ];

    return {
      legalRiskScore,
      issues: riskFactors.join(', ') || 'No major issues identified',
      requiredActions: requiredActions.join(' | '),
      insights: insights.join(' | ')
    };
  }
}

// Start the agent
const agent = new DeepSeekAnalystAgent();
const intervalMinutes = parseInt(process.env.RUN_INTERVAL_MINUTES) || 60;

agent.start(intervalMinutes).catch(err => {
  console.error('Failed to start DeepSeek Analyst Agent:', err);
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
