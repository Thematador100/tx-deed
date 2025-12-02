-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'Mentee Elite')),
    membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'basic', 'pro', 'elite')),
    stripe_customer_id TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    county TEXT,
    parcel_id TEXT,
    owner TEXT,
    property_type TEXT,
    bedrooms INTEGER,
    bathrooms NUMERIC(3,1),
    sqft INTEGER,
    lot_size TEXT,
    year_built INTEGER,
    price NUMERIC(12,2),
    estimated_value NUMERIC(12,2),
    starting_bid NUMERIC(12,2),
    auction_date DATE,
    status TEXT DEFAULT 'active',
    listing_type TEXT CHECK (listing_type IN ('auction', 'marketplace', 'tax_deed', 'redeemable')),
    description TEXT,
    image_url TEXT,
    image_alt TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geolocation GEOGRAPHY(POINT, 4326),
    roi NUMERIC(10,2),
    opportunity_score INTEGER,
    deal_stage TEXT,
    red_flags TEXT[],
    median_income NUMERIC(12,2),
    population_density INTEGER,
    school_rating NUMERIC(3,1),
    environmental_risks TEXT[],
    data_source TEXT, -- Which scraper/source this came from
    source_url TEXT, -- Original listing URL
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tax_delinquent_leads table
CREATE TABLE IF NOT EXISTS public.tax_delinquent_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parcel_id TEXT NOT NULL,
    owner TEXT,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    county TEXT,
    delinquent_amount NUMERIC(12,2),
    starting_bid NUMERIC(12,2),
    auction_date DATE,
    status TEXT DEFAULT 'Initial Notice',
    property_type TEXT,
    image_url TEXT,
    image_alt TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geolocation GEOGRAPHY(POINT, 4326),
    data_source TEXT,
    source_url TEXT,
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create redeemable_deeds table
CREATE TABLE IF NOT EXISTS public.redeemable_deeds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT NOT NULL,
    county TEXT,
    original_owner TEXT,
    new_owner TEXT,
    sale_price NUMERIC(12,2),
    estimated_value NUMERIC(12,2),
    redemption_date DATE,
    redemption_period_months INTEGER,
    interest_rate NUMERIC(5,2),
    status TEXT DEFAULT 'Redeemable',
    data_source TEXT,
    source_url TEXT,
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scraper_configs table to store county-specific scraper configurations
CREATE TABLE IF NOT EXISTS public.scraper_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county TEXT NOT NULL,
    state TEXT NOT NULL,
    scraper_type TEXT NOT NULL CHECK (scraper_type IN ('tax_deed', 'tax_delinquent', 'redeemable')),
    website_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    scraper_method TEXT, -- 'web_scrape', 'api', 'manual'
    selector_config JSONB, -- CSS selectors or XPath for scraping
    api_config JSONB, -- API endpoints and authentication
    last_scraped_at TIMESTAMPTZ,
    scrape_frequency_hours INTEGER DEFAULT 24,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(county, state, scraper_type)
);

-- Create scraper_logs table
CREATE TABLE IF NOT EXISTS public.scraper_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scraper_config_id UUID REFERENCES public.scraper_configs(id),
    county TEXT,
    state TEXT,
    scraper_type TEXT,
    status TEXT CHECK (status IN ('success', 'failed', 'partial')),
    records_found INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_saved_properties table
