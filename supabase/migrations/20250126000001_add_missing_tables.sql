-- Migration: Add all missing tables for complete functionality
-- Created: 2025-01-26

-- 1. TRANSACTIONS TABLE - Payment and subscription tracking
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  status TEXT NOT NULL CHECK (status IN ('pending', 'completed', 'failed', 'refunded', 'cancelled')),
  product_type TEXT CHECK (product_type IN ('subscription', 'lead_purchase', 'service', 'training')),
  product_name TEXT,
  product_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- 2. MARKETPLACE LEADS TABLE - Lead marketplace functionality
CREATE TABLE IF NOT EXISTS marketplace_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  county TEXT,
  state TEXT,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  price NUMERIC(10,2) NOT NULL,
  original_price NUMERIC(10,2),
  property_type TEXT,
  estimated_value NUMERIC(12,2),
  roi_potential NUMERIC(5,2),
  is_certified BOOLEAN DEFAULT FALSE,
  certification_notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'sold', 'removed')),
  view_count INTEGER DEFAULT 0,
  inquiry_count INTEGER DEFAULT 0,
  images JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  sold_to_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_marketplace_leads_seller_id ON marketplace_leads(seller_id);
CREATE INDEX idx_marketplace_leads_status ON marketplace_leads(status);
CREATE INDEX idx_marketplace_leads_state ON marketplace_leads(state);
CREATE INDEX idx_marketplace_leads_county ON marketplace_leads(county);
CREATE INDEX idx_marketplace_leads_price ON marketplace_leads(price);
CREATE INDEX idx_marketplace_leads_created_at ON marketplace_leads(created_at DESC);

-- 3. LIBRARY ITEMS TABLE - Training and educational content
CREATE TABLE IF NOT EXISTS library_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('video', 'article', 'pdf', 'course', 'webinar', 'template', 'checklist')),
  category TEXT CHECK (category IN ('getting_started', 'research', 'bidding', 'due_diligence', 'redemption', 'exit_strategies', 'legal', 'marketing', 'advanced')),
  content_url TEXT,
  thumbnail_url TEXT,
  file_path TEXT,
  file_size INTEGER,
  duration_minutes INTEGER,
  access_level TEXT DEFAULT 'free' CHECK (access_level IN ('free', 'basic', 'pro', 'elite')),
  author TEXT,
  tags TEXT[],
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

CREATE INDEX idx_library_items_type ON library_items(item_type);
CREATE INDEX idx_library_items_category ON library_items(category);
CREATE INDEX idx_library_items_access_level ON library_items(access_level);
CREATE INDEX idx_library_items_created_at ON library_items(created_at DESC);

-- 4. AFFILIATES TABLE - Affiliate program management
CREATE TABLE IF NOT EXISTS affiliates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  affiliate_code TEXT NOT NULL UNIQUE,
  commission_rate NUMERIC(5,2) DEFAULT 10.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
  total_referrals INTEGER DEFAULT 0,
  total_earnings NUMERIC(10,2) DEFAULT 0,
  paid_earnings NUMERIC(10,2) DEFAULT 0,
  pending_earnings NUMERIC(10,2) DEFAULT 0,
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}',
  notes TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliates_user_id ON affiliates(user_id);
CREATE INDEX idx_affiliates_code ON affiliates(affiliate_code);
CREATE INDEX idx_affiliates_status ON affiliates(status);

-- 5. AFFILIATE REFERRALS TABLE - Track individual referrals
CREATE TABLE IF NOT EXISTS affiliate_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  transaction_id UUID REFERENCES transactions(id) ON DELETE SET NULL,
  commission_amount NUMERIC(10,2),
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'cancelled')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_affiliate_referrals_affiliate_id ON affiliate_referrals(affiliate_id);
CREATE INDEX idx_affiliate_referrals_referred_user_id ON affiliate_referrals(referred_user_id);

-- 6. CONVERSATIONS TABLE - User-to-user messaging
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_1_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  participant_2_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  last_message_id UUID,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant_1_id, participant_2_id)
);

CREATE INDEX idx_conversations_participant_1 ON conversations(participant_1_id);
CREATE INDEX idx_conversations_participant_2 ON conversations(participant_2_id);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at DESC);

-- 7. MESSAGES TABLE - Individual messages in conversations
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file', 'property_share')),
  attachment_url TEXT,
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_read ON messages(read);

-- 8. NOTIFICATIONS TABLE - System notifications for users
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'new_property', 'new_message', 'price_drop', 'scout_alert', 'system')),
  icon TEXT,
  action_url TEXT,
  action_label TEXT,
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 9. USER PREFERENCES TABLE - User notification and app preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  push_notifications BOOLEAN DEFAULT TRUE,
  notify_new_properties BOOLEAN DEFAULT TRUE,
  notify_price_drops BOOLEAN DEFAULT TRUE,
  notify_messages BOOLEAN DEFAULT TRUE,
  notify_scout_alerts BOOLEAN DEFAULT TRUE,
  notify_marketing BOOLEAN DEFAULT FALSE,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  default_search_radius INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_user_preferences_user_id ON user_preferences(user_id);

