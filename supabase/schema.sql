-- Win With Deeds - Production Database Schema
-- This schema creates all tables needed for the tax deed investment platform
-- Run this in your Supabase SQL Editor to set up the database

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
-- Extends Supabase auth.users with additional profile information
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'Mentee Elite')),
  phone TEXT,
  company TEXT,
  user_metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update all profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- PROPERTIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  price DECIMAL(12, 2),
  estimated_value DECIMAL(12, 2),
  auction_date DATE,
  status TEXT DEFAULT 'Upcoming',
  roi DECIMAL(8, 2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  sqft INTEGER,
  lot_size TEXT,
  year_built INTEGER,
  property_type TEXT,
  description TEXT,
  image_url TEXT,
  listing_type TEXT CHECK (listing_type IN ('auction', 'marketplace', 'tax_sale', 'redeemable')),
  deal_stage TEXT,
  opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),
  red_flags JSONB DEFAULT '[]'::jsonb,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  median_income DECIMAL(12, 2),
  population_density INTEGER,
  school_rating DECIMAL(3, 1),
  environmental_risks JSONB DEFAULT '[]'::jsonb,
  parcel_id TEXT,
  owner TEXT,
  starting_bid DECIMAL(12, 2),
  county TEXT,
  state TEXT,
  zip_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Properties are viewable by authenticated users" ON public.properties FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can insert properties" ON public.properties FOR INSERT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update properties" ON public.properties FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can delete properties" ON public.properties FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_opportunity_score ON public.properties(opportunity_score);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- ============================================================================
-- TAX DELINQUENT LEADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.tax_delinquent_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  address TEXT NOT NULL,
  delinquent_amount DECIMAL(12, 2),
  status TEXT DEFAULT 'Initial Notice',
  parcel_id TEXT,
  county TEXT,
  state TEXT,
  zip_code TEXT,
  owner_phone TEXT,
  owner_email TEXT,
  years_delinquent INTEGER,
  property_type TEXT,
  estimated_value DECIMAL(12, 2),
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.tax_delinquent_leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Leads viewable by authenticated users" ON public.tax_delinquent_leads FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage leads" ON public.tax_delinquent_leads FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- REDEEMABLE DEEDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.redeemable_deeds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  original_owner TEXT,
  new_owner TEXT,
  sale_price DECIMAL(12, 2),
  estimated_value DECIMAL(12, 2),
  redemption_date DATE,
  status TEXT DEFAULT 'Redeemable',
  state TEXT,
  county TEXT,
  parcel_id TEXT,
  property_type TEXT,
  interest_rate DECIMAL(5, 2),
  penalty_rate DECIMAL(5, 2),
  total_redemption_amount DECIMAL(12, 2),
  days_until_redemption INTEGER,
  image_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.redeemable_deeds ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Redeemable deeds viewable by authenticated users" ON public.redeemable_deeds FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage redeemable deeds" ON public.redeemable_deeds FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- SAVED PROPERTIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.saved_properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

-- Enable RLS
ALTER TABLE public.saved_properties ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own saved properties" ON public.saved_properties FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own saved properties" ON public.saved_properties FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own saved properties" ON public.saved_properties FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  product_name TEXT,
  stripe_payment_id TEXT,
  stripe_session_id TEXT,
  payment_method TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all transactions" ON public.transactions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);

-- ============================================================================
-- LIBRARY ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT CHECK (content_type IN ('course', 'document', 'video', 'article')),
  file_url TEXT,
  category TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  is_premium BOOLEAN DEFAULT FALSE,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Library items viewable by authenticated users" ON public.library_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage library items" ON public.library_items FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- LEAD UPLOADS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.lead_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  processed_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lead_uploads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own uploads" ON public.lead_uploads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own uploads" ON public.lead_uploads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all uploads" ON public.lead_uploads FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- SCOUT AGENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.scout_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,
  criteria JSONB NOT NULL DEFAULT '{}'::jsonb,
  notification_method TEXT CHECK (notification_method IN ('email', 'sms', 'both')),
  notification_email TEXT,
  notification_phone TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMP WITH TIME ZONE,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scout_agents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own scout agents" ON public.scout_agents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own scout agents" ON public.scout_agents FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all scout agents" ON public.scout_agents FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- PIPELINE STAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  stage TEXT NOT NULL,
  notes TEXT,
  tasks JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage own pipeline" ON public.pipeline_stages FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- ============================================================================
-- PARTNER APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  website TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can submit partner application" ON public.partner_applications FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view all applications" ON public.partner_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update applications" ON public.partner_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- FUNDING SUBMISSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.funding_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_address TEXT NOT NULL,
  funding_amount DECIMAL(12, 2) NOT NULL,
  property_details JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'approved', 'rejected')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.funding_submissions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own funding submissions" ON public.funding_submissions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create funding submissions" ON public.funding_submissions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all funding submissions" ON public.funding_submissions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);
CREATE POLICY "Admins can update funding submissions" ON public.funding_submissions FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- API KEYS TABLE (Encrypted storage for API credentials)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  service_name TEXT UNIQUE NOT NULL,
  encrypted_key TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_tested_at TIMESTAMP WITH TIME ZONE,
  test_status TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Only admins can manage API keys" ON public.api_keys FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to get API key status (returns which keys are configured)
CREATE OR REPLACE FUNCTION get_api_key_status()
RETURNS TABLE(service_name TEXT, key_present BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT
    api_keys.service_name,
    (api_keys.encrypted_key IS NOT NULL AND api_keys.encrypted_key != '') AS key_present
  FROM api_keys
  WHERE is_active = TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_library_items_updated_at BEFORE UPDATE ON public.library_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_lead_uploads_updated_at BEFORE UPDATE ON public.lead_uploads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scout_agents_updated_at BEFORE UPDATE ON public.scout_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON public.pipeline_stages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partner_applications_updated_at BEFORE UPDATE ON public.partner_applications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_funding_submissions_updated_at BEFORE UPDATE ON public.funding_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_tax_delinquent_leads_updated_at BEFORE UPDATE ON public.tax_delinquent_leads FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_redeemable_deeds_updated_at BEFORE UPDATE ON public.redeemable_deeds FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA
-- ============================================================================

-- Insert default API key placeholders
INSERT INTO public.api_keys (service_name, is_active)
VALUES
  ('openai', TRUE),
  ('google-ai', TRUE),
  ('google-doc-ai', TRUE),
  ('smarty', TRUE),
  ('stripe', TRUE)
ON CONFLICT (service_name) DO NOTHING;

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================
DO $$
BEGIN
  RAISE NOTICE 'Database schema created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Configure API keys in the Admin Panel > API Key Vault';
  RAISE NOTICE '2. Add properties, leads, and redeemable deeds via the Admin Panel';
  RAISE NOTICE '3. Users can now register and start using the platform';
END $$;