CREATE TABLE IF NOT EXISTS public.user_saved_properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Create leads table (user-uploaded or system-generated leads)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    lead_type TEXT,
    status TEXT DEFAULT 'new',
    source TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(state, county, city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_auction_date ON public.properties(auction_date);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_geolocation ON public.properties USING GIST(geolocation);

CREATE INDEX IF NOT EXISTS idx_tax_delinquent_location ON public.tax_delinquent_leads(state, county, city);
CREATE INDEX IF NOT EXISTS idx_tax_delinquent_status ON public.tax_delinquent_leads(status);
CREATE INDEX IF NOT EXISTS idx_tax_delinquent_geolocation ON public.tax_delinquent_leads USING GIST(geolocation);

CREATE INDEX IF NOT EXISTS idx_redeemable_state ON public.redeemable_deeds(state);
CREATE INDEX IF NOT EXISTS idx_redeemable_redemption_date ON public.redeemable_deeds(redemption_date);

CREATE INDEX IF NOT EXISTS idx_scraper_configs_location ON public.scraper_configs(state, county, scraper_type);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_status ON public.scraper_logs(status, created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_properties
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tax_delinquent
    BEFORE UPDATE ON public.tax_delinquent_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_redeemable
    BEFORE UPDATE ON public.redeemable_deeds
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_delinquent_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeemable_deeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Properties policies (viewable by all authenticated users)
CREATE POLICY "Authenticated users can view properties"
    ON public.properties FOR SELECT
    TO authenticated
    USING (true);

-- Tax delinquent leads policies
CREATE POLICY "Authenticated users can view tax delinquent leads"
    ON public.tax_delinquent_leads FOR SELECT
    TO authenticated
    USING (true);

-- Redeemable deeds policies
CREATE POLICY "Authenticated users can view redeemable deeds"
    ON public.redeemable_deeds FOR SELECT
    TO authenticated
    USING (true);

-- User saved properties policies
CREATE POLICY "Users can view their own saved properties"
    ON public.user_saved_properties FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved properties"
    ON public.user_saved_properties FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved properties"
    ON public.user_saved_properties FOR DELETE
    USING (auth.uid() = user_id);

-- Leads policies
CREATE POLICY "Users can view their own leads"
    ON public.leads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
    ON public.leads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
    ON public.leads FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
    ON public.leads FOR DELETE
    USING (auth.uid() = user_id);

-- Admin policies (for scraper_configs and scraper_logs)
ALTER TABLE public.scraper_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage scraper configs"
    ON public.scraper_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can view scraper logs"
    ON public.scraper_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
-- Migration: Add all missing tables for complete functionality
-- Created: 2025-01-26

-- 1. TRANSACTIONS TABLE - Payment and subscription tracking
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  product_type TEXT CHECK (product_type IN ('subscription', 'lead_purchase', 'service', 'training')),
  product_name TEXT,
  product_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- 2. MARKETPLACE LEADS TABLE - Lead marketplace functionality
CREATE TABLE IF NOT EXISTS marketplace_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  county TEXT,
  state TEXT,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  property_type TEXT,
  estimated_value NUMERIC(12,2),
  roi_potential NUMERIC(5,2),
  is_certified BOOLEAN DEFAULT FALSE,
  certification_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'removed')),
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,
  images JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  sold_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketplace_leads_seller_id ON marketplace_leads(seller_id);
CREATE INDEX idx_marketplace_leads_status ON marketplace_leads(status);
CREATE INDEX idx_marketplace_leads_state ON marketplace_leads(state);
CREATE INDEX idx_marketplace_leads_county ON marketplace_leads(county);
CREATE INDEX idx_marketplace_leads_price ON marketplace_leads(price);
CREATE INDEX idx_marketplace_leads_created_at ON marketplace_leads(created_at DESC);

-- 3. LIBRARY ITEMS TABLE - Training and educational content
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('video', 'article', 'pdf', 'course', 'webinar', 'template', 'checklist')),
  category TEXT CHECK (category IN ('getting_started', 'research', 'bidding', 'due_diligence', 'redemption', 'exit_strategies', 'legal', 'marketing', 'advanced')),
  content_url TEXT,
  thumbnail_url TEXT,
  file_path TEXT,
  file_size INTEGER,
  duration_minutes INTEGER,
  access_level TEXT DEFAULT 'free' CHECK (access_level IN ('free', 'basic', 'pro', 'elite')),
  author TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_library_items_type ON library_items(item_type);
CREATE INDEX idx_library_items_category ON library_items(category);
CREATE INDEX idx_library_items_access_level ON library_items(access_level);
CREATE INDEX idx_library_items_created_at ON library_items(created_at DESC);

-- 4. AFFILIATES TABLE - Affiliate program management
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  paid_earnings NUMERIC(10,2) DEFAULT 0,
  pending_earnings NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}',
  notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON affiliates(status);

-- 5. AFFILIATE REFERRALS TABLE - Track individual referrals
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  commission_amount NUMERIC(10,2),
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);

-- 6. CONVERSATIONS TABLE - User-to-user messaging
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id)
);

CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- 7. MESSAGES TABLE - Individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'property_share')),
  attachment_url TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_read ON messages(read);

