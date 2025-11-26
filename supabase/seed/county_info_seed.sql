-- Comprehensive County Information for Tax Deed Investing
-- Major counties across all 50 states with active tax sales

INSERT INTO county_info (state_code, county_name, population, tax_collector_website, auction_website, auction_schedule, filing_requirements, local_rules, contact_email, contact_phone, office_address, office_hours, average_properties_per_auction, last_auction_date, next_auction_date, metadata) VALUES

-- ALABAMA
('AL', 'Jefferson', 658466, 'https://jccal.org/revenue', 'https://jccal.org/taxsale', 'Annual in May', 'Photo ID, Cashier check or cash', 'Must register 24 hours before', 'revenue@jccal.org', '205-325-5500', '716 Richard Arrington Jr. Blvd N, Birmingham, AL 35203', 'Mon-Fri 8am-5pm', 150, NULL, NULL, '{}'),
('AL', 'Mobile', 414809, 'https://www.mobilecountyal.gov/revenue', NULL, 'Annual in May', 'Valid ID, Cash or certified funds', 'In-person registration required', NULL, '251-574-8530', 'PO Box 7, Mobile, AL 36601', 'Mon-Fri 8am-4:30pm', 120, NULL, NULL, '{}'),

-- ALASKA
('AK', 'Anchorage', 291247, 'https://www.muni.org/treasury', NULL, 'Annual in September', 'Photo ID, Bank check', 'Properties posted 90 days before', 'treasury@anchorageak.gov', '907-343-6650', '632 W. 6th Ave, Anchorage, AK 99501', 'Mon-Fri 8am-5pm', 25, NULL, NULL, '{}'),

-- ARIZONA
('AZ', 'Maricopa', 4485414, 'https://treasurer.maricopa.gov', 'https://treasurer.maricopa.gov/taxlien', 'Annual in February', 'Registration and deposit required', 'Online bidding platform', 'treashelp@maricopa.gov', '602-506-8511', '301 W Jefferson St, Phoenix, AZ 85003', 'Mon-Fri 8am-5pm', 3000, NULL, NULL, '{}'),
('AZ', 'Pima', 1043433, 'https://www.asr.pima.gov', 'https://www.asr.pima.gov/taxsale', 'Annual in February', 'Online registration required', 'Hybrid online/in-person', 'treasurer@pima.gov', '520-724-8341', '115 N Church Ave, Tucson, AZ 85701', 'Mon-Fri 8am-5pm', 1500, NULL, NULL, '{}'),

-- ARKANSAS
('AR', 'Pulaski', 399125, 'https://www.pulaskicounty.net/treasurer', NULL, 'Annual in August', 'Cash or certified check', 'Court-supervised auction', NULL, '501-340-8330', '401 W Markham St, Little Rock, AR 72201', 'Mon-Fri 8am-4:30pm', 200, NULL, NULL, '{}'),

-- CALIFORNIA
('CA', 'Los Angeles', 10014009, 'https://ttc.lacounty.gov', 'https://ttc.lacounty.gov/proptax/auction', 'Multiple times per year', 'Online registration and deposit', 'Online auctions only', 'auction@ttc.lacounty.gov', '213-974-2111', '225 N Hill St, Los Angeles, CA 90012', 'Mon-Fri 8am-5pm', 500, NULL, NULL, '{}'),
('CA', 'San Diego', 3298634, 'https://www.sdttc.com', 'https://www.sdttc.com/content/ttc/en/tax-collection/auctions.html', 'Quarterly', 'Online registration required', 'Fully online auctions', 'ttcweb@sdcounty.ca.gov', '877-829-4732', '1600 Pacific Hwy, San Diego, CA 92101', 'Mon-Fri 8am-5pm', 300, NULL, NULL, '{}'),
('CA', 'Orange', 3186989, 'https://www.octreasurer.com', 'https://www.octreasurer.com/auctions', 'Multiple times per year', 'Online registration and $5000 deposit', 'Online bidding platform', 'ttc@ttc.ocgov.com', '714-834-7600', '601 N Ross St, Santa Ana, CA 92701', 'Mon-Fri 8am-5pm', 250, NULL, NULL, '{}'),
('CA', 'Riverside', 2470546, 'https://www.countytreasurer.org', 'https://www.countytreasurer.org/tax-sales', 'Multiple times per year', 'Online registration required', 'Online auctions', 'treasurer@rivco.org', '951-955-3900', '4080 Lemon St, Riverside, CA 92501', 'Mon-Fri 8am-5pm', 400, NULL, NULL, '{}'),

