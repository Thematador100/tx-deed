-- Microsites Table
CREATE TABLE IF NOT EXISTS microsites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  slug TEXT UNIQUE NOT NULL,
  address TEXT NOT NULL,
  headline TEXT,
  content JSONB,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Microsite Leads (people who showed interest)
CREATE TABLE IF NOT EXISTS microsite_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  microsite_id UUID REFERENCES microsites(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  message TEXT,
  signed_nda BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach Campaigns
CREATE TABLE IF NOT EXISTS outreach_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sequence_data JSONB,
  status TEXT DEFAULT 'draft',
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  response_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Outreach Messages (individual messages sent)
CREATE TABLE IF NOT EXISTS outreach_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES outreach_campaigns(id) ON DELETE CASCADE,
  recipient_email TEXT,
  recipient_phone TEXT,
  channel TEXT,
  subject TEXT,
  body TEXT,
  status TEXT DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_microsites_slug ON microsites(slug);
CREATE INDEX IF NOT EXISTS idx_microsites_property ON microsites(property_id);
CREATE INDEX IF NOT EXISTS idx_microsites_user ON microsites(user_id);
CREATE INDEX IF NOT EXISTS idx_microsite_leads_microsite ON microsite_leads(microsite_id);
CREATE INDEX IF NOT EXISTS idx_outreach_campaigns_user ON outreach_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_campaign ON outreach_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_outreach_messages_status ON outreach_messages(status);

-- RLS Policies
ALTER TABLE microsites ENABLE ROW LEVEL SECURITY;
ALTER TABLE microsite_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages ENABLE ROW LEVEL SECURITY;

-- Public can view active microsites
CREATE POLICY "Public can view active microsites"
  ON microsites FOR SELECT
  USING (is_active = true);

-- Users can manage their own microsites
CREATE POLICY "Users can manage own microsites"
  ON microsites FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Anyone can submit leads to microsites
CREATE POLICY "Anyone can submit microsite leads"
  ON microsite_leads FOR INSERT
  WITH CHECK (true);

-- Users can view leads for their microsites
CREATE POLICY "Users can view own microsite leads"
  ON microsite_leads FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM microsites
      WHERE microsites.id = microsite_leads.microsite_id
      AND microsites.user_id = auth.uid()
    )
  );

-- Users can manage their own campaigns
CREATE POLICY "Users can manage own campaigns"
  ON outreach_campaigns FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Users can view messages for their campaigns
CREATE POLICY "Users can view own campaign messages"
  ON outreach_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM outreach_campaigns
      WHERE outreach_campaigns.id = outreach_messages.campaign_id
      AND outreach_campaigns.user_id = auth.uid()
    )
  );

-- Trigger to update view count when microsite is viewed
CREATE OR REPLACE FUNCTION increment_microsite_view()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE microsites
  SET view_count = view_count + 1
  WHERE id = NEW.microsite_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Not creating trigger on microsite_leads as it would fire on every lead
-- Instead, implement view counting via API calls
