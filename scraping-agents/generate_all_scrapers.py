#!/usr/bin/env python3
"""
Universal County Scraper Generator
Automatically generates scrapers for all counties in the database
"""

import os
import json
from pathlib import Path

# Template for a universal county scraper
SCRAPER_TEMPLATE = '''"""
{county_name} County, {state_name} Tax Deed/Lien Scraper
Auto-generated scraper - customize as needed
"""

from scrapers.base_scraper import BaseScraper
from models.property import Property
from typing import List
import logging

logger = logging.getLogger(__name__)


class {class_name}Scraper(BaseScraper):
    """Scraper for {county_name} County, {state_name}"""

    def __init__(self):
        super().__init__(
            county_name="{county_name}",
            state_code="{state_code}",
            base_url="{base_url}"
        )
        self.deed_type = "{deed_type}"

    async def scrape(self) -> List[Property]:
        """
        Main scraping method

        Returns:
            List of Property objects
        """
        logger.info(f"Starting scrape for {{self.county_name}} County, {{self.state_code}}")

        properties = []

        try:
            # Step 1: Navigate to tax sale page
            await self.navigate_to_tax_sale_page()

            # Step 2: Extract property listings
            raw_data = await self.extract_property_data()

            # Step 3: Parse and create Property objects
            properties = await self.parse_properties(raw_data)

            logger.info(f"Successfully scraped {{len(properties)}} properties")

        except Exception as e:
            logger.error(f"Error scraping {{self.county_name}} County: {{str(e)}}")
            raise

        return properties

    async def navigate_to_tax_sale_page(self):
        """Navigate to the tax sale/auction page"""
        if not self.base_url:
            raise ValueError("No base URL configured for this county")

        # Try common tax sale page patterns
        possible_paths = [
            "/tax-sale",
            "/tax-sales",
            "/taxsale",
            "/foreclosure",
            "/auction",
            "/delinquent-tax",
            "/tax-delinquent",
        ]

        for path in possible_paths:
            try:
                url = self.base_url.rstrip('/') + path
                response = await self.session.get(url, timeout=30)
                if response.status_code == 200:
                    logger.info(f"Found tax sale page at: {{url}}")
                    return
            except Exception as e:
                continue

        # If no specific page found, use base URL
        logger.warning(f"Using base URL as tax sale page: {{self.base_url}}")

    async def extract_property_data(self) -> List[dict]:
        """
        Extract raw property data from the page
        Override this method with county-specific logic
        """
        raw_data = []

        # Use AI to extract data if available
        if self.use_ai:
            raw_data = await self.ai_extract_properties()
        else:
            # Generic extraction logic
            raw_data = await self.generic_extract()

        return raw_data

    async def ai_extract_properties(self) -> List[dict]:
        """Use AI to extract property data from the page"""
        try:
            from utils.ai_extractor import AIExtractor

            extractor = AIExtractor()
            html = await self.get_page_html()

            properties = await extractor.extract_properties(
                html=html,
                county=self.county_name,
                state=self.state_code,
                deed_type=self.deed_type
            )

            return properties

        except Exception as e:
            logger.error(f"AI extraction failed: {{str(e)}}")
            return []

    async def generic_extract(self) -> List[dict]:
        """
        Generic extraction using common patterns
        Override with county-specific selectors
        """
        from bs4 import BeautifulSoup

        html = await self.get_page_html()
        soup = BeautifulSoup(html, 'html.parser')

        properties = []

        # Try to find property tables or lists
        tables = soup.find_all('table')
        for table in tables:
            rows = table.find_all('tr')[1:]  # Skip header

            for row in rows:
                cells = row.find_all(['td', 'th'])
                if len(cells) >= 3:  # Minimum fields
                    prop_data = {{
                        'raw_html': str(row),
                        'cells': [cell.get_text(strip=True) for cell in cells]
                    }}
                    properties.append(prop_data)

        return properties

    async def parse_properties(self, raw_data: List[dict]) -> List[Property]:
        """
        Parse raw data into Property objects
        Override with county-specific parsing logic
        """
        properties = []

        for data in raw_data:
            try:
                # Extract common fields
                prop = Property(
                    county=self.county_name,
                    state=self.state_code,
                    deed_type=self.deed_type,
                    source_url=self.base_url,
                    raw_data=data
                )

                # Try to populate fields from cells
                if 'cells' in data and len(data['cells']) >= 3:
                    cells = data['cells']

                    # Common patterns (customize based on actual county format)
                    prop.parcel_number = cells[0] if len(cells) > 0 else None
                    prop.address = cells[1] if len(cells) > 1 else None

                    # Try to find amount
                    for cell in cells:
                        if '$' in cell:
                            try:
                                prop.tax_amount = float(cell.replace('$', '').replace(',', ''))
                                break
                            except:
                                pass

                properties.append(prop)

            except Exception as e:
                logger.error(f"Error parsing property: {{str(e)}}")
                continue

        return properties

    async def get_page_html(self) -> str:
        """Get current page HTML"""
        # Implementation depends on whether using Selenium or requests
        # Override in subclass if needed
        return ""
'''