-- COLORADO
('CO', 'Denver', 715522, 'https://www.denvergov.org/treasurer', 'https://www.denvergov.org/treasurer/tax-lien-sale', 'Annual in November', 'Online registration and deposit', 'Online auction', 'treashelp@denvergov.org', '720-913-9400', '201 W Colfax Ave, Denver, CO 80202', 'Mon-Fri 8am-5pm', 800, NULL, NULL, '{}'),
('CO', 'El Paso', 730395, 'https://treasurer.elpasoco.com', 'https://treasurer.elpasoco.com/tax-lien-sale', 'Annual in November', 'Online registration required', 'Bid-down interest auction', 'treasurer@elpasoco.com', '719-520-6600', '1675 Garden of the Gods Rd, Colorado Springs, CO 80907', 'Mon-Fri 8am-5pm', 600, NULL, NULL, '{}'),

-- CONNECTICUT
('CT', 'Hartford', 899498, 'https://www.hartford.gov/treasurer', NULL, 'Periodic foreclosures', 'Attorney representation recommended', 'Tax lien foreclosure process', NULL, '860-757-9560', '550 Main St, Hartford, CT 06103', 'Mon-Fri 8:30am-5pm', 50, NULL, NULL, '{}'),

-- DELAWARE
('DE', 'New Castle', 570719, 'https://www.nccde.org/treasurer', NULL, 'Periodic monition sales', 'Court process required', 'Monition through Court of Chancery', NULL, '302-395-5340', '87 Read\'s Way, New Castle, DE 19720', 'Mon-Fri 8am-4:30pm', 30, NULL, NULL, '{}'),

-- FLORIDA
('FL', 'Miami-Dade', 2716940, 'https://www.miamidade.gov/taxcollector', 'https://www.miamidade.gov/taxcollector/tax-certificate-sale.asp', 'Annual in May/June', 'Online registration and deposit', 'Online bidding - bid down interest', 'taxinfo@miamidade.gov', '305-270-4916', '200 NW 2nd Ave, Miami, FL 33128', 'Mon-Fri 8:30am-5pm', 5000, NULL, NULL, '{}'),
('FL', 'Broward', 1944375, 'https://www.broward.org/RecordsTaxesTreasury', 'https://www.broward.org/RecordsTaxesTreasury/Pages/tax-certificate-sales.aspx', 'Annual in May', 'Online registration required', 'Online bidding platform', 'tax@broward.org', '954-831-4000', '115 S Andrews Ave, Fort Lauderdale, FL 33301', 'Mon-Fri 8am-5pm', 4000, NULL, NULL, '{}'),
('FL', 'Palm Beach', 1496770, 'https://www.pbctax.gov', 'https://www.pbctax.gov/tax-certificate-sale', 'Annual in May', 'Online registration and $200 deposit', 'Online bidding', 'taxcollector@pbctax.com', '561-355-2264', '301 N Olive Ave, West Palm Beach, FL 33401', 'Mon-Fri 8am-5pm', 3500, NULL, NULL, '{}'),
('FL', 'Hillsborough', 1459762, 'https://www.hillstax.org', 'https://www.hillstax.org/tax-certificate-sale', 'Annual in May', 'Online registration required', 'Fully online auction', 'hillstax@hillstax.org', '813-635-5200', '601 E Kennedy Blvd, Tampa, FL 33602', 'Mon-Fri 8am-5pm', 3000, NULL, NULL, '{}'),
('FL', 'Orange', 1429908, 'https://www.octaxcol.com', 'https://www.octaxcol.com/tax-certificate-auctions', 'Annual in May', 'Online registration and deposit', 'Online bidding system', 'customerservice@octaxcol.com', '407-836-4143', '200 S Orange Ave, Orlando, FL 32801', 'Mon-Fri 8am-5pm', 2500, NULL, NULL, '{}'),

