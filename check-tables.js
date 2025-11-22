import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://aedapqfuegbqztuetkxd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGFwcWZ1ZWdicXp0dWV0a3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTY4NTEsImV4cCI6MjA3NDQ5Mjg1MX0.mWkZO0jU64_U6JUug7IOhdQmRpiRunahy-QFTLfQCWY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking Supabase tables...\n');

  const tables = ['leads', 'lead_sources', 'news_articles', 'legislation_updates'];

  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('id').limit(1);

      if (error) {
        if (error.code === '42P01') {
          console.log(`❌ ${table} - Does not exist`);
        } else {
          console.log(`⚠️  ${table} - Error: ${error.message}`);
        }
      } else {
        console.log(`✅ ${table} - Exists! (${data?.length || 0} rows found)`);
      }
    } catch (err) {
      console.log(`❌ ${table} - Exception: ${err.message}`);
    }
  }

  console.log('\n');
}

checkTables().then(() => process.exit(0));
