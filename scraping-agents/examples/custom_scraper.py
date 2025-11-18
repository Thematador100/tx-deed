"""
Example: Creating a Custom County Scraper

This example shows how to create a scraper for a new county
"""
import asyncio
from typing import List, Dict
from datetime import datetime
from loguru import logger

# Import base scraper
import sys
sys.path.append('..')
from scrapers.base_scraper import BaseScraper
from models.property import ScrapedProperty, DeedType, PropertyStatus, PropertyType


class ExampleCountyScraper(BaseScraper):
    """
    Example scraper for a new county
    Replace 'Example' with your county name
    """

    def __init__(self, config: Dict):
        # Initialize with county name
        super().__init__("Example", config)

        # Get URLs from config
        self.main_url = config["websites"]["main_site"]
        self.search_url = config["websites"]["search_page"]

    async def scrape(self) -> List[ScrapedProperty]:
        """
        Main scraping method - REQUIRED
        This method must be implemented
        """
        logger.info(f"Starting {self.county_name} County scraper...")

        properties = []

        try:
            # Method 1: Simple HTTP request
            html = self.fetch_page(self.search_url)
            simple_props = self.scrape_with_requests(html)
            properties.extend(simple_props)

            # Method 2: Using Selenium (for JavaScript-heavy sites)
            # selenium_props = await self.scrape_with_selenium()
            # properties.extend(selenium_props)

            logger.info(f"Found {len(properties)} properties in {self.county_name} County")

        except Exception as e:
            logger.error(f"Error in {self.county_name} County scraper: {str(e)}")
            self.run.errors.append(str(e))

        return properties

    def scrape_with_requests(self, html: str) -> List[ScrapedProperty]:
        """Example: Scraping with simple HTTP requests"""
        properties = []

        # Parse HTML tables
        rows = self.parse_html_table(html)

        for row in rows:
            # Extract property from each row
            prop = self.extract_property_from_row(row)
            if prop:
                properties.append(prop)

        return properties

    async def scrape_with_selenium(self) -> List[ScrapedProperty]:
        """Example: Scraping with Selenium for dynamic content"""
        properties = []
        driver = None

        try:
            # Get Selenium driver
            driver = self.get_selenium_driver(headless=True)

            # Navigate to page
            driver.get(self.search_url)

            # Wait for content to load
            import time
            time.sleep(3)

            # Example: Fill search form
            # search_input = driver.find_element(By.ID, "search-box")
            # search_input.send_keys("delinquent")
            # search_button = driver.find_element(By.ID, "search-btn")
            # search_button.click()

            # Parse results
            html = driver.page_source
            rows = self.parse_html_table(html)

            for row in rows:
                prop = self.extract_property_from_row(row)
                if prop:
                    properties.append(prop)

        except Exception as e:
            logger.error(f"Error in Selenium scraping: {str(e)}")

        finally:
            if driver:
                driver.quit()

        return properties

    def extract_property_from_row(self, row: Dict) -> ScrapedProperty:
        """
        Extract property data from a table row
        Customize field mapping based on your county's data structure
        """
        try:
            # Map row data to property model
            property_data = ScrapedProperty(
                # Required fields
                address=self.clean_address(row.get('Address', '')),
                county=self.county_name,
                deed_type=DeedType.TAX_DEED,
                status=PropertyStatus.UPCOMING,

                # Location details
                city=row.get('City', ''),
                state="TX",
                zip_code=row.get('ZIP', ''),

                # Identifiers
                account_number=row.get('Account #', ''),
                parcel_id=row.get('Parcel ID', ''),

                # Financial data
                appraised_value=self.clean_currency(row.get('Appraised Value', '')),
                taxes_owed=self.clean_currency(row.get('Taxes Owed', '')),
                minimum_bid=self.clean_currency(row.get('Min Bid', '')),

                # Property details
                property_type=self.map_property_type(row.get('Type', '')),
                bedrooms=self.parse_int(row.get('Beds', '')),
                bathrooms=self.parse_float(row.get('Baths', '')),
                sqft=self.parse_int(row.get('Sq Ft', '')),

                # Sale info
                sale_date=self.parse_date(row.get('Sale Date', '')),

                # Metadata
                source_url=self.search_url,
                scraped_at=datetime.now()
            )

            # Calculate scores
            property_data.calculate_roi()
            property_data.calculate_opportunity_score()

            return property_data

        except Exception as e:
            logger.error(f"Error extracting property: {str(e)}")
            return None

    def map_property_type(self, type_str: str) -> PropertyType:
        """Map county-specific property type codes to standard types"""
        if not type_str:
            return PropertyType.UNKNOWN

        type_str = type_str.upper()

        # Customize mapping based on your county's codes
        type_mapping = {
            'SFR': PropertyType.SINGLE_FAMILY,
            'SF': PropertyType.SINGLE_FAMILY,
            'SINGLE': PropertyType.SINGLE_FAMILY,
            'MF': PropertyType.MULTI_FAMILY,
            'MULTI': PropertyType.MULTI_FAMILY,
            'CONDO': PropertyType.CONDO,
            'LAND': PropertyType.LAND,
            'COMM': PropertyType.COMMERCIAL,
        }

        for key, prop_type in type_mapping.items():
            if key in type_str:
                return prop_type

        return PropertyType.UNKNOWN

    def parse_int(self, value: str) -> int:
        """Parse integer from string"""
        if not value:
            return None
        try:
            return int(value.replace(',', '').strip())
        except:
            return None

    def parse_float(self, value: str) -> float:
        """Parse float from string"""
        if not value:
            return None
        try:
            return float(value.replace(',', '').strip())
        except:
            return None

    def parse_date(self, date_str: str) -> datetime:
        """Parse date from string"""
        if not date_str:
            return None

        try:
            # Try common date formats
            from dateutil import parser
            return parser.parse(date_str)
        except:
            return None


async def main():
    """Test the scraper"""

    # Example configuration
    config = {
        "name": "Example County",
        "websites": {
            "main_site": "https://example-county.gov",
            "search_page": "https://example-county.gov/tax-sales"
        }
    }

    # Create and run scraper
    scraper = ExampleCountyScraper(config)
    run = await scraper.run_scraper()

    # Print results
    print(f"\nScraper Status: {run.status}")
    print(f"Properties Found: {run.properties_found}")
    print(f"Properties Saved: {run.properties_saved}")

    if run.errors:
        print(f"Errors: {run.errors}")


if __name__ == "__main__":
    asyncio.run(main())
