import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yupijhwsiqejapufdwhk.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFlZGFwcWZ1ZWdicXp0dWV0a3hkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg5MTY4NTEsImV4cCI6MjA3NDQ5Mjg1MX0.mWkZO0jU64_U6JUug7IOhdQmRpiRunahy-QFTLfQCWY';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log('Checking Supabase tables...\n');

  // Check leads table
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .limit(1);

  console.log('✓ leads table:', leadsError ? `❌ ${leadsError.message}` : '✅ EXISTS');

  // Check lead_sources table
  const { data: sources, error: sourcesError } = await supabase
    .from('lead_sources')
    .select('*')
    .limit(1);

  console.log('✓ lead_sources table:', sourcesError ? `❌ ${sourcesError.message}` : '✅ EXISTS');

  // Check news_articles table
  const { data: news, error: newsError } = await supabase
    .from('news_articles')
    .select('*')
    .limit(1);

  console.log('✓ news_articles table:', newsError ? `❌ ${newsError.message}` : '✅ EXISTS (optional)');

  // Check legislation_updates table
  const { data: legislation, error: legislationError } = await supabase
    .from('legislation_updates')
    .select('*')
    .limit(1);

  console.log('✓ legislation_updates table:', legislationError ? `❌ ${legislationError.message}` : '✅ EXISTS (optional)');
}

checkTables().catch(console.error);