-- GEORGIA
('GA', 'Fulton', 1063937, 'https://www.fultontaxcommissioner.org', 'https://www.fultontaxcommissioner.org/tax-sales', 'Monthly', 'Cash, cashier check, or money order', 'First Tuesday of each month', 'taxcommissioner@fultoncountyga.gov', '404-612-6440', '141 Pryor St SW, Atlanta, GA 30303', 'Mon-Fri 8am-4:30pm', 100, NULL, NULL, '{}'),
('GA', 'Gwinnett', 957062, 'https://www.gwinnettcounty.com/taxcommissioner', 'https://www.gwinnettcounty.com/taxcommissioner/tax-sales', 'Monthly', 'Cashier check only', 'First Tuesday of each month', NULL, '770-822-8800', '75 Langley Dr, Lawrenceville, GA 30046', 'Mon-Fri 8am-5pm', 80, NULL, NULL, '{}'),
('GA', 'Cobb', 766149, 'https://www.cobbtax.org', 'https://www.cobbtax.org/tax-sales', 'Monthly', 'Cash or cashier check', 'First Tuesday of each month', NULL, '770-528-8600', '736 Whitlock Ave, Marietta, GA 30064', 'Mon-Fri 8am-5pm', 75, NULL, NULL, '{}'),
('GA', 'DeKalb', 764382, 'https://www.dekalbcountyga.gov/taxcommissioner', 'https://www.dekalbcountyga.gov/taxcommissioner/tax-sales', 'Monthly', 'Cashier check required', 'First Tuesday of each month', NULL, '404-371-8176', '1300 Commerce Dr, Decatur, GA 30030', 'Mon-Fri 8am-5pm', 90, NULL, NULL, '{}'),
('GA', 'Clayton', 294038, 'https://www.claytoncountyga.gov/taxcommissioner', NULL, 'Monthly', 'Cashier check', 'First Tuesday of each month', NULL, '770-477-3311', '112 Smith St, Jonesboro, GA 30236', 'Mon-Fri 8am-5pm', 60, NULL, NULL, '{}'),

-- HAWAII
('HI', 'Honolulu', 1016508, 'https://www.realpropertyhonolulu.com', NULL, 'Periodic', 'Cash or certified check', 'Limited inventory', NULL, '808-768-3799', '842 Bethel St, Honolulu, HI 96813', 'Mon-Fri 7:45am-4:30pm', 15, NULL, NULL, '{}'),

-- IDAHO
('ID', 'Ada', 494967, 'https://adacounty.id.gov/treasurer', NULL, 'Annual in December', 'Cash or certified funds', 'Auction at courthouse', NULL, '208-287-7210', '200 W Front St, Boise, ID 83702', 'Mon-Fri 9am-5pm', 40, NULL, NULL, '{}'),

-- ILLINOIS
('IL', 'Cook', 5275541, 'https://www.cookcountytreasurer.com', 'https://www.cookcountytreasurer.com/tax-sale', 'Annual in November', 'Online registration and deposit', 'Online bidding system', 'taxsale@cookcountyil.gov', '312-443-5100', '118 N Clark St, Chicago, IL 60602', 'Mon-Fri 9am-5pm', 10000, NULL, NULL, '{}'),
('IL', 'DuPage', 932877, 'https://www.dupagetreasurer.org', 'https://www.dupagetreasurer.org/tax-sale', 'Annual', 'Registration required', 'Hybrid auction', NULL, '630-407-5900', '421 N County Farm Rd, Wheaton, IL 60187', 'Mon-Fri 8am-4:30pm', 800, NULL, NULL, '{}'),

-- INDIANA
('IN', 'Marion', 977203, 'https://www.indy.gov/agency/office-of-finance-and-management', 'https://www.indy.gov/agency/office-of-finance-and-management/tax-sale', 'Annual', 'Court-supervised process', 'Judicial tax sale', NULL, '317-327-4700', '200 E Washington St, Indianapolis, IN 46204', 'Mon-Fri 8am-5pm', 300, NULL, NULL, '{}'),

-- IOWA
('IA', 'Polk', 513649, 'https://www.polkcountyiowa.gov/treasurer', 'https://www.polkcountyiowa.gov/treasurer/tax-sale', 'Annual in June', 'Photo ID and deposit', 'In-person auction', 'treasurer@polkcountyiowa.gov', '515-286-3060', '111 Court Ave, Des Moines, IA 50309', 'Mon-Fri 8am-4:30pm', 400, NULL, NULL, '{}'),

-- KANSAS
('KS', 'Johnson', 610863, 'https://www.jocogov.org/treasurer', NULL, 'Annual in September', 'Registration required', 'In-person auction', 'treasurer@jocogov.org', '913-715-2600', '111 S Cherry St, Olathe, KS 66061', 'Mon-Fri 8am-5pm', 150, NULL, NULL, '{}'),

