"""Generic county tax sale scraper - can be customized per county."""
from typing import List, Dict, Any
from loguru import logger
from .base import BaseScraper

class CountyTaxSaleScraper(BaseScraper):
    """Scraper for county-specific tax sale websites."""

    def __init__(self, county: str, state: str, base_url: str):
        """
        Initialize county scraper.

        Args:
            county: County name (e.g., "Harris")
            state: State code (e.g., "TX")
            base_url: Base URL of county tax sale website
        """
        super().__init__(f"{county}-{state}-county")
        self.county = county
        self.state = state
        self.base_url = base_url

    async def scrape(self) -> List[Dict[str, Any]]:
        """Scrape properties from county website."""
        try:
            logger.info(f"Scraping {self.county} County, {self.state}")

            # Fetch main listing page
            html = await self.fetch_page(self.base_url)
            soup = self.parse_html(html)

            # Generic selectors that work for many county sites
            property_elements = soup.select('table tr, .property-row, li.property')

            # If table format, skip header
            if soup.select('table'):
                property_elements = property_elements[1:]  # Skip header row

            logger.info(f"Found {len(property_elements)} properties")

            properties = []
            for element in property_elements:
                try:
                    property_data = self.parse_property(element)
                    if property_data:
                        properties.append(property_data)
                except Exception as e:
                    logger.debug(f"Skipping element: {e}")
                    continue

            self.properties = properties
            logger.info(f"Successfully scraped {len(properties)} properties")
            return properties

        except Exception as e:
            logger.error(f"County scraping failed: {e}")
            raise

    def parse_property(self, element) -> Dict[str, Any]:
        """Parse property from county website."""
        try:
            # For table rows
            cells = element.select('td')
            if cells:
                return self._parse_table_row(cells)

            # For list/div elements
            return self._parse_div_element(element)

        except Exception as e:
            logger.debug(f"Parse error: {e}")
            return None

    def _parse_table_row(self, cells) -> Dict[str, Any]:
        """Parse property from table row format."""
        if len(cells) < 3:
            return None

        # Common table structures (adjust indices based on actual county)
        parcel_id = self.clean_text(cells[0].text)
        owner = self.clean_text(cells[1].text)
        address = self.clean_text(cells[2].text)

        # Optional fields
        tax_amount = self.parse_price(cells[3].text) if len(cells) > 3 else None
        starting_bid = self.parse_price(cells[4].text) if len(cells) > 4 else None
        auction_date = self.parse_date(cells[5].text) if len(cells) > 5 else None

        if not address:
            return None

        property_id = self.generate_property_id(self.source_name, parcel_id, address)

        return {
            'id': property_id,
            'source': self.source_name,
            'county': self.county,
            'state': self.state,
            'parcel_id': parcel_id,
            'owner': owner,
            'address': address,
            'tax_amount': tax_amount,
            'starting_bid': starting_bid,
            'auction_date': auction_date,
            'status': 'Upcoming'
        }

    def _parse_div_element(self, element) -> Dict[str, Any]:
        """Parse property from div/list element format."""
        address_elem = element.select_one('.address, .property-address')
        address = self.clean_text(address_elem.text) if address_elem else None

        if not address:
            return None

        owner_elem = element.select_one('.owner')
        owner = self.clean_text(owner_elem.text) if owner_elem else None

        parcel_elem = element.select_one('.parcel')
        parcel_id = self.clean_text(parcel_elem.text) if parcel_elem else None

        property_id = self.generate_property_id(self.source_name, parcel_id, address)

        return {
            'id': property_id,
            'source': self.source_name,
            'county': self.county,
            'state': self.state,
            'parcel_id': parcel_id,
            'owner': owner,
            'address': address,
            'status': 'Upcoming'
        }


# Pre-configured county scrapers
COUNTY_CONFIGS = {
    'harris-tx': {
        'county': 'Harris',
        'state': 'TX',
        'url': 'https://www.hctax.net/Delinquent/Home'
    },
    'travis-tx': {
        'county': 'Travis',
        'state': 'TX',
        'url': 'https://tax-office.traviscountytx.gov/delinquent-taxes'
    },
    'fulton-ga': {
        'county': 'Fulton',
        'state': 'GA',
        'url': 'https://www.fultontreasurer.org/tax-sales'
    },
    'maricopa-az': {
        'county': 'Maricopa',
        'state': 'AZ',
        'url': 'https://treasurer.maricopa.gov/Home/TaxLienSale'
    },
    'cook-il': {
        'county': 'Cook',
        'state': 'IL',
        'url': 'https://www.cookcountytreasurer.com/scavengersale.aspx'
    }
}


async def create_county_scraper(county_key: str) -> CountyTaxSaleScraper:
    """Factory function to create pre-configured county scrapers."""
    config = COUNTY_CONFIGS.get(county_key)
    if not config:
        raise ValueError(f"No configuration found for county: {county_key}")

    return CountyTaxSaleScraper(
        county=config['county'],
        state=config['state'],
        base_url=config['url']
    )