-- 10. DOCUMENT LIBRARY TABLE - OCR processed documents
CREATE TABLE IF NOT EXISTS document_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER,
  storage_path TEXT,
  ocr_status TEXT DEFAULT 'pending' CHECK (ocr_status IN ('pending', 'processing', 'completed', 'failed')),
  ocr_text TEXT,
  extracted_data JSONB DEFAULT '{}',
  property_data JSONB DEFAULT '{}',
  page_count INTEGER,
  confidence_score NUMERIC(5,2),
  error_message TEXT,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_document_library_user_id ON document_library(user_id);
CREATE INDEX idx_document_library_ocr_status ON document_library(ocr_status);

-- 11. STATE LAWS TABLE - State-specific tax deed/lien laws
CREATE TABLE IF NOT EXISTS state_laws (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL UNIQUE,
  state_name TEXT NOT NULL,
  deed_type TEXT NOT NULL CHECK (deed_type IN ('tax_deed', 'tax_lien', 'hybrid', 'redeemable_deed')),
  redemption_period_months INTEGER,
  interest_rate NUMERIC(5,2),
  auction_type TEXT CHECK (auction_type IN ('online', 'in_person', 'hybrid')),
  minimum_bid TEXT,
  surplus_funds_available BOOLEAN DEFAULT FALSE,
  quiet_title_required BOOLEAN DEFAULT FALSE,
  owner_occupied_protections BOOLEAN DEFAULT FALSE,
  statute_references TEXT[],
  key_deadlines JSONB DEFAULT '{}',
  investor_notes TEXT,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_state_laws_state_code ON state_laws(state_code);
CREATE INDEX idx_state_laws_deed_type ON state_laws(deed_type);

-- 12. COUNTY INFO TABLE - County-specific information
CREATE TABLE IF NOT EXISTS county_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  state_code TEXT NOT NULL,
  county_name TEXT NOT NULL,
  population INTEGER,
  tax_collector_website TEXT,
  auction_website TEXT,
  auction_schedule TEXT,
  filing_requirements TEXT,
  local_rules TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  office_address TEXT,
  office_hours TEXT,
  average_properties_per_auction INTEGER,
  last_auction_date DATE,
  next_auction_date DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(state_code, county_name)
);

CREATE INDEX idx_county_info_state ON county_info(state_code);
CREATE INDEX idx_county_info_name ON county_info(county_name);

-- Add RLS policies for all tables

-- Transactions RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Marketplace Leads RLS
ALTER TABLE marketplace_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active marketplace leads"
  ON marketplace_leads FOR SELECT
  USING (status = 'active');

CREATE POLICY "Sellers can manage own leads"
  ON marketplace_leads FOR ALL
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all marketplace leads"
  ON marketplace_leads FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Library Items RLS
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view library items based on access level"
  ON library_items FOR SELECT
  USING (
    access_level = 'free' OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND (
        (access_level = 'basic' AND membership_tier IN ('basic', 'pro', 'elite')) OR
        (access_level = 'pro' AND membership_tier IN ('pro', 'elite')) OR
        (access_level = 'elite' AND membership_tier = 'elite') OR
        role = 'admin'
      )
    )
  );

CREATE POLICY "Admins can manage library items"
  ON library_items FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Affiliates RLS
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own affiliate account"
  ON affiliates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own affiliate account"
  ON affiliates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own affiliate account"
  ON affiliates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all affiliates"
  ON affiliates FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Affiliate Referrals RLS
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own referrals"
  ON affiliate_referrals FOR SELECT
  USING (EXISTS (SELECT 1 FROM affiliates WHERE id = affiliate_id AND user_id = auth.uid()));

CREATE POLICY "Admins can manage all referrals"
  ON affiliate_referrals FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Conversations RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() IN (participant_1_id, participant_2_id));

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() IN (participant_1_id, participant_2_id));

-- Messages RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth.uid() IN (participant_1_id, participant_2_id)
    )
  );

CREATE POLICY "Users can send messages in their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM conversations
      WHERE id = conversation_id
      AND auth.uid() IN (participant_1_id, participant_2_id)
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Notifications RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON notifications FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- User Preferences RLS
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences FOR ALL
  USING (auth.uid() = user_id);

-- Document Library RLS
ALTER TABLE document_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own documents"
  ON document_library FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all documents"
  ON document_library FOR SELECT
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- State Laws RLS (Public read access)
ALTER TABLE state_laws ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view state laws"
  ON state_laws FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage state laws"
  ON state_laws FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- County Info RLS (Public read access)
ALTER TABLE county_info ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view county info"
  ON county_info FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage county info"
  ON county_info FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Create functions and triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_marketplace_leads_updated_at BEFORE UPDATE ON marketplace_leads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_items_updated_at BEFORE UPDATE ON library_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliates_updated_at BEFORE UPDATE ON affiliates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_county_info_updated_at BEFORE UPDATE ON county_info
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to update conversation last_message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_message_id = NEW.id,
      last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_on_new_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_last_message();

-- Create function to auto-create user preferences on profile creation
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER create_user_preferences_on_signup
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();
