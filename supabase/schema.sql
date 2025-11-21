-- Win With Deeds - Tax Deed Investment Platform
-- Database Schema for Supabase

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For text search

-- =====================================================
-- USER PROFILES
-- =====================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'affiliate')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'pro', 'enterprise')),
  subscription_status TEXT DEFAULT 'inactive' CHECK (subscription_status IN ('active', 'inactive', 'cancelled', 'past_due')),
  subscription_id TEXT,
  stripe_customer_id TEXT,
  avatar_url TEXT,
  phone TEXT,
  company TEXT,
  bio TEXT,
  onboarding_completed BOOLEAN DEFAULT false,
  credits INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROPERTIES
-- =====================================================
CREATE TABLE IF NOT EXISTS properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id TEXT UNIQUE,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  county TEXT,
  parcel_id TEXT,
  property_type TEXT CHECK (property_type IN ('residential', 'commercial', 'land', 'multi_family', 'industrial')),

  -- Financial Information
  assessed_value DECIMAL(12, 2),
  market_value DECIMAL(12, 2),
  minimum_bid DECIMAL(12, 2),
  opening_bid DECIMAL(12, 2),
  tax_amount DECIMAL(12, 2),

  -- Property Details
  square_footage INTEGER,
  lot_size DECIMAL(10, 2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  year_built INTEGER,

  -- Investment Analysis
  opportunity_score DECIMAL(5, 2) DEFAULT 0,
  roi_estimate DECIMAL(5, 2),
  estimated_repair_cost DECIMAL(12, 2),
  estimated_arv DECIMAL(12, 2), -- After Repair Value

  -- Sale Information
  sale_date DATE,
  sale_time TIME,
  sale_location TEXT,
  sale_status TEXT DEFAULT 'upcoming' CHECK (sale_status IN ('upcoming', 'active', 'sold', 'cancelled', 'postponed')),

  -- Stage/Status
  stage TEXT DEFAULT 'pre_auction' CHECK (stage IN ('pre_auction', 'auction', 'post_auction', 'research', 'closed')),

  -- Additional Data
  description TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  documents JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- AI Analysis
  ai_analysis JSONB,
  risk_factors JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SAVED PROPERTIES (User Favorites)
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
  notes TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- =====================================================
-- TRANSACTIONS (Payments & Subscriptions)
-- =====================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  stripe_payment_id TEXT UNIQUE,
  stripe_session_id TEXT,

  type TEXT NOT NULL CHECK (type IN ('subscription', 'one_time', 'credit_purchase', 'refund')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),

  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'usd',

  description TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LEADS
-- =====================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Contact Information
  owner_name TEXT,
  owner_email TEXT,
  owner_phone TEXT,
  owner_address TEXT,

  -- Lead Details
  lead_type TEXT CHECK (lead_type IN ('tax_deed', 'foreclosure', 'probate', 'divorce', 'bankruptcy', 'pre_foreclosure')),
  lead_status TEXT DEFAULT 'new' CHECK (lead_status IN ('new', 'contacted', 'qualified', 'negotiating', 'closed', 'dead')),
  lead_score INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),

  -- Property Information
  property_address TEXT,
  property_city TEXT,
  property_state TEXT,
  property_zip TEXT,

  -- Financial
  estimated_value DECIMAL(12, 2),
  amount_owed DECIMAL(12, 2),
  equity_estimate DECIMAL(12, 2),

  -- Metadata
  source TEXT,
  notes TEXT,
  tags TEXT[],
  custom_fields JSONB DEFAULT '{}'::jsonb,

  -- Tracking
  last_contact_date DATE,
  next_follow_up_date DATE,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LEAD UPLOADS (User-Imported Leads)
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  file_name TEXT NOT NULL,
  file_size INTEGER,
  file_url TEXT,

  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_log JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LEAD SOURCES
-- =====================================================
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  type TEXT CHECK (type IN ('api', 'manual', 'import', 'scraper', 'partner')),
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- MARKETPLACE LEADS
-- =====================================================
CREATE TABLE IF NOT EXISTS marketplace_leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,

  seller_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  price DECIMAL(10, 2) NOT NULL,

  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'pending', 'removed')),

  purchase_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  featured BOOLEAN DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INVOICES
-- =====================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  invoice_number TEXT UNIQUE NOT NULL,

  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,

  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),

  due_date DATE,
  paid_date DATE,

  line_items JSONB DEFAULT '[]'::jsonb,
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- LIBRARY ITEMS (Resources, Courses, Tools)
-- =====================================================
CREATE TABLE IF NOT EXISTS library_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  title TEXT NOT NULL,
  description TEXT,
  content TEXT,

  type TEXT NOT NULL CHECK (type IN ('article', 'video', 'course', 'template', 'tool', 'guide')),
  category TEXT,

  thumbnail_url TEXT,
  file_url TEXT,
  video_url TEXT,

  access_level TEXT DEFAULT 'free' CHECK (access_level IN ('free', 'basic', 'pro', 'enterprise')),

  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,

  tags TEXT[],
  metadata JSONB DEFAULT '{}'::jsonb,

  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  action_url TEXT,
  action_label TEXT,

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,

  metadata JSONB DEFAULT '{}'::jsonb,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PARTNER APPLICATIONS (Affiliate Program)
