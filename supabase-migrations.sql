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
-- Migration Complete!
-- ============================================================================
-- All tables have been created with proper indexes, foreign keys, and RLS policies
-- The autonomous agents can now operate fully autonomously with database persistence
-- ============================================================================