-- 8. NOTIFICATIONS TABLE - System notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'new_property', 'new_message', 'price_drop', 'scout_alert', 'system')),
  icon TEXT,
  action_url TEXT,
  action_label TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 9. USER PREFERENCES TABLE - User notification and app preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  notify_new_properties BOOLEAN DEFAULT TRUE,
  notify_price_drops BOOLEAN DEFAULT TRUE,
  notify_messages BOOLEAN DEFAULT TRUE,
  notify_scout_alerts BOOLEAN DEFAULT TRUE,
  notify_marketing BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  default_search_radius INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- 10. DOCUMENT LIBRARY TABLE - OCR processed documents
CREATE TABLE IF NOT EXISTS document_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT,
  ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_text TEXT,
  extracted_data JSONB DEFAULT '{}',
  property_data JSONB DEFAULT '{}',
  page_count INTEGER,
  confidence_score NUMERIC(5,2),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_library_user_id ON document_library(user_id);
CREATE INDEX idx_document_library_ocr_status ON document_library(ocr_status);

-- 11. STATE LAWS TABLE - State-specific tax deed/lien laws
CREATE TABLE IF NOT EXISTS state_laws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,
  deed_type TEXT NOT NULL CHECK (deed_type IN ('tax_deed', 'tax_lien', 'hybrid', 'redeemable_deed')),
  redemption_period_months INTEGER,
  interest_rate NUMERIC(5,2),
  auction_type TEXT CHECK (auction_type IN ('online', 'in_person', 'hybrid')),
  minimum_bid TEXT,
  surplus_funds_available BOOLEAN DEFAULT FALSE,
  quiet_title_required BOOLEAN DEFAULT FALSE,
  owner_occupied_protections BOOLEAN DEFAULT FALSE,
  statute_references TEXT[],
  key_deadlines JSONB DEFAULT '{}',
  investor_notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_state_laws_state_code ON state_laws(state_code);
CREATE INDEX idx_state_laws_deed_type ON state_laws(deed_type);

-- 12. COUNTY INFO TABLE - County-specific information
CREATE TABLE IF NOT EXISTS county_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL,
  county_name TEXT NOT NULL,
  population INTEGER,
  tax_collector_website TEXT,
  auction_website TEXT,
  auction_schedule TEXT,
  filing_requirements TEXT,
  local_rules TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  office_address TEXT,
  office_hours TEXT,
  average_properties_per_auction INTEGER,
  last_auction_date DATE,
  next_auction_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_code, county_name)
);

CREATE INDEX idx_county_info_state ON county_info(state_code);
CREATE INDEX idx_county_info_name ON county_info(county_name);

-- Add RLS policies for all tables

-- Transactions RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Marketplace Leads RLS
ALTER TABLE marketplace_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active marketplace leads"
  ON marketplace_leads FOR SELECT
  USING (status = 'active');

CREATE POLICY "Sellers can manage own leads"
  ON marketplace_leads FOR ALL
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all marketplace leads"
  ON marketplace_leads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Library Items RLS
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view library items based on access level"
  ON library_items FOR SELECT
  USING (
    access_level = 'free' OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (
        (access_level = 'basic' AND membership_tier IN ('basic', 'pro', 'elite')) OR
        (access_level = 'pro' AND membership_tier IN ('pro', 'elite')) OR
        (access_level = 'elite' AND membership_tier = 'elite') OR
        role = 'admin'
      )
    )
  );

CREATE POLICY "Admins can manage library items"
  ON library_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Affiliates RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate account"
  ON affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own affiliate account"
  ON affiliates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate account"
  ON affiliates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliates"
  ON affiliates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Affiliate Referrals RLS
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own referrals"
  ON affiliate_referrals FOR SELECT
  USING (EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND user_id = auth.uid()));

CREATE POLICY "Admins can manage all referrals"
  ON affiliate_referrals FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Conversations RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() IN (participant_1_id, participant_2_id));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IN (participant_1_id, participant_2_id));

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth.uid() IN (participant_1_id, participant_2_id)
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth.uid() IN (participant_1_id, participant_2_id)
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- User Preferences RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Document Library RLS
ALTER TABLE document_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON document_library FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
  ON document_library FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- State Laws RLS (Public read access)
ALTER TABLE state_laws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view state laws"
  ON state_laws FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage state laws"
  ON state_laws FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- County Info RLS (Public read access)
