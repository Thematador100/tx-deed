-- ============================================================================
-- Autonomous Agents Database Tables
-- ============================================================================
-- This migration creates all tables needed for the autonomous agent system
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Skip Trace Results Table
-- ============================================================================
-- Stores results from the SkipTracingAgent
-- Tracks family members, contact info, and deceased owner details

CREATE TABLE IF NOT EXISTS skip_trace_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  owner_name TEXT NOT NULL,

  -- Parsed name information
  parsed_first_name TEXT,
  parsed_middle_name TEXT,
  parsed_last_name TEXT,
  parsed_suffix TEXT,

  -- Owner status
  is_deceased BOOLEAN DEFAULT false,
  is_trust BOOLEAN DEFAULT false,
  is_llc BOOLEAN DEFAULT false,

  -- Family members found (JSON array)
  family_members JSONB DEFAULT '[]'::jsonb,

  -- Contact information found (JSON array)
  contacts JSONB DEFAULT '[]'::jsonb,

  -- Estate information (for deceased owners)
  estate_info JSONB,

  -- Tracing metadata
  trace_confidence DECIMAL(3,2), -- 0.00 to 1.00
  trace_sources TEXT[], -- Where data was found
  trace_notes TEXT,

  -- Status tracking
  status TEXT DEFAULT 'completed',
  traced_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_skip_trace_property_id ON skip_trace_results(property_id);
CREATE INDEX IF NOT EXISTS idx_skip_trace_owner_name ON skip_trace_results(owner_name);
CREATE INDEX IF NOT EXISTS idx_skip_trace_is_deceased ON skip_trace_results(is_deceased);
CREATE INDEX IF NOT EXISTS idx_skip_trace_traced_at ON skip_trace_results(traced_at DESC);

-- ============================================================================
-- 2. Property Enrichment Table
-- ============================================================================
-- Stores comprehensive property data from PropertyEnrichmentAgent
-- BatchLeads/Reonomy-style full property reports