-- KENTUCKY
('KY', 'Jefferson', 782969, 'https://jeffersonky-sheriff.com', NULL, 'Annual', 'Certified funds', 'Sheriff conducts sales', NULL, '502-574-5400', '531 Court Pl, Louisville, KY 40202', 'Mon-Fri 8:30am-4:30pm', 200, NULL, NULL, '{}'),

-- LOUISIANA
('LA', 'Orleans', 383997, 'https://nola.gov/finance/tax-sale', 'https://nola.gov/finance/tax-sale', 'Annual in May', 'Registration and deposit', 'Hybrid auction', 'taxsale@nola.gov', '504-658-1615', '1300 Perdido St, New Orleans, LA 70112', 'Mon-Fri 8:30am-5pm', 500, NULL, NULL, '{}'),
('LA', 'Jefferson Parish', 440781, 'https://www.jpso.com/civilproperty', NULL, 'Periodic', 'Cash or cashier check', 'Sheriff tax sales', NULL, '504-364-5300', '200 Derbigny St, Gretna, LA 70053', 'Mon-Fri 8:30am-4:30pm', 300, NULL, NULL, '{}'),

-- MARYLAND
('MD', 'Baltimore City', 585708, 'https://www.baltimorecity.gov/treasury', 'https://www.baltimorecity.gov/treasury/tax-sale', 'Annual in May', 'Online registration and deposit', 'Highly competitive bidding', 'taxsale@baltimorecity.gov', '410-396-3987', '200 Holliday St, Baltimore, MD 21202', 'Mon-Fri 8am-5pm', 2000, NULL, NULL, '{}'),
('MD', 'Montgomery', 1062061, 'https://www.montgomerycountymd.gov/finance', 'https://www.montgomerycountymd.gov/finance/tax-sale', 'Annual in June', 'Online registration required', 'Premium bidding', NULL, '240-777-8850', '255 Rockville Pike, Rockville, MD 20850', 'Mon-Fri 8:30am-5pm', 1500, NULL, NULL, '{}'),

-- MASSACHUSETTS
('MA', 'Middlesex', 1632002, 'https://www.middlesextreasurer.com', NULL, 'Periodic', 'Attorney recommended', 'Foreclosure process', NULL, '617-494-4310', '40 Thorndike St, Cambridge, MA 02141', 'Mon-Fri 8:30am-4:30pm', 100, NULL, NULL, '{}'),

-- MICHIGAN
('MI', 'Wayne', 1793561, 'https://www.waynecounty.com/treasurer', 'https://www.waynecounty.com/elected/treasurer/foreclosure.aspx', 'Annual in October', 'Online registration and deposit', 'Statewide online auction', 'taxforeclosure@waynecounty.com', '313-224-5990', '400 Monroe St, Detroit, MI 48226', 'Mon-Fri 8am-4:30pm', 5000, NULL, NULL, '{}'),
('MI', 'Oakland', 1274395, 'https://www.oakgov.com/treasurer', 'https://www.oakgov.com/treasurer/Pages/foreclosure-auction.aspx', 'Annual in October', 'Online registration required', 'Statewide online platform', 'treasurer@oakgov.com', '248-858-0611', '1200 N Telegraph Rd, Pontiac, MI 48341', 'Mon-Fri 8am-5pm', 3000, NULL, NULL, '{}'),
('MI', 'Macomb', 881217, 'https://treasurer.macombgov.org', 'https://treasurer.macombgov.org/TaxForeclosureAuction', 'Annual in October', 'Online registration and deposit', 'Statewide online auction', 'treasurer@macombgov.org', '586-469-5200', '120 N Main St, Mount Clemens, MI 48043', 'Mon-Fri 8:30am-5pm', 2500, NULL, NULL, '{}'),

-- MINNESOTA
('MN', 'Hennepin', 1281565, 'https://www.hennepin.us/treasury', NULL, 'Periodic', 'Court-supervised', 'Judicial foreclosure', NULL, '612-348-3011', '300 S 6th St, Minneapolis, MN 55487', 'Mon-Fri 8am-4:30pm', 150, NULL, NULL, '{}'),

-- MISSISSIPPI
('MS', 'Hinds', 227742, 'https://www.co.hinds.ms.us/pgs/officials/taxcollector', NULL, 'Annual in August', 'Cash or certified check', 'Courthouse steps auction', NULL, '601-968-6507', '316 S President St, Jackson, MS 39201', 'Mon-Fri 8am-5pm', 200, NULL, NULL, '{}'),

