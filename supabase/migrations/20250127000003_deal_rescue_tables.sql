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
