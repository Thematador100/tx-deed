-- =====================================================
-- COMPLETE TAX DEED PLATFORM DATABASE SCHEMA
-- Enterprise-Level Tax Deed Investment Platform
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "vector"; -- For AI embeddings

-- =====================================================
-- USER & AUTH TABLES
-- =====================================================

CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'Mentee Elite', 'Pro Investor', 'Syndicate')),
  phone TEXT,
  company TEXT,
  avatar_url TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'canceled', 'past_due')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'Pro Investor', 'Mentee Elite', 'Syndicate')),
  subscription_start_date TIMESTAMPTZ,
  subscription_end_date TIMESTAMPTZ,
  stripe_customer_id TEXT UNIQUE,
  api_key TEXT UNIQUE, -- For Syndicate tier API access
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_owner_id, member_id)
);

-- =====================================================
-- COUNTY & SCRAPER CONFIGURATION
-- =====================================================

CREATE TABLE IF NOT EXISTS us_counties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL, -- 'GA', 'FL', etc.
  state_name TEXT NOT NULL,
  county_name TEXT NOT NULL,
  fips_code TEXT UNIQUE,
  population INTEGER,
  median_home_value NUMERIC(12,2),
  tax_sale_frequency TEXT, -- 'monthly', 'quarterly', 'annual'
  tax_sale_type TEXT, -- 'deed', 'lien', 'hybrid'
  redemption_period_months INTEGER,
  interest_rate NUMERIC(5,2),
  bidding_type TEXT, -- 'premium', 'bid_down', 'rotational'
  registration_required BOOLEAN DEFAULT false,
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount NUMERIC(12,2),
  online_auction_available BOOLEAN DEFAULT false,
  county_website_url TEXT,
  tax_commissioner_url TEXT,
  auction_website_url TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_code, county_name)
);

CREATE TABLE IF NOT EXISTS scraper_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  county_id UUID NOT NULL REFERENCES us_counties(id) ON DELETE CASCADE,
  scraper_type TEXT NOT NULL CHECK (scraper_type IN ('selenium', 'puppeteer', 'api', 'rss', 'manual')),
  target_url TEXT NOT NULL,
  selectors JSONB NOT NULL, -- CSS selectors for data extraction
  authentication_required BOOLEAN DEFAULT false,
  auth_config JSONB, -- Credentials, tokens, etc.
  schedule_cron TEXT DEFAULT '0 2 * * *', -- Default: 2 AM daily
  enabled BOOLEAN DEFAULT true,
  proxy_required BOOLEAN DEFAULT true,
  captcha_handling TEXT CHECK (captcha_handling IN ('none', '2captcha', 'anticaptcha', 'manual')),
  rate_limit_ms INTEGER DEFAULT 1000,
  max_retries INTEGER DEFAULT 3,
  timeout_seconds INTEGER DEFAULT 60,
  custom_headers JSONB,
  cookies JSONB,
  javascript_required BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(county_id)
);

CREATE TABLE IF NOT EXISTS scraper_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  county_id UUID NOT NULL REFERENCES us_counties(id) ON DELETE CASCADE,
  scraper_config_id UUID REFERENCES scraper_configs(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'partial')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  properties_found INTEGER DEFAULT 0,
  properties_new INTEGER DEFAULT 0,
  properties_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  error_message TEXT,
  logs JSONB, -- Detailed execution logs
  execution_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraper_runs_county ON scraper_runs(county_id, created_at DESC);
CREATE INDEX idx_scraper_runs_status ON scraper_runs(status);

