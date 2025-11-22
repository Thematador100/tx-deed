import { supabase } from './supabase-client.js';

export class BaseAgent {
  constructor(name, type) {
    this.name = name;
    this.type = type;
    this.isRunning = false;
  }

  async updateStatus(status, lastRunAt = new Date().toISOString()) {
    try {
      const { data, error } = await supabase
        .from('lead_sources')
        .upsert({
          source_name: this.name,
          source_type: this.type,
          status: status,
          last_run_at: lastRunAt,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'source_name'
        });

      if (error) {
        console.error(`Error updating status for ${this.name}:`, error);
      }
    } catch (err) {
      console.error(`Exception updating status for ${this.name}:`, err);
    }
  }

  async log(message, level = 'info') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${this.name}] [${level.toUpperCase()}] ${message}`);
  }

  async start(intervalMinutes = 60) {
    this.isRunning = true;
    await this.log(`Starting ${this.name} with ${intervalMinutes} minute interval`);
    await this.updateStatus('Active');

    // Run immediately on start
    await this.run();

    // Then run on interval
    this.interval = setInterval(async () => {
      if (this.isRunning) {
        await this.run();
      }
    }, intervalMinutes * 60 * 1000);
  }

  async stop() {
    this.isRunning = false;
    if (this.interval) {
      clearInterval(this.interval);
    }
    await this.updateStatus('Inactive');
    await this.log(`Stopped ${this.name}`);
  }

  // Override this in child classes
  async run() {
    throw new Error('run() must be implemented by child class');
  }
}
