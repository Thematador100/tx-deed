-- Win With Deeds Database Schema
-- This schema supports user listings, nationwide sales calendar, and membership features

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Listings Table (for sellers to add their properties)
CREATE TABLE IF NOT EXISTS user_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  county VARCHAR(100),
  property_type VARCHAR(50), -- Single Family, Multi-Family, Land, Commercial, etc.
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  images TEXT[], -- Array of image URLs
  parcel_id VARCHAR(100),
  acreage DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  year_built INTEGER,
  redemption_period_ends DATE,
  sale_date DATE,
  liens_amount DECIMAL(12,2),
  estimated_value DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'active', -- active, pending, sold, withdrawn
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Nationwide Upcoming Sales Calendar
CREATE TABLE IF NOT EXISTS upcoming_sales (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  state VARCHAR(2) NOT NULL,
  county VARCHAR(100) NOT NULL,
  sale_date DATE NOT NULL,
  sale_time TIME,
  location_name TEXT, -- Courthouse, online, etc.
  location_address TEXT,
  registration_deadline DATE,
  deposit_required BOOLEAN DEFAULT false,
  deposit_amount DECIMAL(12,2),
  sale_type VARCHAR(50), -- Tax Deed, Tax Lien, Sheriff Sale, etc.
  num_properties INTEGER,
  website_url TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  notes TEXT,
  source_url TEXT, -- Where we scraped this from
  last_verified TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Subscriptions (for membership tracking)
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  tier VARCHAR(50) NOT NULL, -- Pro Investor, Mentee Elite, Syndicate
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active', -- active, canceled, past_due, trialing
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- User Favorites/Saved Properties
CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID, -- Can reference different tables
  property_type VARCHAR(50), -- user_listing, upcoming_sale, property, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, property_id, property_type)
);

-- Usage Tracking (for tier limits)
CREATE TABLE IF NOT EXISTS usage_tracking (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  feature VARCHAR(100) NOT NULL, -- buyer_match, deal_rescue, ai_valuation, etc.
  usage_count INTEGER DEFAULT 0,
  month VARCHAR(7) NOT NULL, -- YYYY-MM format
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, feature, month)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_listings_user_id ON user_listings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_listings_status ON user_listings(status);
CREATE INDEX IF NOT EXISTS idx_user_listings_state ON user_listings(state);
CREATE INDEX IF NOT EXISTS idx_user_listings_created_at ON user_listings(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_upcoming_sales_state ON upcoming_sales(state);
CREATE INDEX IF NOT EXISTS idx_upcoming_sales_county ON upcoming_sales(county);
CREATE INDEX IF NOT EXISTS idx_upcoming_sales_date ON upcoming_sales(sale_date);
CREATE INDEX IF NOT EXISTS idx_upcoming_sales_state_date ON upcoming_sales(state, sale_date);

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_tracking_user_month ON usage_tracking(user_id, month);

-- Row Level Security (RLS) Policies

-- User Listings: Users can only edit/delete their own listings, but everyone can view active ones
ALTER TABLE user_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view active listings" ON user_listings
  FOR SELECT USING (status = 'active' OR user_id = auth.uid());

CREATE POLICY "Users can insert their own listings" ON user_listings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own listings" ON user_listings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own listings" ON user_listings
  FOR DELETE USING (auth.uid() = user_id);

-- Upcoming Sales: Public read access, admin-only write
ALTER TABLE upcoming_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view upcoming sales" ON upcoming_sales
  FOR SELECT USING (true);

-- Subscriptions: Users can only view their own subscription
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- User Favorites: Users can only manage their own favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON user_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON user_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON user_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Usage Tracking: Users can view their own usage
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage" ON usage_tracking
  FOR SELECT USING (auth.uid() = user_id);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_user_listings_updated_at
  BEFORE UPDATE ON user_listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_upcoming_sales_updated_at
  BEFORE UPDATE ON upcoming_sales
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usage_tracking_updated_at
  BEFORE UPDATE ON usage_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
