-- Private Members Marketplace Database Schema
-- Properties YOU are selling/wholesaling to members

-- ============================================
-- 1. PRIVATE LISTINGS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS private_listings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Property Details
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  county TEXT NOT NULL,
  zip_code TEXT,

  -- Property Characteristics
  property_type TEXT CHECK (property_type IN ('Single Family', 'Multi-Family', 'Condo', 'Townhouse', 'Land', 'Commercial', 'Industrial')),
  bedrooms INTEGER,
  bathrooms NUMERIC(3,1),
  sqft INTEGER,
  lot_size TEXT,
  year_built INTEGER,

  -- Pricing & Deal Info
  asking_price NUMERIC(12,2) NOT NULL,
  acquisition_cost NUMERIC(12,2),
  arv NUMERIC(12,2), -- After Repair Value
  rehab_estimate NUMERIC(12,2),
  potential_profit NUMERIC(12,2),

  -- Deal Type
  deal_type TEXT CHECK (deal_type IN ('Wholesale', 'Assignment', 'Owned', 'JV Opportunity', 'Fix & Flip')),
  assignment_fee NUMERIC(12,2),

  -- Media
  primary_image_url TEXT,
  image_urls TEXT[], -- Array of image URLs
  video_url TEXT,
  virtual_tour_url TEXT,

  -- Description & Details
  title TEXT NOT NULL,
  description TEXT,
  highlights TEXT[], -- Key selling points
  property_condition TEXT CHECK (property_condition IN ('Excellent', 'Good', 'Fair', 'Needs Work', 'Tear Down')),

  -- Due Diligence
  title_status TEXT CHECK (title_status IN ('Clear', 'Liens Present', 'Under Review', 'Clouded')),
  occupancy_status TEXT CHECK (occupancy_status IN ('Vacant', 'Owner Occupied', 'Tenant Occupied', 'Unknown')),
  redemption_period_ends DATE,
  liens_total NUMERIC(12,2),

  -- Location Data
  latitude NUMERIC(10,6),
  longitude NUMERIC(10,6),

  -- Analytics
  neighborhood_quality TEXT,
  school_rating INTEGER,
  median_income INTEGER,
  crime_score INTEGER, -- 0-100, lower is better

  -- Availability
  status TEXT CHECK (status IN ('Available', 'Under Contract', 'Sold', 'Removed')) DEFAULT 'Available',
  featured BOOLEAN DEFAULT FALSE,
  exclusive BOOLEAN DEFAULT FALSE, -- Elite members only

  -- Dates
  listed_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  sold_date TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Contact & Viewing
  showing_instructions TEXT,
  contact_method TEXT CHECK (contact_method IN ('Platform Message', 'Phone', 'Email', 'Schedule Showing')),

  -- Metadata
  views_count INTEGER DEFAULT 0,
  inquiries_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_private_listings_status ON private_listings(status);
CREATE INDEX idx_private_listings_state ON private_listings(state);
CREATE INDEX idx_private_listings_deal_type ON private_listings(deal_type);
CREATE INDEX idx_private_listings_featured ON private_listings(featured) WHERE featured = true;
CREATE INDEX idx_private_listings_exclusive ON private_listings(exclusive) WHERE exclusive = true;
CREATE INDEX idx_private_listings_price ON private_listings(asking_price);
CREATE INDEX idx_private_listings_listed_date ON private_listings(listed_date DESC);

-- RLS Policies
ALTER TABLE private_listings ENABLE ROW LEVEL SECURITY;

-- Members can view available listings
CREATE POLICY "Members can view available listings"
  ON private_listings FOR SELECT
  USING (
    status = 'Available'
    AND (
      -- Regular members see non-exclusive
      (exclusive = FALSE)
      OR
      -- Elite members see everything
      (EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role IN ('Mentee Elite', 'admin')
      ))
    )
  );

-- Admins can manage all listings
CREATE POLICY "Admins can manage listings"
  ON private_listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 2. MEMBER INQUIRIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS listing_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES private_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Inquiry Details
  inquiry_type TEXT CHECK (inquiry_type IN ('General Question', 'Schedule Showing', 'Make Offer', 'Request Info', 'Partner Opportunity')),
  message TEXT NOT NULL,
  offer_amount NUMERIC(12,2),

  -- Contact Preferences
  preferred_contact TEXT CHECK (preferred_contact IN ('Email', 'Phone', 'Platform Message')),
  phone_number TEXT,

  -- Status
  status TEXT CHECK (status IN ('New', 'Responded', 'Scheduled', 'Offer Made', 'Closed')) DEFAULT 'New',
  admin_notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  responded_at TIMESTAMP WITH TIME ZONE,

  UNIQUE(listing_id, user_id, created_at)
);