-- =====================================================
CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,

  website TEXT,
  social_media JSONB DEFAULT '{}'::jsonb,

  partnership_type TEXT CHECK (partnership_type IN ('affiliate', 'reseller', 'integration', 'content')),

  audience_size INTEGER,
  audience_description TEXT,

  why_partner TEXT,
  referral_strategy TEXT,

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'under_review')),

  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,

  commission_rate DECIMAL(5, 2) DEFAULT 10.00,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PIPELINE STAGES (Deal Pipeline Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  color TEXT DEFAULT '#3B82F6',
  order_index INTEGER NOT NULL,

  is_default BOOLEAN DEFAULT false,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- SCOUT AGENTS (AI Workforce)
-- =====================================================
CREATE TABLE IF NOT EXISTS scout_agents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL,
  description TEXT,
  agent_type TEXT NOT NULL CHECK (agent_type IN ('property_finder', 'market_analyzer', 'lead_qualifier', 'research', 'custom')),

  is_active BOOLEAN DEFAULT true,

  configuration JSONB DEFAULT '{}'::jsonb,
  search_criteria JSONB DEFAULT '{}'::jsonb,

  -- Performance Metrics
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  last_run_at TIMESTAMP WITH TIME ZONE,

  schedule TEXT, -- Cron expression for automated runs

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- UPCOMING SALES (Auction Calendar)
-- =====================================================
CREATE TABLE IF NOT EXISTS upcoming_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  county TEXT NOT NULL,
  state TEXT NOT NULL,

  sale_date DATE NOT NULL,
  sale_time TIME,
  sale_location TEXT,

  sale_type TEXT CHECK (sale_type IN ('tax_deed', 'tax_lien', 'foreclosure', 'sheriff')),

  property_count INTEGER DEFAULT 0,

  registration_deadline DATE,
  deposit_required DECIMAL(10, 2),

  contact_name TEXT,
  contact_phone TEXT,
  contact_email TEXT,

  website_url TEXT,
  document_url TEXT,

  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- FUNDING SUBMISSIONS (Funding Portal)
-- =====================================================
CREATE TABLE IF NOT EXISTS funding_submissions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL NOT NULL,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Applicant Information
  applicant_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,

  -- Property Information
  property_address TEXT NOT NULL,
  property_city TEXT NOT NULL,
  property_state TEXT NOT NULL,
  property_zip TEXT NOT NULL,

  purchase_price DECIMAL(12, 2) NOT NULL,
  estimated_arv DECIMAL(12, 2),
  repair_budget DECIMAL(12, 2),

  -- Funding Details
  funding_amount_requested DECIMAL(12, 2) NOT NULL,
  funding_type TEXT CHECK (funding_type IN ('purchase', 'rehab', 'bridge', 'hard_money')),

  down_payment DECIMAL(12, 2),
  credit_score INTEGER,

  -- Documents
  documents JSONB DEFAULT '[]'::jsonb,

  -- Status
  status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'funded')),

  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_subscription_status ON profiles(subscription_status);

-- Properties
CREATE INDEX IF NOT EXISTS idx_properties_city_state ON properties(city, state);
CREATE INDEX IF NOT EXISTS idx_properties_sale_date ON properties(sale_date);
CREATE INDEX IF NOT EXISTS idx_properties_sale_status ON properties(sale_status);
CREATE INDEX IF NOT EXISTS idx_properties_opportunity_score ON properties(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_stage ON properties(stage);
CREATE INDEX IF NOT EXISTS idx_properties_property_type ON properties(property_type);

-- Saved Properties
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);

-- Transactions
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Leads
CREATE INDEX IF NOT EXISTS idx_leads_lead_status ON leads(lead_status);
CREATE INDEX IF NOT EXISTS idx_leads_lead_type ON leads(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_lead_score ON leads(lead_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Scout Agents
CREATE INDEX IF NOT EXISTS idx_scout_agents_user_id ON scout_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_scout_agents_is_active ON scout_agents(is_active);

-- Upcoming Sales
CREATE INDEX IF NOT EXISTS idx_upcoming_sales_date ON upcoming_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_upcoming_sales_state_county ON upcoming_sales(state, county);

-- Funding Submissions
CREATE INDEX IF NOT EXISTS idx_funding_submissions_user_id ON funding_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_submissions_status ON funding_submissions(status);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_uploads_updated_at BEFORE UPDATE ON lead_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_leads_updated_at BEFORE UPDATE ON marketplace_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_library_items_updated_at BEFORE UPDATE ON library_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_applications_updated_at BEFORE UPDATE ON partner_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scout_agents_updated_at BEFORE UPDATE ON scout_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_upcoming_sales_updated_at BEFORE UPDATE ON upcoming_sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funding_submissions_updated_at BEFORE UPDATE ON funding_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
