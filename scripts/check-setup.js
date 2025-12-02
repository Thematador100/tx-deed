#!/usr/bin/env node

/**
 * Setup Verification Script
 *
 * This script checks if your environment is properly configured
 * and provides helpful diagnostics.
 *
 * Usage:
 *   node scripts/check-setup.js
 *
 * Or use the npm script:
 *   npm run setup:check
 */

import { createClient } from '@supabase/supabase-js';
import { existsSync, readFileSync } from 'fs';
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
  log(`  ❌ ${message}`, 'red');
}

function success(message) {
  log(`  ✅ ${message}`, 'green');
}

function warning(message) {
  log(`  ⚠️  ${message}`, 'yellow');
}

function info(message) {
  log(`  ℹ️  ${message}`, 'cyan');
}

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

async function main() {
  log('\n' + '='.repeat(70), 'cyan');
  log('🔍 Win With Deeds - Environment Check', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  // Check 1: .env file exists
  log('1️⃣  Checking .env file...', 'blue');
  const envPath = join(projectRoot, '.env');
  if (existsSync(envPath)) {
    success('.env file exists');
    checks.passed++;
  } else {
    error('.env file not found');
    info('Create a .env file in the project root');
    checks.failed++;
    return printSummary();
  }

  // Check 2: Supabase URL
  log('\n2️⃣  Checking Supabase URL...', 'blue');
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  if (supabaseUrl && supabaseUrl.includes('aedapqfuegbqztuetkxd.supabase.co')) {
    success(`Supabase URL configured: ${supabaseUrl}`);
    checks.passed++;
  } else if (supabaseUrl) {
    warning(`Unexpected Supabase URL: ${supabaseUrl}`);
    checks.warnings++;
  } else {
    error('VITE_SUPABASE_URL not set in .env');
    checks.failed++;
  }

  // Check 3: Supabase anon key
  log('\n3️⃣  Checking Supabase anon key...', 'blue');
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseKey) {
    error('VITE_SUPABASE_ANON_KEY not set in .env');
    checks.failed++;
  } else if (supabaseKey.includes('REPLACE_WITH_YOUR_REAL_KEY')) {
    error('Supabase anon key is still a placeholder');
    info('Get your real key from: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/settings/api');
    checks.failed++;
  } else if (supabaseKey.startsWith('eyJ')) {
    success('Supabase anon key configured');
    checks.passed++;
  } else {
    warning('Supabase anon key format looks unusual');
    checks.warnings++;
  }

  // Check 4: Google Maps API key
  log('\n4️⃣  Checking Google Maps API key...', 'blue');
  const googleMapsKey = process.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!googleMapsKey || googleMapsKey === 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    warning('Google Maps API key not configured');
    info('Add Property feature will not work without it');
    info('Get a key from: https://console.cloud.google.com/google/maps-apis/credentials');
    checks.warnings++;
  } else {
    success('Google Maps API key configured');
    checks.passed++;
  }

  // Check 5: Stripe key
  log('\n5️⃣  Checking Stripe publishable key...', 'blue');
  const stripeKey = process.env.VITE_STRIPE_PUBLISHABLE_KEY;
  if (!stripeKey || stripeKey === 'pk_test_your_key_here') {
    warning('Stripe key not configured');
    info('Payment features will not work without it');
    info('Get a key from: https://dashboard.stripe.com/test/apikeys');
    checks.warnings++;
  } else if (stripeKey.startsWith('pk_')) {
    success('Stripe key configured');
    checks.passed++;
  } else {
    warning('Stripe key format looks unusual');
    checks.warnings++;
  }

  // Check 6: Supabase connection
  if (supabaseUrl && supabaseKey && !supabaseKey.includes('REPLACE_WITH_YOUR_REAL_KEY')) {
    log('\n6️⃣  Testing Supabase connection...', 'blue');
    try {
      const supabase = createClient(supabaseUrl, supabaseKey);

      // Try to query a table
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error) {
        if (error.message.includes('does not exist')) {
          warning('Connected to Supabase, but profiles table does not exist');
          info('You need to run the database setup SQL script');
          info('Go to: https://supabase.com/dashboard/project/aedapqfuegbqztuetkxd/sql');
          checks.warnings++;
        } else {
          error(`Supabase connection error: ${error.message}`);
          checks.failed++;
        }
      } else {
        success('Successfully connected to Supabase!');
        success('Database tables are set up');
        checks.passed++;
      }
    } catch (err) {
      error(`Could not connect to Supabase: ${err.message}`);
      checks.failed++;
    }
  }

  // Check 7: Required files
  log('\n7️⃣  Checking required files...', 'blue');
  const requiredFiles = [
    'COMPLETE_DATABASE_SETUP.sql',
    'src/lib/customSupabaseClient.js',
    'src/contexts/SupabaseAuthContext.jsx',
    'src/components/PropertyMapAdd.jsx',
    'src/data/usCountiesData.js',
  ];

  let filesOk = true;
  for (const file of requiredFiles) {
    const filePath = join(projectRoot, file);
    if (existsSync(filePath)) {
      // success(`${file} exists`);
    } else {
      error(`Missing: ${file}`);
      filesOk = false;
    }
  }

  if (filesOk) {
    success('All required files present');
    checks.passed++;
  } else {
    checks.failed++;
  }

  // Check 8: Node modules
  log('\n8️⃣  Checking dependencies...', 'blue');
  const nodeModulesPath = join(projectRoot, 'node_modules');
  if (existsSync(nodeModulesPath)) {
    success('node_modules directory exists');

    // Check for key packages
    const keyPackages = [
      '@supabase/supabase-js',
      '@react-google-maps/api',
      'react-router-dom',
      'framer-motion',
    ];

    let packagesOk = true;
    for (const pkg of keyPackages) {
      const pkgPath = join(nodeModulesPath, pkg);
      if (!existsSync(pkgPath)) {
        error(`Missing package: ${pkg}`);
        packagesOk = false;
      }
    }

    if (packagesOk) {
      success('All key packages installed');
      checks.passed++;
    } else {
      error('Some packages are missing');
      info('Run: npm install');
      checks.failed++;
    }
  } else {
    error('node_modules directory not found');
    info('Run: npm install');
    checks.failed++;
  }

  printSummary();
}

function printSummary() {
  log('\n' + '='.repeat(70), 'cyan');
  log('📊 Summary', 'cyan');
  log('='.repeat(70) + '\n', 'cyan');

  success(`${checks.passed} checks passed`);
  if (checks.warnings > 0) {
    warning(`${checks.warnings} warnings (optional features)`);
  }
  if (checks.failed > 0) {
    error(`${checks.failed} checks failed`);
  }

  log('\n');

  if (checks.failed === 0 && checks.warnings === 0) {
    log('🎉 Your environment is fully configured!', 'green');
    log('You can now run: npm run dev', 'green');
  } else if (checks.failed === 0) {
    log('✅ Core configuration is complete!', 'green');
    log('Some optional features need configuration (see warnings above)', 'yellow');
    log('You can run: npm run dev', 'green');
  } else {
    log('❌ Configuration incomplete', 'red');
    log('Please fix the errors above before running the app', 'red');
  }

  log('\n' + '='.repeat(70) + '\n', 'cyan');
}

main().catch(err => {
  error(`Unexpected error: ${err.message}`);
  console.error(err);
  process.exit(1);
});
