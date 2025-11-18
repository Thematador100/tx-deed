"""
County tax records scraper
Scrapes property tax and delinquent tax data from county websites
"""

import re
import json
from typing import Dict, List, Optional
from urllib.parse import urlencode

from scraping_system.core.base_scraper import BaseScraper


class CountyTaxScraper(BaseScraper):
    """Scraper for county tax records"""

    # County configurations for different tax assessor websites
    COUNTY_CONFIGS = {
        'travis': {
            'name': 'Travis County, TX',
            'url': 'https://stage.travis.prodigycad.com',
            'search_endpoint': '/api/property/search',
            'type': 'api'
        },
        'harris': {
            'name': 'Harris County, TX',
            'url': 'https://public.hcad.org',
            'search_endpoint': '/Search/SearchProperty',
            'type': 'web'
        },
        'dallas': {
            'name': 'Dallas County, TX',
            'url': 'https://www.dallascad.org',
            'search_endpoint': '/AcctSearch.aspx',
            'type': 'web'
        },
        'bexar': {
            'name': 'Bexar County, TX',
            'url': 'https://bexar.trueprodigy.com',
            'search_endpoint': '/api/v1/search',
            'type': 'api'
        }
    }

    def __init__(self, county: str = 'travis', **kwargs):
        """
        Initialize county tax scraper

        Args:
            county: County identifier (e.g., 'travis', 'harris')
        """
        super().__init__(name=f"county_tax_{county}", **kwargs)

        self.county = county.lower()

        if self.county not in self.COUNTY_CONFIGS:
            raise ValueError(f"Unsupported county: {county}")

        self.config = self.COUNTY_CONFIGS[self.county]
        self.base_url = self.config['url']

        self.logger.info(f"Initialized scraper for {self.config['name']}")

    def scrape(
        self,
        search_type: str = 'delinquent',
        max_results: int = 1000,
        **search_params
    ) -> List[Dict]:
        """
        Scrape tax records

        Args:
            search_type: Type of search ('delinquent', 'all', 'address', 'owner')
            max_results: Maximum number of results
            **search_params: Additional search parameters

        Returns:
            List of property tax records
        """
        all_records = []

        self.logger.info(f"Starting tax scrape for {self.config['name']}")

        if search_type == 'delinquent':
            records = self.scrape_delinquent_properties(max_results)
        elif search_type == 'address':
            records = self.search_by_address(search_params.get('address'), max_results)
        elif search_type == 'owner':
            records = self.search_by_owner(search_params.get('owner'), max_results)
        else:
            records = []

        all_records.extend(records)
        self.stats['items_scraped'] += len(records)

        self.logger.info(f"Scraped {len(all_records)} tax records")
        return all_records

    def scrape_delinquent_properties(self, max_results: int = 1000) -> List[Dict]:
        """
        Scrape delinquent tax properties

        Args:
            max_results: Maximum number of results

        Returns:
            List of delinquent property records
        """
        if self.config['type'] == 'api':
            return self._scrape_delinquent_api(max_results)
        else:
            return self._scrape_delinquent_web(max_results)

    def _scrape_delinquent_api(self, max_results: int) -> List[Dict]:
        """Scrape delinquent properties from API-based county system"""
        records = []
        page = 1
        page_size = 100

        while len(records) < max_results:
            params = {
                'page': page,
                'pageSize': page_size,
                'delinquent': 'true',
                'sortBy': 'delinquentAmount',
                'sortOrder': 'desc'
            }

            url = f"{self.base_url}{self.config['search_endpoint']}?{urlencode(params)}"

            response = self.fetch(url)

            if not response:
                break

            page_records = self.parse(response)

            if not page_records:
                break

            records.extend(page_records)
            page += 1

            if len(page_records) < page_size:
                break

        return records[:max_results]

    def _scrape_delinquent_web(self, max_results: int) -> List[Dict]:
        """Scrape delinquent properties from web-based county system"""
        records = []

        # This would need to be customized for each county's website
        # This is a template implementation

        url = f"{self.base_url}{self.config['search_endpoint']}"

        # Example for form-based search
        data = {
            'searchType': 'delinquent',
            'page': 1
        }

        response = self.fetch(url, method='POST', data=data)

        if response:
            records = self.parse(response)

        return records[:max_results]

    def search_by_address(self, address: str, max_results: int = 100) -> List[Dict]:
        """
        Search tax records by address

        Args:
            address: Property address
            max_results: Maximum results

        Returns:
            List of matching tax records
        """
        params = {
            'address': address,
            'pageSize': min(max_results, 100)
        }

        url = f"{self.base_url}{self.config['search_endpoint']}?{urlencode(params)}"

        response = self.fetch(url)

        if not response:
            return []

        return self.parse(response)

    def search_by_owner(self, owner_name: str, max_results: int = 100) -> List[Dict]:
        """
        Search tax records by owner name

        Args:
            owner_name: Property owner name
            max_results: Maximum results

        Returns:
            List of matching tax records
        """
        params = {
            'owner': owner_name,
            'pageSize': min(max_results, 100)
        }

        url = f"{self.base_url}{self.config['search_endpoint']}?{urlencode(params)}"

        response = self.fetch(url)

        if not response:
            return []

        return self.parse(response)

    def parse(self, response) -> List[Dict]:
        """
        Parse tax records from response

        Args:
            response: HTTP response

        Returns:
            List of property tax records
        """
        records = []

        if self.config['type'] == 'api':
            # Parse JSON API response
            data = self.extract_json(response)

            if not data:
                return records

            # Extract records based on county-specific structure
            if self.county == 'travis':
                records = self._parse_travis_county(data)
            elif self.county == 'bexar':
                records = self._parse_bexar_county(data)

        else:
            # Parse HTML response
            soup = self.parse_html(response.text)

            if self.county == 'harris':
                records = self._parse_harris_county_html(soup)
            elif self.county == 'dallas':
                records = self._parse_dallas_county_html(soup)

        return records

    def _parse_travis_county(self, data: Dict) -> List[Dict]:
        """Parse Travis County API response"""
        records = []

        results = data.get('results', [])

        for result in results:
            record = {
                'property_id': result.get('propertyId'),
                'account_number': result.get('accountNumber'),
                'address': result.get('situs'),
                'owner_name': result.get('ownerName'),
                'owner_address': result.get('ownerAddress'),
                'assessed_value': result.get('assessedValue'),
                'market_value': result.get('marketValue'),
                'tax_year': result.get('taxYear'),
                'tax_amount': result.get('taxAmount'),
                'is_tax_delinquent': result.get('isDelinquent', False),
                'delinquent_amount': result.get('delinquentAmount', 0),
                'property_type': result.get('propertyType'),
                'land_use': result.get('landUse'),
                'square_feet': result.get('squareFeet'),
                'year_built': result.get('yearBuilt'),
                'county': 'Travis',
                'state': 'TX',
                'data_source': f'county_tax_travis',
                'raw_data': json.dumps(result)
            }

            records.append(record)

        return records

    def _parse_bexar_county(self, data: Dict) -> List[Dict]:
        """Parse Bexar County API response"""
        # Similar to Travis County but with Bexar-specific fields
        return self._parse_travis_county(data)

    def _parse_harris_county_html(self, soup) -> List[Dict]:
        """Parse Harris County HTML response"""
        records = []

        # Find property table
        table = soup.find('table', {'id': 'propertyResults'})

        if not table:
            return records

        rows = table.find_all('tr')[1:]  # Skip header

        for row in rows:
            cols = row.find_all('td')

            if len(cols) >= 5:
                record = {
                    'account_number': cols[0].text.strip(),
                    'owner_name': cols[1].text.strip(),
                    'address': cols[2].text.strip(),
                    'market_value': self._parse_currency(cols[3].text),
                    'tax_amount': self._parse_currency(cols[4].text),
                    'county': 'Harris',
                    'state': 'TX',
                    'data_source': 'county_tax_harris'
                }

                records.append(record)

        return records

    def _parse_dallas_county_html(self, soup) -> List[Dict]:
        """Parse Dallas County HTML response"""
        # Similar to Harris County
        return []

    def _parse_currency(self, text: str) -> Optional[float]:
        """Parse currency string to float"""
        if not text:
            return None

        # Remove currency symbols and commas
        cleaned = re.sub(r'[^0-9.]', '', text)

        try:
            return float(cleaned)
        except ValueError:
            return None

    def get_property_details(self, account_number: str) -> Optional[Dict]:
        """
        Get detailed tax information for a property

        Args:
            account_number: Property account number

        Returns:
            Detailed tax record
        """
        url = f"{self.base_url}/property/{account_number}"

        response = self.fetch(url)

        if not response:
            return None

        # Parse detailed information
        # Implementation would depend on county structure

        return {
            'account_number': account_number,
            'county': self.config['name']
        }
