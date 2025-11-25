import pg from 'pg';
const { Client } = pg;

const connectionString = 'postgres://postgres.yupijhwsiqejapufdwhk:z6SDVoTZw540K4r7@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require';

const tables = [
  {
    name: 'properties',
    sql: `
      CREATE TABLE IF NOT EXISTS properties (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        address TEXT NOT NULL,
        county TEXT,
        property_type TEXT,
        bedrooms INTEGER,
        bathrooms INTEGER,
        opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_properties_score ON properties(opportunity_score DESC);
      CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(county);
    `
  },
  {
    name: 'leads',
    sql: `
      CREATE TABLE IF NOT EXISTS leads (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
        contact_name TEXT,
        contact_email TEXT,
        contact_phone TEXT,
        lead_source TEXT,
        status TEXT DEFAULT 'new',
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
      CREATE INDEX IF NOT EXISTS idx_leads_property ON leads(property_id);
    `
  },
  {
    name: 'lead_sources',
    sql: `
      CREATE TABLE IF NOT EXISTS lead_sources (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        source_name TEXT NOT NULL,
        source_type TEXT NOT NULL,
        status TEXT DEFAULT 'Active',
        last_run_at TIMESTAMP WITH TIME ZONE,
        config JSONB,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_lead_sources_type ON lead_sources(source_type);
      CREATE INDEX IF NOT EXISTS idx_lead_sources_status ON lead_sources(status);
    `
  },
  {
    name: 'scout_agents',
    sql: `
      CREATE TABLE IF NOT EXISTS scout_agents (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        agent_name TEXT NOT NULL,
        criteria JSONB NOT NULL,
        notification_method TEXT DEFAULT 'email',
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_scout_agents_user ON scout_agents(user_id);
      CREATE INDEX IF NOT EXISTS idx_scout_agents_active ON scout_agents(is_active);
    `
  }
];

async function createTables() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    for (const table of tables) {
      console.log(`📝 Creating table: ${table.name}...`);
      try {
        await client.query(table.sql);
        console.log(`✅ Table "${table.name}" created successfully!\n`);
      } catch (error) {
        console.error(`❌ Error creating table "${table.name}":`, error.message);
        throw error;
      }
    }

    console.log('🎉 All tables created successfully!');

    // Verify tables exist
    console.log('\n🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('properties', 'leads', 'lead_sources', 'scout_agents')
      ORDER BY table_name;
    `);

    console.log('✅ Tables found in database:');
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed.');
  }
}

createTables();
