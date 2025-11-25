-- Database Schema for TX Deed Scraping Agents
-- Run this in your Supabase SQL editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Properties table (if not already exists)
CREATE TABLE IF NOT EXISTS properties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    external_id TEXT,
    account_number TEXT,
    parcel_id TEXT,

    -- Location
    address TEXT NOT NULL,
    city TEXT,
    county TEXT NOT NULL,
    state TEXT DEFAULT 'TX',
    zip_code TEXT,

    -- Property Details
    property_type TEXT,
    bedrooms INTEGER,
    bathrooms DECIMAL(3,1),
    sqft INTEGER,
    lot_size TEXT,
    year_built INTEGER,

    -- Financial
    price DECIMAL(12,2),
    estimated_value DECIMAL(12,2),
    appraised_value DECIMAL(12,2),
    assessed_value DECIMAL(12,2),
    minimum_bid DECIMAL(12,2),
    opening_bid DECIMAL(12,2),
    taxes_owed DECIMAL(12,2),
    total_debt DECIMAL(12,2),

    -- Sale Information
    listing_type TEXT,
    status TEXT,
    auction_date TIMESTAMPTZ,
    sale_date TIMESTAMPTZ,
    sale_location TEXT,
    case_number TEXT,

    -- Additional Data
    owner_name TEXT,
    legal_description TEXT,
    redemption_period INTEGER,
    description TEXT,

    -- Calculated Fields
    roi DECIMAL(8,2),
    opportunity_score INTEGER CHECK (opportunity_score >= 0 AND opportunity_score <= 100),

    -- Geographic
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),

    -- Metadata
    source_url TEXT,
    scraped_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Indexes
    UNIQUE(address, county)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_county ON properties(county);
CREATE INDEX IF NOT EXISTS idx_properties_opportunity_score ON properties(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_properties_sale_date ON properties(sale_date);
CREATE INDEX IF NOT EXISTS idx_properties_status ON properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_scraped_at ON properties(scraped_at DESC);

-- Scout agents table (if not already exists)
CREATE TABLE IF NOT EXISTS scout_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_name TEXT NOT NULL,
    criteria JSONB NOT NULL DEFAULT '{}',
    notification_method TEXT DEFAULT 'email',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scout_agents_user_id ON scout_agents(user_id);
CREATE INDEX IF NOT EXISTS idx_scout_agents_is_active ON scout_agents(is_active) WHERE is_active = true;

-- Scraper runs table (for logging)
CREATE TABLE IF NOT EXISTS scraper_runs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    county TEXT NOT NULL,
    started_at TIMESTAMPTZ NOT NULL,
    completed_at TIMESTAMPTZ,
    status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    properties_found INTEGER DEFAULT 0,
    properties_saved INTEGER DEFAULT 0,
    errors JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scraper_runs_county ON scraper_runs(county);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_started_at ON scraper_runs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scraper_runs_status ON scraper_runs(status);

-- Agent notifications table
CREATE TABLE IF NOT EXISTS agent_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES scout_agents(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed')),
    notified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(agent_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_agent_notifications_agent_id ON agent_notifications(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_notifications_status ON agent_notifications(status) WHERE status = 'pending';

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_properties_updated_at ON properties;
CREATE TRIGGER update_properties_updated_at
    BEFORE UPDATE ON properties
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scout_agents_updated_at ON scout_agents;
CREATE TRIGGER update_scout_agents_updated_at
    BEFORE UPDATE ON scout_agents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE scout_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_notifications ENABLE ROW LEVEL SECURITY;

-- Users can only see their own scout agents
CREATE POLICY "Users can view own scout agents"
    ON scout_agents FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own scout agents"
    ON scout_agents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scout agents"
    ON scout_agents FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scout agents"
    ON scout_agents FOR DELETE
    USING (auth.uid() = user_id);

-- Service role can access everything (for scraper)
CREATE POLICY "Service role has full access to scout_agents"
    ON scout_agents
    USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Properties are publicly readable
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Properties are viewable by everyone"
    ON properties FOR SELECT
    USING (true);

-- Only service role can insert/update properties (scrapers)
CREATE POLICY "Service role can insert properties"
    ON properties FOR INSERT
    WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

CREATE POLICY "Service role can update properties"
    ON properties FOR UPDATE
    USING (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Scraper runs viewable by authenticated users
ALTER TABLE scraper_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can view scraper runs"
    ON scraper_runs FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can insert scraper runs"
    ON scraper_runs FOR INSERT
    WITH CHECK (current_setting('request.jwt.claims', true)::json->>'role' = 'service_role');

-- Create view for scraper statistics
CREATE OR REPLACE VIEW scraper_statistics AS
SELECT
    county,
    COUNT(*) as total_runs,
    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as successful_runs,
    SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END) as failed_runs,
    SUM(properties_saved) as total_properties_saved,
    AVG(properties_saved) as avg_properties_per_run,
    MAX(started_at) as last_run_at
FROM scraper_runs
GROUP BY county;

-- Grant access to views
GRANT SELECT ON scraper_statistics TO authenticated;
