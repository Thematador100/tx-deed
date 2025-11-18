"""Scraper for TaxSaleResources.com and similar aggregator sites."""
from typing import List, Dict, Any
from loguru import logger
from .base import BaseScraper

class TaxSaleResourcesScraper(BaseScraper):
    """Scraper for TaxSaleResources.com."""

    def __init__(self):
        super().__init__("taxsaleresources.com")
        self.base_url = "https://www.taxsaleresources.com"

    async def scrape(self, state: str = None, county: str = None) -> List[Dict[str, Any]]:
        """
        Scrape tax sale listings from TaxSaleResources.com.

        Args:
            state: State filter (e.g., "TX", "GA")
            county: County filter (e.g., "Harris")

        Returns:
            List of property dictionaries
        """
        try:
            # Build search URL
            search_url = f"{self.base_url}/tax-sales"
            if state:
                search_url += f"/{state.lower()}"
                if county:
                    search_url += f"/{county.lower()}"

            logger.info(f"Scraping {search_url}")

            # Fetch the page
            html = await self.fetch_page(search_url)
            soup = self.parse_html(html)

            # Find all property listings
            # NOTE: This is a generic example - actual selectors depend on the website structure
            property_elements = soup.select('.property-listing, .tax-sale-item, .listing-item')

            if not property_elements:
                logger.warning("No property elements found - website structure may have changed")
                # Try alternative selectors
                property_elements = soup.select('article, .property, .sale-listing')

            logger.info(f"Found {len(property_elements)} potential properties")

            properties = []
            for element in property_elements:
                try:
                    property_data = self.parse_property(element)
                    if property_data:
                        properties.append(property_data)
                except Exception as e:
                    logger.error(f"Error parsing property: {e}")
                    continue

                await self.random_delay()

            self.properties = properties
            logger.info(f"Successfully scraped {len(properties)} properties from {self.source_name}")
            return properties

        except Exception as e:
            logger.error(f"Scraping failed for {self.source_name}: {e}")
            raise

    def parse_property(self, element) -> Dict[str, Any]:
        """Parse individual property element."""
        try:
            # Extract property details
            # NOTE: Adjust selectors based on actual website structure
            address_elem = element.select_one('.address, .property-address, h3, h4')
            address = self.clean_text(address_elem.text) if address_elem else None

            owner_elem = element.select_one('.owner, .property-owner')
            owner = self.clean_text(owner_elem.text) if owner_elem else None

            parcel_elem = element.select_one('.parcel, .parcel-id')
            parcel_id = self.clean_text(parcel_elem.text) if parcel_elem else None

            # Financial information
            bid_elem = element.select_one('.bid, .starting-bid, .price')
            starting_bid = self.parse_price(bid_elem.text) if bid_elem else None

            tax_elem = element.select_one('.tax-amount, .taxes-owed')
            tax_amount = self.parse_price(tax_elem.text) if tax_elem else None

            # Auction details
            date_elem = element.select_one('.auction-date, .sale-date, .date')
            auction_date = self.parse_date(date_elem.text) if date_elem else None

            location_elem = element.select_one('.location, .auction-location')
            auction_location = self.clean_text(location_elem.text) if location_elem else None

            # Property details
            type_elem = element.select_one('.property-type, .type')
            property_type = self.clean_text(type_elem.text) if type_elem else None

            desc_elem = element.select_one('.description, p')
            description = self.clean_text(desc_elem.text) if desc_elem else None

            # URL
            link_elem = element.select_one('a[href]')
            listing_url = link_elem['href'] if link_elem else None
            if listing_url and not listing_url.startswith('http'):
                listing_url = f"{self.base_url}{listing_url}"

            if not address:
                return None

            property_id = self.generate_property_id(self.source_name, parcel_id, address)

            return {
                'id': property_id,
                'source': self.source_name,
                'parcel_id': parcel_id,
                'owner': owner,
                'address': address,
                'starting_bid': starting_bid,
                'tax_amount': tax_amount,
                'auction_date': auction_date,
                'auction_location': auction_location,
                'property_type': property_type,
                'description': description,
                'listing_url': listing_url,
                'status': 'Upcoming'
            }

        except Exception as e:
            logger.error(f"Error in parse_property: {e}")
            return None

    async def scrape_property_details(self, property_url: str) -> Dict[str, Any]:
        """Scrape detailed information from individual property page."""
        try:
            html = await self.fetch_page(property_url)
            soup = self.parse_html(html)

            details = {}

            # Extract additional details from property detail page
            # This is where you'd extract bedrooms, bathrooms, sqft, etc.
            details_section = soup.select_one('.property-details, .details')
            if details_section:
                # Extract structured data
                detail_items = details_section.select('.detail-item, li')
                for item in detail_items:
                    text = self.clean_text(item.text)
                    if 'bedroom' in text.lower():
                        details['bedrooms'] = self._extract_number(text)
                    elif 'bathroom' in text.lower():
                        details['bathrooms'] = self._extract_number(text)
                    elif 'sqft' in text.lower() or 'sq ft' in text.lower():
                        details['sqft'] = self._extract_number(text)
                    elif 'year built' in text.lower():
                        details['year_built'] = self._extract_number(text)

            return details

        except Exception as e:
            logger.error(f"Error scraping property details: {e}")
            return {}

    def _extract_number(self, text: str) -> int:
        """Extract first number from text."""
        import re
        match = re.search(r'\d+', text)
        return int(match.group()) if match else None
