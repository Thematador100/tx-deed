import { BaseAgent } from '../../shared/base-agent.js';
import { supabase } from '../../shared/supabase-client.js';

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

    // Simulate scraping - in production, this would connect to actual county websites
    // For now, we'll generate sample data to demonstrate the agent is working

    const sampleLeads = this.generateSampleLeads(countyName);

    for (const lead of sampleLeads) {
      try {
        // Check if lead already exists
        const { data: existing } = await supabase
          .from('leads')
          .select('id')
          .eq('property_address', lead.property_address)
          .single();

        if (!existing) {
          // Insert new lead
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
    // Generate 2-5 sample leads per county per run
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

// Start the agent
const agent = new CountyScraperAgent();
const intervalMinutes = parseInt(process.env.RUN_INTERVAL_MINUTES) || 60;

agent.start(intervalMinutes).catch(err => {
  console.error('Failed to start County Scraper Agent:', err);
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
