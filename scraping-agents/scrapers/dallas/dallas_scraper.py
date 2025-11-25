"""
Dallas County Tax Deed Scraper
Scrapes sheriff sales and delinquent tax data from Dallas County websites
"""
from typing import List, Dict
import asyncio
from datetime import datetime
from loguru import logger
import requests
from bs4 import BeautifulSoup

from scrapers.base_scraper import BaseScraper
from models.property import ScrapedProperty, DeedType, PropertyStatus, PropertyType


class DallasCountyScraper(BaseScraper):
    """Scraper for Dallas County tax deeds and sheriff sales"""

    def __init__(self, config: Dict):
        super().__init__("Dallas", config)
        self.sheriff_url = config["websites"]["sheriff_sales"]
        self.tax_url = config["websites"]["tax_sale"]

    async def scrape(self) -> List[ScrapedProperty]:
        """Scrape Dallas County properties"""
        logger.info("Starting Dallas County scraper...")

        properties = []

        try:
            # Method 1: Scrape sheriff sales
            sheriff_props = await self.scrape_sheriff_sales()
            properties.extend(sheriff_props)

            logger.info(f"Dallas County scraper found {len(properties)} properties")

        except Exception as e:
            logger.error(f"Error in Dallas County scraper: {str(e)}")
            self.run.errors.append(str(e))

        return properties

    async def scrape_sheriff_sales(self) -> List[ScrapedProperty]:
        """Scrape Dallas County sheriff sale properties"""
        properties = []

        try:
            # Fetch the sheriff sales page
            html = self.fetch_page(self.sheriff_url)
            soup = BeautifulSoup(html, 'html.parser')

            # Parse sheriff sale listings
            # Note: Actual implementation depends on website structure
            # This is a template showing the pattern

            # Example: Look for property tables or listings
            tables = soup.find_all('table', class_='property-table')

            for table in tables:
                rows = self.parse_html_table(str(table))

                for row in rows:
                    prop = self.extract_dallas_property(row)
                    if prop:
                        properties.append(prop)

        except Exception as e:
            logger.error(f"Error scraping Dallas County sheriff sales: {str(e)}")

        return properties

    def extract_dallas_property(self, data: Dict) -> ScrapedProperty:
        """Extract property data from Dallas County format"""
        try:
            property_data = ScrapedProperty(
                address=self.clean_address(data.get('Address', '')),
                city=data.get('City', 'Dallas'),
                county="Dallas",
                state="TX",
                zip_code=data.get('Zip', ''),

                case_number=data.get('Case Number', ''),
                appraised_value=self.clean_currency(data.get('Appraised Value', '')),
                minimum_bid=self.clean_currency(data.get('Minimum Bid', '')),

                property_type=self.map_dallas_property_type(data.get('Type', '')),
                deed_type=DeedType.SHERIFF_SALE,
                status=PropertyStatus.UPCOMING,
                sale_date=self.parse_date(data.get('Sale Date', '')),

                source_url=self.sheriff_url,
                scraped_at=datetime.now()
            )

            property_data.calculate_roi()
            property_data.calculate_opportunity_score()

            return property_data

        except Exception as e:
            logger.error(f"Error extracting Dallas County property: {str(e)}")
            return None

    def map_dallas_property_type(self, type_str: str) -> PropertyType:
        """Map Dallas County property type to standard types"""
        if not type_str:
            return PropertyType.UNKNOWN

        type_str = type_str.upper()

        if 'SINGLE' in type_str or 'SFR' in type_str:
            return PropertyType.SINGLE_FAMILY
        elif 'MULTI' in type_str or 'DUPLEX' in type_str:
            return PropertyType.MULTI_FAMILY
        elif 'CONDO' in type_str:
            return PropertyType.CONDO
        elif 'COMMERCIAL' in type_str:
            return PropertyType.COMMERCIAL
        elif 'LAND' in type_str or 'LOT' in type_str:
            return PropertyType.LAND
        else:
            return PropertyType.UNKNOWN

    def parse_date(self, date_str: str) -> datetime:
        """Parse date string to datetime object"""
        if not date_str:
            return None

        try:
            for fmt in ['%m/%d/%Y', '%Y-%m-%d', '%m-%d-%Y', '%B %d, %Y']:
                try:
                    return datetime.strptime(date_str.strip(), fmt)
                except ValueError:
                    continue
            return None
        except Exception:
            return None


async def main():
    """Test the Dallas County scraper"""
    config = {
        "websites": {
            "sheriff_sales": "https://www.dallascounty.org/government/sheriff/sales.php",
            "tax_sale": "https://www.dallascounty.org/government/tax/"
        }
    }

    scraper = DallasCountyScraper(config)
    run = await scraper.run_scraper()

    print(f"Scraper Status: {run.status}")
    print(f"Properties Found: {run.properties_found}")
    print(f"Properties Saved: {run.properties_saved}")


if __name__ == "__main__":
    asyncio.run(main())