-- MISSOURI
('MO', 'St. Louis County', 1004125, 'https://stlouiscountymo.gov/collector', NULL, 'Annual in August', 'Certified funds', 'Courthouse auction', NULL, '314-615-5353', '41 S Central Ave, Clayton, MO 63105', 'Mon-Fri 8am-5pm', 400, NULL, NULL, '{}'),
('MO', 'Jackson', 717204, 'https://www.jacksongov.org/159/Collector-of-Revenue', NULL, 'Annual in August', 'Cash or certified funds', 'Trustee tax sale', NULL, '816-881-3232', '415 E 12th St, Kansas City, MO 64106', 'Mon-Fri 8am-5pm', 350, NULL, NULL, '{}'),

-- MONTANA
('MT', 'Yellowstone', 164731, 'https://www.co.yellowstone.mt.gov/treasurer', NULL, 'Annual', 'Cash or check', 'In-person auction', NULL, '406-256-2785', '217 N 27th St, Billings, MT 59101', 'Mon-Fri 8am-5pm', 80, NULL, NULL, '{}'),

-- NEBRASKA
('NE', 'Douglas', 584526, 'https://www.douglascounty-ne.gov/treasurer', 'https://www.douglascounty-ne.gov/treasurer/tax-sale', 'Annual', 'Registration required', 'In-person auction', NULL, '402-444-7021', '1819 Farnam St, Omaha, NE 68183', 'Mon-Fri 8am-5pm', 300, NULL, NULL, '{}'),

-- NEVADA
('NV', 'Clark', 2265461, 'https://www.clarkcountynv.gov/treasurer', 'https://www.clarkcountynv.gov/treasurer/tax_sale', 'Multiple times per year', 'Online registration and deposit', 'Online auctions', 'treasurer@clarkcountynv.gov', '702-455-4323', '500 S Grand Central Pkwy, Las Vegas, NV 89106', 'Mon-Fri 8am-5pm', 1000, NULL, NULL, '{}'),
('NV', 'Washoe', 486492, 'https://www.washoecounty.gov/treasurer', 'https://www.washoecounty.gov/treasurer/tax-sale', 'Multiple times per year', 'Online registration required', 'Online bidding', 'treasurer@washoecounty.gov', '775-328-2510', '1001 E 9th St, Reno, NV 89512', 'Mon-Fri 8am-5pm', 200, NULL, NULL, '{}'),

-- NEW JERSEY
('NJ', 'Essex', 863728, 'https://www.essexcountynj.org/treasurer', NULL, 'Annual', 'Registration and deposit', 'Highly competitive', NULL, '973-621-4921', '465 Dr Martin Luther King Jr Blvd, Newark, NJ 07102', 'Mon-Fri 8:30am-4:30pm', 1500, NULL, NULL, '{}'),
('NJ', 'Bergen', 955732, 'https://www.co.bergen.nj.us/treasurer', NULL, 'Annual', 'Online registration', 'Bid down interest', NULL, '201-336-6400', '1 Bergen County Plaza, Hackensack, NJ 07601', 'Mon-Fri 8:30am-4:30pm', 1200, NULL, NULL, '{}'),

-- NEW MEXICO
('NM', 'Bernalillo', 679121, 'https://www.bernco.gov/treasurer', NULL, 'Periodic', 'Certified funds', 'Treasurer sale', NULL, '505-222-3700', '1 Civic Plaza NW, Albuquerque, NM 87102', 'Mon-Fri 8am-5pm', 200, NULL, NULL, '{}'),

-- NEW YORK
('NY', 'Erie', 954236, 'https://www2.erie.gov/finance', NULL, 'Annual in September', 'Registration required', 'In-person auction', NULL, '716-858-8404', '95 Franklin St, Buffalo, NY 14202', 'Mon-Fri 9am-5pm', 500, NULL, NULL, '{}'),
('NY', 'Monroe', 759443, 'https://www2.monroecounty.gov/finance-index', NULL, 'Annual in October', 'Registration required', 'Auction at civic center', NULL, '585-753-1921', '39 W Main St, Rochester, NY 14614', 'Mon-Fri 9am-5pm', 400, NULL, NULL, '{}'),

