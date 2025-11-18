-- Database Setup for Automation System
-- Run this in your Supabase SQL Editor

-- ============================================
-- 1. DATABASE TRIGGERS
-- ============================================

-- Trigger: Auto-enrich property when inserted
CREATE OR REPLACE FUNCTION trigger_property_enrichment()
RETURNS TRIGGER AS $$
BEGIN
  -- Call property-enrichment Edge Function
  PERFORM net.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/property-enrichment',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    ),
    body := jsonb_build_object('propertyId', NEW.id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_property_insert
  AFTER INSERT ON properties
  FOR EACH ROW
  EXECUTE FUNCTION trigger_property_enrichment();

-- ============================================
-- 2. ADMIN ALERTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS admin_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_admin_alerts_created_at ON admin_alerts(created_at DESC);
CREATE INDEX idx_admin_alerts_unread ON admin_alerts(is_read) WHERE is_read = FALSE;

-- RLS Policies
ALTER TABLE admin_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all alerts"
  ON admin_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 3. AGENT STATUS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS agent_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT UNIQUE NOT NULL,
  agent_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('active', 'idle', 'error', 'disabled')),
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  success_rate NUMERIC(5,2),
  total_runs INTEGER DEFAULT 0,
  successful_runs INTEGER DEFAULT 0,
  failed_runs INTEGER DEFAULT 0,
  last_error TEXT,
  config JSONB,
  metrics JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Insert default agents
INSERT INTO agent_status (agent_name, agent_type, status, config) VALUES
  ('county-scraper', 'Data Scraper', 'active', '{"schedule": "0 3 * * *", "counties": "all"}'::jsonb),
  ('property-enrichment', 'Data Processor', 'active', '{"batch_size": 50}'::jsonb),
  ('news-monitor', 'News Scraper', 'active', '{"sources": ["reuters", "local"]}'::jsonb),
  ('buyer-match-engine', 'AI Worker', 'active', '{"model": "proprietary"}'::jsonb),
  ('email-automation', 'Communication', 'active', '{"provider": "sendgrid"}'::jsonb)
ON CONFLICT (agent_name) DO NOTHING;

-- RLS Policy
ALTER TABLE agent_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage agents"
  ON agent_status FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ============================================
-- 4. AUTOMATION LOGS
-- ============================================

CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT CHECK (status IN ('started', 'completed', 'failed')),
  details JSONB,
  error_message TEXT,
  duration_ms INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_automation_logs_agent ON automation_logs(agent_name);
CREATE INDEX idx_automation_logs_created_at ON automation_logs(created_at DESC);
CREATE INDEX idx_automation_logs_status ON automation_logs(status);

-- Auto-delete logs older than 30 days
CREATE OR REPLACE FUNCTION delete_old_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM automation_logs
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. SMART CLASSIFICATION CACHE
-- ============================================

CREATE TABLE IF NOT EXISTS classification_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_hash TEXT UNIQUE NOT NULL,
  filename TEXT,
  classification TEXT NOT NULL,
  table_name TEXT NOT NULL,
  confidence NUMERIC(3,2),
  extracted_fields JSONB,
  record_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_classification_cache_hash ON classification_cache(file_hash);

-- ============================================
-- 6. USER AUTOMATION PREFERENCES
-- ============================================

CREATE TABLE IF NOT EXISTS user_automation_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email_alerts BOOLEAN DEFAULT TRUE,
  sms_alerts BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  auto_buyer_match BOOLEAN DEFAULT FALSE,
  auto_document_generation BOOLEAN DEFAULT TRUE,
  alert_counties TEXT[],
  alert_property_types TEXT[],
  alert_min_roi INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- RLS Policy
ALTER TABLE user_automation_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_automation_preferences FOR ALL
  USING (auth.uid() = user_id);

-- ============================================
-- 7. HELPER FUNCTIONS
-- ============================================

-- Function to log automation events
CREATE OR REPLACE FUNCTION log_automation_event(
  p_agent_name TEXT,
  p_event_type TEXT,
  p_status TEXT,
  p_details JSONB DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO automation_logs (
    agent_name,
    event_type,
    status,
    details,
    error_message,
    duration_ms
  ) VALUES (
    p_agent_name,
    p_event_type,
    p_status,
    p_details,
    p_error_message,
    p_duration_ms
  ) RETURNING id INTO v_log_id;

  -- Update agent status
  UPDATE agent_status
  SET
    last_run_at = NOW(),
    total_runs = total_runs + 1,
    successful_runs = CASE WHEN p_status = 'completed' THEN successful_runs + 1 ELSE successful_runs END,
    failed_runs = CASE WHEN p_status = 'failed' THEN failed_runs + 1 ELSE failed_runs END,
    success_rate = (successful_runs::NUMERIC / NULLIF(total_runs, 0)) * 100,
    last_error = CASE WHEN p_status = 'failed' THEN p_error_message ELSE last_error END,
    updated_at = NOW()
  WHERE agent_name = p_agent_name;

  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create admin alert
CREATE OR REPLACE FUNCTION create_admin_alert(
  p_title TEXT,
  p_message TEXT,
  p_severity TEXT DEFAULT 'info',
  p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO admin_alerts (title, message, severity, details)
  VALUES (p_title, p_message, p_severity, p_details)
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- ============================================

SELECT 'Automation setup complete! ✅' AS status;