ALTER TABLE county_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view county info"
  ON county_info FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage county info"
  ON county_info FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_leads_updated_at BEFORE UPDATE ON marketplace_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_items_updated_at BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_county_info_updated_at BEFORE UPDATE ON county_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update conversation last_message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_id = NEW.id,
      last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Create function to auto-create user preferences on profile creation
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_preferences_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();
-- Buyer Profiles Table
CREATE TABLE IF NOT EXISTS buyer_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company_name TEXT,
  preferred_counties TEXT[] DEFAULT '{}',
  preferred_property_types TEXT[] DEFAULT '{}',
  min_price NUMERIC,
  max_price NUMERIC,
  min_roi NUMERIC,
  avg_purchase_price NUMERIC,
  total_purchases INTEGER DEFAULT 0,
  last_purchase_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyer Purchases Table (historical transactions)
CREATE TABLE IF NOT EXISTS buyer_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  purchase_price NUMERIC,
  purchase_date TIMESTAMPTZ,
  source TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Buyer Match History (track when we've matched buyers to properties)
CREATE TABLE IF NOT EXISTS buyer_match_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  buyer_id UUID REFERENCES buyer_profiles(id) ON DELETE CASCADE,
  match_score NUMERIC,
  contacted BOOLEAN DEFAULT false,
  response_status TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_buyer_profiles_active ON buyer_profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_buyer_purchases_buyer ON buyer_purchases(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyer_purchases_property ON buyer_purchases(property_id);
CREATE INDEX IF NOT EXISTS idx_buyer_match_history_property ON buyer_match_history(property_id);
CREATE INDEX IF NOT EXISTS idx_buyer_match_history_buyer ON buyer_match_history(buyer_id);

-- RLS Policies
ALTER TABLE buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE buyer_match_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all buyer profiles
CREATE POLICY "Authenticated users can view buyer profiles"
  ON buyer_profiles FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can modify buyer profiles
CREATE POLICY "Admins can manage buyer profiles"
  ON buyer_profiles FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Same for buyer_purchases
CREATE POLICY "Authenticated users can view buyer purchases"
  ON buyer_purchases FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage buyer purchases"
  ON buyer_purchases FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can view and create their own match history
CREATE POLICY "Users can view buyer match history"
  ON buyer_match_history FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create buyer match history"
  ON buyer_match_history FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_buyer_profiles_updated_at
  BEFORE UPDATE ON buyer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_purchases_updated_at
  BEFORE UPDATE ON buyer_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_buyer_match_history_updated_at
  BEFORE UPDATE ON buyer_match_history
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample buyer data for testing
INSERT INTO buyer_profiles (name, email, phone, company_name, preferred_counties, preferred_property_types, min_price, max_price, min_roi, avg_purchase_price, total_purchases, last_purchase_date, is_active) VALUES
('John Smith', 'john.smith@realestateinvestors.com', '555-0101', 'Smith Capital Partners', ARRAY['Harris', 'Fort Bend', 'Montgomery'], ARRAY['Single Family', 'Townhouse'], 50000, 300000, 30, 125000, 47, NOW() - INTERVAL '15 days', true),
('Maria Rodriguez', 'maria@fliphousepros.com', '555-0102', 'FlipHouse Pros', ARRAY['Harris', 'Galveston'], ARRAY['Single Family', 'Condo'], 75000, 250000, 40, 150000, 32, NOW() - INTERVAL '8 days', true),
('David Chen', 'david@chenproperties.com', '555-0103', 'Chen Properties LLC', ARRAY['Dallas', 'Collin', 'Denton'], ARRAY['Single Family', 'Multi-Family'], 100000, 500000, 25, 275000, 63, NOW() - INTERVAL '22 days', true),
('Sarah Johnson', 'sarah@texaslandbuyers.com', '555-0104', 'Texas Land Buyers', ARRAY['Travis', 'Williamson'], ARRAY['Single Family', 'Vacant Land'], 60000, 350000, 35, 180000, 28, NOW() - INTERVAL '45 days', true),
('Michael Brown', 'michael@brownrealty.com', '555-0105', 'Brown Realty Group', ARRAY['Bexar', 'Comal'], ARRAY['Single Family', 'Townhouse', 'Condo'], 80000, 400000, 30, 195000, 51, NOW() - INTERVAL '12 days', true),
('Jennifer White', 'jennifer@whiteinvestments.com', '555-0106', 'White Investments', ARRAY['Tarrant', 'Johnson'], ARRAY['Single Family', 'Multi-Family'], 90000, 450000, 28, 220000, 38, NOW() - INTERVAL '6 days', true),
('Robert Garcia', 'robert@garciacapital.com', '555-0107', 'Garcia Capital', ARRAY['Harris', 'Fort Bend'], ARRAY['Single Family', 'Townhouse'], 70000, 320000, 32, 165000, 42, NOW() - INTERVAL '19 days', true),
('Lisa Martinez', 'lisa@starpropertysolutions.com', '555-0108', 'Star Property Solutions', ARRAY['El Paso', 'Hudspeth'], ARRAY['Single Family', 'Vacant Land'], 55000, 280000, 38, 140000, 25, NOW() - INTERVAL '31 days', true),
('James Wilson', 'james@wilsonrealestate.com', '555-0109', 'Wilson Real Estate Fund', ARRAY['Dallas', 'Rockwall'], ARRAY['Single Family', 'Condo'], 85000, 380000, 27, 205000, 56, NOW() - INTERVAL '9 days', true),
('Amanda Taylor', 'amanda@taylorinvestments.com', '555-0110', 'Taylor Investments', ARRAY['Travis', 'Hays'], ARRAY['Single Family', 'Multi-Family'], 95000, 420000, 31, 235000, 44, NOW() - INTERVAL '14 days', true),
('Christopher Lee', 'chris@leeproperties.com', '555-0111', 'Lee Properties', ARRAY['Harris', 'Brazoria'], ARRAY['Single Family', 'Townhouse'], 65000, 310000, 33, 155000, 36, NOW() - INTERVAL '26 days', true),
('Emily Anderson', 'emily@andersonhomes.com', '555-0112', 'Anderson Homes', ARRAY['Collin', 'Denton'], ARRAY['Single Family'], 100000, 450000, 29, 245000, 48, NOW() - INTERVAL '7 days', true),
('Daniel Thomas', 'daniel@thomascapital.com', '555-0113', 'Thomas Capital Group', ARRAY['Fort Bend', 'Brazoria'], ARRAY['Single Family', 'Multi-Family'], 75000, 340000, 34, 175000, 40, NOW() - INTERVAL '18 days', true),
('Ashley Jackson', 'ashley@jacksonrealty.com', '555-0114', 'Jackson Realty', ARRAY['Williamson', 'Bell'], ARRAY['Single Family', 'Townhouse'], 70000, 330000, 36, 170000, 33, NOW() - INTERVAL '11 days', true),
('Matthew Harris', 'matthew@harrisventures.com', '555-0115', 'Harris Ventures', ARRAY['Bexar', 'Guadalupe'], ARRAY['Single Family', 'Condo'], 80000, 390000, 30, 190000, 52, NOW() - INTERVAL '23 days', true),
('Jessica Martin', 'jessica@martinholdings.com', '555-0116', 'Martin Holdings', ARRAY['Dallas', 'Ellis'], ARRAY['Single Family', 'Vacant Land'], 60000, 300000, 37, 145000, 29, NOW() - INTERVAL '38 days', true),
('Ryan Thompson', 'ryan@thompsonrealty.com', '555-0117', 'Thompson Realty Partners', ARRAY['Tarrant', 'Parker'], ARRAY['Single Family', 'Townhouse'], 85000, 410000, 28, 210000, 55, NOW() - INTERVAL '5 days', true),
('Michelle Garcia', 'michelle@garciaproperties.com', '555-0118', 'Garcia Properties', ARRAY['Harris', 'Montgomery'], ARRAY['Single Family', 'Multi-Family'], 90000, 440000, 26, 225000, 49, NOW() - INTERVAL '13 days', true),
('Kevin Rodriguez', 'kevin@rodriguezinvestments.com', '555-0119', 'Rodriguez Investments', ARRAY['Travis', 'Bastrop'], ARRAY['Single Family', 'Vacant Land'], 65000, 350000, 35, 160000, 37, NOW() - INTERVAL '27 days', true),
('Nicole Davis', 'nicole@davisrealty.com', '555-0120', 'Davis Realty Group', ARRAY['Collin', 'Hunt'], ARRAY['Single Family', 'Townhouse'], 95000, 430000, 29, 230000, 45, NOW() - INTERVAL '16 days', true)
ON CONFLICT DO NOTHING;
-- Property Transactions Table (for title history)
CREATE TABLE IF NOT EXISTS property_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  county TEXT,
  parcel_id TEXT,
  transaction_date DATE,
  transaction_type TEXT,
  seller_name TEXT,
  buyer_name TEXT,
  sale_price NUMERIC,
  document_number TEXT,
  recording_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lien Records Table
CREATE TABLE IF NOT EXISTS lien_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  county TEXT,
  parcel_id TEXT,
  lien_type TEXT NOT NULL,
  amount NUMERIC,
  filed_date DATE,
  creditor_name TEXT,
  status TEXT DEFAULT 'active',
  release_date DATE,
  document_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Court Records Table
CREATE TABLE IF NOT EXISTS court_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  county TEXT,
  case_number TEXT,
  case_type TEXT,
  filed_date DATE,
  status TEXT,
  parties TEXT[],
  summary TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deal Dossiers Table (saved reports)
CREATE TABLE IF NOT EXISTS deal_dossiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  city TEXT,
  state TEXT,
  county TEXT,
  parcel_id TEXT,
  title_status TEXT,
  overall_score NUMERIC,
  liens_count INTEGER DEFAULT 0,
  court_records_count INTEGER DEFAULT 0,
  red_flags TEXT[] DEFAULT '{}',
  recommendation TEXT,
  dossier_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_property_transactions_address ON property_transactions(address);
CREATE INDEX IF NOT EXISTS idx_lien_records_address ON lien_records(address);
CREATE INDEX IF NOT EXISTS idx_lien_records_status ON lien_records(status);
CREATE INDEX IF NOT EXISTS idx_court_records_address ON court_records(property_address);
CREATE INDEX IF NOT EXISTS idx_deal_dossiers_address ON deal_dossiers(address);
CREATE INDEX IF NOT EXISTS idx_deal_dossiers_user ON deal_dossiers(user_id);

-- RLS Policies
ALTER TABLE property_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE lien_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE court_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE deal_dossiers ENABLE ROW LEVEL SECURITY;

-- Anyone can read public records
CREATE POLICY "Public can view property transactions"
  ON property_transactions FOR SELECT
  USING (true);

CREATE POLICY "Public can view lien records"
  ON lien_records FOR SELECT
  USING (true);

CREATE POLICY "Public can view court records"
  ON court_records FOR SELECT
  USING (true);

-- Users can view their own dossiers
CREATE POLICY "Users can view own dossiers"
  ON deal_dossiers FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create dossiers"
  ON deal_dossiers FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- Admins can manage all records
CREATE POLICY "Admins can manage property transactions"
  ON property_transactions FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage lien records"
  ON lien_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Admins can manage court records"
  ON court_records FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Insert sample data for testing
INSERT INTO property_transactions (address, city, state, county, transaction_date, transaction_type, seller_name, buyer_name, sale_price, document_number) VALUES
('1234 Main St', 'Houston', 'TX', 'Harris', '2024-03-15', 'Warranty Deed', 'John Doe', 'Jane Smith', 250000, 'DOC2024-123456'),
('5678 Oak Ave', 'Dallas', 'TX', 'Dallas', '2024-01-20', 'Tax Deed', 'Dallas County Tax Assessor', 'Mike Johnson', 85000, 'TD2024-789'),
('910 Elm St', 'Austin', 'TX', 'Travis', '2023-11-10', 'Quitclaim Deed', 'Sarah Williams', 'Bob Brown', 195000, 'DOC2023-456789')
ON CONFLICT DO NOTHING;

INSERT INTO lien_records (address, city, state, county, lien_type, amount, filed_date, creditor_name, status) VALUES
('5678 Oak Ave', 'Dallas', 'TX', 'Dallas', 'Tax Lien', 12500, '2023-08-15', 'Dallas County Tax Collector', 'active'),
('1234 Main St', 'Houston', 'TX', 'Harris', 'Mechanics Lien', 8500, '2024-02-01', 'ABC Construction Co', 'satisfied'),
('910 Elm St', 'Austin', 'TX', 'Travis', 'HOA Lien', 3200, '2023-12-20', 'Elm Street HOA', 'active')
ON CONFLICT DO NOTHING;

INSERT INTO court_records (property_address, city, state, county, case_number, case_type, filed_date, status, parties) VALUES
('5678 Oak Ave', 'Dallas', 'TX', 'Dallas', '2023-CV-12345', 'Foreclosure', '2023-06-10', 'Closed', ARRAY['Bank of America', 'Previous Owner']),
('910 Elm St', 'Austin', 'TX', 'Travis', '2024-CV-67890', 'Property Dispute', '2024-01-05', 'Active', ARRAY['HOA', 'Current Owner'])
ON CONFLICT DO NOTHING;
-- Microsites Table
CREATE TABLE IF NOT EXISTS microsites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  headline TEXT,
  content JSONB,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Microsite Leads (people who showed interest)
CREATE TABLE IF NOT EXISTS microsite_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  microsite_id UUID REFERENCES microsites(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  signed_nda BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach Campaigns
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence_data JSONB,
  status TEXT DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach Messages (individual messages sent)
CREATE TABLE IF NOT EXISTS outreach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT,
  recipient_phone TEXT,
  channel TEXT,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_microsites_slug ON microsites(slug);
CREATE INDEX IF NOT EXISTS idx_microsites_property ON microsites(property_id);
CREATE INDEX IF NOT EXISTS idx_microsites_user ON microsites(user_id);
CREATE INDEX IF NOT EXISTS idx_microsite_leads_microsite ON microsite_leads(microsite_id);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_user ON outreach_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_campaign ON outreach_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_status ON outreach_messages(status);

-- RLS Policies
ALTER TABLE microsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE microsite_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;

-- Public can view active microsites
CREATE POLICY "Public can view active microsites"
  ON microsites FOR SELECT
  USING (is_active = true);

-- Users can manage their own microsites
CREATE POLICY "Users can manage own microsites"
  ON microsites FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can submit leads to microsites
CREATE POLICY "Anyone can submit microsite leads"
  ON microsite_leads FOR INSERT
  WITH CHECK (true);

-- Users can view leads for their microsites
CREATE POLICY "Users can view own microsite leads"
  ON microsite_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM microsites
      WHERE microsites.id = microsite_leads.microsite_id
      AND microsites.user_id = auth.uid()
    )
  );

-- Users can manage their own campaigns
CREATE POLICY "Users can manage own campaigns"
  ON outreach_campaigns FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view messages for their campaigns
CREATE POLICY "Users can view own campaign messages"
  ON outreach_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      WHERE outreach_campaigns.id = outreach_messages.campaign_id
      AND outreach_campaigns.user_id = auth.uid()
    )
  );

