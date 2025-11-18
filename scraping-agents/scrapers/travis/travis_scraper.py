"""
Travis County (Austin) Tax Deed Scraper
Scrapes constable sales and delinquent tax data from Travis County websites
"""
from typing import List, Dict
import asyncio
from datetime import datetime
from loguru import logger
from playwright.async_api import async_playwright
from bs4 import BeautifulSoup

from scrapers.base_scraper import BaseScraper
from models.property import ScrapedProperty, DeedType, PropertyStatus, PropertyType


class TravisCountyScraper(BaseScraper):
    """Scraper for Travis County tax deeds and constable sales"""

    def __init__(self, config: Dict):
        super().__init__("Travis", config)
        self.tax_office_url = config["websites"]["tax_office"]
        self.appraisal_url = config["websites"]["appraisal_district"]

    async def scrape(self) -> List[ScrapedProperty]:
        """Scrape Travis County properties using Playwright"""
        logger.info("Starting Travis County scraper...")

        properties = []

        try:
            async with async_playwright() as p:
                browser = await p.chromium.launch(headless=True)
                context = await browser.new_context(
                    user_agent=self.user_agent.random
                )
                page = await context.new_page()

                # Scrape tax office data
                tax_props = await self.scrape_tax_office(page)
                properties.extend(tax_props)

                await browser.close()

            logger.info(f"Travis County scraper found {len(properties)} properties")

        except Exception as e:
            logger.error(f"Error in Travis County scraper: {str(e)}")
            self.run.errors.append(str(e))

        return properties

    async def scrape_tax_office(self, page) -> List[ScrapedProperty]:
        """Scrape tax office/constable sale properties"""
        properties = []

        try:
            await page.goto(self.tax_office_url, wait_until='networkidle')

            # Wait for content to load
            await page.wait_for_timeout(3000)

            # Get page content
            content = await page.content()
            soup = BeautifulSoup(content, 'html.parser')

            # Parse property listings (adjust selectors based on actual site)
            # Example implementation:
            listings = soup.select('.property-listing')  # Adjust selector

            for listing in listings:
                prop = self.extract_travis_property(listing)
                if prop:
                    properties.append(prop)

        except Exception as e:
            logger.error(f"Error scraping Travis County tax office: {str(e)}")

        return properties

    def extract_travis_property(self, listing) -> ScrapedProperty:
        """Extract property data from Travis County listing"""
        try:
            # Example extraction - adjust based on actual HTML structure
            address = listing.select_one('.address')
            address_text = address.text.strip() if address else ''

            appraised = listing.select_one('.appraised-value')
            appraised_value = self.clean_currency(appraised.text if appraised else '')

            property_data = ScrapedProperty(
                address=self.clean_address(address_text),
                city="Austin",
                county="Travis",
                state="TX",

                appraised_value=appraised_value,

                property_type=PropertyType.SINGLE_FAMILY,
                deed_type=DeedType.CONSTABLE_SALE,
                status=PropertyStatus.UPCOMING,

                source_url=self.tax_office_url,
                scraped_at=datetime.now()
            )

            property_data.calculate_roi()
            property_data.calculate_opportunity_score()

            return property_data

        except Exception as e:
            logger.error(f"Error extracting Travis County property: {str(e)}")
            return None


async def main():
    """Test the Travis County scraper"""
    config = {
        "websites": {
            "tax_office": "https://tax-office.traviscountytx.gov/",
            "appraisal_district": "https://www.traviscad.org/"
        }
    }

    scraper = TravisCountyScraper(config)
    run = await scraper.run_scraper()

    print(f"Scraper Status: {run.status}")
    print(f"Properties Found: {run.properties_found}")
    print(f"Properties Saved: {run.properties_saved}")


if __name__ == "__main__":
    asyncio.run(main())
