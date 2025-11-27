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
