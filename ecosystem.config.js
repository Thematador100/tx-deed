/**
 * PM2 Ecosystem Configuration
 *
 * For production deployment with PM2 process manager
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 save
 *   pm2 startup
 */

module.exports = {
  apps: [
    {
      name: 'scraper-autonomous',
      script: 'server/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: 'logs/scraper-error.log',
      out_file: 'logs/scraper-output.log',
      log_file: 'logs/scraper-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',

      // Auto-restart configuration
      min_uptime: '10s',
      max_restarts: 10,

      // Cron restart (optional - restarts daily at 1 AM for fresh state)
      cron_restart: '0 1 * * *',

      // Environment variables loaded from .env file
      env_file: '.env',
    },
  ],
};
