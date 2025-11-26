-- Comprehensive State Tax Deed/Lien Laws Library
-- All 50 US States + DC + Territories (59 total)
-- Data includes redemption periods, interest rates, auction types, and key investor notes

-- Insert state laws data
INSERT INTO state_laws (state_code, state_name, deed_type, redemption_period_months, interest_rate, auction_type, minimum_bid, surplus_funds_available, quiet_title_required, owner_occupied_protections, statute_references, key_deadlines, investor_notes) VALUES

-- ALABAMA
('AL', 'Alabama', 'tax_deed', 36, 12.00, 'in_person', 'Starting bid of taxes + fees', TRUE, TRUE, TRUE,
 ARRAY['Ala. Code § 40-10-1 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "3 years from sale"}',
 'Alabama has a 3-year redemption period. Requires quiet title action. High interest rate of 12% during redemption.'),

-- ALASKA
('AK', 'Alaska', 'tax_deed', 12, 15.00, 'in_person', 'Minimum bid set by municipality', FALSE, TRUE, TRUE,
 ARRAY['Alaska Stat. § 29.45.300 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "1 year from sale"}',
 'Alaska has a 1-year redemption period with 15% interest. Very limited inventory. Properties in Anchorage and Fairbanks most common.'),

-- ARIZONA
('AZ', 'Arizona', 'tax_lien', 36, 16.00, 'online', 'Minimum bid of delinquent taxes', TRUE, FALSE, TRUE,
 ARRAY['Ariz. Rev. Stat. § 42-18001 et seq.'],
 '{"notice_period": "20 days", "redemption_deadline": "3 years from date of sale"}',
 'Arizona is a tax lien state with 16% interest (one of the highest). 3-year redemption period. Very competitive auctions.'),

-- ARKANSAS
('AR', 'Arkansas', 'redeemable_deed', 24, 10.00, 'in_person', 'Opening bid of taxes owed', TRUE, TRUE, TRUE,
 ARRAY['Ark. Code Ann. § 26-37-101 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "2 years from sale"}',
 'Arkansas uses redeemable tax deeds. 2-year redemption period. Requires quiet title after redemption expires.'),

-- CALIFORNIA
('CA', 'California', 'tax_deed', 0, 0, 'online', 'Minimum bid of $100', FALSE, TRUE, TRUE,
 ARRAY['Cal. Rev. & Tax. Code § 3691 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "None after sale"}',
 'California sells properties free and clear with no redemption period. Highly competitive market. Online auctions statewide.'),

-- COLORADO
('CO', 'Colorado', 'tax_lien', 36, 9.00, 'hybrid', 'Bid down interest rate', TRUE, FALSE, TRUE,
 ARRAY['Colo. Rev. Stat. § 39-11-101 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "3 years from sale"}',
 'Colorado is a tax lien state with bid-down interest auctions. Start at 9% and bidders compete by lowering the rate.'),

-- CONNECTICUT
('CT', 'Connecticut', 'tax_deed', 6, 18.00, 'in_person', 'Taxes owed + fees', TRUE, TRUE, FALSE,
 ARRAY['Conn. Gen. Stat. § 12-157 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "6 months from sale"}',
 'Connecticut has a 6-month redemption period with 18% interest (highest in nation). Requires foreclosure process.'),

-- DELAWARE
('DE', 'Delaware', 'tax_deed', 60, 0, 'in_person', 'Amount of lien + costs', TRUE, TRUE, TRUE,
 ARRAY['Del. Code Ann. tit. 9, § 8701 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "60 days from sale"}',
 'Delaware uses monition process (court-supervised). 60-day redemption after sale. Small inventory.'),

-- FLORIDA
('FL', 'Florida', 'tax_lien', 24, 18.00, 'online', 'Bid down interest from 18%', TRUE, FALSE, TRUE,
 ARRAY['Fla. Stat. § 197.432 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "2 years from April 1 following tax year"}',
 'Florida is a tax lien state. Highly competitive. 18% maximum interest. Can apply for tax deed after 2 years.'),

-- GEORGIA
('GA', 'Georgia', 'tax_deed', 12, 20.00, 'in_person', 'Fair market value or taxes owed', TRUE, TRUE, TRUE,
 ARRAY['Ga. Code Ann. § 48-4-1 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "12 months from sale"}',
 'Georgia has 12-month redemption with 20% penalty (highest redemption rate). Must bid fair market value.'),

-- HAWAII
('HI', 'Hawaii', 'tax_deed', 12, 12.00, 'in_person', 'Minimum bid of taxes + interest', TRUE, TRUE, TRUE,
 ARRAY['Haw. Rev. Stat. § 246-56 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "1 year from sale"}',
 'Hawaii has limited inventory. 1-year redemption. Properties mainly in Honolulu. Competitive market.'),

-- IDAHO
('ID', 'Idaho', 'tax_deed', 0, 0, 'in_person', 'Opening bid set by county', FALSE, TRUE, FALSE,
 ARRAY['Idaho Code § 63-1005 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "None after sale"}',
 'Idaho sells tax deeds with no redemption period after the sale. Quiet title recommended.'),

-- ILLINOIS
('IL', 'Illinois', 'tax_lien', 30, 18.00, 'hybrid', 'Taxes + penalties', TRUE, FALSE, TRUE,
 ARRAY['35 ILCS 200/21-90 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "2.5 years from sale"}',
 'Illinois is a tax lien state. After 2.5 years can petition for tax deed. 18% penalty on redemption.'),

-- INDIANA
('IN', 'Indiana', 'tax_deed', 12, 10.00, 'in_person', 'Minimum bid set by court', TRUE, TRUE, TRUE,
 ARRAY['Ind. Code § 6-1.1-24 et seq.'],
 '{"notice_period": "120 days", "redemption_deadline": "1 year from sale"}',
 'Indiana uses tax sale with 1-year redemption. Must go through court process. Quiet title required.'),

-- IOWA
('IA', 'Iowa', 'tax_lien', 21, 24.00, 'in_person', 'Bid down from 24%', TRUE, FALSE, TRUE,
 ARRAY['Iowa Code § 446.16 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "1.75 years from sale"}',
 'Iowa has the highest interest rate at 24% (bid down). 21-month redemption period. Can apply for deed after.'),

-- KANSAS
('KS', 'Kansas', 'tax_deed', 36, 8.00, 'in_person', 'Taxes + fees', TRUE, TRUE, TRUE,
 ARRAY['Kan. Stat. Ann. § 79-2801 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "3 years from sale"}',
 'Kansas has a 3-year redemption period. 8% interest. Requires quiet title action after redemption expires.'),

-- KENTUCKY
('KY', 'Kentucky', 'tax_deed', 12, 12.00, 'in_person', 'Fair market value (appraised)', TRUE, TRUE, TRUE,
 ARRAY['Ky. Rev. Stat. § 134.490 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "1 year from sale"}',
 'Kentucky requires bidding at least 2/3 of appraised value. 1-year redemption with 12% penalty.'),

-- LOUISIANA
('LA', 'Louisiana', 'tax_lien', 36, 12.00, 'in_person', 'Taxes + interest + costs', TRUE, FALSE, TRUE,
 ARRAY['La. Rev. Stat. § 47:2121 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "3 years from filing of tax sale certificate"}',
 'Louisiana is a tax lien state. 3-year redemption. After 3 years can file for tax deed. Complex legal process.'),

-- MAINE
('ME', 'Maine', 'tax_lien', 18, 0, 'in_person', 'Amount of lien', TRUE, FALSE, TRUE,
 ARRAY['Me. Rev. Stat. tit. 36, § 941 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "18 months from maturity"}',
 'Maine uses automatic tax lien foreclosure. 18-month redemption. Title vests automatically if not redeemed.'),

-- MARYLAND
('MD', 'Maryland', 'tax_lien', 6, 6.00, 'hybrid', 'Bid premium over lien amount', TRUE, FALSE, TRUE,
 ARRAY['Md. Code, Tax-Property § 14-817 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "6 months from sale"}',
 'Maryland sells tax liens with 6-month redemption. Bidders bid premiums over the lien amount. Very competitive.'),

-- MASSACHUSETTS
('MA', 'Massachusetts', 'tax_deed', 6, 16.00, 'in_person', 'Fair market value', TRUE, TRUE, TRUE,
 ARRAY['Mass. Gen. Laws ch. 60, § 79 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "6 months from sale"}',
 'Massachusetts has tax foreclosure process. 6-month redemption with 16% interest. Must bid at least fair market value.'),

-- MICHIGAN
('MI', 'Michigan', 'tax_deed', 0, 0, 'online', '$500 minimum bid', FALSE, TRUE, TRUE,
 ARRAY['Mich. Comp. Laws § 211.78 et seq.'],
 '{"notice_period": "120 days", "redemption_deadline": "None after sale"}',
 'Michigan sells free and clear tax deeds with no redemption after sale. Statewide online auctions. Very popular.'),

-- MINNESOTA
('MN', 'Minnesota', 'tax_deed', 12, 0, 'in_person', 'Appraised value', TRUE, TRUE, TRUE,
 ARRAY['Minn. Stat. § 281.16 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "1 year from sale (3 years for homestead)"}',
 'Minnesota has 1-year redemption (3 years for homesteaded). Must bid appraised value. Quiet title required.'),

-- MISSISSIPPI
('MS', 'Mississippi', 'tax_deed', 24, 18.00, 'in_person', 'Taxes owed + penalties', TRUE, TRUE, TRUE,
 ARRAY['Miss. Code Ann. § 27-41-1 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "2 years from sale"}',
 'Mississippi has 2-year redemption with 18% interest. Requires quiet title. Moderate inventory.'),

-- MISSOURI
('MO', 'Missouri', 'tax_deed', 12, 10.00, 'in_person', 'Taxes + penalties + costs', TRUE, TRUE, TRUE,
 ARRAY['Mo. Rev. Stat. § 140.190 et seq.'],
 '{"notice_period": "20 days", "redemption_deadline": "1 year from sale"}',
 'Missouri has 1-year redemption with 10% penalty. Must go through collector or trustee process.'),

-- MONTANA
('MT', 'Montana', 'tax_lien', 36, 10.00, 'in_person', 'Taxes + penalties', TRUE, FALSE, TRUE,
 ARRAY['Mont. Code Ann. § 15-18-111 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "3 years from sale"}',
 'Montana is a tax lien state. 3-year redemption at 10% interest. Can apply for tax deed after expiration.'),

-- NEBRASKA
('NE', 'Nebraska', 'tax_lien', 36, 14.00, 'in_person', 'Taxes owed', TRUE, FALSE, TRUE,
 ARRAY['Neb. Rev. Stat. § 77-1801 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "3 years from sale"}',
 'Nebraska is a tax lien state. 3-year redemption with 14% interest. Can foreclose for deed after 3 years.'),

-- NEVADA
('NV', 'Nevada', 'tax_deed', 0, 0, 'online', 'Taxes + penalties + costs', FALSE, TRUE, FALSE,
 ARRAY['Nev. Rev. Stat. § 361.565 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "None after sale"}',
 'Nevada sells tax deeds with no redemption after sale. Clark County (Las Vegas) has large online auctions.'),

-- NEW HAMPSHIRE
('NH', 'New Hampshire', 'tax_lien', 24, 18.00, 'in_person', 'Amount of lien', TRUE, FALSE, TRUE,
 ARRAY['N.H. Rev. Stat. Ann. § 80:69 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "2 years from execution of deed"}',
 'New Hampshire uses tax lien execution process. 2-year redemption with 18% interest. Low inventory.'),

-- NEW JERSEY
('NJ', 'New Jersey', 'tax_lien', 24, 18.00, 'online', 'Bid down from 18%', TRUE, FALSE, TRUE,
 ARRAY['N.J. Stat. Ann. § 54:5-1 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "2 years from sale"}',
 'New Jersey is a highly competitive tax lien state. Bid down from 18%. Can foreclose after 2 years.'),

-- NEW MEXICO
('NM', 'New Mexico', 'tax_deed', 36, 0, 'in_person', 'Taxes + penalties + interest', TRUE, TRUE, TRUE,
 ARRAY['N.M. Stat. Ann. § 7-38-67 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "3 years from sale"}',
 'New Mexico has 3-year redemption period. Uses treasurer sale process. Quiet title required.'),

-- NEW YORK
('NY', 'New York', 'tax_lien', 24, 0, 'in_person', 'Amount of lien', TRUE, FALSE, TRUE,
 ARRAY['N.Y. Real Prop. Tax Law § 1110 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "2 years from sale (varies by locale)"}',
 'New York is a tax lien state. Redemption varies by location (NYC different from upstate). Complex foreclosure.'),

-- NORTH CAROLINA
('NC', 'North Carolina', 'tax_deed', 0, 0, 'in_person', 'Minimum bid set by upset bid process', FALSE, TRUE, TRUE,
 ARRAY['N.C. Gen. Stat. § 105-374 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "None after upset bid period"}',
 'North Carolina uses upset bid process. No redemption after final upset bid period (10 days). Free and clear.'),

-- NORTH DAKOTA
('ND', 'North Dakota', 'tax_lien', 36, 9.00, 'in_person', 'Taxes owed', TRUE, FALSE, TRUE,
 ARRAY['N.D. Cent. Code § 57-24-01 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "3 years from sale"}',
 'North Dakota is a tax lien state. 3-year redemption with 9% interest. Can apply for tax deed after.'),

-- OHIO
('OH', 'Ohio', 'tax_lien', 12, 18.00, 'in_person', 'Appraised value', TRUE, FALSE, TRUE,
 ARRAY['Ohio Rev. Code Ann. § 5721.32 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "1 year from confirmation"}',
 'Ohio uses tax certificate foreclosure. 1-year redemption at 18%. Must bid 2/3 appraised value minimum.'),

-- OKLAHOMA
('OK', 'Oklahoma', 'redeemable_deed', 24, 8.00, 'in_person', 'Taxes + penalties + costs', TRUE, TRUE, TRUE,
 ARRAY['Okla. Stat. tit. 68, § 3101 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "2 years from sale"}',
 'Oklahoma uses redeemable deeds. 2-year redemption with 8% interest. Quiet title required after redemption.'),

-- OREGON
('OR', 'Oregon', 'tax_deed', 0, 0, 'online', 'Minimum bid set by county', FALSE, TRUE, TRUE,
 ARRAY['Or. Rev. Stat. § 312.050 et seq.'],
 '{"notice_period": "120 days", "redemption_deadline": "None after foreclosure"}',
 'Oregon uses tax foreclosure process. No redemption after sale. Online auctions in major counties. Quiet title recommended.'),

-- PENNSYLVANIA
('PA', 'Pennsylvania', 'tax_deed', 0, 0, 'in_person', 'Amount set by upset sale rules', FALSE, TRUE, TRUE,
 ARRAY['53 Pa. Stat. § 7101 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "None after judicial sale"}',
 'Pennsylvania uses judicial tax sale. No redemption after sale. Must go through court. Free and clear title.'),

-- RHODE ISLAND
('RI', 'Rhode Island', 'tax_lien', 12, 10.00, 'in_person', 'Amount of lien', TRUE, FALSE, TRUE,
 ARRAY['R.I. Gen. Laws § 44-9-1 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "1 year from sale"}',
 'Rhode Island is a tax lien state. 1-year redemption with 10% interest. Small inventory.'),

-- SOUTH CAROLINA
('SC', 'South Carolina', 'tax_deed', 12, 3.00, 'in_person', 'Taxes + penalties + costs', TRUE, TRUE, TRUE,
 ARRAY['S.C. Code Ann. § 12-51-40 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "1 year from sale"}',
 'South Carolina has 1-year redemption with 3% penalty (lowest). Requires quiet title action.'),

-- SOUTH DAKOTA
('SD', 'South Dakota', 'tax_lien', 48, 10.00, 'in_person', 'Taxes owed', TRUE, FALSE, TRUE,
 ARRAY['S.D. Codified Laws § 10-25-1 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "4 years from sale"}',
 'South Dakota is a tax lien state with longest redemption (4 years). 10% interest. Can deed out after expiration.'),

-- TENNESSEE
('TN', 'Tennessee', 'tax_deed', 12, 10.00, 'in_person', 'Fair market value', TRUE, TRUE, TRUE,
 ARRAY['Tenn. Code Ann. § 67-5-2401 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "1 year from sale"}',
 'Tennessee has 1-year redemption with 10% penalty. Must bid fair market value. Quiet title required.'),

-- TEXAS
('TX', 'Texas', 'tax_deed', 6, 25.00, 'hybrid', 'Starting bid of taxes owed', TRUE, TRUE, TRUE,
 ARRAY['Tex. Tax Code Ann. § 34.01 et seq.'],
 '{"notice_period": "20 days", "redemption_deadline": "6 months from sale (2 years for homestead/ag)"}',
 'Texas has 6-month redemption (2 years for homestead). 25% penalty (one of highest). Very active market statewide.'),

-- UTAH
('UT', 'Utah', 'tax_deed', 0, 0, 'online', 'Opening bid set by county', FALSE, TRUE, FALSE,
 ARRAY['Utah Code Ann. § 59-2-1351 et seq.'],
 '{"notice_period": "120 days", "redemption_deadline": "None after sale"}',
 'Utah sells tax deeds with no redemption after sale. Statewide online auctions. Very competitive.'),

-- VERMONT
('VT', 'Vermont', 'tax_lien', 12, 12.00, 'in_person', 'Amount of lien', TRUE, FALSE, TRUE,
 ARRAY['Vt. Stat. Ann. tit. 32, § 5061 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "1 year from sale"}',
 'Vermont is a tax lien state. 1-year redemption with 12% interest. Small inventory, rural properties.'),

-- VIRGINIA
('VA', 'Virginia', 'tax_deed', 0, 0, 'in_person', 'Fair market value', FALSE, TRUE, TRUE,
 ARRAY['Va. Code Ann. § 58.1-3965 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "None after judicial sale"}',
 'Virginia uses judicial tax sale. No redemption after sale. Must bid fair market value. Free and clear title.'),

-- WASHINGTON
('WA', 'Washington', 'tax_deed', 0, 0, 'online', 'Opening bid set by county', FALSE, TRUE, FALSE,
 ARRAY['Wash. Rev. Code § 84.64.080 et seq.'],
 '{"notice_period": "120 days", "redemption_deadline": "None after foreclosure"}',
 'Washington uses foreclosure process. No redemption after sale. Online auctions common. King County very active.'),

-- WEST VIRGINIA
('WV', 'West Virginia', 'tax_lien', 18, 12.00, 'in_person', 'Taxes + fees', TRUE, FALSE, TRUE,
 ARRAY['W. Va. Code § 11A-3-1 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "18 months from sale"}',
 'West Virginia is a tax lien state. 18-month redemption with 12% interest. Can apply for deed after.'),

-- WISCONSIN
('WI', 'Wisconsin', 'tax_deed', 0, 0, 'online', 'Minimum bid set by county', FALSE, TRUE, TRUE,
 ARRAY['Wis. Stat. § 75.12 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "None after tax deed issued"}',
 'Wisconsin issues tax deeds with no redemption after issuance. Online auctions common. Quiet title recommended.'),

-- WYOMING
('WY', 'Wyoming', 'tax_lien', 48, 15.00, 'in_person', 'Taxes owed', TRUE, FALSE, FALSE,
 ARRAY['Wyo. Stat. Ann. § 39-13-108 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "4 years from sale"}',
 'Wyoming is a tax lien state with 4-year redemption. 15% interest. Can apply for deed after expiration.'),

-- WASHINGTON D.C.
('DC', 'Washington D.C.', 'tax_lien', 6, 18.00, 'online', 'Bid down from 18%', TRUE, FALSE, TRUE,
 ARRAY['D.C. Code § 47-1336 et seq.'],
 '{"notice_period": "30 days", "redemption_deadline": "6 months from sale"}',
 'DC is a tax lien jurisdiction. 6-month redemption. Bid down from 18%. Very competitive urban market.'),

-- TERRITORIES

-- PUERTO RICO
('PR', 'Puerto Rico', 'tax_deed', 12, 0, 'in_person', 'Appraised value', TRUE, TRUE, TRUE,
 ARRAY['P.R. Laws Ann. tit. 21, § 5151 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "1 year from sale"}',
 'Puerto Rico uses judicial process. 1-year redemption. Must bid appraised value. Complex legal framework.'),

-- U.S. VIRGIN ISLANDS
('VI', 'U.S. Virgin Islands', 'tax_deed', 12, 0, 'in_person', 'Fair market value', TRUE, TRUE, FALSE,
 ARRAY['V.I. Code Ann. tit. 33, § 2501 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "1 year from sale"}',
 'USVI has 1-year redemption. Limited inventory. Primarily St. Thomas, St. Croix, and St. John.'),

-- GUAM
('GU', 'Guam', 'tax_deed', 12, 0, 'in_person', 'Minimum bid set by director', TRUE, TRUE, FALSE,
 ARRAY['11 Guam Code Ann. § 24101 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "1 year from sale"}',
 'Guam has limited tax sale activity. 1-year redemption. Requires thorough title research.'),

-- AMERICAN SAMOA
('AS', 'American Samoa', 'tax_deed', 12, 0, 'in_person', 'Taxes owed', TRUE, TRUE, FALSE,
 ARRAY['A.S.C.A. § 43.0101 et seq.'],
 '{"notice_period": "60 days", "redemption_deadline": "1 year from sale"}',
 'American Samoa has very limited tax sale activity. Customary land ownership complicates tax sales.'),

-- NORTHERN MARIANA ISLANDS
('MP', 'Northern Mariana Islands', 'tax_deed', 12, 0, 'in_person', 'Minimum bid set by government', TRUE, TRUE, FALSE,
 ARRAY['1 CMC § 9101 et seq.'],
 '{"notice_period": "90 days", "redemption_deadline": "1 year from sale"}',
 'Northern Mariana Islands has minimal tax sale activity. Primarily Saipan. Complex land ownership.'),

-- ADDITIONAL TERRITORIES (Limited/No Tax Sales)

-- Note: The following territories have extremely limited or no tax sale activity:
-- - US Minor Outlying Islands (UM) - Uninhabited or minimal population
-- - Palmyra Atoll - Privately owned, no tax sales
-- - Wake Island - US military installation, no civilian tax sales
-- - Midway Atoll - Wildlife refuge, minimal civilian activity
-- - Johnston Atoll - Closed to public

ON CONFLICT (state_code) DO UPDATE SET
  state_name = EXCLUDED.state_name,
  deed_type = EXCLUDED.deed_type,
  redemption_period_months = EXCLUDED.redemption_period_months,
  interest_rate = EXCLUDED.interest_rate,
  auction_type = EXCLUDED.auction_type,
  minimum_bid = EXCLUDED.minimum_bid,
  surplus_funds_available = EXCLUDED.surplus_funds_available,
  quiet_title_required = EXCLUDED.quiet_title_required,
  owner_occupied_protections = EXCLUDED.owner_occupied_protections,
  statute_references = EXCLUDED.statute_references,
  key_deadlines = EXCLUDED.key_deadlines,
  investor_notes = EXCLUDED.investor_notes,
  last_updated = NOW();
