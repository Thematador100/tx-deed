-- =====================================================
-- US COUNTIES MASTER DATABASE SCHEMA
-- Supports all 3,143 counties/parishes/boroughs in USA
-- =====================================================

-- Counties Master Table
CREATE TABLE IF NOT EXISTS counties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fips_code VARCHAR(5) UNIQUE NOT NULL, -- Federal Information Processing Standards code
    state_code VARCHAR(2) NOT NULL, -- Two-letter state code
    state_name VARCHAR(100) NOT NULL,
    county_name VARCHAR(100) NOT NULL,
    county_type VARCHAR(20) DEFAULT 'County', -- County, Parish, Borough, Census Area, Municipality
    population INTEGER,
    land_area_sqmi DECIMAL(10, 2),

    -- Contact Information
    county_seat VARCHAR(100),
    tax_assessor_name VARCHAR(200),
    tax_assessor_phone VARCHAR(20),
    tax_assessor_email VARCHAR(100),
    tax_collector_name VARCHAR(200),

    -- Geographic Data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),

    -- Data Source Configuration
    tax_deed_website_url TEXT,
    tax_lien_website_url TEXT,
    property_search_url TEXT,
    auction_calendar_url TEXT,

    -- Scraping Configuration
    scraper_config JSONB DEFAULT '{}'::jsonb, -- Stores selectors, auth, pagination rules
    scraper_type VARCHAR(50), -- 'direct', 'third_party', 'manual', 'api'
    scraper_status VARCHAR(20) DEFAULT 'pending', -- 'active', 'pending', 'failed', 'unsupported'
    last_scraped_at TIMESTAMP,
    scraper_frequency VARCHAR(20) DEFAULT 'daily', -- 'hourly', 'daily', 'weekly', 'monthly'

    -- Data Quality Metrics
    data_completeness_score INTEGER DEFAULT 0, -- 0-100
    avg_properties_per_scrape INTEGER DEFAULT 0,
    scraper_success_rate DECIMAL(5, 2) DEFAULT 0.00,

    -- Business Rules
    redemption_period_months INTEGER, -- How long to redeem after tax sale
    interest_rate DECIMAL(5, 2), -- Annual interest rate on tax liens
    auction_type VARCHAR(50), -- 'Tax Deed', 'Tax Lien', 'Hybrid', 'Redeemable Deed'
    online_bidding_available BOOLEAN DEFAULT false,
    registration_required BOOLEAN DEFAULT true,
    deposit_required BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(10, 2),

    -- Status Flags
    is_active BOOLEAN DEFAULT true,
    is_premium BOOLEAN DEFAULT false, -- Premium counties with high-quality data
    has_api BOOLEAN DEFAULT false,
    requires_auth BOOLEAN DEFAULT false,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_counties_state_code ON counties(state_code);
CREATE INDEX idx_counties_fips_code ON counties(fips_code);
CREATE INDEX idx_counties_scraper_status ON counties(scraper_status);
CREATE INDEX idx_counties_is_active ON counties(is_active);
CREATE INDEX idx_counties_auction_type ON counties(auction_type);
CREATE INDEX idx_counties_state_county ON counties(state_code, county_name);

-- Scraper Jobs Queue Table
CREATE TABLE IF NOT EXISTS scraper_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    job_type VARCHAR(50) NOT NULL, -- 'full_scrape', 'incremental', 'validation', 'discovery'
    status VARCHAR(20) DEFAULT 'queued', -- 'queued', 'running', 'completed', 'failed', 'retrying'
    priority INTEGER DEFAULT 5, -- 1-10, higher = more urgent

    -- Execution Details
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    execution_time_seconds INTEGER,

    -- Results
    properties_found INTEGER DEFAULT 0,
    properties_new INTEGER DEFAULT 0,
    properties_updated INTEGER DEFAULT 0,
    error_message TEXT,
    error_count INTEGER DEFAULT 0,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,

    -- Metadata
    scraper_agent VARCHAR(100), -- Which scraper/agent executed this
    scraper_version VARCHAR(20),
    config_snapshot JSONB, -- Copy of scraper_config at time of execution

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_scraper_jobs_status ON scraper_jobs(status);
CREATE INDEX idx_scraper_jobs_county_id ON scraper_jobs(county_id);
CREATE INDEX idx_scraper_jobs_created_at ON scraper_jobs(created_at DESC);

