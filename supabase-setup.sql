-- TX Deed - Supabase Database Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/yupijhwsiqejapufdwhk/sql)

-- 1. LEADS TABLE (Main table for property leads)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_address TEXT NOT NULL,
  owner_name TEXT,
  tax_amount NUMERIC,
  years_delinquent INTEGER,
  property_type TEXT,
  county TEXT,
  state TEXT,
  status TEXT DEFAULT 'New',
  source TEXT,

  -- OpenAI Analyst fields
  analysis_status TEXT,
  investment_score INTEGER,
  risk_level TEXT,
  recommended_action TEXT,
  ai_insights TEXT,
  analyzed_by TEXT,
  analyzed_at TIMESTAMPTZ,

  -- Google AI Analyst fields
  market_analysis_status TEXT,
  estimated_market_value NUMERIC,
  market_trend TEXT,
  comparable_sales INTEGER,
  market_insights TEXT,
  market_analyzed_by TEXT,
  market_analyzed_at TIMESTAMPTZ,

  -- DeepSeek Analyst fields
  compliance_status TEXT,
  legal_risk_score INTEGER,
  compliance_issues TEXT,
  required_actions TEXT,
  compliance_insights TEXT,
  compliance_analyzed_by TEXT,
  compliance_analyzed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_analysis_status ON leads(analysis_status);
CREATE INDEX IF NOT EXISTS idx_leads_market_analysis_status ON leads(market_analysis_status);
CREATE INDEX IF NOT EXISTS idx_leads_compliance_status ON leads(compliance_status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- 2. LEAD SOURCES TABLE (Tracks agent status)
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_name TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_sources_name ON lead_sources(source_name);

-- 3. NEWS ARTICLES TABLE (Optional - for News Scraper)
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT UNIQUE NOT NULL,
  description TEXT,
  keyword TEXT,
  published_at TIMESTAMPTZ,
  relevance_score NUMERIC,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_news_articles_url ON news_articles(url);

-- 4. LEGISLATION UPDATES TABLE (Optional - for Legislation Monitor)
CREATE TABLE IF NOT EXISTS legislation_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_number TEXT NOT NULL,
  state TEXT NOT NULL,
  title TEXT,
  description TEXT,
  status TEXT,
  introduced_date TIMESTAMPTZ,
  impact_level TEXT,
  url TEXT,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(bill_number, state)
);

-- Enable Row Level Security (RLS) - Important for security!
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation_updates ENABLE ROW LEVEL SECURITY;

-- Create policies to allow service role full access
CREATE POLICY "Enable all for service role" ON leads FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON lead_sources FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON news_articles FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON legislation_updates FOR ALL USING (true);

-- Create policies for authenticated users (read-only)
CREATE POLICY "Enable read for authenticated users" ON leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for authenticated users" ON lead_sources FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for authenticated users" ON news_articles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Enable read for authenticated users" ON legislation_updates FOR SELECT USING (auth.role() = 'authenticated');

-- Success message
SELECT 'Database setup complete! All tables created successfully.' AS status;