-- =====================================================
-- PROPERTY DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Basic Info
  parcel_id TEXT,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT NOT NULL,
  zip_code TEXT,
  county TEXT NOT NULL,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),

  -- Property Details
  property_type TEXT CHECK (property_type IN ('Single Family', 'Multi-Family', 'Condo', 'Townhouse', 'Land', 'Lot', 'Commercial', 'Industrial', 'Mobile Home')),
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  sqft INTEGER,
  lot_size TEXT,
  year_built INTEGER,
  zoning TEXT,

  -- Tax & Financial
  assessed_value NUMERIC(12,2),
  market_value NUMERIC(12,2),
  estimated_value NUMERIC(12,2),
  annual_tax_amount NUMERIC(12,2),
  delinquent_amount NUMERIC(12,2),
  delinquent_years INTEGER,

  -- Auction Info
  auction_date DATE,
  auction_time TIME,
  auction_location TEXT,
  auction_type TEXT CHECK (auction_type IN ('in-person', 'online', 'hybrid')),
  starting_bid NUMERIC(12,2),
  minimum_bid NUMERIC(12,2),
  reserve_price NUMERIC(12,2),
  winning_bid NUMERIC(12,2),

  -- Deal Analysis
  opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  roi NUMERIC(6,2),
  price NUMERIC(12,2), -- Our calculated bid price
  estimated_profit NUMERIC(12,2),
  deal_stage TEXT CHECK (deal_stage IN ('Lead', 'Researching', 'Due Diligence', 'Ready for Auction', 'Bidding', 'Acquired', 'Sold', 'Passed')),
  red_flags JSONB DEFAULT '[]',

  -- Owner Info
  owner_name TEXT,
  owner_address TEXT,
  owner_occupied BOOLEAN,

  -- Neighborhood Data
  median_income NUMERIC(12,2),
  population_density INTEGER,
  school_rating NUMERIC(3,1),
  crime_rate TEXT,
  walkability_score INTEGER,

  -- Environmental
  environmental_risks JSONB DEFAULT '[]',
  flood_zone TEXT,
  flood_insurance_required BOOLEAN,

  -- Status
  status TEXT DEFAULT 'Active' CHECK (status IN ('Active', 'Pending', 'Sold', 'Redeemed', 'Canceled', 'Expired')),
  listing_type TEXT CHECK (listing_type IN ('auction', 'marketplace', 'private')),

  -- Media
  image_url TEXT,
  images JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]',

  -- Metadata
  source TEXT, -- 'scraper', 'manual', 'api', 'upload'
  source_url TEXT,
  scraped_at TIMESTAMPTZ,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES profiles(id),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(parcel_id, county, state)
);

-- Indexes for performance
CREATE INDEX idx_properties_county_state ON properties(county, state);
CREATE INDEX idx_properties_auction_date ON properties(auction_date) WHERE auction_date IS NOT NULL;
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_opportunity_score ON properties(opportunity_score DESC);
CREATE INDEX idx_properties_location ON properties(latitude, longitude);
CREATE INDEX idx_properties_deal_stage ON properties(deal_stage);

-- =====================================================
-- SKIP TRACING & CONTACT DATA
-- =====================================================

CREATE TABLE IF NOT EXISTS skip_trace_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Person Info
  full_name TEXT,
  first_name TEXT,
  middle_name TEXT,
  last_name TEXT,
  age INTEGER,
  date_of_birth DATE,

  -- Contact Info
  phone_numbers JSONB DEFAULT '[]', -- [{number, type, valid, line_type}]
  email_addresses JSONB DEFAULT '[]',
  addresses JSONB DEFAULT '[]', -- Current and historical

  -- Additional Data
  relatives JSONB DEFAULT '[]',
  associates JSONB DEFAULT '[]',
  employment_history JSONB DEFAULT '[]',
  bankruptcies JSONB DEFAULT '[]',
  liens JSONB DEFAULT '[]',
  judgments JSONB DEFAULT '[]',

  -- Source & Quality
  data_source TEXT, -- 'BatchSkipTracing', 'TLOxp', 'BeenVerified'
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  data_quality TEXT CHECK (data_quality IN ('excellent', 'good', 'fair', 'poor')),

  -- Cost & Usage
  cost NUMERIC(6,2),
  credits_used INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_skip_trace_property ON skip_trace_results(property_id);
CREATE INDEX idx_skip_trace_user ON skip_trace_results(user_id);

-- =====================================================
-- AI SCOUT AGENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS scout_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Search Criteria
  criteria JSONB NOT NULL, -- {counties: [], propertyType: [], minBeds, minBaths, minScore, maxPrice, minROI}

  -- Notifications
  notification_method TEXT DEFAULT 'email' CHECK (notification_method IN ('email', 'sms', 'both', 'none')),
  notification_frequency TEXT DEFAULT 'immediate' CHECK (notification_frequency IN ('immediate', 'daily', 'weekly')),

  -- Performance
  properties_found INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scout_agent_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID NOT NULL REFERENCES scout_agents(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  match_score INTEGER CHECK (match_score >= 0 AND match_score <= 100),
  notified BOOLEAN DEFAULT false,
  notified_at TIMESTAMPTZ,
  viewed BOOLEAN DEFAULT false,
  viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(agent_id, property_id)
);

