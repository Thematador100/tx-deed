import { BaseAgent } from '../../shared/base-agent.js';
import { supabase } from '../../shared/supabase-client.js';

class LegislationMonitorAgent extends BaseAgent {
  constructor() {
    super('State Legislation Monitor', 'Legislation Monitor');
    this.states = process.env.MONITOR_STATES ? process.env.MONITOR_STATES.split(',') : [
      'TX', 'FL', 'CA', 'NY', 'IL'
    ];
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

    // In production, this would connect to state legislature APIs or scrape official sites
    // For now, we'll generate sample legislation updates

    const bills = this.generateSampleBills(state);

    for (const bill of bills) {
      try {
        // Check if bill already tracked
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

          if (error && error.code !== '42P01') { // Ignore if table doesn't exist
            await this.log(`Error inserting bill: ${error.message}`, 'error');
          } else if (!error) {
            await this.log(`New bill tracked: ${bill.bill_number} - ${bill.title}`);
          }
        }
      } catch (err) {
        await this.log(`Error processing bill: ${err.message}`, 'error');
      }
    }
  }

  generateSampleBills(state) {
    const timestamp = Date.now();
    const count = Math.floor(Math.random() * 2) + 1;
    const bills = [];

    const topics = [
      'Property Tax Reform',
      'Tax Lien Sale Procedures',
      'Foreclosure Timeline Changes',
      'Homeowner Relief Programs',
      'Real Estate Disclosure Requirements'
    ];

    for (let i = 0; i < count; i++) {
      const billNum = Math.floor(Math.random() * 9999) + 1000;
      bills.push({
        bill_number: `${state}-${billNum}`,
        state: state,
        title: topics[Math.floor(Math.random() * topics.length)],
        description: `Proposed legislation affecting real estate and tax delinquent properties in ${state}`,
        status: ['Introduced', 'Committee', 'Passed House', 'Passed Senate'][Math.floor(Math.random() * 4)],
        introduced_date: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
        impact_level: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
        url: `https://legislature.${state.toLowerCase()}.gov/bill/${billNum}`
      });
    }

    return bills;
  }
}

// Start the agent
const agent = new LegislationMonitorAgent();
const intervalMinutes = parseInt(process.env.RUN_INTERVAL_MINUTES) || 360; // Every 6 hours

agent.start(intervalMinutes).catch(err => {
  console.error('Failed to start Legislation Monitor Agent:', err);
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
