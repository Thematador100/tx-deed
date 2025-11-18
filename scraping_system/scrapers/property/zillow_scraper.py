"""
Zillow property data scraper
Scrapes property listings, details, and market data from Zillow
"""

import re
import json
from typing import Dict, List, Optional, Any
from urllib.parse import urlencode
import time

from scraping_system.core.base_scraper import BaseScraper


class ZillowScraper(BaseScraper):
    """Scraper for Zillow property data"""

    def __init__(self, **kwargs):
        super().__init__(name="zillow", **kwargs)

        self.base_url = "https://www.zillow.com"
        self.search_url = f"{self.base_url}/homes"

    def scrape(
        self,
        location: str,
        property_type: Optional[str] = None,
        max_pages: int = 10
    ) -> List[Dict]:
        """
        Scrape property listings for a location

        Args:
            location: City, state, or zip code
            property_type: Type of property (house, condo, etc.)
            max_pages: Maximum number of pages to scrape

        Returns:
            List of property dictionaries
        """
        all_properties = []

        self.logger.info(f"Starting Zillow scrape for: {location}")

        for page in range(1, max_pages + 1):
            self.logger.info(f"Scraping page {page}/{max_pages}")

            search_params = {
                'searchQueryState': json.dumps({
                    'pagination': {'currentPage': page},
                    'filterState': {},
                    'isMapVisible': True
                })
            }

            search_url = f"{self.search_url}/{location.replace(' ', '-')}/?{urlencode(search_params)}"

            response = self.fetch(search_url)

            if not response:
                self.logger.warning(f"Failed to fetch page {page}")
                continue

            properties = self.parse(response)

            if not properties:
                self.logger.info("No more properties found")
                break

            all_properties.extend(properties)
            self.stats['items_scraped'] += len(properties)

            # Be respectful with rate limiting
            time.sleep(2)

        self.logger.info(f"Scraped {len(all_properties)} properties from Zillow")
        return all_properties

    def parse(self, response) -> List[Dict]:
        """
        Parse Zillow search results page

        Args:
            response: HTTP response

        Returns:
            List of property dictionaries
        """
        properties = []

        soup = self.parse_html(response.text)

        # Find the JSON data embedded in the page
        script_tags = soup.find_all('script', {'type': 'application/json'})

        for script in script_tags:
            try:
                data = json.loads(script.string)

                # Navigate through the Zillow data structure
                if 'cat1' in data and 'searchResults' in data['cat1']:
                    search_results = data['cat1']['searchResults'].get('listResults', [])

                    for result in search_results:
                        property_data = self._extract_property_data(result)
                        if property_data:
                            properties.append(property_data)

            except (json.JSONDecodeError, KeyError) as e:
                self.logger.debug(f"Error parsing JSON: {str(e)}")
                continue

        # Fallback to HTML parsing if no JSON found
        if not properties:
            properties = self._parse_html_listings(soup)

        return properties

    def _extract_property_data(self, result: Dict) -> Optional[Dict]:
        """
        Extract property data from Zillow result

        Args:
            result: Property result dictionary

        Returns:
            Normalized property dictionary
        """
        try:
            return {
                'property_id': result.get('zpid'),
                'address': result.get('address'),
                'city': result.get('addressCity'),
                'state': result.get('addressState'),
                'zip_code': result.get('addressZipcode'),
                'latitude': result.get('latLong', {}).get('latitude'),
                'longitude': result.get('latLong', {}).get('longitude'),
                'price': result.get('price'),
                'bedrooms': result.get('beds'),
                'bathrooms': result.get('baths'),
                'square_feet': result.get('area'),
                'property_type': result.get('hdpData', {}).get('homeInfo', {}).get('homeType'),
                'listing_url': result.get('detailUrl'),
                'image_url': result.get('imgSrc'),
                'status': result.get('statusType'),
                'days_on_zillow': result.get('daysOnZillow'),
                'data_source': 'zillow',
                'raw_data': json.dumps(result)
            }

        except Exception as e:
            self.logger.error(f"Error extracting property data: {str(e)}")
            return None

    def _parse_html_listings(self, soup) -> List[Dict]:
        """
        Parse property listings from HTML (fallback method)

        Args:
            soup: BeautifulSoup object

        Returns:
            List of property dictionaries
        """
        properties = []

        # This is a simplified example - actual implementation would need
        # to be updated based on current Zillow HTML structure
        listings = soup.find_all('article', class_=re.compile('list-card'))

        for listing in listings:
            try:
                property_data = {
                    'address': listing.find('address').text.strip() if listing.find('address') else None,
                    'price': self._extract_price(listing),
                    'details': self._extract_details(listing),
                    'data_source': 'zillow',
                }
                properties.append(property_data)

            except Exception as e:
                self.logger.debug(f"Error parsing listing: {str(e)}")
                continue

        return properties

    def _extract_price(self, listing) -> Optional[float]:
        """Extract price from listing"""
        price_elem = listing.find('span', class_=re.compile('list-card-price'))
        if price_elem:
            price_text = price_elem.text.strip()
            # Remove currency symbol and commas
            price_text = re.sub(r'[^0-9.]', '', price_text)
            try:
                return float(price_text)
            except ValueError:
                return None
        return None

    def _extract_details(self, listing) -> Dict:
        """Extract property details from listing"""
        details = {}

        details_elem = listing.find('ul', class_=re.compile('list-card-details'))
        if details_elem:
            items = details_elem.find_all('li')

            for item in items:
                text = item.text.strip()

                if 'bd' in text:
                    details['bedrooms'] = int(re.search(r'(\d+)', text).group(1))
                elif 'ba' in text:
                    details['bathrooms'] = float(re.search(r'([\d.]+)', text).group(1))
                elif 'sqft' in text:
                    sqft = re.search(r'([\d,]+)', text).group(1).replace(',', '')
                    details['square_feet'] = int(sqft)

        return details

    def get_property_details(self, property_id: str) -> Optional[Dict]:
        """
        Get detailed information for a specific property

        Args:
            property_id: Zillow property ID (zpid)

        Returns:
            Detailed property dictionary
        """
        url = f"{self.base_url}/homedetails/{property_id}_zpid/"

        response = self.fetch(url)

        if not response:
            return None

        soup = self.parse_html(response.text)

        # Extract detailed data from property page
        # This would need to be implemented based on Zillow's current structure

        return {
            'property_id': property_id,
            'data_source': 'zillow'
        }