-- Trigger to update view count when microsite is viewed
CREATE OR REPLACE FUNCTION increment_microsite_view()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE microsites
  SET view_count = view_count + 1
  WHERE id = NEW.microsite_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Not creating trigger on microsite_leads as it would fire on every lead
-- Instead, implement view counting via API calls
-- Deal Rescues Table
CREATE TABLE IF NOT EXISTS deal_rescues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  diagnosis JSONB,
  revised_pricing JSONB,
  buyer_profiles JSONB,
  rescue_strategies JSONB,
  outreach_scripts JSONB,
  status TEXT DEFAULT 'pending',
  implemented_strategies TEXT[] DEFAULT '{}',
  result TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deal_rescues_property ON deal_rescues(property_id);
CREATE INDEX IF NOT EXISTS idx_deal_rescues_user ON deal_rescues(user_id);
CREATE INDEX IF NOT EXISTS idx_deal_rescues_status ON deal_rescues(status);

-- RLS Policies
ALTER TABLE deal_rescues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rescues"
  ON deal_rescues FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create rescues"
  ON deal_rescues FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update own rescues"
  ON deal_rescues FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger
CREATE TRIGGER update_deal_rescues_updated_at
  BEFORE UPDATE ON deal_rescues
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Scout Agents Table
CREATE TABLE IF NOT EXISTS scout_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_phone TEXT,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}',
  is_active BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'daily',
  last_check_at TIMESTAMPTZ,
  alert_count INTEGER DEFAULT 0,
  properties_found INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scout Agent Alerts Table (history)
CREATE TABLE IF NOT EXISTS scout_agent_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES scout_agents(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  match_score INTEGER,
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scout_agents_user ON scout_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_scout_agents_active ON scout_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_scout_agent_alerts_agent ON scout_agent_alerts(agent_id);
CREATE INDEX IF NOT EXISTS idx_scout_agent_alerts_property ON scout_agent_alerts(property_id);

-- RLS Policies
ALTER TABLE scout_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_agent_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scout agents"
  ON scout_agents FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own agent alerts"
  ON scout_agent_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scout_agents
      WHERE scout_agents.id = scout_agent_alerts.agent_id
      AND scout_agents.user_id = auth.uid()
    )
  );

-- Trigger
CREATE TRIGGER update_scout_agents_updated_at
  BEFORE UPDATE ON scout_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
