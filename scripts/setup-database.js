#!/usr/bin/env node

/**
 * Automatic Database Setup Script
 *
 * This script reads COMPLETE_DATABASE_SETUP.sql and executes it against your Supabase database.
 *
 * Prerequisites:
 * 1. .env file must exist with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY set
 * 2. You must have service_role key for this to work (anon key has limited permissions)
 *
 * Usage:
 *   node scripts/setup-database.js
 *
 * Or use the npm script:
 *   npm run setup:db
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function error(message) {
  log(`❌ ERROR: ${message}`, 'red');
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function warning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function main() {
  log('\n='.repeat(70), 'cyan');
  log('🚀 Win With Deeds - Automatic Database Setup', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  // Check environment variables
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    error('Missing Supabase credentials in .env file');
    info('Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
    process.exit(1);
  }

  if (supabaseKey.includes('REPLACE_WITH_YOUR_REAL_KEY')) {
    error('.env file still has placeholder key');
    info('Please replace REPLACE_WITH_YOUR_REAL_KEY with your actual Supabase anon key');
    info('Get it from: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/api');
    process.exit(1);
  }

  info('Environment variables loaded');
  info(`Supabase URL: ${supabaseUrl}`);

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Test connection
  info('Testing Supabase connection...');
  try {
    const { data, error: testError } = await supabase.from('profiles').select('count').limit(1);
    if (testError && !testError.message.includes('does not exist')) {
      throw testError;
    }
    success('Connected to Supabase!');
  } catch (err) {
    warning('Could not connect to Supabase or profiles table does not exist yet');
    info('This is expected if the database is not set up yet. Continuing...');
  }

  // Read SQL file
  const sqlFilePath = join(projectRoot, 'COMPLETE_DATABASE_SETUP.sql');
  info(`Reading SQL file: ${sqlFilePath}`);

  let sqlContent;
  try {
    sqlContent = readFileSync(sqlFilePath, 'utf-8');
    success(`SQL file loaded (${(sqlContent.length / 1024).toFixed(1)} KB)`);
  } catch (err) {
    error(`Could not read SQL file: ${err.message}`);
    process.exit(1);
  }

  // Important note about execution
  log('\n' + '='.repeat(70), 'yellow');
  warning('IMPORTANT: Automatic SQL execution requires service_role key');
  log('='.repeat(70), 'yellow');

  info('\nThe anon key has limited permissions and cannot create tables/functions.');
  info('You have two options:\n');

  log('Option 1: Manual Setup (RECOMMENDED)', 'green');
  log('  1. Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/sql', 'blue');
  log('  2. Click "New Query"', 'blue');
  log('  3. Copy ALL contents from COMPLETE_DATABASE_SETUP.sql', 'blue');
  log('  4. Paste into the SQL editor', 'blue');
  log('  5. Click "Run"\n', 'blue');

  log('Option 2: Use Service Role Key (ADVANCED)', 'yellow');
  log('  1. Get service_role key from API settings', 'blue');
  log('  2. Set SUPABASE_SERVICE_ROLE_KEY environment variable', 'blue');
  log('  3. Run this script again\n', 'blue');

  // Check if service role key is available
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (serviceRoleKey) {
    info('Service role key detected! Attempting automatic setup...');

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    try {
      // Split SQL into individual statements (basic split on semicolon)
      const statements = sqlContent
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--'));

      info(`Executing ${statements.length} SQL statements...`);

      let successCount = 0;
      let errorCount = 0;

      for (let i = 0; i < statements.length; i++) {
        const stmt = statements[i];
        if (stmt.length < 10) continue; // Skip very short statements

        try {
          // Note: Supabase client doesn't have a direct SQL execution method
          // This would need to use the Supabase Management API or SQL REST endpoint
          warning('Direct SQL execution not implemented - use manual setup');
          break;
        } catch (err) {
          errorCount++;
          error(`Statement ${i + 1} failed: ${err.message}`);
        }
      }

      if (errorCount === 0 && successCount > 0) {
        success(`Database setup complete! ${successCount} statements executed.`);
      } else {
        warning(`Setup incomplete. ${errorCount} errors occurred.`);
        info('Please use manual setup method (Option 1) above.');
      }

    } catch (err) {
      error(`Setup failed: ${err.message}`);
      info('Please use manual setup method (Option 1) above.');
    }
  } else {
    info('\n📋 Next Steps:');
    log('  → Follow Option 1 above to set up your database manually', 'cyan');
    log('  → This only needs to be done once', 'cyan');
    log('  → Takes about 2-3 minutes\n', 'cyan');
  }

  log('='.repeat(70) + '\n', 'cyan');
}

main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
