-- =====================================================
-- TX-DEED Platform - Seed Data
-- =====================================================
-- Optional seed data for development and testing
-- Run this AFTER the initial schema migration
-- =====================================================

-- =====================================================
-- SAMPLE PROPERTIES
-- =====================================================
INSERT INTO public.properties (address, price, estimated_value, property_type, bedrooms, bathrooms, sqft, year_built, status, opportunity_score, description)
VALUES
  ('123 Oak Street, Hartford, CT 06103', 45000, 120000, 'Single Family', 3, 2, 1450, 1985, 'active', 85.5, 'Tax deed property with high equity potential. Property needs cosmetic repairs.'),
  ('456 Maple Avenue, New Haven, CT 06511', 65000, 150000, 'Single Family', 4, 2, 1850, 1992, 'active', 92.0, 'Excellent investment opportunity in desirable neighborhood. Minor repairs needed.'),
  ('789 Pine Road, Bridgeport, CT 06604', 32000, 95000, 'Condo', 2, 1, 950, 2005, 'active', 78.3, 'Waterfront condo with great upside. HOA fees apply.'),
  ('321 Elm Street, Stamford, CT 06902', 125000, 280000, 'Multi-Family', 6, 4, 3200, 1978, 'active', 88.7, 'Duplex with steady rental income potential. Both units need updating.'),
  ('654 Cedar Lane, Waterbury, CT 06702', 28000, 75000, 'Single Family', 2, 1, 850, 1960, 'pending', 82.1, 'Fixer-upper with tremendous potential. Needs full renovation.'),
  ('987 Birch Court, Norwalk, CT 06850', 98000, 225000, 'Single Family', 4, 3, 2100, 2000, 'active', 90.5, 'Move-in ready with modern updates. Great family home.'),
  ('147 Spruce Drive, Danbury, CT 06810', 55000, 140000, 'Single Family', 3, 2, 1600, 1988, 'active', 86.2, 'Tax deed with clear title. Property shows well.')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE LIBRARY ITEMS
-- =====================================================
INSERT INTO public.library_items (title, description, item_type, url, thumbnail_url)
VALUES
  ('Tax Deed Investing 101', 'Complete beginner guide to tax deed investing. Learn the fundamentals, legal considerations, and investment strategies.', 'video', 'https://www.youtube.com/watch?v=example1', 'https://img.youtube.com/vi/example1/maxresdefault.jpg'),
  ('Connecticut Tax Deed Laws', 'Comprehensive PDF guide covering Connecticut-specific tax deed regulations, redemption periods, and investor rights.', 'pdf', 'https://example.com/ct-tax-deed-laws.pdf', null),
  ('Due Diligence Checklist', 'Essential checklist for evaluating tax deed properties before bidding. Cover all critical inspection points.', 'article', 'https://example.com/blog/due-diligence-checklist', null),
  ('Financing Your Tax Deed Purchases', 'Learn about financing options for tax deed investments including hard money, private money, and creative strategies.', 'video', 'https://www.youtube.com/watch?v=example2', 'https://img.youtube.com/vi/example2/maxresdefault.jpg'),
  ('Property Valuation Strategies', 'Master the art of property valuation for tax deeds. Learn comps, ARV calculations, and repair cost estimation.', 'article', 'https://example.com/blog/property-valuation', null),
  ('Redemption Period Explained', 'Understand redemption periods, how they work, and what to expect during the waiting period after purchase.', 'pdf', 'https://example.com/redemption-period-guide.pdf', null),
  ('Exit Strategies for Tax Deeds', 'Learn multiple exit strategies including fix-and-flip, wholesaling, rental properties, and owner financing.', 'video', 'https://www.youtube.com/watch?v=example3', 'https://img.youtube.com/vi/example3/maxresdefault.jpg'),
  ('Title Insurance Basics', 'Everything you need to know about title insurance for tax deed properties and protecting your investment.', 'article', 'https://example.com/blog/title-insurance', null)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE SCOUT AGENT RECORD
-- =====================================================
-- Create initial scout agent record
INSERT INTO public.scout_agents (last_run_at, properties_found, status)
VALUES
  (NOW() - INTERVAL '2 days', 7, 'completed')
ON CONFLICT DO NOTHING;

-- =====================================================
-- SAMPLE PARTNER APPLICATION
-- =====================================================
-- Example affiliate application for testing
INSERT INTO public.partner_applications (name, email, website, audience_size, platform, message, status)
VALUES
  ('John Smith', 'john@example.com', 'https://realestateblog.example.com', '10,000 - 50,000', 'Blog & YouTube', 'I run a real estate investment blog and would love to promote your platform to my audience.', 'pending'),
  ('Sarah Johnson', 'sarah@investorpodcast.com', 'https://investorpodcast.com', '50,000 - 100,000', 'Podcast', 'Host of Real Estate Investor Podcast with 75K monthly listeners. Interested in partnership opportunities.', 'approved')
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMMENTS
-- =====================================================
-- This seed data provides a starting point for development
-- In production, you would not run this seed file
-- Instead, real data would be added through the application

COMMENT ON TABLE public.properties IS 'Sample properties added for development/testing';
COMMENT ON TABLE public.library_items IS 'Sample educational content for development/testing';