CREATE INDEX idx_scout_matches_agent ON scout_agent_matches(agent_id, created_at DESC);

-- =====================================================
-- OUTREACH & CAMPAIGNS
-- =====================================================

CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL CHECK (campaign_type IN ('sms', 'email', 'direct_mail', 'cold_call')),

  -- Target Audience
  target_property_ids UUID[] DEFAULT '{}',
  target_filters JSONB, -- Alternative to specific IDs

  -- Content
  subject TEXT,
  message_template TEXT NOT NULL,
  variables JSONB DEFAULT '{}', -- For personalization

  -- Sending Schedule
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'running', 'paused', 'completed', 'canceled')),
  schedule_type TEXT CHECK (schedule_type IN ('immediate', 'scheduled', 'drip')),
  send_at TIMESTAMPTZ,
  drip_config JSONB, -- {days_between: 3, max_messages: 5}

  -- Compliance
  tcpa_consent_verified BOOLEAN DEFAULT false,
  dnc_list_checked BOOLEAN DEFAULT false,
  opt_out_available BOOLEAN DEFAULT true,

  -- Performance
  total_recipients INTEGER DEFAULT 0,
  messages_sent INTEGER DEFAULT 0,
  messages_delivered INTEGER DEFAULT 0,
  messages_failed INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  opt_outs INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outreach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,

  -- Recipient
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_email TEXT,

  -- Message
  message_type TEXT NOT NULL CHECK (message_type IN ('sms', 'mms', 'email', 'voicemail')),
  subject TEXT,
  body TEXT NOT NULL,

  -- Delivery
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'delivered', 'failed', 'bounced', 'opted_out')),
  provider TEXT, -- 'Telnyx', 'SendGrid', 'Resend'
  provider_message_id TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Engagement
  opened BOOLEAN DEFAULT false,
  opened_at TIMESTAMPTZ,
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMPTZ,
  replied BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ,
  reply_text TEXT,

  -- Cost
  cost NUMERIC(6,4),

  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_outreach_messages_campaign ON outreach_messages(campaign_id);
CREATE INDEX idx_outreach_messages_status ON outreach_messages(status);