# County data for all major counties (from seed data)
COUNTIES = [
    # Alabama
    {"state": "AL", "state_name": "Alabama", "county": "Jefferson", "url": "https://jccal.org/revenue", "type": "tax_deed"},
    {"state": "AL", "state_name": "Alabama", "county": "Mobile", "url": "https://www.mobilecountyal.gov/revenue", "type": "tax_deed"},

    # Alaska
    {"state": "AK", "state_name": "Alaska", "county": "Anchorage", "url": "https://www.muni.org/treasury", "type": "tax_deed"},

    # Arizona
    {"state": "AZ", "state_name": "Arizona", "county": "Maricopa", "url": "https://treasurer.maricopa.gov", "type": "tax_lien"},
    {"state": "AZ", "state_name": "Arizona", "county": "Pima", "url": "https://www.asr.pima.gov", "type": "tax_lien"},

    # Arkansas
    {"state": "AR", "state_name": "Arkansas", "county": "Pulaski", "url": "https://www.pulaskicounty.net/treasurer", "type": "redeemable_deed"},

    # California
    {"state": "CA", "state_name": "California", "county": "Los Angeles", "url": "https://ttc.lacounty.gov", "type": "tax_deed"},
    {"state": "CA", "state_name": "California", "county": "San Diego", "url": "https://www.sdttc.com", "type": "tax_deed"},
    {"state": "CA", "state_name": "California", "county": "Orange", "url": "https://www.octreasurer.com", "type": "tax_deed"},
    {"state": "CA", "state_name": "California", "county": "Riverside", "url": "https://www.countytreasurer.org", "type": "tax_deed"},
    {"state": "CA", "state_name": "California", "county": "Sacramento", "url": "https://www.treasurer.saccounty.net", "type": "tax_deed"},
    {"state": "CA", "state_name": "California", "county": "Alameda", "url": "https://www.acgov.org/treasurer", "type": "tax_deed"},

    # Colorado
    {"state": "CO", "state_name": "Colorado", "county": "Denver", "url": "https://www.denvergov.org/treasurer", "type": "tax_lien"},
    {"state": "CO", "state_name": "Colorado", "county": "El Paso", "url": "https://treasurer.elpasoco.com", "type": "tax_lien"},

    # Florida
    {"state": "FL", "state_name": "Florida", "county": "Miami-Dade", "url": "https://www.miamidade.gov/taxcollector", "type": "tax_lien"},
    {"state": "FL", "state_name": "Florida", "county": "Broward", "url": "https://www.broward.org/RecordsTaxesTreasury", "type": "tax_lien"},
    {"state": "FL", "state_name": "Florida", "county": "Palm Beach", "url": "https://www.pbctax.gov", "type": "tax_lien"},
    {"state": "FL", "state_name": "Florida", "county": "Orange", "url": "https://www.octaxcol.com", "type": "tax_lien"},
    {"state": "FL", "state_name": "Florida", "county": "Pinellas", "url": "https://www.pinellascounty.org/taxcoll", "type": "tax_lien"},
    {"state": "FL", "state_name": "Florida", "county": "Polk", "url": "https://www.polktaxes.com", "type": "tax_lien"},
    {"state": "FL", "state_name": "Florida", "county": "Lee", "url": "https://www.leepa.org", "type": "tax_lien"},

    # Georgia
    {"state": "GA", "state_name": "Georgia", "county": "Gwinnett", "url": "https://www.gwinnettcounty.com/taxcommissioner", "type": "tax_deed"},
    {"state": "GA", "state_name": "Georgia", "county": "Cobb", "url": "https://www.cobbtax.org", "type": "tax_deed"},
    {"state": "GA", "state_name": "Georgia", "county": "DeKalb", "url": "https://www.dekalbcountyga.gov/taxcommissioner", "type": "tax_deed"},

    # Illinois
    {"state": "IL", "state_name": "Illinois", "county": "Cook", "url": "https://www.cookcountytreasurer.com", "type": "tax_lien"},
    {"state": "IL", "state_name": "Illinois", "county": "DuPage", "url": "https://www.dupagetreasurer.org", "type": "tax_lien"},

    # Michigan
    {"state": "MI", "state_name": "Michigan", "county": "Oakland", "url": "https://www.oakgov.com/treasurer", "type": "tax_deed"},
    {"state": "MI", "state_name": "Michigan", "county": "Macomb", "url": "https://treasurer.macombgov.org", "type": "tax_deed"},

    # Nevada
    {"state": "NV", "state_name": "Nevada", "county": "Clark", "url": "https://www.clarkcountynv.gov/treasurer", "type": "tax_deed"},
    {"state": "NV", "state_name": "Nevada", "county": "Washoe", "url": "https://www.washoecounty.gov/treasurer", "type": "tax_deed"},

    # New Jersey
    {"state": "NJ", "state_name": "New Jersey", "county": "Essex", "url": "https://www.essexcountynj.org/treasurer", "type": "tax_lien"},
    {"state": "NJ", "state_name": "New Jersey", "county": "Bergen", "url": "https://www.co.bergen.nj.us/treasurer", "type": "tax_lien"},

    # New York
    {"state": "NY", "state_name": "New York", "county": "Erie", "url": "https://www2.erie.gov/finance", "type": "tax_lien"},

    # North Carolina
    {"state": "NC", "state_name": "North Carolina", "county": "Wake", "url": "https://www.wake.gov/departments-government/tax-administration", "type": "tax_deed"},

    # Ohio
    {"state": "OH", "state_name": "Ohio", "county": "Cuyahoga", "url": "https://fiscalofficer.cuyahogacounty.us", "type": "tax_lien"},
    {"state": "OH", "state_name": "Ohio", "county": "Franklin", "url": "https://treasurer.franklincountyohio.gov", "type": "tax_lien"},
    {"state": "OH", "state_name": "Ohio", "county": "Hamilton", "url": "https://www.hamiltoncountyohio.gov/treasurer", "type": "tax_lien"},

    # Pennsylvania
    {"state": "PA", "state_name": "Pennsylvania", "county": "Philadelphia", "url": "https://www.phila.gov/revenue", "type": "tax_deed"},
    {"state": "PA", "state_name": "Pennsylvania", "county": "Allegheny", "url": "https://www.alleghenycounty.us/treasury", "type": "tax_deed"},

    # South Carolina
    {"state": "SC", "state_name": "South Carolina", "county": "Charleston", "url": "https://www.charlestoncounty.org/treasurer", "type": "tax_deed"},
    {"state": "SC", "state_name": "South Carolina", "county": "Greenville", "url": "https://www.greenvillecounty.org/TaxCollection", "type": "tax_deed"},

    # Tennessee
    {"state": "TN", "state_name": "Tennessee", "county": "Shelby", "url": "https://www.shelbycountytn.gov/treasurer", "type": "tax_deed"},
    {"state": "TN", "state_name": "Tennessee", "county": "Davidson", "url": "https://www.nashville.gov/departments/finance/trustee", "type": "tax_deed"},

    # Utah
    {"state": "UT", "state_name": "Utah", "county": "Salt Lake", "url": "https://slco.org/treasurer", "type": "tax_deed"},
    {"state": "UT", "state_name": "Utah", "county": "Utah", "url": "https://www.utahcounty.gov/dept/treasurer", "type": "tax_deed"},

    # Washington
    {"state": "WA", "state_name": "Washington", "county": "King", "url": "https://kingcounty.gov/treasury", "type": "tax_deed"},
    {"state": "WA", "state_name": "Washington", "county": "Pierce", "url": "https://www.piercecountywa.gov/treasurer", "type": "tax_deed"},
    {"state": "WA", "state_name": "Washington", "county": "Snohomish", "url": "https://snohomishcountywa.gov/156/Treasurer", "type": "tax_deed"},

    # Wisconsin
    {"state": "WI", "state_name": "Wisconsin", "county": "Milwaukee", "url": "https://county.milwaukee.gov/EN/Treasurer", "type": "tax_deed"},
    {"state": "WI", "state_name": "Wisconsin", "county": "Dane", "url": "https://treasurer.countyofdane.com", "type": "tax_deed"},
]


