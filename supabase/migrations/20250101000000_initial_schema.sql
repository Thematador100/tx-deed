-- =====================================================
-- TX-DEED Platform - Complete Database Schema
-- =====================================================
-- This migration creates all tables and security policies
-- for the tax deed investment platform.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PROFILES TABLE
-- =====================================================
-- Extends Supabase auth.users with additional profile data
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member', 'user')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- PROPERTIES TABLE
-- =====================================================
-- Stores tax deed property listings
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address TEXT NOT NULL,
  price NUMERIC(12,2) DEFAULT 0,
  estimated_value NUMERIC(12,2) DEFAULT 0,
  property_type TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  sqft INTEGER,
  year_built INTEGER,
  status TEXT DEFAULT 'active',
  opportunity_score NUMERIC(5,2),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Policies for properties
CREATE POLICY "Properties are viewable by authenticated users"
  ON public.properties FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can insert properties"
  ON public.properties FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update properties"
  ON public.properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can delete properties"
  ON public.properties FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_properties_address ON public.properties(address);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_created_at ON public.properties(created_at DESC);

-- Trigger
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- TRANSACTIONS TABLE
-- =====================================================
-- Stores payment and subscription transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only system can insert transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON public.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- =====================================================
-- PARTNER_APPLICATIONS TABLE
-- =====================================================
-- Stores affiliate/partner program applications
CREATE TABLE IF NOT EXISTS public.partner_applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  website TEXT,
  audience_size TEXT,
  platform TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.partner_applications ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can submit partner applications"
  ON public.partner_applications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view partner applications"
  ON public.partner_applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can update partner applications"
  ON public.partner_applications FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partner_applications_status ON public.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_applications_created_at ON public.partner_applications(created_at DESC);

-- =====================================================
-- LIBRARY_ITEMS TABLE
-- =====================================================
-- Stores educational resources (videos, PDFs, articles)
CREATE TABLE IF NOT EXISTS public.library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('video', 'pdf', 'article')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Library items are viewable by authenticated users"
  ON public.library_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage library items"
  ON public.library_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_library_items_created_at ON public.library_items(created_at DESC);

-- =====================================================
-- SCOUT_AGENTS TABLE
-- =====================================================
-- Tracks scout agent runs for property discovery
CREATE TABLE IF NOT EXISTS public.scout_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  last_run_at TIMESTAMPTZ DEFAULT NOW(),
  properties_found INTEGER DEFAULT 0,
  status TEXT DEFAULT 'idle',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.scout_agents ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Scout agents viewable by authenticated users"
  ON public.scout_agents FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Only admins can manage scout agents"
  ON public.scout_agents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_scout_agents_last_run ON public.scout_agents(last_run_at DESC);

-- =====================================================
-- LEAD_UPLOADS TABLE
-- =====================================================
-- Tracks uploaded lead files for processing
CREATE TABLE IF NOT EXISTS public.lead_uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.lead_uploads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own uploads"
  ON public.lead_uploads FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own uploads"
  ON public.lead_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all uploads"
  ON public.lead_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lead_uploads_user_id ON public.lead_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_lead_uploads_created_at ON public.lead_uploads(created_at DESC);

-- =====================================================
-- INVOICES TABLE
-- =====================================================
-- Stores invoices for services like Deal Rescue
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  description TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  due_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view their own invoices"
  ON public.invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all invoices"
  ON public.invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Only admins can manage invoices"
  ON public.invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at DESC);

-- =====================================================
-- LEADS TABLE
-- =====================================================
-- Stores contact form submissions
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can submit contact form"
  ON public.leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Only admins can view leads"
  ON public.leads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Index
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON public.leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_status ON public.leads(status);

-- =====================================================
-- RPC FUNCTION: get_api_key_status
-- =====================================================
-- Returns status of API keys stored in Supabase Vault
-- Note: This function will need to be updated with actual vault integration
CREATE OR REPLACE FUNCTION get_api_key_status()
RETURNS TABLE (
  id UUID,
  service_name TEXT,
  key_present BOOLEAN,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Placeholder function - needs actual Supabase Vault integration
  -- For now, return empty result set
  RETURN QUERY
  SELECT
    uuid_generate_v4() as id,
    unnest(ARRAY['smarty', 'openai', 'google-ai', 'google-doc-ai']) as service_name,
    false as key_present,
    NOW() as updated_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SEED DATA FOR DEVELOPMENT
-- =====================================================
-- Note: This is optional seed data for testing

-- Insert a sample library item
INSERT INTO public.library_items (title, description, item_type, url)
VALUES
  ('Getting Started with Tax Deeds', 'An introductory guide to tax deed investing', 'video', 'https://example.com/intro-video'),
  ('Tax Deed Investment Guide', 'Complete PDF guide for beginners', 'pdf', 'https://example.com/guide.pdf')
ON CONFLICT DO NOTHING;

-- =====================================================
-- GRANTS
-- =====================================================
-- Ensure authenticated users can access tables
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE public.profiles IS 'User profile data extending auth.users';
COMMENT ON TABLE public.properties IS 'Tax deed property listings';
COMMENT ON TABLE public.transactions IS 'Payment and subscription transactions';
COMMENT ON TABLE public.partner_applications IS 'Affiliate program applications';
COMMENT ON TABLE public.library_items IS 'Educational resource library';
COMMENT ON TABLE public.scout_agents IS 'AI scout agent tracking';
COMMENT ON TABLE public.lead_uploads IS 'User-uploaded lead files';
COMMENT ON TABLE public.invoices IS 'Service invoices (e.g., Deal Rescue)';
COMMENT ON TABLE public.leads IS 'Contact form submissions';
