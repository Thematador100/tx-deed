/**
 * Supabase Verification Script
 *
 * Comprehensive verification of all Supabase tables and configuration
 */

import { createClient } from '@supabase/supabase-js';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  bright: '\x1b[1m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function verify() {
  log('\n🔍 Verifying Supabase Setup\n', 'bright');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ Missing environment variables', 'red');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  // All tables that should exist
  const requiredTables = {
    'Core Tables': [
      'properties',
      'profiles',
    ],
    'Autonomous Agent Tables': [
      'scraper_runs',
      'skip_trace_results',
      'property_enrichment',
      'pipeline_stages',
      'saved_properties',
      'property_assignments',
      'notifications',
    ],
    'Enterprise Tables': [
      'property_valuations',
      'ml_decisions',
      'decision_outcomes',
      'prospect_lists',
      'marketing_campaigns',
      'market_reports',
      'offers',
      'due_diligence_tasks',
      'watchlist',
      'review_queue',
      'data_import_log',
      'system_analytics',
    ],
  };

  let totalTables = 0;
  let existingTables = 0;

  for (const [category, tables] of Object.entries(requiredTables)) {
    log(`\n${category}:`, 'blue');

    for (const table of tables) {
      totalTables++;
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1);

        if (error && error.code === 'PGRST116') {
          log(`  ❌ ${table} - NOT FOUND`, 'red');
        } else if (error) {
          log(`  ⚠️  ${table} - ${error.message}`, 'yellow');
          existingTables++;
        } else {
          log(`  ✅ ${table}`, 'green');
          existingTables++;
        }
      } catch (error) {
        log(`  ❌ ${table} - ERROR`, 'red');
      }
    }
  }

  // Summary
  log('\n━'.repeat(60), 'blue');
  log(`\nVerification Complete: ${existingTables}/${totalTables} tables found`, 'bright');

  const percentage = Math.round((existingTables / totalTables) * 100);

  if (percentage === 100) {
    log('🎉 Supabase is 100% configured!', 'green');
  } else if (percentage >= 80) {
    log(`⚠️  Supabase is ${percentage}% configured - almost there!`, 'yellow');
  } else {
    log(`❌ Supabase is only ${percentage}% configured`, 'red');
    log('Please run the SQL migrations', 'yellow');
  }

  log('\n');
}

verify().catch(error => {
  log('\n❌ Verification failed:', 'red');
  log(error.message, 'red');
  process.exit(1);
});