CREATE TABLE IF NOT EXISTS property_enrichment (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,

  -- Property details
  property_details JSONB,

  -- Ownership history
  ownership_history JSONB DEFAULT '[]'::jsonb,
  current_owner_tenure_years INTEGER,

  -- Liens and encumbrances
  liens JSONB DEFAULT '[]'::jsonb,
  total_lien_amount DECIMAL(12,2),

  -- Tax history
  tax_history JSONB DEFAULT '[]'::jsonb,
  tax_delinquent BOOLEAN DEFAULT false,
  years_delinquent INTEGER,

  -- Market comparables
  comps JSONB DEFAULT '[]'::jsonb,
  estimated_market_value DECIMAL(12,2),
  comp_avg_price_per_sqft DECIMAL(8,2),

  -- Neighborhood data
  neighborhood_data JSONB,
  walk_score INTEGER,
  crime_score INTEGER,

  -- School information
  school_data JSONB DEFAULT '[]'::jsonb,

  -- Environmental data
  environmental_data JSONB,
  flood_zone TEXT,
  has_environmental_hazards BOOLEAN DEFAULT false,

  -- Investment metrics
  investment_metrics JSONB,
  estimated_rent DECIMAL(10,2),
  cap_rate DECIMAL(5,2),
  cash_on_cash_return DECIMAL(5,2),

  -- Market insights
  market_insights JSONB,
  appreciation_rate DECIMAL(5,2),
  days_on_market_avg INTEGER,

  -- Enrichment metadata
  enrichment_score DECIMAL(3,2), -- 0.00 to 1.00 (completeness)
  data_sources TEXT[],
  enriched_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_property_enrichment FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_enrichment_property_id ON property_enrichment(property_id);
CREATE INDEX IF NOT EXISTS idx_enrichment_market_value ON property_enrichment(estimated_market_value);
CREATE INDEX IF NOT EXISTS idx_enrichment_tax_delinquent ON property_enrichment(tax_delinquent);
CREATE INDEX IF NOT EXISTS idx_enrichment_enriched_at ON property_enrichment(enriched_at DESC);

-- ============================================================================
-- 3. Pipeline Stages Table
-- ============================================================================
-- Defines the stages for member property pipeline

CREATE TABLE IF NOT EXISTS pipeline_stages (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3b82f6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default pipeline stages
INSERT INTO pipeline_stages (name, description, color, sort_order) VALUES
  ('New Lead', 'Newly assigned properties', '#10b981', 1),
  ('Research', 'Researching property details', '#3b82f6', 2),
  ('Contact', 'Contacting property owner', '#f59e0b', 3),
  ('Negotiating', 'In negotiation with owner', '#8b5cf6', 4),
  ('Under Contract', 'Contract signed', '#ec4899', 5),
  ('Closed', 'Deal completed', '#14b8a6', 6),
  ('Lost', 'Deal fell through', '#ef4444', 7)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- 4. Saved Properties Table (Member Pipeline)
-- ============================================================================
-- Tracks properties saved by members and their pipeline status

CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  property_id UUID NOT NULL,

  -- Pipeline status
  pipeline_stage_id INTEGER REFERENCES pipeline_stages(id),

  -- How property was added
  added_via TEXT DEFAULT 'manual', -- 'manual', 'assignment', 'search'

  -- Member notes
  notes TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Activity tracking
  last_activity_at TIMESTAMP DEFAULT NOW(),
  follow_up_date DATE,
  reminder_set BOOLEAN DEFAULT false,

  -- Status
  is_archived BOOLEAN DEFAULT false,
  archived_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_property_saved FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT unique_user_property UNIQUE (user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_pipeline_stage ON saved_properties(pipeline_stage_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_follow_up ON saved_properties(follow_up_date);

-- ============================================================================
-- 5. Property Assignments Table
-- ============================================================================
-- Tracks property assignments from admins to specific members

CREATE TABLE IF NOT EXISTS property_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  member_id UUID NOT NULL,
  assigned_by UUID NOT NULL,

  -- Assignment details
  assigned_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  responded_at TIMESTAMP,

  -- Status: pending, accepted, declined, expired, cancelled
  status TEXT NOT NULL DEFAULT 'pending',

  -- Competitive assignment (multiple members, first to respond wins)
  is_competitive BOOLEAN DEFAULT false,

  -- Response tracking
  decline_reason TEXT,
  cancel_reason TEXT,
  cancelled_at TIMESTAMP,

  -- Assignment metadata
  notes TEXT,
  priority TEXT DEFAULT 'normal', -- low, normal, high, urgent

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_property_assignment FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_member FOREIGN KEY (member_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_assigned_by FOREIGN KEY (assigned_by) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_assignments_property_id ON property_assignments(property_id);
CREATE INDEX IF NOT EXISTS idx_assignments_member_id ON property_assignments(member_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status ON property_assignments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_expires_at ON property_assignments(expires_at);
CREATE INDEX IF NOT EXISTS idx_assignments_priority ON property_assignments(priority);

-- ============================================================================
-- 6. Notifications Table
-- ============================================================================
-- Stores user notifications for all types of events

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,

  -- Notification details
  type TEXT NOT NULL, -- property_assignment, assignment_cancelled, property_update, etc.
  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Associated data (JSON)
  data JSONB DEFAULT '{}'::jsonb,

  -- Read status
  read BOOLEAN DEFAULT false,
  read_at TIMESTAMP,

  -- Action link (optional)
  action_url TEXT,
  action_text TEXT,

  -- Priority
  priority TEXT DEFAULT 'normal', -- low, normal, high

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================================
-- 7. Row Level Security (RLS) Policies
-- ============================================================================
-- Enable RLS and create policies for all tables

-- Skip Trace Results - Admins only
ALTER TABLE skip_trace_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all skip trace results"
  ON skip_trace_results FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Property Enrichment - All authenticated users can read
ALTER TABLE property_enrichment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view property enrichment"
  ON property_enrichment FOR SELECT
  TO authenticated
  USING (true);

-- Saved Properties - Users can only see their own
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved properties"
  ON saved_properties FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own saved properties"
  ON saved_properties FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own saved properties"
  ON saved_properties FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own saved properties"
  ON saved_properties FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Property Assignments - Users can see their own assignments
ALTER TABLE property_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assignments"
  ON property_assignments FOR SELECT
  TO authenticated
  USING (member_id = auth.uid() OR assigned_by = auth.uid());

CREATE POLICY "Admins can insert assignments"
  ON property_assignments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "Members can update own assignments"
  ON property_assignments FOR UPDATE
  TO authenticated
  USING (member_id = auth.uid());

-- Notifications - Users can only see their own
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

-- Pipeline Stages - All authenticated users can read
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pipeline stages"
  ON pipeline_stages FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================================
-- 8. Triggers for updated_at timestamps
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers to all tables with updated_at
CREATE TRIGGER update_skip_trace_updated_at BEFORE UPDATE ON skip_trace_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enrichment_updated_at BEFORE UPDATE ON property_enrichment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_properties_updated_at BEFORE UPDATE ON saved_properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON property_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pipeline_stages_updated_at BEFORE UPDATE ON pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 9. Library Items Table (Educational Resources)
-- ============================================================================
-- Stores educational content for members: videos, PDFs, articles
-- Includes state-specific tax deed and lien rules

CREATE TABLE IF NOT EXISTS library_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('video', 'pdf', 'article')),
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  state_code TEXT, -- For state-specific resources (e.g., 'FL', 'TX', 'CA')
  category TEXT, -- e.g., 'Tax Deed Rules', 'Tax Lien Rules', 'Redemption Periods'
  tags TEXT[], -- For filtering and search
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_library_items_type ON library_items(item_type);
CREATE INDEX IF NOT EXISTS idx_library_items_state ON library_items(state_code);
CREATE INDEX IF NOT EXISTS idx_library_items_category ON library_items(category);
CREATE INDEX IF NOT EXISTS idx_library_items_created_at ON library_items(created_at DESC);

-- Row Level Security for library_items
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view library items"
  ON library_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage library items"
  ON library_items FOR ALL
  TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

-- Trigger for updated_at
CREATE TRIGGER update_library_items_updated_at BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 10. Seed Data: State-Specific Tax Deed and Lien Rules
-- ============================================================================
-- Comprehensive guide covering all 50 states

INSERT INTO library_items (title, description, item_type, url, state_code, category, tags) VALUES

-- Alabama
('Alabama Tax Deed Guide', 'Alabama uses tax liens with a 3-year redemption period. Properties are sold through competitive bidding at county tax sales. Investors receive liens, not immediate ownership.', 'article', 'https://revenue.alabama.gov/property-tax/', 'AL', 'Tax Lien Rules', ARRAY['tax lien', 'redemption period', '3 years', 'competitive bidding']),

-- Alaska
('Alaska Tax Deed Rules', 'Alaska is a tax deed state with a 1-year redemption period. Properties sold at public auction go to the highest bidder. Full ownership transfers after redemption period expires.', 'article', 'https://dnr.alaska.gov/mlw/factsht/tax_sale/', 'AK', 'Tax Deed Rules', ARRAY['tax deed', 'redemption period', '1 year', 'public auction']),

-- Arizona
('Arizona Tax Lien Certificates', 'Arizona sells tax lien certificates at 16% interest. 3-year redemption period. After 3 years, investors can foreclose and obtain tax deed to the property.', 'article', 'https://www.azdor.gov/', 'AZ', 'Tax Lien Rules', ARRAY['tax lien', '16% interest', '3 years', 'foreclose']),

-- Arkansas
('Arkansas Tax Deed Process', 'Arkansas is a hybrid state (both deeds and liens). Properties can be sold via tax deed after 2-year redemption period. Competitive bidding at county sales.', 'article', 'https://www.dfa.arkansas.gov/', 'AR', 'Tax Deed Rules', ARRAY['hybrid', 'tax deed', '2 years', 'competitive bidding']),

-- California
('California Tax Defaulted Property', 'California has a 5-year redemption period for tax-defaulted properties. After 5 years, properties are sold at public auction. No tax liens sold to investors.', 'article', 'https://sco.ca.gov/', 'CA', 'Tax Deed Rules', ARRAY['tax deed', '5 years', 'no liens', 'public auction']),

-- Colorado
('Colorado Tax Lien Certificates', 'Colorado sells tax lien certificates with interest rates set by bidding (starts at 9%). 3-year redemption period. Can apply for tax deed after 3 years.', 'article', 'https://tax.colorado.gov/', 'CO', 'Tax Lien Rules', ARRAY['tax lien', '9%+ interest', '3 years', 'bidding']),

-- Connecticut
('Connecticut Tax Lien Sales', 'Connecticut uses tax liens with an 18% annual interest rate. No competitive bidding - first come, first served. Can foreclose after several years of non-payment.', 'article', 'https://portal.ct.gov/', 'CT', 'Tax Lien Rules', ARRAY['tax lien', '18% interest', 'first come first served']),

-- Delaware
('Delaware Tax Deed State', 'Delaware is a tax deed state with a 60-day redemption period. Very short redemption makes it attractive for investors. Properties sold at sheriff sale.', 'article', 'https://revenue.delaware.gov/', 'DE', 'Tax Deed Rules', ARRAY['tax deed', '60 days', 'short redemption', 'sheriff sale']),

-- Florida
('Florida Tax Deed Sales', 'Florida sells tax deed certificates (liens) with up to 18% interest. 2-year waiting period before tax deed application. Very active market with monthly auctions.', 'article', 'https://floridarevenue.com/', 'FL', 'Tax Lien Rules', ARRAY['tax lien', '18% interest', '2 years', 'monthly auctions']),

-- Georgia
('Georgia Tax Deed Auctions', 'Georgia is a tax deed state with a 1-year redemption period (12 months). Properties sold at courthouse steps. High-volume market with good inventory.', 'article', 'https://dor.georgia.gov/', 'GA', 'Tax Deed Rules', ARRAY['tax deed', '1 year', 'courthouse', 'high volume']),

-- Hawaii
('Hawaii Tax Deed Process', 'Hawaii uses tax deeds with a 1-year redemption period. Limited inventory but high property values. Sales conducted by county tax collectors.', 'article', 'https://tax.hawaii.gov/', 'HI', 'Tax Deed Rules', ARRAY['tax deed', '1 year', 'limited inventory']),

-- Idaho
('Idaho Tax Deed State', 'Idaho is a tax deed state with a 3-year redemption period. Properties sold at public auction after 3 years of delinquency. County-by-county process.', 'article', 'https://tax.idaho.gov/', 'ID', 'Tax Deed Rules', ARRAY['tax deed', '3 years', 'public auction']),

-- Illinois
('Illinois Tax Deed Sales', 'Illinois sells tax deeds with a 2.5 to 3-year redemption period depending on property type and size. Cook County has largest volume. Overbid process available.', 'article', 'https://www2.illinois.gov/', 'IL', 'Tax Deed Rules', ARRAY['tax deed', '2.5-3 years', 'overbid', 'Cook County']),

-- Indiana
('Indiana Tax Deed Procedures', 'Indiana is a tax deed state with a 1-year redemption period. Properties sold at commissioner sales. Minimum bid covers back taxes plus costs.', 'article', 'https://www.in.gov/dlgf/', 'IN', 'Tax Deed Rules', ARRAY['tax deed', '1 year', 'commissioner sale']),

-- Iowa
('Iowa Tax Deed Sales', 'Iowa uses tax deeds with a  1.75-year redemption period (21 months). Public auctions held at county treasurer office. Interest accrues during redemption.', 'article', 'https://tax.iowa.gov/', 'IA', 'Tax Deed Rules', ARRAY['tax deed', '21 months', 'treasurer sale']),

-- Kansas
('Kansas Tax Deed State', 'Kansas is a tax deed state with a 3-year redemption period. Properties sold at sheriff sales. Competitive bidding determines winning investor.', 'article', 'https://www.ksrevenue.gov/', 'KS', 'Tax Deed Rules', ARRAY['tax deed', '3 years', 'sheriff sale']),

-- Kentucky
('Kentucky Tax Lien Certificates', 'Kentucky sells tax lien certificates at 12% annual interest. 1-year redemption for commercial, 2 years for agricultural property. Can obtain deed after redemption expires.', 'article', 'https://revenue.ky.gov/', 'KY', 'Tax Lien Rules', ARRAY['tax lien', '12% interest', '1-2 years']),

-- Louisiana
('Louisiana Tax Deed Sales', 'Louisiana uses tax liens with a 3-year redemption period and 12% interest (1% per month). After 3 years, investors can file for tax deed. Very investor-friendly.', 'article', 'https://revenue.louisiana.gov/', 'LA', 'Tax Lien Rules', ARRAY['tax lien', '12% annual', '3 years']),

-- Maine
('Maine Tax Lien Process', 'Maine sells tax liens with automatic foreclosure after 18 months. No bidding on interest - flat rate applies. Investors can acquire property title after redemption period.', 'article', 'https://www.maine.gov/revenue/', 'ME', 'Tax Lien Rules', ARRAY['tax lien', '18 months', 'automatic foreclosure']),

-- Maryland
('Maryland Tax Deed Sales', 'Maryland uses tax lien certificates with a 6-month redemption period. After 6 months, investors can foreclose. High interest rates (varies by county).', 'article', 'https://www.marylandtaxes.gov/', 'MD', 'Tax Lien Rules', ARRAY['tax lien', '6 months', 'foreclosure', 'high interest']),

-- Massachusetts
('Massachusetts Tax Deed Procedures', 'Massachusetts uses tax liens with a 6-month redemption period. 16% interest rate. Can foreclose after redemption period. Complex legal process.', 'article', 'https://www.mass.gov/dor', 'MA', 'Tax Lien Rules', ARRAY['tax lien', '16% interest', '6 months', 'complex']),

-- Michigan
('Michigan Tax Deed Auctions', 'Michigan is a tax deed state with no redemption period after sale. Properties sold at county auctions. Winner gets immediate ownership. Very competitive market.', 'article', 'https://www.michigan.gov/treasury', 'MI', 'Tax Deed Rules', ARRAY['tax deed', 'no redemption', 'immediate ownership']),

-- Minnesota
('Minnesota Tax Deed State', 'Minnesota uses tax deeds with a 3-year redemption period. Sold at public auction. One of the longer redemption periods, but solid inventory.', 'article', 'https://www.revenue.state.mn.us/', 'MN', 'Tax Deed Rules', ARRAY['tax deed', '3 years', 'public auction']),

-- Mississippi
('Mississippi Tax Deed Sales', 'Mississippi is a tax deed state with a 2-year redemption period. Properties sold at chancery clerk sales. Good opportunities in rural areas.', 'article', 'https://www.dor.ms.gov/', 'MS', 'Tax Deed Rules', ARRAY['tax deed', '2 years', 'chancery sale']),

-- Missouri
('Missouri Tax Deed Process', 'Missouri uses tax deeds with a 1-year redemption period. Properties sold at collector sales. Very active market with good volume in St. Louis and Kansas City.', 'article', 'https://dor.mo.gov/', 'MO', 'Tax Deed Rules', ARRAY['tax deed', '1 year', 'collector sale']),

-- Montana
('Montana Tax Lien Certificates', 'Montana sells tax lien certificates at 10% interest plus penalties. 3-year redemption period. Can apply for tax deed after 3 years of non-redemption.', 'article', 'https://mtrevenue.gov/', 'MT', 'Tax Lien Rules', ARRAY['tax lien', '10% interest', '3 years']),

-- Nebraska
('Nebraska Tax Deed Sales', 'Nebraska uses tax certificates (liens) with a 3-year redemption period. 14% interest rate. Can obtain deed after 3 years. Relatively small market.', 'article', 'https://revenue.nebraska.gov/', 'NE', 'Tax Lien Rules', ARRAY['tax lien', '14% interest', '3 years']),

-- Nevada
('Nevada Tax Deed Auctions', 'Nevada is a tax deed state with no redemption period. Properties sold at county treasurer auctions. Immediate ownership transfer. Very competitive in Las Vegas area.', 'article', 'https://tax.nv.gov/', 'NV', 'Tax Deed Rules', ARRAY['tax deed', 'no redemption', 'immediate']),

-- New Hampshire
('New Hampshire Tax Lien Process', 'New Hampshire sells tax liens with a 2-year redemption period. 18% interest rate (one of highest). Can execute deed after redemption expires.', 'article', 'https://www.revenue.nh.gov/', 'NH', 'Tax Lien Rules', ARRAY['tax lien', '18% interest', '2 years']),

-- New Jersey
('New Jersey Tax Lien Certificates', 'New Jersey sells tax lien certificates at 18% interest (bid down). 2-year redemption period. Can foreclose and obtain deed after 2 years. Very active market.', 'article', 'https://www.nj.gov/treasury/', 'NJ', 'Tax Lien Rules', ARRAY['tax lien', '18% interest', '2 years', 'active market']),

-- New Mexico
('New Mexico Tax Deed State', 'New Mexico is a tax deed state with a 3-year redemption period. Properties sold at public auction. Good opportunities in smaller counties.', 'article', 'https://www.tax.newmexico.gov/', 'NM', 'Tax Deed Rules', ARRAY['tax deed', '3 years', 'public auction']),

-- New York
('New York Tax Deed/Lien Hybrid', 'New York varies by county. Most use tax liens with 2-year redemption. High interest rates (varies). Can foreclose after redemption. NYC has special process.', 'article', 'https://www.tax.ny.gov/', 'NY', 'Hybrid Rules', ARRAY['hybrid', '2 years', 'varies by county', 'NYC special']),

-- North Carolina
('North Carolina Tax Deed Sales', 'North Carolina is a tax deed state with no redemption period after upset bid period. Properties sold at public auction. Competitive market in urban areas.', 'article', 'https://www.ncdor.gov/', 'NC', 'Tax Deed Rules', ARRAY['tax deed', 'upset bid', 'no redemption']),

-- North Dakota
('North Dakota Tax Deed State', 'North Dakota uses tax deeds with a 3-year redemption period. Properties sold at county director of tax equalization. Small market with limited inventory.', 'article', 'https://www.nd.gov/tax/', 'ND', 'Tax Deed Rules', ARRAY['tax deed', '3 years', 'small market']),

-- Ohio
('Ohio Tax Lien Certificates', 'Ohio sells tax lien certificates with a 1-year redemption period. Can foreclose after 1 year. Interest varies by property class. Good volume in major cities.', 'article', 'https://tax.ohio.gov/', 'OH', 'Tax Lien Rules', ARRAY['tax lien', '1 year', 'foreclose', 'urban volume']),

-- Oklahoma
('Oklahoma Tax Deed Resale', 'Oklahoma uses tax deeds with a 2-year redemption period. Properties sold at county resale. Good rural opportunities with lower competition.', 'article', 'https://www.ok.gov/tax/', 'OK', 'Tax Deed Rules', ARRAY['tax deed', '2 years', 'resale', 'rural']),

-- Oregon
('Oregon Tax Deed Foreclosure', 'Oregon uses tax deeds with a 2-year redemption period (3 years for certain properties). County treasurer conducts sales. Moderate market activity.', 'article', 'https://www.oregon.gov/dor/', 'OR', 'Tax Deed Rules', ARRAY['tax deed', '2-3 years', 'treasurer sale']),

-- Pennsylvania
('Pennsylvania Tax Deed Sales', 'Pennsylvania is a tax deed state with a 1-year redemption period. Upset and judicial sales. Very active market in Philadelphia and Pittsburgh. Complex legal process.', 'article', 'https://www.revenue.pa.gov/', 'PA', 'Tax Deed Rules', ARRAY['tax deed', '1 year', 'upset sale', 'judicial']),

-- Rhode Island
('Rhode Island Tax Lien Sales', 'Rhode Island sells tax liens with a 1-year redemption period. 16% interest rate. Can petition for deed after 1 year. Small state with limited inventory.', 'article', 'https://tax.ri.gov/', 'RI', 'Tax Lien Rules', ARRAY['tax lien', '16% interest', '1 year', 'small market']),

-- South Carolina
('South Carolina Tax Deed Sales', 'South Carolina uses tax deeds with a 1-year redemption period. Properties sold at delinquent tax sales. Good opportunities in coastal areas.', 'article', 'https://dor.sc.gov/', 'SC', 'Tax Deed Rules', ARRAY['tax deed', '1 year', 'delinquent sale']),

-- South Dakota
('South Dakota Tax Deed Procedures', 'South Dakota is a tax deed state with a 3-year redemption period (4 years for agricultural). County treasurer conducts sales. Rural opportunities available.', 'article', 'https://dor.sd.gov/', 'SD', 'Tax Deed Rules', ARRAY['tax deed', '3-4 years', 'agricultural']),

-- Tennessee
('Tennessee Tax Deed Auctions', 'Tennessee uses tax deeds with a 1-year redemption period. Properties sold at public auction. Active market in Nashville, Memphis, and Knoxville areas.', 'article', 'https://www.tn.gov/revenue.html', 'TN', 'Tax Deed Rules', ARRAY['tax deed', '1 year', 'active market']),

-- Texas
('Texas Tax Deed Sales', 'Texas is a tax deed state with a 6-month to 2-year redemption period (depends on homestead status). Very large market with monthly sales in most counties. Highly competitive.', 'article', 'https://comptroller.texas.gov/', 'TX', 'Tax Deed Rules', ARRAY['tax deed', '6 months-2 years', 'homestead', 'large market']),

-- Utah
('Utah Tax Deed State', 'Utah uses tax deeds with a 4-year redemption period. One of the longest redemption periods. County auditor conducts sales. Growing market along Wasatch Front.', 'article', 'https://tax.utah.gov/', 'UT', 'Tax Deed Rules', ARRAY['tax deed', '4 years', 'long redemption']),

-- Vermont
('Vermont Tax Lien Sales', 'Vermont sells tax liens with a 1-year redemption period. 12% interest rate. Can file for deed after 1 year. Small market with limited inventory.', 'article', 'https://tax.vermont.gov/', 'VT', 'Tax Lien Rules', ARRAY['tax lien', '12% interest', '1 year', 'small']),

-- Virginia
('Virginia Tax Deed Process', 'Virginia is a tax deed state with no redemption period after sale. Properties sold at commissioner sales. Immediate ownership. Active market in Northern Virginia.', 'article', 'https://www.tax.virginia.gov/', 'VA', 'Tax Deed Rules', ARRAY['tax deed', 'no redemption', 'immediate', 'NoVA active']),

-- Washington
('Washington Tax Deed Foreclosure', 'Washington uses tax deeds with a 3-year redemption period. County treasurer conducts foreclosure sales. Competitive market in Seattle/Tacoma area.', 'article', 'https://dor.wa.gov/', 'WA', 'Tax Deed Rules', ARRAY['tax deed', '3 years', 'foreclosure', 'competitive']),

-- West Virginia
('West Virginia Tax Lien Certificates', 'West Virginia sells tax lien certificates with a 17-month redemption period. 12% interest. Can obtain deed after redemption expires. Small market.', 'article', 'https://tax.wv.gov/', 'WV', 'Tax Lien Rules', ARRAY['tax lien', '12% interest', '17 months']),

-- Wisconsin
('Wisconsin Tax Deed Sales', 'Wisconsin uses tax deeds with a 3-year redemption period (varies by county). County treasurer holds sales. Moderate activity in Milwaukee and Madison.', 'article', 'https://www.revenue.wi.gov/', 'WI', 'Tax Deed Rules', ARRAY['tax deed', '3 years', 'county variance']),

-- Wyoming
('Wyoming Tax Deed State', 'Wyoming is a tax deed state with a 4-year redemption period. County treasurer conducts sales. Small market with very limited inventory.', 'article', 'https://revenue.wyo.gov/', 'WY', 'Tax Deed Rules', ARRAY['tax deed', '4 years', 'limited inventory']),

-- General educational resources
('Tax Deed vs Tax Lien Explained', 'Comprehensive guide explaining the difference between tax deed and tax lien investing. Learn which states use which method and the pros/cons of each strategy.', 'article', 'https://www.winwithdeeds.com/resources/deed-vs-lien', NULL, 'Education', ARRAY['beginner', 'tax deed', 'tax lien', 'comparison']),

('Redemption Period Guide', 'Understanding redemption periods across all 50 states. Learn how long property owners have to redeem their property and what it means for investors.', 'article', 'https://www.winwithdeeds.com/resources/redemption-periods', NULL, 'Education', ARRAY['redemption', 'timeline', 'all states']),

('Due Diligence Checklist', 'Step-by-step checklist for researching tax deed and tax lien properties. Avoid costly mistakes by following this comprehensive due diligence process.', 'pdf', 'https://www.winwithdeeds.com/resources/due-diligence-checklist.pdf', NULL, 'Education', ARRAY['due diligence', 'checklist', 'research']),

('ROI Calculator for Tax Deeds', 'Learn how to calculate return on investment for tax deed properties. Includes formulas, examples, and a downloadable spreadsheet calculator.', 'article', 'https://www.winwithdeeds.com/resources/roi-calculator', NULL, 'Education', ARRAY['ROI', 'calculator', 'investment analysis']);

-- ============================================================================
-- Migration Complete!
-- ============================================================================
-- All tables have been created with proper indexes, foreign keys, and RLS policies
-- The autonomous agents can now operate fully autonomously with database persistence
-- Library now includes comprehensive tax deed/lien rules for all 50 states
-- ============================================================================