-- NORTH CAROLINA
('NC', 'Mecklenburg', 1115482, 'https://taxcollector.mecklenburgcountync.gov', 'https://www.mecklenburgcountync.gov/news-splash/Pages/foreclosure.aspx', 'Periodic', 'Deposit required', 'Upset bid process', NULL, '704-336-2614', '700 E 4th St, Charlotte, NC 28202', 'Mon-Fri 8am-5pm', 300, NULL, NULL, '{}'),
('NC', 'Wake', 1129410, 'https://www.wake.gov/departments-government/tax-administration', 'https://www.wake.gov/departments-government/tax-administration/foreclosures', 'Periodic', 'Deposit and registration', 'Upset bid process', NULL, '919-856-5400', '301 S McDowell St, Raleigh, NC 27601', 'Mon-Fri 8am-5pm', 250, NULL, NULL, '{}'),
('NC', 'Guilford', 541299, 'https://www.guilfordcountync.gov/our-county/tax-director', NULL, 'Periodic', 'Registration required', 'Upset bid process', NULL, '336-641-3363', '400 W Market St, Greensboro, NC 27401', 'Mon-Fri 8am-5pm', 200, NULL, NULL, '{}'),

-- OHIO
('OH', 'Cuyahoga', 1264817, 'https://fiscalofficer.cuyahogacounty.us', 'https://fiscalofficer.cuyahogacounty.us/en-US/foreclosure-sales.aspx', 'Multiple times per year', 'Registration and deposit', 'In-person auctions', NULL, '216-443-7010', '2079 E 9th St, Cleveland, OH 44115', 'Mon-Fri 8:30am-4:30pm', 500, NULL, NULL, '{}'),
('OH', 'Franklin', 1323807, 'https://treasurer.franklincountyohio.gov', 'https://treasurer.franklincountyohio.gov/foreclosure-sales', 'Multiple times per year', 'Online registration', 'Hybrid auctions', NULL, '614-525-3438', '373 S High St, Columbus, OH 43215', 'Mon-Fri 8am-5pm', 600, NULL, NULL, '{}'),
('OH', 'Hamilton', 830639, 'https://www.hamiltoncountyohio.gov/treasurer', NULL, 'Periodic', 'Registration required', 'In-person auctions', NULL, '513-946-4800', '138 E Court St, Cincinnati, OH 45202', 'Mon-Fri 8am-4:30pm', 400, NULL, NULL, '{}'),

-- OKLAHOMA
('OK', 'Oklahoma', 796292, 'https://www.oklahomacounty.org/treasurer', NULL, 'Annual in June', 'Cash or certified check', 'Resale properties', NULL, '405-713-1300', '320 Robert S Kerr Ave, Oklahoma City, OK 73102', 'Mon-Fri 8am-5pm', 300, NULL, NULL, '{}'),
('OK', 'Tulsa', 669279, 'https://www.tulsacounty.org/treasurer', NULL, 'Annual in June', 'Certified funds', 'Resale auction', NULL, '918-596-5050', '218 W 6th St, Tulsa, OK 74119', 'Mon-Fri 8am-5pm', 250, NULL, NULL, '{}'),

-- OREGON
('OR', 'Multnomah', 815428, 'https://www.multco.us/treasurer', 'https://www.multco.us/treasurer/foreclosures', 'Multiple times per year', 'Online registration', 'Online auctions', 'treasurer@multco.us', '503-988-3126', '501 SE Hawthorne Blvd, Portland, OR 97214', 'Mon-Fri 8am-5pm', 150, NULL, NULL, '{}'),

-- PENNSYLVANIA
('PA', 'Philadelphia', 1603797, 'https://www.phila.gov/revenue', 'https://www.phila.gov/property/real-estate-tax-sale', 'Periodic', 'Registration required', 'Sheriff tax sales', NULL, '215-686-6442', '1401 John F Kennedy Blvd, Philadelphia, PA 19102', 'Mon-Fri 8:30am-5pm', 1000, NULL, NULL, '{}'),
('PA', 'Allegheny', 1250578, 'https://www.alleghenycounty.us/treasury', 'https://www.alleghenycounty.us/treasury/real-estate/upset-sale.aspx', 'Annual in September', 'Registration and deposit', 'Upset and judicial sales', NULL, '412-350-4100', '436 Grant St, Pittsburgh, PA 15219', 'Mon-Fri 8:30am-4:30pm', 800, NULL, NULL, '{}'),

-- SOUTH CAROLINA
('SC', 'Charleston', 408235, 'https://www.charlestoncounty.org/treasurer', NULL, 'Annual in November', 'Cash or certified funds', 'Courthouse steps', NULL, '843-958-4360', '4045 Bridge View Dr, North Charleston, SC 29405', 'Mon-Fri 8:30am-5pm', 200, NULL, NULL, '{}'),
('SC', 'Greenville', 525534, 'https://www.greenvillecounty.org/TaxCollection', NULL, 'Annual in November', 'Certified funds', 'In-person auction', NULL, '864-467-7050', '301 University Ridge, Greenville, SC 29601', 'Mon-Fri 8:30am-5pm', 150, NULL, NULL, '{}'),

