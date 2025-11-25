-- Seed initial scraper configurations for known counties

INSERT INTO public.scraper_configs (county, state, scraper_type, website_url, scraper_method, notes) VALUES
-- Texas Counties
('Harris', 'TX', 'tax_deed', 'https://www.hctax.net/Property/PropertyTax', 'web_scrape', 'Houston area - largest county in TX'),
('Harris', 'TX', 'tax_delinquent', 'https://www.hctax.net/Delinquent/DelinquentTaxSearch', 'web_scrape', 'Houston area delinquent properties'),
('Travis', 'TX', 'tax_deed', 'https://tax-office.traviscountytx.gov/', 'web_scrape', 'Austin area'),
('Travis', 'TX', 'tax_delinquent', 'https://tax-office.traviscountytx.gov/delinquent-tax-sales', 'web_scrape', 'Austin area delinquent properties'),
('Bexar', 'TX', 'tax_deed', 'https://www.bexar.org/1925/Tax-Sales', 'web_scrape', 'San Antonio area'),
('Dallas', 'TX', 'tax_deed', 'https://www.dallascounty.org/government/tax/sales.php', 'web_scrape', 'Dallas area'),
('Tarrant', 'TX', 'tax_deed', 'https://www.tarrantcounty.com/en/tax/tax-sales.html', 'web_scrape', 'Fort Worth area'),

-- Georgia Counties
('Fulton', 'GA', 'tax_deed', 'https://www.fultoncountyga.gov/services/taxes/tax-commissioner/tax-sales', 'web_scrape', 'Atlanta area'),
('DeKalb', 'GA', 'tax_deed', 'https://www.dekalbcountyga.gov/tax-commissioner/tax-sales', 'web_scrape', 'Greater Atlanta'),
('Chatham', 'GA', 'tax_deed', 'https://www.chathamcountyga.gov/departments/tax-commissioner', 'web_scrape', 'Savannah area'),
('Gwinnett', 'GA', 'tax_deed', 'https://www.gwinnettcounty.com/web/gwinnett/departments/taxcommissioner/taxsales', 'web_scrape', 'Northeast Atlanta metro'),
('Cobb', 'GA', 'tax_deed', 'https://www.cobbcounty.org/tax/property-tax/tax-sales', 'web_scrape', 'Northwest Atlanta metro'),

-- Florida Counties
('Miami-Dade', 'FL', 'tax_deed', 'https://www.miamidade.gov/global/service.page?Mduid_service=ser1489687901036675', 'web_scrape', 'Miami area'),
('Miami-Dade', 'FL', 'tax_delinquent', 'https://www.miamidade.gov/taxcollector/tax-certificate-sales.asp', 'web_scrape', 'Miami tax certificates'),
('Orange', 'FL', 'tax_deed', 'https://www.octaxcol.com/eservices/tax_deed.cfm', 'web_scrape', 'Orlando area'),
('Hillsborough', 'FL', 'tax_deed', 'https://www.hillstax.org/Programs/Tax-Certificate-Sales', 'web_scrape', 'Tampa area'),
('Broward', 'FL', 'tax_deed', 'https://www.broward.org/RecordsTaxesTreasury/Pages/TaxCertificateSale.aspx', 'web_scrape', 'Fort Lauderdale area'),

-- California Counties
('Los Angeles', 'CA', 'tax_deed', 'https://ttc.lacounty.gov/property-tax-defaulted-property-tax-sales/', 'web_scrape', 'LA area'),
('San Diego', 'CA', 'tax_deed', 'https://arcc.sdcounty.ca.gov/Pages/tax-sale.aspx', 'web_scrape', 'San Diego area'),
('Orange', 'CA', 'tax_deed', 'https://www.octreasurer.gov/property-tax/tax-sales', 'web_scrape', 'Orange County CA'),
('Riverside', 'CA', 'tax_deed', 'https://www.countytreasurer.org/TaxSale.aspx', 'web_scrape', 'Inland Empire'),

-- Arizona Counties
('Maricopa', 'AZ', 'tax_deed', 'https://treasurer.maricopa.gov/Home/TaxLienSale', 'web_scrape', 'Phoenix area'),
('Pima', 'AZ', 'tax_deed', 'https://www.asr.pima.gov/Treasurer/TaxLienSale', 'web_scrape', 'Tucson area'),

-- Nevada Counties
('Clark', 'NV', 'tax_deed', 'https://www.clarkcountynv.gov/government/departments/finance/treasurer/tax_sales/index.php', 'web_scrape', 'Las Vegas area'),
('Washoe', 'NV', 'tax_deed', 'https://www.washoecounty.gov/treas/tax_sale/index.php', 'web_scrape', 'Reno area'),

-- Illinois Counties
('Cook', 'IL', 'tax_deed', 'https://www.cookcountytreasurer.com/scavengersale.aspx', 'web_scrape', 'Chicago area'),

-- Michigan Counties
('Wayne', 'MI', 'tax_deed', 'https://www.waynecounty.com/elected/treasurer/delinquenttaxes.aspx', 'web_scrape', 'Detroit area'),

-- Ohio Counties
('Cuyahoga', 'OH', 'tax_deed', 'https://treasurer.cuyahogacounty.us/en-US/foreclosure-info.aspx', 'web_scrape', 'Cleveland area'),
('Franklin', 'OH', 'tax_deed', 'https://treasurer.franklincountyohio.gov/Real-Estate/Tax-Lien-Sales', 'web_scrape', 'Columbus area'),

-- Pennsylvania Counties
('Philadelphia', 'PA', 'tax_deed', 'https://www.phila.gov/services/payments-assistance-taxes/tax-collections/sheriff-sales/', 'web_scrape', 'Philadelphia'),

-- New York Counties
('Kings', 'NY', 'tax_deed', 'https://www1.nyc.gov/site/finance/taxes/property-lien-sales.page', 'web_scrape', 'Brooklyn'),

-- North Carolina Counties
('Mecklenburg', 'NC', 'tax_deed', 'https://www.mecktax.com/foreclosures/', 'web_scrape', 'Charlotte area'),
('Wake', 'NC', 'tax_deed', 'https://www.wake.gov/departments-government/tax-administration/foreclosure-sale', 'web_scrape', 'Raleigh area')

ON CONFLICT (county, state, scraper_type) DO NOTHING;
