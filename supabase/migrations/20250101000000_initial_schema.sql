-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE,
    full_name TEXT,
    role TEXT DEFAULT 'member' CHECK (role IN ('member', 'admin', 'Mentee Elite')),
    membership_tier TEXT DEFAULT 'free' CHECK (membership_tier IN ('free', 'basic', 'pro', 'elite')),
    stripe_customer_id TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create properties table
CREATE TABLE IF NOT EXISTS public.properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    county TEXT,
    parcel_id TEXT,
    owner TEXT,
    property_type TEXT,
    bedrooms INTEGER,
    bathrooms NUMERIC(3,1),
    sqft INTEGER,
    lot_size TEXT,
    year_built INTEGER,
    price NUMERIC(12,2),
    estimated_value NUMERIC(12,2),
    starting_bid NUMERIC(12,2),
    auction_date DATE,
    status TEXT DEFAULT 'active',
    listing_type TEXT CHECK (listing_type IN ('auction', 'marketplace', 'tax_deed', 'redeemable')),
    description TEXT,
    image_url TEXT,
    image_alt TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geolocation GEOGRAPHY(POINT, 4326),
    roi NUMERIC(10,2),
    opportunity_score INTEGER,
    deal_stage TEXT,
    red_flags TEXT[],
    median_income NUMERIC(12,2),
    population_density INTEGER,
    school_rating NUMERIC(3,1),
    environmental_risks TEXT[],
    data_source TEXT, -- Which scraper/source this came from
    source_url TEXT, -- Original listing URL
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create tax_delinquent_leads table
CREATE TABLE IF NOT EXISTS public.tax_delinquent_leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    parcel_id TEXT NOT NULL,
    owner TEXT,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    county TEXT,
    delinquent_amount NUMERIC(12,2),
    starting_bid NUMERIC(12,2),
    auction_date DATE,
    status TEXT DEFAULT 'Initial Notice',
    property_type TEXT,
    image_url TEXT,
    image_alt TEXT,
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geolocation GEOGRAPHY(POINT, 4326),
    data_source TEXT,
    source_url TEXT,
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create redeemable_deeds table
CREATE TABLE IF NOT EXISTS public.redeemable_deeds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    address TEXT NOT NULL,
    city TEXT,
    state TEXT NOT NULL,
    county TEXT,
    original_owner TEXT,
    new_owner TEXT,
    sale_price NUMERIC(12,2),
    estimated_value NUMERIC(12,2),
    redemption_date DATE,
    redemption_period_months INTEGER,
    interest_rate NUMERIC(5,2),
    status TEXT DEFAULT 'Redeemable',
    data_source TEXT,
    source_url TEXT,
    scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create scraper_configs table to store county-specific scraper configurations
CREATE TABLE IF NOT EXISTS public.scraper_configs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    county TEXT NOT NULL,
    state TEXT NOT NULL,
    scraper_type TEXT NOT NULL CHECK (scraper_type IN ('tax_deed', 'tax_delinquent', 'redeemable')),
    website_url TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    scraper_method TEXT, -- 'web_scrape', 'api', 'manual'
    selector_config JSONB, -- CSS selectors or XPath for scraping
    api_config JSONB, -- API endpoints and authentication
    last_scraped_at TIMESTAMPTZ,
    scrape_frequency_hours INTEGER DEFAULT 24,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(county, state, scraper_type)
);

-- Create scraper_logs table
CREATE TABLE IF NOT EXISTS public.scraper_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    scraper_config_id UUID REFERENCES public.scraper_configs(id),
    county TEXT,
    state TEXT,
    scraper_type TEXT,
    status TEXT CHECK (status IN ('success', 'failed', 'partial')),
    records_found INTEGER DEFAULT 0,
    records_inserted INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create user_saved_properties table
CREATE TABLE IF NOT EXISTS public.user_saved_properties (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, property_id)
);

-- Create leads table (user-uploaded or system-generated leads)
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip_code TEXT,
    lead_type TEXT,
    status TEXT DEFAULT 'new',
    source TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_properties_location ON public.properties(state, county, city);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);
CREATE INDEX IF NOT EXISTS idx_properties_auction_date ON public.properties(auction_date);
CREATE INDEX IF NOT EXISTS idx_properties_listing_type ON public.properties(listing_type);
CREATE INDEX IF NOT EXISTS idx_properties_geolocation ON public.properties USING GIST(geolocation);

CREATE INDEX IF NOT EXISTS idx_tax_delinquent_location ON public.tax_delinquent_leads(state, county, city);
CREATE INDEX IF NOT EXISTS idx_tax_delinquent_status ON public.tax_delinquent_leads(status);
CREATE INDEX IF NOT EXISTS idx_tax_delinquent_geolocation ON public.tax_delinquent_leads USING GIST(geolocation);

CREATE INDEX IF NOT EXISTS idx_redeemable_state ON public.redeemable_deeds(state);
CREATE INDEX IF NOT EXISTS idx_redeemable_redemption_date ON public.redeemable_deeds(redemption_date);

CREATE INDEX IF NOT EXISTS idx_scraper_configs_location ON public.scraper_configs(state, county, scraper_type);
CREATE INDEX IF NOT EXISTS idx_scraper_logs_status ON public.scraper_logs(status, created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER set_updated_at_profiles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_properties
    BEFORE UPDATE ON public.properties
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_tax_delinquent
    BEFORE UPDATE ON public.tax_delinquent_leads
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_redeemable
    BEFORE UPDATE ON public.redeemable_deeds
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_delinquent_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redeemable_deeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id);

-- Properties policies (viewable by all authenticated users)
CREATE POLICY "Authenticated users can view properties"
    ON public.properties FOR SELECT
    TO authenticated
    USING (true);

-- Tax delinquent leads policies
CREATE POLICY "Authenticated users can view tax delinquent leads"
    ON public.tax_delinquent_leads FOR SELECT
    TO authenticated
    USING (true);

-- Redeemable deeds policies
CREATE POLICY "Authenticated users can view redeemable deeds"
    ON public.redeemable_deeds FOR SELECT
    TO authenticated
    USING (true);

-- User saved properties policies
CREATE POLICY "Users can view their own saved properties"
    ON public.user_saved_properties FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved properties"
    ON public.user_saved_properties FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved properties"
    ON public.user_saved_properties FOR DELETE
    USING (auth.uid() = user_id);

-- Leads policies
CREATE POLICY "Users can view their own leads"
    ON public.leads FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own leads"
    ON public.leads FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own leads"
    ON public.leads FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own leads"
    ON public.leads FOR DELETE
    USING (auth.uid() = user_id);

-- Admin policies (for scraper_configs and scraper_logs)
ALTER TABLE public.scraper_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can manage scraper configs"
    ON public.scraper_configs FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

CREATE POLICY "Only admins can view scraper logs"
    ON public.scraper_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