-- TENNESSEE
('TN', 'Shelby', 929744, 'https://www.shelbycountytn.gov/treasurer', NULL, 'Periodic', 'Certified funds', 'Trustee sales', NULL, '901-222-2055', '160 N Main St, Memphis, TN 38103', 'Mon-Fri 8am-4:30pm', 400, NULL, NULL, '{}'),
('TN', 'Davidson', 715884, 'https://www.nashville.gov/departments/finance/trustee', NULL, 'Periodic', 'Cash or certified check', 'Trustee sales', NULL, '615-862-6160', '700 President Ronald Reagan Way, Nashville, TN 37210', 'Mon-Fri 8am-4pm', 300, NULL, NULL, '{}'),

-- TEXAS
('TX', 'Harris', 4731145, 'https://hctax.net', 'https://hctax.net/Property/Delinquent', 'Monthly', 'Cash, cashier check, or wire', 'First Tuesday of each month', 'dso@hctx.net', '713-274-8000', '1001 Preston St, Houston, TX 77002', 'Mon-Fri 8am-4:30pm', 500, NULL, NULL, '{}'),
('TX', 'Dallas', 2613539, 'https://www.dallascounty.org/taxoffice', 'https://www.dallascounty.org/government/taxoffice/foreclosure.php', 'Monthly', 'Cashier check or wire', 'First Tuesday of each month', NULL, '214-653-7811', '500 Elm St, Dallas, TX 75202', 'Mon-Fri 8am-4:30pm', 400, NULL, NULL, '{}'),
('TX', 'Tarrant', 2110640, 'https://www.tarrantcounty.com/en/tax-assessor-collector.html', 'https://www.tarrantcounty.com/en/tax-assessor-collector/foreclosure-sales.html', 'Monthly', 'Cashier check only', 'First Tuesday of each month', NULL, '817-884-1100', '100 E Weatherford St, Fort Worth, TX 76196', 'Mon-Fri 8am-4:30pm', 350, NULL, NULL, '{}'),
('TX', 'Bexar', 2009324, 'https://www.bcad.org', 'https://tax.bexar.org/Delinquent', 'Monthly', 'Cashier check or wire', 'First Tuesday of each month', NULL, '210-224-8511', '411 N Frio St, San Antonio, TX 78207', 'Mon-Fri 8am-5pm', 300, NULL, NULL, '{}'),
('TX', 'Travis', 1290188, 'https://www.traviscountytx.gov/tax-office', 'https://tax.co.travis.tx.us/foreclosure', 'Monthly', 'Cashier check', 'First Tuesday of each month', NULL, '512-854-9473', '5501 Airport Blvd, Austin, TX 78751', 'Mon-Fri 8am-4:30pm', 250, NULL, NULL, '{}'),
('TX', 'Collin', 1064465, 'https://www.collincountytx.gov/tax_assessor', 'https://www.collincountytx.gov/tax_assessor/Pages/delinquent_properties.aspx', 'Monthly', 'Cashier check', 'First Tuesday of each month', NULL, '972-547-5020', '2300 Bloomdale Rd, McKinney, TX 75071', 'Mon-Fri 8am-4:30pm', 200, NULL, NULL, '{}'),
('TX', 'Denton', 944350, 'https://dentoncounty.gov/247/Tax-Assessor-Collector', NULL, 'Monthly', 'Cashier check', 'First Tuesday of each month', NULL, '940-349-3500', '1505 E McKinney St, Denton, TX 76209', 'Mon-Fri 8am-4:30pm', 180, NULL, NULL, '{}'),
('TX', 'Fort Bend', 822779, 'https://www.fortbendcountytx.gov/government/departments/tax-office', NULL, 'Monthly', 'Cashier check', 'First Tuesday of each month', NULL, '281-341-3710', '1317 Eugene Heimann Cir, Richmond, TX 77469', 'Mon-Fri 8am-4:30pm', 150, NULL, NULL, '{}'),
('TX', 'Hidalgo', 870781, 'https://www.hidalgocounty.us/291/Tax-Assessor-Collector', NULL, 'Monthly', 'Cashier check', 'First Tuesday of each month', NULL, '956-318-2100', '100 E Cano St, Edinburg, TX 78539', 'Mon-Fri 8am-5pm', 200, NULL, NULL, '{}'),
('TX', 'El Paso', 865657, 'https://www.epcounty.com/taxoffice', NULL, 'Monthly', 'Cashier check', 'First Tuesday of each month', NULL, '915-771-2300', '500 E San Antonio Ave, El Paso, TX 79901', 'Mon-Fri 8am-5pm', 180, NULL, NULL, '{}'),

