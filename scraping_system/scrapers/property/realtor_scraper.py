"""
Realtor.com property data scraper
Scrapes property listings and details from Realtor.com
"""

import json
import re
from typing import Dict, List, Optional
from urllib.parse import urlencode

from scraping_system.core.base_scraper import BaseScraper


class RealtorScraper(BaseScraper):
    """Scraper for Realtor.com property data"""

    def __init__(self, **kwargs):
        super().__init__(name="realtor", **kwargs)

        self.base_url = "https://www.realtor.com"
        self.api_url = "https://www.realtor.com/api/v1/hulk_main_srp"

    def scrape(
        self,
        city: str,
        state: str,
        max_results: int = 200
    ) -> List[Dict]:
        """
        Scrape property listings for a location

        Args:
            city: City name
            state: State abbreviation
            max_results: Maximum number of results

        Returns:
            List of property dictionaries
        """
        all_properties = []
        offset = 0
        limit = 42  # Realtor.com default page size

        self.logger.info(f"Starting Realtor.com scrape for: {city}, {state}")

        while len(all_properties) < max_results:
            properties = self._fetch_page(city, state, offset, limit)

            if not properties:
                self.logger.info("No more properties found")
                break

            all_properties.extend(properties)
            self.stats['items_scraped'] += len(properties)

            offset += limit

            if len(properties) < limit:
                # No more results
                break

        self.logger.info(f"Scraped {len(all_properties)} properties from Realtor.com")
        return all_properties[:max_results]

    def _fetch_page(
        self,
        city: str,
        state: str,
        offset: int,
        limit: int
    ) -> List[Dict]:
        """Fetch a single page of results"""

        # Realtor.com API parameters
        params = {
            'client_id': 'rdc-x',
            'schema': 'vesta',
            'city': city,
            'state_code': state,
            'offset': offset,
            'limit': limit,
            'status': 'for_sale',
            'sort': 'relevance'
        }

        url = f"{self.api_url}?{urlencode(params)}"

        response = self.fetch(url)

        if not response:
            return []

        return self.parse(response)

    def parse(self, response) -> List[Dict]:
        """
        Parse Realtor.com API response

        Args:
            response: HTTP response

        Returns:
            List of property dictionaries
        """
        properties = []

        data = self.extract_json(response)

        if not data:
            return properties

        # Extract properties from API response
        results = data.get('data', {}).get('home_search', {}).get('results', [])

        for result in results:
            property_data = self._extract_property_data(result)
            if property_data:
                properties.append(property_data)

        return properties

    def _extract_property_data(self, result: Dict) -> Optional[Dict]:
        """
        Extract property data from API result

        Args:
            result: Property result dictionary

        Returns:
            Normalized property dictionary
        """
        try:
            description = result.get('description', {})
            location = result.get('location', {}).get('address', {})
            listing = result.get('list_price_min') or result.get('list_price')

            return {
                'property_id': result.get('property_id'),
                'address': location.get('line'),
                'city': location.get('city'),
                'state': location.get('state_code'),
                'zip_code': location.get('postal_code'),
                'county': location.get('county'),
                'latitude': location.get('coordinate', {}).get('lat'),
                'longitude': location.get('coordinate', {}).get('lon'),
                'price': listing,
                'bedrooms': description.get('beds'),
                'bathrooms': description.get('baths'),
                'square_feet': description.get('sqft'),
                'lot_size': description.get('lot_sqft'),
                'year_built': description.get('year_built'),
                'property_type': description.get('type'),
                'status': result.get('status'),
                'listing_url': f"{self.base_url}/realestateandhomes-detail/{result.get('permalink')}",
                'data_source': 'realtor',
                'raw_data': json.dumps(result)
            }

        except Exception as e:
            self.logger.error(f"Error extracting property data: {str(e)}")
            return None

    def get_property_details(self, property_id: str) -> Optional[Dict]:
        """
        Get detailed information for a specific property

        Args:
            property_id: Realtor.com property ID

        Returns:
            Detailed property dictionary
        """
        url = f"https://www.realtor.com/api/v1/hulk?property_id={property_id}"

        response = self.fetch(url)

        if not response:
            return None

        data = self.extract_json(response)

        if not data:
            return None

        # Extract detailed information
        property_details = data.get('data', {}).get('property', {})

        return {
            'property_id': property_id,
            'details': property_details,
            'data_source': 'realtor'
        }
