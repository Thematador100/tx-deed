import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yupijhwsiqejapufdwhk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1cGlqaHdzaXFlamFwdWZkd2hrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM3NTg3ODksImV4cCI6MjA3OTMzNDc4OX0.MQ1NIAf7i6IDafS0avwYoo2O4DDQ4hLdnlS1nHW_2A4';

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