def generate_scraper(county_data: dict) -> str:
    """Generate scraper code for a county"""
    class_name = county_data['county'].replace(' ', '').replace('-', '')

    return SCRAPER_TEMPLATE.format(
        county_name=county_data['county'],
        state_name=county_data['state_name'],
        state_code=county_data['state'],
        class_name=class_name,
        base_url=county_data['url'],
        deed_type=county_data['type']
    )


def main():
    """Generate all county scrapers"""
    base_path = Path(__file__).parent / 'scrapers'

    print(f"Generating scrapers for {len(COUNTIES)} counties...")

    generated_count = 0

    for county in COUNTIES:
        # Create state directory if it doesn't exist
        state_dir = base_path / county['state'].lower()
        state_dir.mkdir(parents=True, exist_ok=True)

        # Generate scraper file
        class_name = county['county'].replace(' ', '').replace('-', '').lower()
        file_path = state_dir / f"{class_name}_scraper.py"

        # Skip if already exists (don't overwrite custom scrapers)
        if file_path.exists():
            print(f"  ⏭️  Skipping {county['county']}, {county['state']} (already exists)")
            continue

        # Write scraper file
        scraper_code = generate_scraper(county)
        file_path.write_text(scraper_code)

        # Create __init__.py if it doesn't exist
        init_file = state_dir / '__init__.py'
        if not init_file.exists():
            init_file.write_text(f'"""Scrapers for {county["state_name"]}"""\n')

        print(f"  ✅ Generated {county['county']}, {county['state']}")
        generated_count += 1

    print(f"\n🎉 Generated {generated_count} new scrapers!")
    print(f"📁 Scrapers are in: {base_path}")
    print("\n💡 Next steps:")
    print("  1. Review and customize the generated scrapers")
    print("  2. Test each scraper individually")
    print("  3. Update config/counties.json with scraper configurations")
    print("  4. Run: python agent_orchestrator.py --mode once")


if __name__ == '__main__':
    main()