-- County Data Sources Table (Track multiple sources per county)
CREATE TABLE IF NOT EXISTS county_data_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    county_id UUID REFERENCES counties(id) ON DELETE CASCADE,
    source_name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'official_website', 'third_party', 'api', 'marketplace', 'partner'
    source_url TEXT NOT NULL,

    -- Source Configuration
    requires_login BOOLEAN DEFAULT false,
    login_credentials_stored BOOLEAN DEFAULT false,
    api_key_required BOOLEAN DEFAULT false,
    rate_limit_per_hour INTEGER,

    -- Data Quality
    reliability_score INTEGER DEFAULT 50, -- 0-100
    data_freshness VARCHAR(20), -- 'real-time', 'daily', 'weekly', 'monthly', 'unknown'
    avg_response_time_ms INTEGER,

    -- Status
    is_active BOOLEAN DEFAULT true,
    last_checked_at TIMESTAMP,
    last_successful_at TIMESTAMP,
    consecutive_failures INTEGER DEFAULT 0,

    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_data_sources_county_id ON county_data_sources(county_id);
CREATE INDEX idx_data_sources_is_active ON county_data_sources(is_active);

-- County Website Patterns Table (Store learned scraping patterns)
CREATE TABLE IF NOT EXISTS county_website_patterns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pattern_name VARCHAR(100) NOT NULL,
    pattern_type VARCHAR(50) NOT NULL, -- 'table', 'list', 'api', 'pdf', 'map', 'calendar'

    -- Pattern matching
    url_pattern TEXT, -- Regex to match URLs
    software_platform VARCHAR(100), -- 'Tyler Technologies', 'Courthouse Technologies', 'SoftwareSystems', etc.

    -- Scraping selectors (CSS/XPath)
    selectors JSONB NOT NULL, -- {property_id: '.property-id', address: '.address', etc.}

    -- Extraction rules
    extraction_rules JSONB, -- {date_format: 'MM/DD/YYYY', price_regex: '\\$[\\d,]+', etc.}
    pagination_config JSONB, -- {type: 'load_more', selector: '.next-page', max_pages: 50}

    -- Applicability
    counties_using_pattern UUID[], -- Array of county IDs using this pattern
    success_rate DECIMAL(5, 2) DEFAULT 0.00,

    -- Metadata
    discovered_by VARCHAR(50), -- 'manual', 'ai_discovery', 'user_contribution'
    times_used INTEGER DEFAULT 0,
    is_verified BOOLEAN DEFAULT false,

    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_website_patterns_platform ON county_website_patterns(software_platform);
CREATE INDEX idx_website_patterns_type ON county_website_patterns(pattern_type);

-- Update properties table to link to counties
ALTER TABLE properties ADD COLUMN IF NOT EXISTS county_id UUID REFERENCES counties(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS fips_code VARCHAR(5);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS data_source_id UUID REFERENCES county_data_sources(id);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS last_verified_at TIMESTAMP;

CREATE INDEX idx_properties_county_id ON properties(county_id);
CREATE INDEX idx_properties_fips_code ON properties(fips_code);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER update_counties_updated_at BEFORE UPDATE ON counties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_scraper_jobs_updated_at BEFORE UPDATE ON scraper_jobs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_county_data_sources_updated_at BEFORE UPDATE ON county_data_sources
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- View: Counties with Active Scrapers
CREATE OR REPLACE VIEW counties_with_active_scrapers AS
SELECT
    c.*,
    COUNT(DISTINCT cds.id) as active_sources_count,
    MAX(sj.completed_at) as last_scrape_completed,
    AVG(sj.properties_found) as avg_properties_per_scrape,
    SUM(CASE WHEN sj.status = 'failed' THEN 1 ELSE 0 END) as total_failures
FROM counties c
LEFT JOIN county_data_sources cds ON c.id = cds.county_id AND cds.is_active = true
LEFT JOIN scraper_jobs sj ON c.id = sj.county_id
WHERE c.is_active = true
GROUP BY c.id;

-- View: Scraper Performance Metrics
CREATE OR REPLACE VIEW scraper_performance_metrics AS
SELECT
    c.state_code,
    c.state_name,
    COUNT(DISTINCT c.id) as total_counties,
    COUNT(DISTINCT CASE WHEN c.scraper_status = 'active' THEN c.id END) as active_scrapers,
    COUNT(DISTINCT CASE WHEN c.has_api = true THEN c.id END) as api_available,
    AVG(c.data_completeness_score) as avg_completeness,
    AVG(c.scraper_success_rate) as avg_success_rate,
    SUM(c.avg_properties_per_scrape) as total_properties_tracked
FROM counties c
GROUP BY c.state_code, c.state_name
ORDER BY total_properties_tracked DESC;

COMMENT ON TABLE counties IS 'Master registry of all US counties with tax deed/lien data sources';
COMMENT ON TABLE scraper_jobs IS 'Job queue for automated county data scraping operations';
COMMENT ON TABLE county_data_sources IS 'Multiple data sources per county (official websites, APIs, third parties)';
COMMENT ON TABLE county_website_patterns IS 'Reusable scraping patterns learned across similar county websites';
