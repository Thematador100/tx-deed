"""
Base scraper class for all county-specific scrapers
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict
from datetime import datetime
import asyncio
from loguru import logger
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from bs4 import BeautifulSoup
import requests
from fake_useragent import UserAgent
from tenacity import retry, stop_after_attempt, wait_exponential

from models.property import ScrapedProperty, DeedType, PropertyStatus, ScraperRun
from utils.database import DatabaseManager


class BaseScraper(ABC):
    """Abstract base class for county-specific scrapers"""

    def __init__(self, county_name: str, config: Dict):
        self.county_name = county_name
        self.config = config
        self.db = DatabaseManager()
        self.user_agent = UserAgent()
        self.scraped_properties: List[ScrapedProperty] = []
        self.run = ScraperRun(county=county_name)

        logger.info(f"Initialized scraper for {county_name}")

    @abstractmethod
    async def scrape(self) -> List[ScrapedProperty]:
        """
        Main scraping method - must be implemented by each county scraper
        Returns list of scraped properties
        """
        pass

    def get_selenium_driver(self, headless: bool = True) -> webdriver.Chrome:
        """Create and configure a Selenium WebDriver"""
        options = Options()

        if headless:
            options.add_argument('--headless')

        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument(f'user-agent={self.user_agent.random}')
        options.add_argument('--window-size=1920,1080')

        driver = webdriver.Chrome(options=options)
        return driver

    @retry(stop=stop_after_attempt(3), wait=wait_exponential(multiplier=1, min=4, max=10))
    def fetch_page(self, url: str, timeout: int = 30) -> Optional[str]:
        """Fetch a web page with retry logic"""
        try:
            headers = {
                'User-Agent': self.user_agent.random,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
                'Accept-Encoding': 'gzip, deflate',
                'Connection': 'keep-alive',
            }

            response = requests.get(url, headers=headers, timeout=timeout)
            response.raise_for_status()

            logger.info(f"Successfully fetched: {url}")
            return response.text

        except Exception as e:
            logger.error(f"Error fetching {url}: {str(e)}")
            raise

    def parse_html_table(self, html: str, table_selector: str = "table") -> List[Dict]:
        """Parse HTML table into list of dictionaries"""
        soup = BeautifulSoup(html, 'html.parser')
        table = soup.select_one(table_selector)

        if not table:
            logger.warning(f"No table found with selector: {table_selector}")
            return []

        headers = [th.text.strip() for th in table.select('thead th')]
        if not headers:
            headers = [th.text.strip() for th in table.select('tr th')]

        rows = []
        for tr in table.select('tbody tr'):
            cells = [td.text.strip() for td in tr.select('td')]
            if len(cells) == len(headers):
                rows.append(dict(zip(headers, cells)))

        logger.info(f"Parsed {len(rows)} rows from table")
        return rows

    def clean_currency(self, value: str) -> Optional[float]:
        """Clean and convert currency string to float"""
        if not value:
            return None

        try:
            # Remove currency symbols, commas, etc.
            cleaned = value.replace('$', '').replace(',', '').strip()
            return float(cleaned) if cleaned else None
        except:
            return None

    def clean_address(self, address: str) -> str:
        """Clean and standardize address"""
        return ' '.join(address.split()).strip()

    async def save_to_database(self) -> int:
        """Save all scraped properties to database"""
        if not self.scraped_properties:
            logger.warning(f"No properties to save for {self.county_name}")
            return 0

        saved_count = await self.db.save_properties_batch(self.scraped_properties)

        # Check for agent matches
        for prop in self.scraped_properties:
            await self.db.check_agent_matches(prop)

        self.run.properties_found = len(self.scraped_properties)
        self.run.properties_saved = saved_count

        return saved_count

    async def run_scraper(self) -> ScraperRun:
        """
        Execute the complete scraping workflow:
        1. Scrape data
        2. Save to database
        3. Log the run
        """
        logger.info(f"Starting scraper for {self.county_name}")
        self.run = ScraperRun(county=self.county_name)

        try:
            # Execute scraping
            self.scraped_properties = await self.scrape()

            # Save to database
            saved_count = await self.save_to_database()

            # Mark run as complete
            self.run.mark_complete(success=True)

            logger.info(f"Scraper completed for {self.county_name}: "
                       f"{saved_count} properties saved")

        except Exception as e:
            logger.error(f"Scraper failed for {self.county_name}: {str(e)}")
            self.run.errors.append(str(e))
            self.run.mark_complete(success=False)

        finally:
            # Log the run
            await self.db.log_scraper_run(self.run)

        return self.run

    def extract_property_details(self, data: Dict) -> Optional[ScrapedProperty]:
        """
        Extract and normalize property details from raw data
        This is a helper method that can be overridden by specific scrapers
        """
        try:
            # This is a template - override in specific scrapers
            property_data = ScrapedProperty(
                address=self.clean_address(data.get('address', '')),
                county=self.county_name,
                deed_type=DeedType.TAX_DEED,
                status=PropertyStatus.UPCOMING
            )

            return property_data

        except Exception as e:
            logger.error(f"Error extracting property details: {str(e)}")
            return None
