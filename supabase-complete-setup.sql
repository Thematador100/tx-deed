-- TX Deed - COMPLETE Database Setup
-- Run this in your Supabase SQL Editor (https://supabase.com/dashboard/project/yupijhwsiqejapufdwhk/sql)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- USER & AUTH TABLES
-- ============================================================================

-- User profiles (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROPERTY & LEADS TABLES
-- ============================================================================

-- Main leads table (tax delinquent properties)
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_address TEXT NOT NULL,
  owner_name TEXT,
  tax_amount NUMERIC,
  years_delinquent INTEGER,
  property_type TEXT,
  county TEXT,
  state TEXT,
  status TEXT DEFAULT 'New',
  source TEXT,

  -- Analysis fields (from AI agents)
  analysis_status TEXT,
  investment_score INTEGER,
  risk_level TEXT,
  recommended_action TEXT,
  ai_insights TEXT,
  analyzed_by TEXT,
  analyzed_at TIMESTAMPTZ,

  -- Market analysis
  market_analysis_status TEXT,
  estimated_market_value NUMERIC,
  market_trend TEXT,
  comparable_sales INTEGER,
  market_insights TEXT,
  market_analyzed_by TEXT,
  market_analyzed_at TIMESTAMPTZ,

  -- Compliance
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

CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_county ON leads(county);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Properties table (saved/tracked properties)
CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  county TEXT,
  apn TEXT,
  status TEXT DEFAULT 'Active',
  purchase_price NUMERIC,
  current_value NUMERIC,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);

-- Saved properties (user bookmarks)
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lead_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);

-- Upcoming sales (foreclosure/tax sales)
CREATE TABLE IF NOT EXISTS upcoming_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_address TEXT NOT NULL,
  county TEXT,
  state TEXT,
  sale_date TIMESTAMPTZ,
  sale_type TEXT,
  opening_bid NUMERIC,
  status TEXT DEFAULT 'Scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_upcoming_sales_date ON upcoming_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_upcoming_sales_county ON upcoming_sales(county);

-- ============================================================================
-- LEAD MANAGEMENT
-- ============================================================================

-- Lead sources (agent status tracking)
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source_name TEXT UNIQUE NOT NULL,
  source_type TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_lead_sources_name ON lead_sources(source_name);

-- Lead uploads (bulk upload tracking)
CREATE TABLE IF NOT EXISTS lead_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  filename TEXT,
  total_records INTEGER,
  processed_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'Processing',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_lead_uploads_user_id ON lead_uploads(user_id);

-- Marketplace leads (for resale)
CREATE TABLE IF NOT EXISTS marketplace_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  price NUMERIC NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Available',
  sold_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_marketplace_leads_status ON marketplace_leads(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_leads_seller ON marketplace_leads(seller_id);

-- ============================================================================
-- PIPELINE & TRANSACTIONS
-- ============================================================================

-- Pipeline stages (deal flow)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  notes TEXT,
  moved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_stages_user_id ON pipeline_stages(user_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_property_id ON pipeline_stages(property_id);

-- Transactions (payments, subscriptions)
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'USD',
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Pending',
  stripe_payment_id TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE NOT NULL,
  amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'Unpaid',
  due_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- ============================================================================
-- PARTNERSHIPS & FUNDING
-- ============================================================================

-- Partner applications (affiliates)
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_email TEXT,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'Pending',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_applications_user_id ON partner_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON partner_applications(status);

-- Funding submissions
CREATE TABLE IF NOT EXISTS funding_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  amount_requested NUMERIC,
  property_value NUMERIC,
  purpose TEXT,
  status TEXT DEFAULT 'Submitted',
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_funding_submissions_user_id ON funding_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_submissions_status ON funding_submissions(status);

-- ============================================================================
-- CONTENT & RESOURCES
-- ============================================================================

-- Library items (educational content)
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT,
  file_url TEXT,
  category TEXT,
  is_premium BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items(category);

-- ============================================================================
-- AGENT TRACKING
-- ============================================================================

-- Scout agents (additional agent tracking)
CREATE TABLE IF NOT EXISTS scout_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'Active',
  config JSONB,
  last_run_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- News articles (from News Scraper)
CREATE TABLE IF NOT EXISTS news_articles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- Legislation updates (from Legislation Monitor)
CREATE TABLE IF NOT EXISTS legislation_updates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE legislation_updates ENABLE ROW LEVEL SECURITY;

-- Service role has full access to everything
CREATE POLICY "Service role full access" ON profiles FOR ALL USING (true);
CREATE POLICY "Service role full access" ON leads FOR ALL USING (true);
CREATE POLICY "Service role full access" ON properties FOR ALL USING (true);
CREATE POLICY "Service role full access" ON saved_properties FOR ALL USING (true);
CREATE POLICY "Service role full access" ON upcoming_sales FOR ALL USING (true);
CREATE POLICY "Service role full access" ON lead_sources FOR ALL USING (true);
CREATE POLICY "Service role full access" ON lead_uploads FOR ALL USING (true);
CREATE POLICY "Service role full access" ON marketplace_leads FOR ALL USING (true);
CREATE POLICY "Service role full access" ON pipeline_stages FOR ALL USING (true);
CREATE POLICY "Service role full access" ON transactions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON invoices FOR ALL USING (true);
CREATE POLICY "Service role full access" ON partner_applications FOR ALL USING (true);
CREATE POLICY "Service role full access" ON funding_submissions FOR ALL USING (true);
CREATE POLICY "Service role full access" ON library_items FOR ALL USING (true);
CREATE POLICY "Service role full access" ON scout_agents FOR ALL USING (true);
CREATE POLICY "Service role full access" ON news_articles FOR ALL USING (true);
CREATE POLICY "Service role full access" ON legislation_updates FOR ALL USING (true);

-- Users can read their own data
CREATE POLICY "Users can read own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can read leads" ON leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read own properties" ON properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own properties" ON properties FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read own saved properties" ON saved_properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own saved properties" ON saved_properties FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read upcoming sales" ON upcoming_sales FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can read marketplace" ON marketplace_leads FOR SELECT USING (status = 'Available' OR seller_id = auth.uid() OR sold_to = auth.uid());
CREATE POLICY "Users can manage own transactions" ON transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can read library" ON library_items FOR SELECT USING (auth.role() = 'authenticated');

-- Success message
SELECT 'COMPLETE database setup successful! All tables created.' AS status;
