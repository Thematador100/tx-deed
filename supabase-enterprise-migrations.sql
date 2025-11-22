-- ============================================================================
-- ENTERPRISE PLATFORM DATABASE MIGRATIONS
-- ============================================================================
-- Complete schema for autonomous, self-running enterprise property platform
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. Property Valuations Table
-- ============================================================================
-- Stores comprehensive valuations from AdvancedValuationEngine

CREATE TABLE IF NOT EXISTS property_valuations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Valuation methods
  methods JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Final valuation
  final_valuation JSONB,

  -- Confidence and risk metrics
  confidence DECIMAL(3,2),
  risk_metrics JSONB,

  -- Recommendations
  recommendations JSONB DEFAULT '[]'::jsonb,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_property_valuation FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_valuations_property_id ON property_valuations(property_id);
CREATE INDEX IF NOT EXISTS idx_valuations_timestamp ON property_valuations(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_valuations_confidence ON property_valuations(confidence DESC);

-- ============================================================================
-- 2. ML Decisions Table
-- ============================================================================
-- Stores autonomous investment decisions from MLDecisionEngine

CREATE TABLE IF NOT EXISTS ml_decisions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,

  -- Decision details
  action TEXT NOT NULL, -- BUY_IMMEDIATELY, ANALYZE_FURTHER, MONITOR, CONSIDER, PASS
  priority TEXT NOT NULL, -- URGENT, HIGH, MEDIUM, LOW, NONE
  overall_score DECIMAL(3,2),
  confidence DECIMAL(3,2),

  -- Reasoning
  reasoning TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Predictions
  predictions JSONB,

  -- Offer recommendations
  recommended_offer DECIMAL(12,2),
  max_offer DECIMAL(12,2),

  -- Strategy
  hold_strategy JSONB,
  exit_strategy JSONB,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, executed, reviewed, declined
  executed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_decision_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_decisions_property_id ON ml_decisions(property_id);
CREATE INDEX IF NOT EXISTS idx_decisions_action ON ml_decisions(action);
CREATE INDEX IF NOT EXISTS idx_decisions_priority ON ml_decisions(priority);
CREATE INDEX IF NOT EXISTS idx_decisions_score ON ml_decisions(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_decisions_created ON ml_decisions(created_at DESC);

-- ============================================================================
-- 3. Decision Outcomes Table
-- ============================================================================
-- Tracks actual outcomes for ML learning

CREATE TABLE IF NOT EXISTS decision_outcomes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  decision_id UUID NOT NULL,
  property_id UUID NOT NULL,

  -- Actual outcomes
  purchased BOOLEAN DEFAULT false,
  purchase_price DECIMAL(12,2),
  purchase_date DATE,

  -- Performance
  actual_return DECIMAL(5,4), -- 0.1234 = 12.34%
  holding_period_months INTEGER,
  exit_price DECIMAL(12,2),
  exit_date DATE,

  -- Accuracy
  prediction_accuracy DECIMAL(3,2),

  -- Notes
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_outcome_decision FOREIGN KEY (decision_id) REFERENCES ml_decisions(id) ON DELETE CASCADE,
  CONSTRAINT fk_outcome_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_outcomes_decision_id ON decision_outcomes(decision_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_purchased ON decision_outcomes(purchased);
CREATE INDEX IF NOT EXISTS idx_outcomes_return ON decision_outcomes(actual_return DESC);

-- ============================================================================
-- 4. Prospect Lists Table
-- ============================================================================
-- Stores targeted prospect lists from ProspectingAgent

CREATE TABLE IF NOT EXISTS prospect_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  priority TEXT, -- HIGH, MEDIUM, LOW
  action TEXT, -- Campaign type

  -- List metrics
  lead_count INTEGER DEFAULT 0,

  -- Leads (denormalized for performance)
  leads JSONB DEFAULT '[]'::jsonb,

  -- Status
  is_active BOOLEAN DEFAULT true,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_prospect_lists_priority ON prospect_lists(priority);
CREATE INDEX IF NOT EXISTS idx_prospect_lists_active ON prospect_lists(is_active);
CREATE INDEX IF NOT EXISTS idx_prospect_lists_created ON prospect_lists(created_at DESC);

-- ============================================================================
-- 5. Marketing Campaigns Table
-- ============================================================================
-- Auto-generated marketing campaigns

CREATE TABLE IF NOT EXISTS marketing_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  list_id UUID,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  priority TEXT,

  -- Content
  subject_lines TEXT[] DEFAULT ARRAY[]::TEXT[],
  message_templates TEXT,
  call_to_action TEXT,

  -- Targeting
  target_audience JSONB,
  total_leads INTEGER DEFAULT 0,

  -- Metrics
  metrics JSONB DEFAULT '{
    "sent": 0,
    "opened": 0,
    "clicked": 0,
    "responded": 0,
    "converted": 0
  }'::jsonb,

  -- Status
  status TEXT DEFAULT 'draft', -- draft, active, paused, completed
  launched_at TIMESTAMP,
  completed_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_campaign_list FOREIGN KEY (list_id) REFERENCES prospect_lists(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_list_id ON marketing_campaigns(list_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON marketing_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_campaigns_type ON marketing_campaigns(type);
CREATE INDEX IF NOT EXISTS idx_campaigns_created ON marketing_campaigns(created_at DESC);

-- ============================================================================
-- 6. Market Reports Table
-- ============================================================================
-- Engineering as Marketing - auto-generated market reports

CREATE TABLE IF NOT EXISTS market_reports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  type TEXT NOT NULL, -- market_trends, hot_spots, deal_analysis
  generated_at TIMESTAMP DEFAULT NOW(),

  -- Report data
  data JSONB,
  insights JSONB,

  -- Publishing
  published BOOLEAN DEFAULT false,
  published_at TIMESTAMP,
  public_url TEXT,

  -- Metrics
  views INTEGER DEFAULT 0,
  downloads INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_type ON market_reports(type);
CREATE INDEX IF NOT EXISTS idx_reports_published ON market_reports(published);
CREATE INDEX IF NOT EXISTS idx_reports_generated ON market_reports(generated_at DESC);

-- ============================================================================
-- 7. Offers Table
-- ============================================================================
-- Tracks property offers

CREATE TABLE IF NOT EXISTS offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  decision_id UUID,

  -- Offer details
  offer_amount DECIMAL(12,2) NOT NULL,
  max_amount DECIMAL(12,2),
  terms TEXT,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, accepted, rejected, countered, expired
  responded_at TIMESTAMP,
  response_notes TEXT,

  -- Counter offer
  counter_amount DECIMAL(12,2),

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_offer_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_offer_decision FOREIGN KEY (decision_id) REFERENCES ml_decisions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_offers_property_id ON offers(property_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_created ON offers(created_at DESC);

-- ============================================================================
-- 8. Due Diligence Tasks Table
-- ============================================================================
-- Tracks due diligence workflow

CREATE TABLE IF NOT EXISTS due_diligence_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  decision_id UUID,

  -- Task details
  task_type TEXT, -- inspection, title_search, appraisal, etc.
  priority TEXT DEFAULT 'medium',
  assigned_to UUID,

  -- Status
  status TEXT DEFAULT 'scheduled', -- scheduled, in_progress, completed, cancelled
  due_date DATE,
  completed_at TIMESTAMP,

  -- Results
  results JSONB,
  notes TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_dd_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_dd_decision FOREIGN KEY (decision_id) REFERENCES ml_decisions(id) ON DELETE SET NULL,
  CONSTRAINT fk_dd_assigned FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_dd_property_id ON due_diligence_tasks(property_id);
CREATE INDEX IF NOT EXISTS idx_dd_status ON due_diligence_tasks(status);
CREATE INDEX IF NOT EXISTS idx_dd_assigned ON due_diligence_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_dd_due_date ON due_diligence_tasks(due_date);

-- ============================================================================
-- 9. Watchlist Table
-- ============================================================================
-- Properties being monitored

CREATE TABLE IF NOT EXISTS watchlist (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  user_id UUID,
  decision_id UUID,

  -- Watch details
  reason TEXT,
  price_target DECIMAL(12,2),
  alert_conditions JSONB,

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_checked TIMESTAMP,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_watch_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_watch_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT fk_watch_decision FOREIGN KEY (decision_id) REFERENCES ml_decisions(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_watchlist_property_id ON watchlist(property_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_watchlist_active ON watchlist(is_active);

-- ============================================================================
-- 10. Review Queue Table
-- ============================================================================
-- Properties flagged for human review

CREATE TABLE IF NOT EXISTS review_queue (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL,
  decision_id UUID,

  -- Review details
  priority TEXT DEFAULT 'low',
  reason TEXT,
  assigned_to UUID,

  -- Status
  status TEXT DEFAULT 'pending', -- pending, in_review, completed, dismissed
  reviewed_at TIMESTAMP,
  review_notes TEXT,
  review_decision TEXT,

  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_review_property FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_decision FOREIGN KEY (decision_id) REFERENCES ml_decisions(id) ON DELETE SET NULL,
  CONSTRAINT fk_review_assigned FOREIGN KEY (assigned_to) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_review_property_id ON review_queue(property_id);
CREATE INDEX IF NOT EXISTS idx_review_status ON review_queue(status);
CREATE INDEX IF NOT EXISTS idx_review_priority ON review_queue(priority);
CREATE INDEX IF NOT EXISTS idx_review_assigned ON review_queue(assigned_to);

-- ============================================================================
-- 11. Data Import Log Table
-- ============================================================================
-- Tracks CSV/file uploads from IntelligentDataParser

CREATE TABLE IF NOT EXISTS data_import_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,

  -- File details
  filename TEXT NOT NULL,
  file_type TEXT, -- csv, xlsx
  file_size INTEGER,

  -- Source
  data_source TEXT, -- propertyradar, custom, mls, etc.

  -- Processing stats
  total_rows INTEGER DEFAULT 0,
  valid_rows INTEGER DEFAULT 0,
  invalid_rows INTEGER DEFAULT 0,
  inserted INTEGER DEFAULT 0,
  updated INTEGER DEFAULT 0,
  duplicates INTEGER DEFAULT 0,

  -- Column mappings detected
  mappings JSONB,

  -- Invalid records for review
  invalid_records JSONB,

  -- Status
  status TEXT DEFAULT 'processing', -- processing, completed, failed
  error_message TEXT,

  -- Timing
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  duration_ms INTEGER,

  created_at TIMESTAMP DEFAULT NOW(),

  CONSTRAINT fk_import_user FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_import_user_id ON data_import_log(user_id);
CREATE INDEX IF NOT EXISTS idx_import_status ON data_import_log(status);
CREATE INDEX IF NOT EXISTS idx_import_source ON data_import_log(data_source);
CREATE INDEX IF NOT EXISTS idx_import_created ON data_import_log(created_at DESC);

-- ============================================================================
-- 12. System Analytics Table
-- ============================================================================
-- Track overall system performance and metrics

CREATE TABLE IF NOT EXISTS system_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP DEFAULT NOW(),
  period TEXT DEFAULT 'hourly', -- hourly, daily, weekly, monthly

  -- Agent metrics
  agents_running INTEGER DEFAULT 0,
  total_properties INTEGER DEFAULT 0,
  properties_processed_24h INTEGER DEFAULT 0,

  -- Performance metrics
  avg_processing_time_ms INTEGER,
  success_rate DECIMAL(5,4),

  -- Business metrics
  leads_generated INTEGER DEFAULT 0,
  valuations_completed INTEGER DEFAULT 0,
  decisions_made INTEGER DEFAULT 0,
  offers_sent INTEGER DEFAULT 0,

  -- System health
  uptime_hours DECIMAL(10,2),
  error_count INTEGER DEFAULT 0,

  -- Data
  metrics JSONB,

  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_timestamp ON system_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_period ON system_analytics(period);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Property Valuations
ALTER TABLE property_valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view valuations"
  ON property_valuations FOR SELECT
  TO authenticated
  USING (true);

-- ML Decisions
ALTER TABLE ml_decisions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated users can view decisions"
  ON ml_decisions FOR SELECT
  TO authenticated
  USING (true);

-- Offers
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all offers"
  ON offers FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can insert offers"
  ON offers FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Watchlist
ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own watchlist"
  ON watchlist FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can manage own watchlist"
  ON watchlist FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Review Queue
ALTER TABLE review_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view review queue"
  ON review_queue FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Data Import Log
ALTER TABLE data_import_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own imports"
  ON data_import_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR user_id IS NULL);

-- Market Reports (Public)
ALTER TABLE market_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view published reports"
  ON market_reports FOR SELECT
  TO authenticated, anon
  USING (published = true);

-- Prospect Lists (Admin only)
ALTER TABLE prospect_lists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage prospect lists"
  ON prospect_lists FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_prospect_lists_updated_at BEFORE UPDATE ON prospect_lists
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON marketing_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_offers_updated_at BEFORE UPDATE ON offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dd_tasks_updated_at BEFORE UPDATE ON due_diligence_tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_watchlist_updated_at BEFORE UPDATE ON watchlist
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_review_queue_updated_at BEFORE UPDATE ON review_queue
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_outcomes_updated_at BEFORE UPDATE ON decision_outcomes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- VIEWS FOR ANALYTICS
-- ============================================================================

-- Portfolio performance view
CREATE OR REPLACE VIEW portfolio_performance AS
SELECT
  COUNT(*) as total_properties,
  COUNT(*) FILTER (WHERE status = 'purchased') as properties_owned,
  SUM(purchase_price) FILTER (WHERE purchased = true) as total_invested,
  AVG(actual_return) FILTER (WHERE actual_return IS NOT NULL) as avg_return,
  SUM(exit_price - purchase_price) FILTER (WHERE exit_price IS NOT NULL) as total_profit
FROM decision_outcomes;

-- ML accuracy view
CREATE OR REPLACE VIEW ml_accuracy AS
SELECT
  date_trunc('day', created_at) as day,
  COUNT(*) as total_decisions,
  AVG(prediction_accuracy) as avg_accuracy,
  COUNT(*) FILTER (WHERE prediction_accuracy > 0.80) as accurate_decisions,
  COUNT(*) FILTER (WHERE prediction_accuracy < 0.60) as inaccurate_decisions
FROM decision_outcomes
WHERE prediction_accuracy IS NOT NULL
GROUP BY day
ORDER BY day DESC;

-- Prospecting performance view
CREATE OR REPLACE VIEW prospecting_performance AS
SELECT
  type,
  COUNT(*) as total_campaigns,
  SUM((metrics->>'sent')::int) as total_sent,
  SUM((metrics->>'responded')::int) as total_responses,
  SUM((metrics->>'converted')::int) as total_conversions,
  CASE
    WHEN SUM((metrics->>'sent')::int) > 0
    THEN (SUM((metrics->>'responded')::int)::float / SUM((metrics->>'sent')::int) * 100)
    ELSE 0
  END as response_rate
FROM marketing_campaigns
WHERE status = 'completed'
GROUP BY type;

-- ============================================================================
-- ENTERPRISE MIGRATION COMPLETE!
-- ============================================================================
-- All enterprise tables, indexes, RLS policies, and views created
-- The system is now ready for autonomous enterprise-level operation
-- ============================================================================