CREATE TABLE IF NOT EXISTS dnc_list (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone TEXT UNIQUE,
  email TEXT,
  reason TEXT CHECK (reason IN ('user_request', 'complaint', 'legal', 'bounce')),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MARKETPLACE & TRANSACTIONS
-- =====================================================

CREATE TABLE IF NOT EXISTS marketplace_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,

  -- Listing Details
  listing_type TEXT NOT NULL CHECK (listing_type IN ('wholesale', 'assignment', 'deed', 'note')),
  asking_price NUMERIC(12,2) NOT NULL,
  negotiable BOOLEAN DEFAULT true,
  assignment_fee NUMERIC(12,2),
  closing_date DATE,

  -- Deal Package
  title TEXT NOT NULL,
  description TEXT,
  highlights JSONB DEFAULT '[]',
  documents JSONB DEFAULT '[]', -- Title report, inspection, etc.

  -- Requirements
  buyer_requirements TEXT,
  earnest_money_required NUMERIC(12,2),
  proof_of_funds_required BOOLEAN DEFAULT true,
  nda_required BOOLEAN DEFAULT false,

  -- Visibility
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'pending', 'sold', 'canceled', 'expired')),
  visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'private', 'network')),
  featured BOOLEAN DEFAULT false,

  -- Performance
  views INTEGER DEFAULT 0,
  inquiries INTEGER DEFAULT 0,
  offers_received INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  offer_amount NUMERIC(12,2) NOT NULL,
  earnest_money NUMERIC(12,2),
  contingencies TEXT,
  proposed_closing_date DATE,
  financing_type TEXT CHECK (financing_type IN ('cash', 'conventional', 'hard_money', 'private')),

  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'withdrawn', 'expired')),
  seller_response TEXT,
  counter_offer_amount NUMERIC(12,2),

  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,

  -- Buyer Info
  buyer_type TEXT CHECK (buyer_type IN ('individual', 'llc', 'trust', 'fund', 'institution')),
  investment_strategy JSONB DEFAULT '[]', -- ['fix_flip', 'buy_hold', 'wholesale', 'development']

  -- Preferences
  preferred_property_types JSONB DEFAULT '[]',
  preferred_states JSONB DEFAULT '[]',
  preferred_counties JSONB DEFAULT '[]',
  min_roi NUMERIC(6,2),
  max_price NUMERIC(12,2),
  min_price NUMERIC(12,2),

  -- Experience
  deals_completed INTEGER DEFAULT 0,
  portfolio_size INTEGER DEFAULT 0,
  total_invested NUMERIC(14,2),

  -- Funding
  proof_of_funds_verified BOOLEAN DEFAULT false,
  proof_of_funds_amount NUMERIC(14,2),
  funding_source TEXT CHECK (funding_source IN ('cash', 'line_of_credit', 'hard_money', 'private_lender', 'syndication')),

  -- AI Matching
  embedding vector(1536), -- OpenAI embedding for semantic matching

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TRANSACTIONS & PAYMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('subscription', 'credit_purchase', 'skip_trace', 'outreach_credit', 'marketplace_fee', 'commission')),

  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),

  product_name TEXT,
  product_id TEXT,
  quantity INTEGER DEFAULT 1,

  -- Payment Info
  payment_provider TEXT CHECK (payment_provider IN ('stripe', 'paypal', 'bank_transfer', 'crypto')),
  payment_intent_id TEXT,
  payment_method TEXT,

  -- Metadata
  metadata JSONB,
  invoice_url TEXT,
  receipt_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,

  invoice_number TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  tax NUMERIC(12,2) DEFAULT 0,
  total NUMERIC(12,2) NOT NULL,

  status TEXT DEFAULT 'pending' CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'canceled')),
  due_date DATE,
  paid_at TIMESTAMPTZ,

  pdf_url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_credits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  skip_trace_credits INTEGER DEFAULT 0,
  outreach_credits INTEGER DEFAULT 0,
  ai_analysis_credits INTEGER DEFAULT 0,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- SAVED & PIPELINE
-- =====================================================

CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  pipeline_stage TEXT CHECK (pipeline_stage IN ('Researching', 'Due Diligence', 'Ready for Auction', 'Acquired', 'Sold')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

CREATE INDEX idx_saved_properties_user ON saved_properties(user_id);

-- =====================================================
-- EDUCATION & KNOWLEDGE BASE
-- =====================================================

CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('video', 'pdf', 'article', 'guide', 'template', 'webinar')),
  category TEXT CHECK (category IN ('tax_deeds', 'tax_liens', 'state_laws', 'due_diligence', 'bidding', 'redemption', 'case_studies')),

  url TEXT,
  file_url TEXT,
  thumbnail_url TEXT,
  duration_minutes INTEGER,

  -- Content
  content TEXT, -- Full text for search
  summary TEXT,
  tags JSONB DEFAULT '[]',

  -- Access Control
  access_level TEXT DEFAULT 'all' CHECK (access_level IN ('all', 'Pro Investor', 'Mentee Elite', 'Syndicate')),

  -- AI
  embedding vector(1536), -- For semantic search

  -- Stats
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_library_category ON library_items(category);
CREATE INDEX idx_library_access ON library_items(access_level);

CREATE TABLE IF NOT EXISTS state_tax_laws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT UNIQUE NOT NULL,
  state_name TEXT NOT NULL,

  -- Tax Sale Type
  sale_type TEXT NOT NULL CHECK (sale_type IN ('deed', 'lien', 'hybrid')),

  -- Redemption
  redemption_period_months INTEGER,
  redemption_interest_rate NUMERIC(5,2),
  redemption_penalty_rate NUMERIC(5,2),
  redemption_allowed BOOLEAN DEFAULT true,

  -- Bidding
  bidding_type TEXT CHECK (bidding_type IN ('premium', 'bid_down_interest', 'rotational', 'lottery')),
  minimum_bid TEXT,

  -- Rights & Process
  right_of_redemption TEXT,
  surplus_funds_process TEXT,
  quiet_title_required BOOLEAN,
  typical_timeline_days INTEGER,

  -- Documentation
  statutes JSONB, -- {title: 'Code Section', url: '...'}
  required_forms JSONB,

  -- Full Guide
  complete_guide TEXT,
  last_updated DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- AFFILIATE PROGRAM