CREATE INDEX idx_inquiries_listing ON listing_inquiries(listing_id);
CREATE INDEX idx_inquiries_user ON listing_inquiries(user_id);
CREATE INDEX idx_inquiries_status ON listing_inquiries(status);

-- RLS Policies
ALTER TABLE listing_inquiries ENABLE ROW LEVEL SECURITY;

-- Users can view their own inquiries
CREATE POLICY "Users can view own inquiries"
  ON listing_inquiries FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create inquiries
CREATE POLICY "Users can create inquiries"
  ON listing_inquiries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can manage all inquiries
CREATE POLICY "Admins can manage inquiries"
  ON listing_inquiries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 3. LISTING FAVORITES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS listing_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES private_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),

  UNIQUE(listing_id, user_id)
);

CREATE INDEX idx_favorites_user ON listing_favorites(user_id);
CREATE INDEX idx_favorites_listing ON listing_favorites(listing_id);

-- RLS Policies
ALTER TABLE listing_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own favorites"
  ON listing_favorites FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 4. LISTING VIEWS TRACKER
-- ============================================

CREATE TABLE IF NOT EXISTS listing_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID REFERENCES private_listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_views_listing ON listing_views(listing_id);
CREATE INDEX idx_views_user ON listing_views(user_id);
CREATE INDEX idx_views_date ON listing_views(viewed_at DESC);

-- Function to increment view count
CREATE OR REPLACE FUNCTION increment_listing_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE private_listings
  SET views_count = views_count + 1
  WHERE id = NEW.listing_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_view
  AFTER INSERT ON listing_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_listing_views();

-- ============================================
-- 5. LISTING ANALYTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW listing_analytics AS
SELECT
  pl.id,
  pl.title,
  pl.asking_price,
  pl.status,
  pl.views_count,
  pl.inquiries_count,
  COUNT(DISTINCT lf.user_id) as favorites_count,
  COUNT(DISTINCT li.id) as total_inquiries,
  COUNT(DISTINCT li.id) FILTER (WHERE li.status = 'New') as pending_inquiries,
  COUNT(DISTINCT li.id) FILTER (WHERE li.status = 'Offer Made') as offers_count,
  ROUND(
    (COUNT(DISTINCT li.id)::NUMERIC / NULLIF(pl.views_count, 0)) * 100,
    2
  ) as conversion_rate
FROM private_listings pl
LEFT JOIN listing_favorites lf ON pl.id = lf.listing_id
LEFT JOIN listing_inquiries li ON pl.id = li.listing_id
GROUP BY pl.id, pl.title, pl.asking_price, pl.status, pl.views_count, pl.inquiries_count;

-- ============================================
-- 6. HELPER FUNCTIONS
-- ============================================

