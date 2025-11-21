-- Row Level Security (RLS) Policies for Win With Deeds
-- These policies ensure users can only access their own data

-- =====================================================
-- ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE library_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE scout_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE upcoming_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_submissions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- PROFILES POLICIES
-- =====================================================

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- PROPERTIES POLICIES
-- =====================================================

-- All authenticated users can view properties (marketplace)
CREATE POLICY "Authenticated users can view properties"
  ON properties FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can insert properties
CREATE POLICY "Admins can insert properties"
  ON properties FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can update properties
CREATE POLICY "Admins can update properties"
  ON properties FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can delete properties
CREATE POLICY "Admins can delete properties"
  ON properties FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- SAVED PROPERTIES POLICIES
-- =====================================================

-- Users can view their own saved properties
CREATE POLICY "Users can view own saved properties"
  ON saved_properties FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved properties
CREATE POLICY "Users can insert own saved properties"
  ON saved_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved properties
CREATE POLICY "Users can delete own saved properties"
  ON saved_properties FOR DELETE
  USING (auth.uid() = user_id);

-- Users can update their own saved properties
CREATE POLICY "Users can update own saved properties"
  ON saved_properties FOR UPDATE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRANSACTIONS POLICIES
-- =====================================================

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid() = user_id);

-- Only system can insert transactions (via Edge Functions)
CREATE POLICY "System can insert transactions"
  ON transactions FOR INSERT
  WITH CHECK (true); -- Will be restricted by Edge Function auth

-- Admins can view all transactions
CREATE POLICY "Admins can view all transactions"
  ON transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- LEADS POLICIES
-- =====================================================

-- Users can view leads assigned to them or public marketplace leads
CREATE POLICY "Users can view assigned leads"
  ON leads FOR SELECT
  USING (
    auth.uid() = assigned_to
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Users can insert their own leads
CREATE POLICY "Users can insert own leads"
  ON leads FOR INSERT
  WITH CHECK (auth.uid() = assigned_to OR assigned_to IS NULL);

-- Users can update their assigned leads
CREATE POLICY "Users can update assigned leads"
  ON leads FOR UPDATE
  USING (auth.uid() = assigned_to);

-- Admins can do everything with leads
CREATE POLICY "Admins can manage all leads"
  ON leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- LEAD UPLOADS POLICIES
-- =====================================================

-- Users can view their own lead uploads
CREATE POLICY "Users can view own lead uploads"
  ON lead_uploads FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own lead uploads
CREATE POLICY "Users can insert own lead uploads"
  ON lead_uploads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all lead uploads
CREATE POLICY "Admins can view all lead uploads"
  ON lead_uploads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- LEAD SOURCES POLICIES
-- =====================================================

-- All authenticated users can view lead sources
CREATE POLICY "Authenticated users can view lead sources"
  ON lead_sources FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage lead sources
CREATE POLICY "Admins can manage lead sources"
  ON lead_sources FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- MARKETPLACE LEADS POLICIES
-- =====================================================

-- All authenticated users can view marketplace leads
CREATE POLICY "Authenticated users can view marketplace leads"
  ON marketplace_leads FOR SELECT
  USING (auth.role() = 'authenticated' AND status = 'available');

-- Sellers can insert their own marketplace leads
CREATE POLICY "Sellers can insert marketplace leads"
  ON marketplace_leads FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Sellers can update their own marketplace leads
CREATE POLICY "Sellers can update own marketplace leads"
  ON marketplace_leads FOR UPDATE
  USING (auth.uid() = seller_id);

-- Admins can manage all marketplace leads
CREATE POLICY "Admins can manage marketplace leads"
  ON marketplace_leads FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- INVOICES POLICIES
-- =====================================================

-- Users can view their own invoices
CREATE POLICY "Users can view own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

-- Admins can view all invoices
CREATE POLICY "Admins can view all invoices"
  ON invoices FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Only admins can insert/update invoices
CREATE POLICY "Admins can manage invoices"
  ON invoices FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- LIBRARY ITEMS POLICIES
-- =====================================================

-- Users can view published library items matching their subscription tier
CREATE POLICY "Users can view accessible library items"
  ON library_items FOR SELECT
  USING (
    is_published = true
    AND (
      access_level = 'free'
      OR EXISTS (
        SELECT 1 FROM profiles
        WHERE profiles.id = auth.uid()
        AND (
          (access_level = 'basic' AND profiles.subscription_tier IN ('basic', 'pro', 'enterprise'))
          OR (access_level = 'pro' AND profiles.subscription_tier IN ('pro', 'enterprise'))
          OR (access_level = 'enterprise' AND profiles.subscription_tier = 'enterprise')
        )
      )
    )
  );

-- Admins can manage all library items
CREATE POLICY "Admins can manage library items"
  ON library_items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- NOTIFICATIONS POLICIES
-- =====================================================

-- Users can view their own notifications
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own notifications
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (auth.uid() = user_id);

-- System can insert notifications
CREATE POLICY "System can insert notifications"
  ON notifications FOR INSERT
  WITH CHECK (true); -- Will be restricted by Edge Function auth

-- =====================================================
-- PARTNER APPLICATIONS POLICIES
-- =====================================================

-- Users can view their own partner applications
CREATE POLICY "Users can view own partner applications"
  ON partner_applications FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own partner applications
CREATE POLICY "Users can insert own partner applications"
  ON partner_applications FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view and manage all partner applications
CREATE POLICY "Admins can manage partner applications"
  ON partner_applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- PIPELINE STAGES POLICIES
-- =====================================================

-- Users can view their own pipeline stages
CREATE POLICY "Users can view own pipeline stages"
  ON pipeline_stages FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own pipeline stages
CREATE POLICY "Users can manage own pipeline stages"
  ON pipeline_stages FOR ALL
  USING (auth.uid() = user_id);

-- =====================================================
-- SCOUT AGENTS POLICIES
-- =====================================================

-- Users can view their own scout agents
CREATE POLICY "Users can view own scout agents"
  ON scout_agents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can manage their own scout agents
CREATE POLICY "Users can manage own scout agents"
  ON scout_agents FOR ALL
  USING (auth.uid() = user_id);

-- Admins can view all scout agents
CREATE POLICY "Admins can view all scout agents"
  ON scout_agents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- UPCOMING SALES POLICIES
-- =====================================================

-- All authenticated users can view upcoming sales
CREATE POLICY "Authenticated users can view upcoming sales"
  ON upcoming_sales FOR SELECT
  USING (auth.role() = 'authenticated');

-- Only admins can manage upcoming sales
CREATE POLICY "Admins can manage upcoming sales"
  ON upcoming_sales FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- =====================================================
-- FUNDING SUBMISSIONS POLICIES
-- =====================================================

-- Users can view their own funding submissions
CREATE POLICY "Users can view own funding submissions"
  ON funding_submissions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own funding submissions
CREATE POLICY "Users can insert own funding submissions"
  ON funding_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending submissions
CREATE POLICY "Users can update own pending submissions"
  ON funding_submissions FOR UPDATE
  USING (auth.uid() = user_id AND status = 'submitted');

-- Admins can view and manage all funding submissions
CREATE POLICY "Admins can manage funding submissions"
  ON funding_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