-- =====================================================

CREATE TABLE IF NOT EXISTS partner_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  website TEXT,
  company TEXT,

  platform TEXT, -- 'youtube', 'blog', 'podcast', 'instagram'
  audience_size INTEGER,
  niche TEXT,

  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),

  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  affiliate_code TEXT UNIQUE NOT NULL,
  commission_rate NUMERIC(4,2) DEFAULT 20.00, -- 20%
  payment_method TEXT CHECK (payment_method IN ('paypal', 'stripe', 'bank_transfer')),
  payment_details JSONB,

  -- Stats
  total_referrals INTEGER DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  total_earned NUMERIC(12,2) DEFAULT 0,
  total_paid NUMERIC(12,2) DEFAULT 0,
  balance NUMERIC(12,2) DEFAULT 0,

  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended', 'terminated')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Tracking
  referral_code TEXT NOT NULL,
  landing_page TEXT,
  ip_address TEXT,
  user_agent TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,

  -- Conversion
  converted BOOLEAN DEFAULT false,
  converted_at TIMESTAMPTZ,
  commission_amount NUMERIC(12,2),
  commission_paid BOOLEAN DEFAULT false,
  commission_paid_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LEAD UPLOADS & DATA SOURCES
-- =====================================================

CREATE TABLE IF NOT EXISTS lead_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  file_name TEXT NOT NULL,
  file_format TEXT CHECK (file_format IN ('csv', 'xlsx', 'pdf', 'txt')),
  file_url TEXT,
  file_size_bytes INTEGER,

  status TEXT DEFAULT 'processing' CHECK (status IN ('uploaded', 'processing', 'completed', 'error')),
  leads_found INTEGER DEFAULT 0,
  leads_imported INTEGER DEFAULT 0,
  leads_duplicates INTEGER DEFAULT 0,

  source_type TEXT, -- 'regrid', 'batchleads', 'propwire', 'manual'

  error_message TEXT,
  processing_logs JSONB,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- =====================================================
-- ANALYTICS & LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS user_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  activity_type TEXT NOT NULL, -- 'login', 'property_view', 'search', 'export', etc.
  entity_type TEXT, -- 'property', 'campaign', 'listing'
  entity_id UUID,

  metadata JSONB,
  ip_address TEXT,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_activity_user ON user_activity(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  service_name TEXT NOT NULL, -- 'Smarty', 'OpenAI', 'Telnyx', 'BatchSkipTracing'
  api_key_encrypted TEXT NOT NULL,
  api_secret_encrypted TEXT,

  is_global BOOLEAN DEFAULT false, -- System-wide vs user-specific

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- VIEWS & MATERIALIZED VIEWS
-- =====================================================

-- Active upcoming auctions
CREATE VIEW upcoming_auctions AS
SELECT
  p.*,
  c.county_name,
  c.state_name,
  c.auction_website_url
FROM properties p
JOIN us_counties c ON p.county = c.county_name AND p.state = c.state_code
WHERE p.auction_date >= CURRENT_DATE
  AND p.status = 'Active'
ORDER BY p.auction_date ASC;

-- High opportunity properties
CREATE VIEW high_opportunity_deals AS
SELECT *
FROM properties
WHERE opportunity_score >= 80
  AND status = 'Active'
  AND auction_date >= CURRENT_DATE
ORDER BY opportunity_score DESC, roi DESC;

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scout_agents_updated_at BEFORE UPDATE ON scout_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_marketplace_listings_updated_at BEFORE UPDATE ON marketplace_listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_buyer_profiles_updated_at BEFORE UPDATE ON buyer_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate opportunity score automatically
CREATE OR REPLACE FUNCTION calculate_opportunity_score(
  p_roi NUMERIC,
  p_delinquent_years INTEGER,
  p_estimated_value NUMERIC,
  p_price NUMERIC
)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 50;
  equity_percent NUMERIC;
BEGIN
  -- ROI component (0-40 points)
  IF p_roi >= 100 THEN score := score + 40;
  ELSIF p_roi >= 50 THEN score := score + 30;
  ELSIF p_roi >= 25 THEN score := score + 20;
  ELSIF p_roi >= 10 THEN score := score + 10;
  END IF;

  -- Equity component (0-30 points)
  IF p_estimated_value > 0 AND p_price > 0 THEN
    equity_percent := ((p_estimated_value - p_price) / p_estimated_value) * 100;
    IF equity_percent >= 70 THEN score := score + 30;
    ELSIF equity_percent >= 50 THEN score := score + 20;
    ELSIF equity_percent >= 30 THEN score := score + 10;
    END IF;
  END IF;

  -- Delinquency component (0-20 points)
  IF p_delinquent_years >= 3 THEN score := score + 20;
  ELSIF p_delinquent_years >= 2 THEN score := score + 10;
  END IF;

  -- Cap at 100
  IF score > 100 THEN score := 100; END IF;
  IF score < 0 THEN score := 0; END IF;

  RETURN score;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own scout agents" ON scout_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own scout agents" ON scout_agents FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own saved properties" ON saved_properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own saved properties" ON saved_properties FOR ALL USING (auth.uid() = user_id);

-- Properties are publicly readable
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties are viewable by all authenticated users" ON properties FOR SELECT TO authenticated USING (true);

-- Admins can do everything
CREATE POLICY "Admins can do everything on profiles" ON profiles FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
);

