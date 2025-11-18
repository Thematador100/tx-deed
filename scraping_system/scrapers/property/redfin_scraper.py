"""
Redfin property data scraper
Scrapes property listings and market data from Redfin
"""

import json
import time
from typing import Dict, List, Optional
from urllib.parse import quote

from scraping_system.core.base_scraper import BaseScraper


class RedfinScraper(BaseScraper):
    """Scraper for Redfin property data"""

    def __init__(self, **kwargs):
        super().__init__(name="redfin", **kwargs)

        self.base_url = "https://www.redfin.com"
        self.search_url = f"{self.base_url}/stingray/api/gis"

    def scrape(
        self,
        location: str,
        max_results: int = 350
    ) -> List[Dict]:
        """
        Scrape property listings for a location

        Args:
            location: City and state (e.g., "Austin, TX")
            max_results: Maximum number of results (Redfin max is 350 per search)

        Returns:
            List of property dictionaries
        """
        all_properties = []

        self.logger.info(f"Starting Redfin scrape for: {location}")

        # First, get the region ID for the location
        region_id = self._get_region_id(location)

        if not region_id:
            self.logger.error(f"Could not find region ID for: {location}")
            return []

        # Now fetch properties for the region
        properties = self._fetch_properties(region_id, max_results)

        all_properties.extend(properties)
        self.stats['items_scraped'] += len(properties)

        self.logger.info(f"Scraped {len(all_properties)} properties from Redfin")
        return all_properties

    def _get_region_id(self, location: str) -> Optional[int]:
        """
        Get Redfin region ID for a location

        Args:
            location: Location string

        Returns:
            Region ID or None
        """
        url = f"{self.base_url}/stingray/do/location-autocomplete"

        params = {
            'location': location,
            'v': '2'
        }

        response = self.fetch(url, data=params, method='GET')

        if not response:
            return None

        try:
            data = response.json()

            if data and len(data) > 0:
                # Get the first matching region
                region = data[0]
                return region.get('id')

        except Exception as e:
            self.logger.error(f"Error getting region ID: {str(e)}")

        return None

    def _fetch_properties(self, region_id: int, max_results: int) -> List[Dict]:
        """
        Fetch properties for a region

        Args:
            region_id: Redfin region ID
            max_results: Maximum results

        Returns:
            List of property dictionaries
        """
        params = {
            'region_id': region_id,
            'region_type': 6,  # City
            'num_homes': min(max_results, 350),  # Redfin max
            'status': 1,  # Active listings
            'v': 8
        }

        url = f"{self.search_url}?{self._build_query_string(params)}"

        response = self.fetch(url)

        if not response:
            return []

        return self.parse(response)

    def _build_query_string(self, params: Dict) -> str:
        """Build query string for Redfin API"""
        return '&'.join([f"{k}={v}" for k, v in params.items()])

    def parse(self, response) -> List[Dict]:
        """
        Parse Redfin API response

        Args:
            response: HTTP response

        Returns:
            List of property dictionaries
        """
        properties = []

        # Redfin returns JSON with a payload wrapper
        content = response.text

        # Remove the wrapper
        if content.startswith('{}&&'):
            content = content[4:]

        try:
            data = json.loads(content)

            # Extract homes from response
            homes = data.get('payload', {}).get('homes', [])

            for home in homes:
                property_data = self._extract_property_data(home)
                if property_data:
                    properties.append(property_data)

        except json.JSONDecodeError as e:
            self.logger.error(f"Error parsing Redfin response: {str(e)}")

        return properties

    def _extract_property_data(self, home: Dict) -> Optional[Dict]:
        """
        Extract property data from Redfin home object

        Args:
            home: Home dictionary from API

        Returns:
            Normalized property dictionary
        """
        try:
            return {
                'property_id': home.get('mlsId', {}).get('value') or home.get('propertyId'),
                'address': home.get('streetLine', {}).get('value'),
                'city': home.get('city'),
                'state': home.get('state'),
                'zip_code': home.get('zip'),
                'latitude': home.get('latLong', {}).get('latitude'),
                'longitude': home.get('latLong', {}).get('longitude'),
                'price': home.get('price', {}).get('value'),
                'bedrooms': home.get('beds'),
                'bathrooms': home.get('baths'),
                'square_feet': home.get('sqFt', {}).get('value'),
                'lot_size': home.get('lotSize', {}).get('value'),
                'year_built': home.get('yearBuilt', {}).get('value'),
                'property_type': home.get('propertyType'),
                'hoa_fee': home.get('hoa'),
                'days_on_market': home.get('dom'),
                'listing_url': f"{self.base_url}{home.get('url')}",
                'data_source': 'redfin',
                'raw_data': json.dumps(home)
            }

        except Exception as e:
            self.logger.error(f"Error extracting property data: {str(e)}")
            return None

    def get_property_details(self, property_id: str) -> Optional[Dict]:
        """
        Get detailed information for a specific property

        Args:
            property_id: Redfin property ID

        Returns:
            Detailed property dictionary
        """
        url = f"{self.base_url}/stingray/api/home/details/aboveTheFold"

        params = {
            'propertyId': property_id,
            'accessLevel': 1
        }

        response = self.fetch(url, data=params, method='GET')

        if not response:
            return None

        # Parse response
        content = response.text
        if content.startswith('{}&&'):
            content = content[4:]

        try:
            data = json.loads(content)
            return {
                'property_id': property_id,
                'details': data.get('payload'),
                'data_source': 'redfin'
            }

        except json.JSONDecodeError as e:
            self.logger.error(f"Error parsing property details: {str(e)}")
            return None
