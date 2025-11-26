-- Migration: Add tables for AI features (Deal Rescue, Dispo Copilot, Deal Dossier)
-- Created: 2025-01-26

-- 1. DEAL RESCUE ANALYSES TABLE
CREATE TABLE IF NOT EXISTS deal_rescue_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  days_on_market INTEGER,
  analysis JSONB NOT NULL DEFAULT '{}',
  alternative_buyers_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_rescue_property_id ON deal_rescue_analyses(property_id);
CREATE INDEX idx_deal_rescue_created_at ON deal_rescue_analyses(created_at DESC);

-- 2. DISPO COPILOT RESULTS TABLE
CREATE TABLE IF NOT EXISTS dispo_copilot_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('price_recommendation', 'generate_microsite', 'create_outreach', 'all')),
  results JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_dispo_copilot_property_id ON dispo_copilot_results(property_id);
CREATE INDEX idx_dispo_copilot_action ON dispo_copilot_results(action);
CREATE INDEX idx_dispo_copilot_created_at ON dispo_copilot_results(created_at DESC);

-- 3. DEAL DOSSIERS TABLE
CREATE TABLE IF NOT EXISTS deal_dossiers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  dossier JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_deal_dossiers_property_id ON deal_dossiers(property_id);
CREATE INDEX idx_deal_dossiers_created_at ON deal_dossiers(created_at DESC);

-- Add RLS policies

-- Deal Rescue Analyses RLS
ALTER TABLE deal_rescue_analyses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view analyses for properties they saved"
  ON deal_rescue_analyses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saved_properties
      WHERE saved_properties.property_id = deal_rescue_analyses.property_id
      AND saved_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all analyses"
  ON deal_rescue_analyses FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Dispo Copilot Results RLS
ALTER TABLE dispo_copilot_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view copilot results for properties they saved"
  ON dispo_copilot_results FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saved_properties
      WHERE saved_properties.property_id = dispo_copilot_results.property_id
      AND saved_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all copilot results"
  ON dispo_copilot_results FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Deal Dossiers RLS
ALTER TABLE deal_dossiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view dossiers for properties they saved"
  ON deal_dossiers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM saved_properties
      WHERE saved_properties.property_id = deal_dossiers.property_id
      AND saved_properties.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all dossiers"
  ON deal_dossiers FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_deal_rescue_updated_at BEFORE UPDATE ON deal_rescue_analyses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dispo_copilot_updated_at BEFORE UPDATE ON dispo_copilot_results
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deal_dossiers_updated_at BEFORE UPDATE ON deal_dossiers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