-- =====================================================
-- SEED DATA - US COUNTIES (Sample - Top 50)
-- =====================================================

INSERT INTO us_counties (state_code, state_name, county_name, fips_code, population, tax_sale_type, redemption_period_months, online_auction_available)
VALUES
('GA', 'Georgia', 'Fulton', '13121', 1063937, 'deed', 12, true),
('GA', 'Georgia', 'Gwinnett', '13135', 957062, 'deed', 12, true),
('GA', 'Georgia', 'Cobb', '13067', 766149, 'deed', 12, true),
('GA', 'Georgia', 'DeKalb', '13089', 764382, 'deed', 12, true),
('FL', 'Florida', 'Miami-Dade', '12086', 2716940, 'lien', 24, true),
('FL', 'Florida', 'Broward', '12011', 1952778, 'lien', 24, true),
('FL', 'Florida', 'Palm Beach', '12099', 1496770, 'lien', 24, true),
('FL', 'Florida', 'Hillsborough', '12057', 1459762, 'lien', 24, true),
('TX', 'Texas', 'Harris', '48201', 4731145, 'deed', 6, true),
('TX', 'Texas', 'Dallas', '48113', 2613539, 'deed', 6, true),
('TX', 'Texas', 'Tarrant', '48439', 2110640, 'deed', 6, true),
('TX', 'Texas', 'Bexar', '48029', 2009324, 'deed', 6, true),
('AZ', 'Arizona', 'Maricopa', '04013', 4485414, 'deed', 12, true),
('AZ', 'Arizona', 'Pima', '04019', 1043433, 'deed', 12, true),
('CA', 'California', 'Los Angeles', '06037', 10014009, 'deed', 12, true),
('CA', 'California', 'San Diego', '06073', 3286069, 'deed', 12, true),
('CA', 'California', 'Orange', '06059', 3167809, 'deed', 12, true),
('NC', 'North Carolina', 'Mecklenburg', '37119', 1110356, 'deed', 12, true),
('NC', 'North Carolina', 'Wake', '37183', 1129410, 'deed', 12, true),
('OH', 'Ohio', 'Cuyahoga', '39035', 1264817, 'lien', 12, true)
ON CONFLICT (state_code, county_name) DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE properties IS 'Complete property data from scrapers and manual input';
COMMENT ON TABLE us_counties IS 'Configuration for all US counties - supports 3000+ counties';
COMMENT ON TABLE scraper_configs IS 'Scraper configuration for each county - adaptable selectors';
COMMENT ON TABLE skip_trace_results IS 'Owner contact information from skip tracing APIs';
COMMENT ON TABLE scout_agents IS 'AI agents that automatically find matching properties for users';
COMMENT ON TABLE outreach_campaigns IS 'SMS/Email campaigns with compliance tracking';
COMMENT ON TABLE marketplace_listings IS 'Properties listed for sale by platform users';
COMMENT ON TABLE buyer_profiles IS 'Buyer preferences with vector embeddings for AI matching';
COMMENT ON TABLE state_tax_laws IS 'Complete tax deed/lien law database for all 50 states';

-- =====================================================
-- COMPLETE
-- =====================================================
