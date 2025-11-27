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