-- UTAH
('UT', 'Salt Lake', 1185238, 'https://slco.org/treasurer', 'https://slco.org/treasurer/tax-sale', 'Annual in May', 'Online registration and deposit', 'Online auction', 'treasurer@slco.org', '385-468-8000', '2001 S State St, Salt Lake City, UT 84190', 'Mon-Fri 8am-5pm', 300, NULL, NULL, '{}'),
('UT', 'Utah', 659399, 'https://www.utahcounty.gov/dept/treasurer', 'https://www.utahcounty.gov/dept/treasurer/taxsale.html', 'Annual in May', 'Online registration required', 'Online bidding', NULL, '801-851-8218', '100 E Center St, Provo, UT 84606', 'Mon-Fri 8am-5pm', 200, NULL, NULL, '{}'),

-- VIRGINIA
('VA', 'Fairfax', 1150309, 'https://www.fairfaxcounty.gov/treasurer', NULL, 'Periodic', 'Court-supervised', 'Judicial tax sales', NULL, '703-222-8234', '12000 Government Center Pkwy, Fairfax, VA 22035', 'Mon-Fri 8am-4:30pm', 150, NULL, NULL, '{}'),

-- WASHINGTON
('WA', 'King', 2269675, 'https://kingcounty.gov/treasury', 'https://kingcounty.gov/depts/finance-business-operations/treasury/property-tax/tax-foreclosure-sales.aspx', 'Multiple times per year', 'Online registration', 'Online auctions', 'treasuryservices@kingcounty.gov', '206-263-2890', '500 4th Ave, Seattle, WA 98104', 'Mon-Fri 8:30am-4:30pm', 200, NULL, NULL, '{}'),
('WA', 'Pierce', 921130, 'https://www.piercecountywa.gov/treasurer', 'https://www.piercecountywa.gov/treasurer/foreclosure', 'Multiple times per year', 'Online registration', 'Online bidding', NULL, '253-798-7450', '2401 S 35th St, Tacoma, WA 98409', 'Mon-Fri 8:30am-4:30pm', 150, NULL, NULL, '{}'),
('WA', 'Snohomish', 827957, 'https://snohomishcountywa.gov/156/Treasurer', NULL, 'Periodic', 'Online registration', 'Online auctions', NULL, '425-388-3366', '3000 Rockefeller Ave, Everett, WA 98201', 'Mon-Fri 8:30am-4:30pm', 120, NULL, NULL, '{}'),

-- WISCONSIN
('WI', 'Milwaukee', 939489, 'https://county.milwaukee.gov/EN/Treasurer', 'https://county.milwaukee.gov/EN/Treasurer/Tax-Delinquent-Land-Sale', 'Annual', 'Online registration', 'Online auction', NULL, '414-278-4033', '901 N 9th St, Milwaukee, WI 53233', 'Mon-Fri 8am-5pm', 400, NULL, NULL, '{}'),
('WI', 'Dane', 561504, 'https://treasurer.countyofdane.com', 'https://treasurer.countyofdane.com/TaxDeedSale', 'Annual', 'Online registration', 'Online bidding', NULL, '608-266-4151', '210 Martin Luther King Jr Blvd, Madison, WI 53703', 'Mon-Fri 8am-4:30pm', 200, NULL, NULL, '{}')

ON CONFLICT (state_code, county_name) DO UPDATE SET
  population = EXCLUDED.population,
  tax_collector_website = EXCLUDED.tax_collector_website,
  auction_website = EXCLUDED.auction_website,
  auction_schedule = EXCLUDED.auction_schedule,
  filing_requirements = EXCLUDED.filing_requirements,
  local_rules = EXCLUDED.local_rules,
  contact_email = EXCLUDED.contact_email,
  contact_phone = EXCLUDED.contact_phone,
  office_address = EXCLUDED.office_address,
  office_hours = EXCLUDED.office_hours,
  average_properties_per_auction = EXCLUDED.average_properties_per_auction,
  updated_at = NOW();
