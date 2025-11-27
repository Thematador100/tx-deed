-- Scout Agents Table
CREATE TABLE IF NOT EXISTS scout_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_phone TEXT,
  name TEXT NOT NULL,
  criteria JSONB NOT NULL,
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": false}',
  is_active BOOLEAN DEFAULT true,
  frequency TEXT DEFAULT 'daily',
  last_check_at TIMESTAMPTZ,
  alert_count INTEGER DEFAULT 0,
  properties_found INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Scout Agent Alerts Table (history)
CREATE TABLE IF NOT EXISTS scout_agent_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id UUID REFERENCES scout_agents(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  match_score INTEGER,
  notified_at TIMESTAMPTZ DEFAULT NOW(),
  viewed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_scout_agents_user ON scout_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_scout_agents_active ON scout_agents(is_active);
CREATE INDEX IF NOT EXISTS idx_scout_agent_alerts_agent ON scout_agent_alerts(agent_id);
CREATE INDEX IF NOT EXISTS idx_scout_agent_alerts_property ON scout_agent_alerts(property_id);

-- RLS Policies
ALTER TABLE scout_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_agent_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own scout agents"
  ON scout_agents FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can view own agent alerts"
  ON scout_agent_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM scout_agents
      WHERE scout_agents.id = scout_agent_alerts.agent_id
      AND scout_agents.user_id = auth.uid()
    )
  );

-- Trigger
CREATE TRIGGER update_scout_agents_updated_at
  BEFORE UPDATE ON scout_agents
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
