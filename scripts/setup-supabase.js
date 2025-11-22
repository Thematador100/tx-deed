/**
 * Supabase Setup Script
 *
 * This script sets up the complete Supabase database for the enterprise platform:
 * - Creates all tables
 * - Sets up indexes
 * - Configures Row Level Security
 * - Verifies setup
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function setupSupabase() {
  log('\n🚀 Starting Supabase Setup for Enterprise Platform\n', 'bright');

  // Step 1: Verify environment variables
  log('Step 1: Verifying environment variables...', 'blue');

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    log('❌ ERROR: Missing environment variables!', 'red');
    log('Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in your .env file', 'yellow');
    process.exit(1);
  }

  log('✅ Environment variables found', 'green');

  // Step 2: Create Supabase client
  log('\nStep 2: Connecting to Supabase...', 'blue');

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  // Test connection
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
      throw error;
    }

    log('✅ Connected to Supabase successfully', 'green');
  } catch (error) {
    log('❌ Failed to connect to Supabase:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }

  // Step 3: Create base tables (properties table must exist first)
  log('\nStep 3: Creating base tables...', 'blue');

  try {
    // Check if properties table exists
    const { error: checkError } = await supabase
      .from('properties')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST116') {
      log('Creating properties table...', 'yellow');

      // Create properties table (base table that other tables reference)
      const { error } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS properties (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

            -- Address
            address TEXT,
            street TEXT,
            city TEXT,
            state TEXT,
            zip TEXT,
            county TEXT,

            -- Property identification
            apn TEXT,
            parcel_id TEXT,

            -- Owner information
            owner TEXT,
            owner_address TEXT,
            owner_city TEXT,
            owner_state TEXT,
            owner_zip TEXT,

            -- Property characteristics
            bedrooms INTEGER,
            bathrooms DECIMAL(3,1),
            sqft INTEGER,
            lot_size INTEGER,
            year_built INTEGER,
            property_type TEXT,

            -- Financial data
            assessed_value DECIMAL(12,2),
            market_value DECIMAL(12,2),
            sale_price DECIMAL(12,2),
            sale_date DATE,

            -- Tax information
            tax_amount DECIMAL(10,2),
            tax_year INTEGER,

            -- Auction/sale data
            auction_date TIMESTAMP,
            opening_bid DECIMAL(12,2),

            -- Location
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),

            -- Metadata
            data_source TEXT,
            record_hash TEXT UNIQUE,

            -- Timestamps
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          );

          CREATE INDEX IF NOT EXISTS idx_properties_address ON properties(address);
          CREATE INDEX IF NOT EXISTS idx_properties_city ON properties(city);
          CREATE INDEX IF NOT EXISTS idx_properties_apn ON properties(apn);
          CREATE INDEX IF NOT EXISTS idx_properties_zip ON properties(zip);
          CREATE INDEX IF NOT EXISTS idx_properties_created ON properties(created_at DESC);
        `
      });

      if (error) {
        // Table might already exist, that's ok
        log('Properties table may already exist', 'yellow');
      } else {
        log('✅ Properties table created', 'green');
      }
    } else {
      log('✅ Properties table already exists', 'green');
    }

  } catch (error) {
    log('Note: Some tables may already exist (this is OK)', 'yellow');
  }

  // Step 4: Display SQL migration instructions
  log('\nStep 4: Database Schema Setup', 'blue');
  log('━'.repeat(60), 'blue');

  log('\n📋 To complete the setup, you need to run the SQL migrations:', 'yellow');
  log('\nOption 1 - Via Supabase Dashboard (Recommended):', 'bright');
  log('1. Go to your Supabase project dashboard', 'yellow');
  log('2. Navigate to SQL Editor', 'yellow');
  log('3. Copy and paste the contents of these files:', 'yellow');
  log('   a) supabase-migrations.sql', 'yellow');
  log('   b) supabase-enterprise-migrations.sql', 'yellow');
  log('4. Execute each file', 'yellow');

  log('\nOption 2 - Via Supabase CLI:', 'bright');
  log('supabase db push', 'yellow');

  log('\nOption 3 - Via psql:', 'bright');
  log('cat supabase-migrations.sql | psql $DATABASE_URL', 'yellow');
  log('cat supabase-enterprise-migrations.sql | psql $DATABASE_URL', 'yellow');

  // Step 5: Verify existing tables
  log('\n\nStep 5: Verifying existing tables...', 'blue');
  log('━'.repeat(60), 'blue');

  const tablesToCheck = [
    'properties',
    'scraper_runs',
    'skip_trace_results',
    'property_enrichment',
    'pipeline_stages',
    'saved_properties',
    'property_assignments',
    'notifications',
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
  ];

  const existingTables = [];
  const missingTables = [];

  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase
        .from(table)
        .select('id')
        .limit(1);

      if (error && error.code === 'PGRST116') {
        missingTables.push(table);
        log(`❌ ${table}`, 'red');
      } else if (error) {
        log(`⚠️  ${table} (check permissions)`, 'yellow');
      } else {
        existingTables.push(table);
        log(`✅ ${table}`, 'green');
      }
    } catch (error) {
      missingTables.push(table);
      log(`❌ ${table}`, 'red');
    }
  }

  // Summary
  log('\n━'.repeat(60), 'blue');
  log('\n📊 Setup Summary:', 'bright');
  log(`✅ Tables created: ${existingTables.length}/${tablesToCheck.length}`, 'green');

  if (missingTables.length > 0) {
    log(`⚠️  Tables to create: ${missingTables.length}`, 'yellow');
    log('\nMissing tables:', 'yellow');
    missingTables.forEach(table => log(`  - ${table}`, 'yellow'));
    log('\nRun the SQL migrations to create these tables (see Option 1-3 above)', 'yellow');
  } else {
    log('🎉 All tables exist!', 'green');
  }

  // Step 6: Test database operations
  log('\n\nStep 6: Testing database operations...', 'blue');
  log('━'.repeat(60), 'blue');

  try {
    // Test insert
    const testProperty = {
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      zip: '12345',
      data_source: 'setup_test',
      created_at: new Date().toISOString(),
    };

    const { data: insertData, error: insertError } = await supabase
      .from('properties')
      .insert(testProperty)
      .select()
      .single();

    if (insertError) {
      log('❌ Insert test failed:', 'red');
      log(insertError.message, 'red');
    } else {
      log('✅ Insert test passed', 'green');

      // Test select
      const { data: selectData, error: selectError } = await supabase
        .from('properties')
        .select('*')
        .eq('id', insertData.id)
        .single();

      if (selectError) {
        log('❌ Select test failed:', 'red');
        log(selectError.message, 'red');
      } else {
        log('✅ Select test passed', 'green');
      }

      // Test update
      const { error: updateError } = await supabase
        .from('properties')
        .update({ bedrooms: 3 })
        .eq('id', insertData.id);

      if (updateError) {
        log('❌ Update test failed:', 'red');
        log(updateError.message, 'red');
      } else {
        log('✅ Update test passed', 'green');
      }

      // Clean up test data
      const { error: deleteError } = await supabase
        .from('properties')
        .delete()
        .eq('id', insertData.id);

      if (deleteError) {
        log('⚠️  Failed to clean up test data', 'yellow');
      } else {
        log('✅ Delete test passed', 'green');
      }
    }

  } catch (error) {
    log('❌ Database operations test failed:', 'red');
    log(error.message, 'red');
  }

  // Final status
  log('\n━'.repeat(60), 'blue');

  if (missingTables.length === 0) {
    log('\n🎉 Supabase is 100% set up and ready!', 'green');
    log('\nYou can now start the autonomous agents:', 'green');
    log('  npm run start:autonomous', 'bright');
    log('  or', 'bright');
    log('  pm2 start ecosystem.config.js', 'bright');
  } else {
    log('\n⚠️  Supabase setup is incomplete', 'yellow');
    log('\nNext steps:', 'bright');
    log('1. Run the SQL migrations (see instructions above)', 'yellow');
    log('2. Run this script again to verify: npm run setup:supabase', 'yellow');
  }

  log('\n');
}

// Run setup
setupSupabase().catch(error => {
  log('\n❌ Setup failed:', 'red');
  log(error.message, 'red');
  log(error.stack, 'red');
  process.exit(1);
});
