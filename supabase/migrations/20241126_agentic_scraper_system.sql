-- ==================================================================
-- AGENTIC AI SCRAPER SYSTEM - DATABASE SCHEMA
-- World's Most Advanced Property Scraping Infrastructure
-- ==================================================================

-- Proxy Pool Management
CREATE TABLE IF NOT EXISTS proxy_pool (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL UNIQUE,
  provider TEXT NOT NULL, -- brightdata, oxylabs, smartproxy, free
  type TEXT DEFAULT 'residential', -- residential, datacenter, mobile
  country TEXT DEFAULT 'us',
  status TEXT DEFAULT 'active', -- active, failed, paused
  success_count INTEGER DEFAULT 0,
  fail_count INTEGER DEFAULT 0,
  last_used TIMESTAMPTZ,
  last_health_check TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_proxy_pool_status ON proxy_pool(status);
CREATE INDEX idx_proxy_pool_last_used ON proxy_pool(last_used);

-- Scraper Queue (Task Management)
CREATE TABLE IF NOT EXISTS scraper_queue (
  id BIGSERIAL PRIMARY KEY,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  priority INTEGER DEFAULT 50, -- 0-100, higher = more urgent
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed, paused
  worker_id INTEGER,
  attempts INTEGER DEFAULT 0,
  result JSONB,
  error_message TEXT,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraper_queue_status ON scraper_queue(status);
CREATE INDEX idx_scraper_queue_priority ON scraper_queue(priority DESC);
CREATE INDEX idx_scraper_queue_county_state ON scraper_queue(county, state);

-- Scraper Configurations (AI-Discovered)
CREATE TABLE IF NOT EXISTS scraper_configs (
  id BIGSERIAL PRIMARY KEY,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  scraper_type TEXT DEFAULT 'tax_deed', -- tax_deed, tax_delinquent, redeemable
  website_url TEXT,
  selectors JSONB, -- AI-discovered selectors
  scraper_method TEXT DEFAULT 'web_scrape', -- web_scrape, api, manual
  ai_confidence FLOAT DEFAULT 0.5, -- 0.0-1.0
  data_structure TEXT, -- table, json, api, cards
  notes TEXT,
  last_scraped TIMESTAMPTZ,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(county, state, scraper_type)
);

CREATE INDEX idx_scraper_configs_county_state ON scraper_configs(county, state);

-- Scraper Logs (Audit Trail)
CREATE TABLE IF NOT EXISTS scraper_logs (
  id BIGSERIAL PRIMARY KEY,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  scraper_type TEXT,
  status TEXT DEFAULT 'success', -- success, failed, partial
  records_found INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  error_message TEXT,
  proxy_used TEXT,
  ai_method TEXT, -- pattern_match, ai_search, state_portal, fallback
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scraper_logs_county_state ON scraper_logs(county, state);
CREATE INDEX idx_scraper_logs_created_at ON scraper_logs(created_at DESC);
CREATE INDEX idx_scraper_logs_status ON scraper_logs(status);

-- AI Agent Tasks (for complex multi-step operations)
CREATE TABLE IF NOT EXISTS ai_agent_tasks (
  id BIGSERIAL PRIMARY KEY,
  task_type TEXT NOT NULL, -- discover_website, analyze_structure, extract_data, validate_data
  county TEXT,
  state TEXT,
  status TEXT DEFAULT 'pending', -- pending, processing, completed, failed
  input_data JSONB,
  output_data JSONB,
  ai_model TEXT, -- claude-3-opus, gpt-4, sonar
  tokens_used INTEGER,
  confidence_score FLOAT,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_agent_tasks_status ON ai_agent_tasks(status);
CREATE INDEX idx_ai_agent_tasks_task_type ON ai_agent_tasks(task_type);

-- County Metadata (for prioritization)
CREATE TABLE IF NOT EXISTS county_metadata (
  id BIGSERIAL PRIMARY KEY,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  state_abbr TEXT NOT NULL,
  population INTEGER,
  median_home_value INTEGER,
  total_properties INTEGER,
  historical_auction_volume INTEGER,
  user_interest_score INTEGER DEFAULT 0, -- Based on user searches
  priority_score FLOAT DEFAULT 50.0,
  last_census_update TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(county, state)
);

CREATE INDEX idx_county_metadata_priority ON county_metadata(priority_score DESC);
CREATE INDEX idx_county_metadata_state ON county_metadata(state);

-- CAPTCHA Solving Log (for tracking)
CREATE TABLE IF NOT EXISTS captcha_logs (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  service TEXT, -- 2captcha, anticaptcha, capsolver
  captcha_type TEXT, -- recaptcha_v2, recaptcha_v3, hcaptcha
  solved BOOLEAN DEFAULT FALSE,
  solution_time_ms INTEGER,
  cost_usd DECIMAL(10, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate Limit Detection
CREATE TABLE IF NOT EXISTS rate_limit_events (
  id BIGSERIAL PRIMARY KEY,
  url TEXT NOT NULL,
  proxy_id BIGINT REFERENCES proxy_pool(id),
  response_code INTEGER,
  rate_limited BOOLEAN DEFAULT TRUE,
  cooldown_minutes INTEGER DEFAULT 60,
  detected_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limit_events_url ON rate_limit_events(url);
CREATE INDEX idx_rate_limit_events_proxy_id ON rate_limit_events(proxy_id);

-- ==================================================================
-- FUNCTIONS & TRIGGERS
-- ==================================================================

-- Auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proxy_pool_updated_at
  BEFORE UPDATE ON proxy_pool
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraper_queue_updated_at
  BEFORE UPDATE ON scraper_queue
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_county_metadata_updated_at
  BEFORE UPDATE ON county_metadata
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================================================================
-- INITIAL DATA - Top US Counties
-- ==================================================================

INSERT INTO county_metadata (county, state, state_abbr, population, median_home_value, priority_score) VALUES
  ('Los Angeles', 'California', 'CA', 10014009, 731000, 95.5),
  ('Cook', 'Illinois', 'IL', 5275541, 282000, 88.2),
  ('Harris', 'Texas', 'TX', 4731145, 252000, 92.1),
  ('Maricopa', 'Arizona', 'AZ', 4485414, 392000, 90.3),
  ('San Diego', 'California', 'CA', 3298634, 804000, 94.2),
  ('Orange', 'California', 'CA', 3186989, 849000, 93.8),
  ('Miami-Dade', 'Florida', 'FL', 2701767, 428000, 91.5),
  ('Dallas', 'Texas', 'TX', 2613539, 291000, 89.7),
  ('Kings', 'New York', 'NY', 2559903, 694000, 92.4),
  ('Riverside', 'California', 'CA', 2470546, 539000, 88.9),
  ('San Bernardino', 'California', 'CA', 2180085, 460000, 86.5),
  ('Clark', 'Nevada', 'NV', 2266715, 405000, 89.2),
  ('Tarrant', 'Texas', 'TX', 2110640, 261000, 87.3),
  ('Bexar', 'Texas', 'TX', 2009324, 235000, 86.8),
  ('Wayne', 'Michigan', 'MI', 1749343, 168000, 82.1),
  ('Santa Clara', 'California', 'CA', 1936259, 1300000, 96.5),
  ('Broward', 'Florida', 'FL', 1944375, 398000, 88.4),
  ('Alameda', 'California', 'CA', 1671329, 992000, 93.1),
  ('Queens', 'New York', 'NY', 2278906, 615000, 90.8),
  ('Cuyahoga', 'Ohio', 'OH', 1235072, 183000, 81.5),
  ('Travis', 'Texas', 'TX', 1290188, 454000, 90.6),
  ('Hillsborough', 'Florida', 'FL', 1459762, 330000, 87.9),
  ('Palm Beach', 'Florida', 'FL', 1496770, 409000, 88.7),
  ('Fulton', 'Georgia', 'GA', 1063937, 349000, 86.2),
  ('Pinellas', 'Florida', 'FL', 959107, 291000, 84.8)
ON CONFLICT (county, state) DO NOTHING;

-- ==================================================================
-- VIEWS FOR MONITORING
-- ==================================================================

-- Active scraping overview
CREATE OR REPLACE VIEW scraper_dashboard AS
SELECT
  (SELECT COUNT(*) FROM scraper_queue WHERE status = 'pending') as pending_tasks,
  (SELECT COUNT(*) FROM scraper_queue WHERE status = 'processing') as active_tasks,
  (SELECT COUNT(*) FROM scraper_queue WHERE status = 'completed') as completed_tasks,
  (SELECT COUNT(*) FROM scraper_queue WHERE status = 'failed') as failed_tasks,
  (SELECT COUNT(*) FROM proxy_pool WHERE status = 'active') as active_proxies,
  (SELECT COUNT(DISTINCT county || '-' || state) FROM scraper_logs WHERE created_at > NOW() - INTERVAL '24 hours') as counties_scraped_24h,
  (SELECT SUM(records_inserted) FROM scraper_logs WHERE created_at > NOW() - INTERVAL '24 hours') as properties_added_24h;

-- Proxy health
CREATE OR REPLACE VIEW proxy_health_view AS
SELECT
  provider,
  COUNT(*) as total,
  SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
  AVG(success_count::FLOAT / NULLIF(success_count + fail_count, 0)) as avg_success_rate,
  MAX(last_used) as last_used
FROM proxy_pool
GROUP BY provider;

-- County scraping status
CREATE OR REPLACE VIEW county_scraping_status AS
SELECT
  cm.county,
  cm.state,
  cm.priority_score,
  sc.last_scraped,
  sq.status as queue_status,
  COALESCE(sl.records_found, 0) as last_records_found
FROM county_metadata cm
LEFT JOIN scraper_configs sc ON cm.county = sc.county AND cm.state = sc.state
LEFT JOIN scraper_queue sq ON cm.county = sq.county AND cm.state = sq.state
LEFT JOIN LATERAL (
  SELECT records_found
  FROM scraper_logs
  WHERE county = cm.county AND state = cm.state
  ORDER BY created_at DESC
  LIMIT 1
) sl ON TRUE
ORDER BY cm.priority_score DESC;

-- ==================================================================
-- GRANTS (for Supabase Edge Functions)
-- ==================================================================

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- ==================================================================
-- COMMENTS (Documentation)
-- ==================================================================

COMMENT ON TABLE proxy_pool IS 'Rotating proxy pool for anti-detection scraping';
COMMENT ON TABLE scraper_queue IS 'Task queue for nationwide scraping orchestration';
COMMENT ON TABLE scraper_configs IS 'AI-discovered scraper configurations per county';
COMMENT ON TABLE scraper_logs IS 'Audit trail of all scraping operations';
COMMENT ON TABLE ai_agent_tasks IS 'AI agent task tracking for intelligent operations';
COMMENT ON TABLE county_metadata IS 'US county metadata for prioritization';
COMMENT ON TABLE captcha_logs IS 'CAPTCHA solving tracking and cost monitoring';
COMMENT ON TABLE rate_limit_events IS 'Rate limit detection and cooldown management';