-- Track listing view
CREATE OR REPLACE FUNCTION track_listing_view(
  p_listing_id UUID,
  p_user_id UUID DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_view_id UUID;
BEGIN
  INSERT INTO listing_views (listing_id, user_id, ip_address, user_agent)
  VALUES (p_listing_id, p_user_id, p_ip_address, p_user_agent)
  RETURNING id INTO v_view_id;

  RETURN v_view_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create inquiry and notify admin
CREATE OR REPLACE FUNCTION create_listing_inquiry(
  p_listing_id UUID,
  p_inquiry_type TEXT,
  p_message TEXT,
  p_offer_amount NUMERIC DEFAULT NULL,
  p_preferred_contact TEXT DEFAULT 'Platform Message',
  p_phone_number TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_inquiry_id UUID;
  v_listing_title TEXT;
BEGIN
  -- Get listing title
  SELECT title INTO v_listing_title
  FROM private_listings
  WHERE id = p_listing_id;

  -- Create inquiry
  INSERT INTO listing_inquiries (
    listing_id,
    user_id,
    inquiry_type,
    message,
    offer_amount,
    preferred_contact,
    phone_number
  ) VALUES (
    p_listing_id,
    auth.uid(),
    p_inquiry_type,
    p_message,
    p_offer_amount,
    p_preferred_contact,
    p_phone_number
  ) RETURNING id INTO v_inquiry_id;

  -- Increment inquiry count
  UPDATE private_listings
  SET inquiries_count = inquiries_count + 1
  WHERE id = p_listing_id;

  -- Create admin alert
  PERFORM create_admin_alert(
    '💰 New Listing Inquiry',
    'New inquiry for: ' || v_listing_title,
    'info',
    jsonb_build_object(
      'inquiry_id', v_inquiry_id,
      'listing_id', p_listing_id,
      'inquiry_type', p_inquiry_type
    )
  );

  RETURN v_inquiry_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SEED DATA (Example Listings)
-- ============================================

INSERT INTO private_listings (
  title,
  address,
  city,
  state,
  county,
  zip_code,
  property_type,
  bedrooms,
  bathrooms,
  sqft,
  lot_size,
  year_built,
  asking_price,
  acquisition_cost,
  arv,
  rehab_estimate,
  potential_profit,
  deal_type,
  assignment_fee,
  description,
  highlights,
  property_condition,
  title_status,
  occupancy_status,
  status,
  featured,
  exclusive,
  primary_image_url
) VALUES
  (
    'Miami Beach Condo - Quick Flip Opportunity',
    '1234 Ocean Drive, Unit 5B',
    'Miami Beach',
    'Florida',
    'Miami-Dade County',
    '33139',
    'Condo',
    2,
    2.0,
    1250,
    'N/A (Condo)',
    2005,
    185000,
    142000,
    275000,
    35000,
    55000,
    'Wholesale',
    15000,
    'Beautiful 2/2 oceanview condo in prime Miami Beach location. Property needs cosmetic updates but has incredible upside. Seller financing available. This is a tax deed property with clear title.',
    ARRAY['Ocean Views', 'Prime Location', 'Clear Title', 'Quick Close Available', 'Seller Financing Option'],
    'Good',
    'Clear',
    'Vacant',
    'Available',
    true,
    false,
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750'
  ),
  (
    'Atlanta Single Family - 75% Equity',
    '5678 Peachtree Ave',
    'Atlanta',
    'Georgia',
    'Fulton County',
    '30303',
    'Single Family',
    3,
    2.0,
    1850,
    '0.25 acres',
    1998,
    125000,
    95000,
    225000,
    40000,
    70000,
    'Assignment',
    12000,
    'Excellent investment property in growing Atlanta neighborhood. Tenant-occupied with lease ending in 60 days. Perfect for fix & flip or rental. Huge equity potential.',
    ARRAY['75% Equity Upside', 'Growing Neighborhood', 'Tenant Occupied', 'Fast Assignment', 'Clear Title'],
    'Fair',
    'Clear',
    'Tenant Occupied',
    'Available',
    true,
    false,
    'https://images.unsplash.com/photo-1568605114967-8130f3a36994'
  ),
  (
    'Houston Multi-Family - Cashflow Beast',
    '910 Main Street',
    'Houston',
    'Texas',
    'Harris County',
    '77002',
    'Multi-Family',
    8,
    6.0,
    4500,
    '0.5 acres',
    1985,
    425000,
    340000,
    650000,
    75000,
    135000,
    'Owned',
    NULL,
    'Fully occupied 4-unit property in Houston. All units rented at market rates. Immediate cashflow opportunity. We own this property free and clear - quick close possible.',
    ARRAY['100% Occupied', 'Immediate Cashflow', 'Below Market Price', 'Quick Close', 'Elite Members Only'],
    'Good',
    'Clear',
    'Tenant Occupied',
    'Available',
    true,
    true,
    'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2'
  ),
  (
    'Phoenix Land - Development Opportunity',
    'Lot 42, Desert Valley Road',
    'Phoenix',
    'Arizona',
    'Maricopa County',
    '85001',
    'Land',
    0,
    0,
    0,
    '2.5 acres',
    NULL,
    75000,
    55000,
    180000,
    0,
    105000,
    'JV Opportunity',
    NULL,
    'Prime 2.5 acre lot zoned for residential development. All utilities at street. Perfect for builder or developer. We''re open to JV partnerships on this one.',
    ARRAY['2.5 Acres', 'Zoned Residential', 'Utilities Available', 'JV Welcome', 'High Growth Area'],
    'Excellent',
    'Clear',
    'Vacant',
    'Available',
    false,
    true,
    'https://images.unsplash.com/photo-1500382017468-9049fed747ef'
  );

-- Grant permissions
GRANT ALL ON private_listings TO authenticated;
GRANT ALL ON listing_inquiries TO authenticated;
GRANT ALL ON listing_favorites TO authenticated;
GRANT ALL ON listing_views TO authenticated;
GRANT SELECT ON listing_analytics TO authenticated;

SELECT 'Private Members Marketplace setup complete! ✅' AS status;
