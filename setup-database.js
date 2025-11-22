import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const supabaseUrl = 'https://yupijhwsiqejapufdwhk.supabase.co';

// Try with service role key from environment, or use anon key as fallback
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cGlqaHdzaXFlamFwdWZkd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTg3ODksImV4cCI6MjA3OTMzNDc4OX0.MQ1NIAf7i6IDafS0avwYoo2O4DDQ4hLdnlS1nHW_2A4';

console.log('🔧 Setting up Supabase database...\n');

const supabase = createClient(supabaseUrl, supabaseKey);

// Read the SQL file
const sql = readFileSync('supabase-setup.sql', 'utf-8');

// Split into individual statements
const statements = sql
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--') && !s.toLowerCase().startsWith('select'));

console.log(`Found ${statements.length} SQL statements to execute\n`);

async function runSetup() {
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';

    // Skip comments
    if (statement.trim().startsWith('--')) continue;

    console.log(`[${i + 1}/${statements.length}] Executing...`);

    try {
      const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

      if (error) {
        console.error(`❌ Error: ${error.message}`);
        errorCount++;

        // If it's a permission error, we need service role key
        if (error.message.includes('permission') || error.message.includes('denied')) {
          console.log('\n⚠️  PERMISSION DENIED - Need service_role key!\n');
          console.log('To fix this:');
          console.log('1. Go to https://supabase.com/dashboard');
          console.log('2. Open your project: yupijhwsiqejapufdwhk');
          console.log('3. Click Settings → API');
          console.log('4. Copy the "service_role" key');
          console.log('5. Run: SUPABASE_SERVICE_KEY=your-key node setup-database.js\n');
          process.exit(1);
        }
      } else {
        console.log(`✅ Success`);
        successCount++;
      }
    } catch (err) {
      console.error(`❌ Exception: ${err.message}`);
      errorCount++;
    }
  }

  console.log(`\n📊 Results:`);
  console.log(`✅ Successful: ${successCount}`);
  console.log(`❌ Errors: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 Database setup complete!\n');
  }
}

// Alternative: Direct execution via supabase-js query
async function tryDirectExecution() {
  console.log('Attempting direct table creation...\n');

  try {
    // Try creating the leads table directly
    const { error: leadsError } = await supabase
      .from('leads')
      .select('id')
      .limit(1);

    if (leadsError && leadsError.code === '42P01') {
      console.log('❌ Tables do not exist yet');
      console.log('\n📋 You need to run the SQL manually in Supabase:');
      console.log('1. Go to https://supabase.com/dashboard/project/yupijhwsiqejapufdwhk/sql');
      console.log('2. Click "New Query"');
      console.log('3. Copy/paste the entire contents of supabase-setup.sql');
      console.log('4. Click "Run" or press Ctrl+Enter\n');
      return false;
    } else if (!leadsError) {
      console.log('✅ leads table exists!');

      // Check other tables
      const tables = ['lead_sources', 'news_articles', 'legislation_updates'];
      for (const table of tables) {
        const { error } = await supabase.from(table).select('id').limit(1);
        if (!error) {
          console.log(`✅ ${table} table exists!`);
        } else if (error.code === '42P01') {
          console.log(`❌ ${table} table missing`);
        }
      }

      console.log('\n✅ Database is ready!\n');
      return true;
    }
  } catch (err) {
    console.error('Error checking tables:', err.message);
    return false;
  }
}

// Run the check first
tryDirectExecution();
