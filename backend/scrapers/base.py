"""Base scraper class with common functionality."""
import asyncio
import random
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from datetime import datetime
from loguru import logger
from playwright.async_api import async_playwright, Browser, Page, TimeoutError as PlaywrightTimeout
from bs4 import BeautifulSoup
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential
from config import settings

class BaseScraper(ABC):
    """Base class for all scrapers."""

    def __init__(self, source_name: str):
        self.source_name = source_name
        self.browser: Optional[Browser] = None
        self.http_client: Optional[httpx.AsyncClient] = None
        self.properties: List[Dict[str, Any]] = []

    async def __aenter__(self):
        """Async context manager entry."""
        await self.init_browser()
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        await self.close()

    async def init_browser(self):
        """Initialize Playwright browser."""
        try:
            playwright = await async_playwright().start()
            self.browser = await playwright.chromium.launch(
                headless=True,
                args=[
                    '--disable-blink-features=AutomationControlled',
                    '--disable-dev-shm-usage',
                    '--no-sandbox'
                ]
            )
            logger.info(f"Browser initialized for {self.source_name}")
        except Exception as e:
            logger.error(f"Failed to initialize browser: {e}")
            raise

    async def init_http_client(self):
        """Initialize HTTP client for simple requests."""
        self.http_client = httpx.AsyncClient(
            headers={"User-Agent": settings.user_agent},
            timeout=30.0,
            follow_redirects=True
        )

    async def create_page(self) -> Page:
        """Create a new browser page with stealth settings."""
        if not self.browser:
            await self.init_browser()

        page = await self.browser.new_page()

        # Anti-detection measures
        await page.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined
            });

            window.navigator.chrome = {
                runtime: {}
            };

            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5]
            });

            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en']
            });
        """)

        return page

    async def random_delay(self):
        """Add random delay to avoid detection."""
        delay = random.uniform(settings.scraping_delay_min, settings.scraping_delay_max)
        await asyncio.sleep(delay)

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=4, max=10),
        reraise=True
    )
    async def fetch_page(self, url: str) -> str:
        """Fetch page content using Playwright."""
        page = await self.create_page()
        try:
            logger.info(f"Fetching {url}")
            await page.goto(url, wait_until="networkidle", timeout=30000)
            await self.random_delay()
            content = await page.content()
            return content
        except PlaywrightTimeout:
            logger.warning(f"Timeout fetching {url}, retrying...")
            raise
        except Exception as e:
            logger.error(f"Error fetching {url}: {e}")
            raise
        finally:
            await page.close()

    async def fetch_with_http(self, url: str) -> str:
        """Fetch page content using HTTP client (faster for simple pages)."""
        if not self.http_client:
            await self.init_http_client()

        try:
            response = await self.http_client.get(url)
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"HTTP fetch error for {url}: {e}")
            raise

    def parse_html(self, html: str) -> BeautifulSoup:
        """Parse HTML content."""
        return BeautifulSoup(html, 'lxml')

    def clean_text(self, text: Optional[str]) -> Optional[str]:
        """Clean and normalize text."""
        if not text:
            return None
        return ' '.join(text.split()).strip()

    def parse_price(self, price_str: Optional[str]) -> Optional[float]:
        """Parse price string to float."""
        if not price_str:
            return None
        try:
            # Remove currency symbols, commas, and whitespace
            clean_price = price_str.replace('$', '').replace(',', '').strip()
            return float(clean_price)
        except (ValueError, AttributeError):
            return None

    def parse_date(self, date_str: Optional[str]) -> Optional[datetime]:
        """Parse date string to datetime."""
        if not date_str:
            return None

        # Common date formats
        formats = [
            "%m/%d/%Y",
            "%Y-%m-%d",
            "%B %d, %Y",
            "%b %d, %Y",
            "%m-%d-%Y",
            "%d/%m/%Y"
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str.strip(), fmt)
            except ValueError:
                continue

        logger.warning(f"Could not parse date: {date_str}")
        return None

    def generate_property_id(self, source: str, parcel_id: Optional[str], address: str) -> str:
        """Generate unique property ID."""
        import hashlib
        unique_str = f"{source}:{parcel_id or address}"
        return hashlib.md5(unique_str.encode()).hexdigest()

    @abstractmethod
    async def scrape(self) -> List[Dict[str, Any]]:
        """Main scraping method - must be implemented by subclasses."""
        pass

    @abstractmethod
    def parse_property(self, element: Any) -> Dict[str, Any]:
        """Parse individual property - must be implemented by subclasses."""
        pass

    async def close(self):
        """Clean up resources."""
        if self.browser:
            await self.browser.close()
        if self.http_client:
            await self.http_client.aclose()
        logger.info(f"Closed resources for {self.source_name}")
