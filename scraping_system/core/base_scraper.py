"""
Base scraper class with enterprise-level features:
- Retry logic with exponential backoff
- Proxy rotation
- Rate limiting
- Session management
- Error handling and logging
"""

import time
import logging
import random
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any, List
from datetime import datetime
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
from bs4 import BeautifulSoup
import json

from .proxy_manager import ProxyManager
from .rate_limiter import RateLimiter
from .session_manager import SessionManager


class BaseScraper(ABC):
    """Base class for all scrapers with enterprise features"""

    def __init__(
        self,
        name: str,
        config: Optional[Dict[str, Any]] = None,
        use_proxy: bool = True,
        rate_limit: float = 1.0,
        max_retries: int = 3,
        timeout: int = 30
    ):
        """
        Initialize the base scraper

        Args:
            name: Name of the scraper
            config: Configuration dictionary
            use_proxy: Whether to use proxy rotation
            rate_limit: Requests per second limit
            max_retries: Maximum number of retries
            timeout: Request timeout in seconds
        """
        self.name = name
        self.config = config or {}
        self.use_proxy = use_proxy
        self.max_retries = max_retries
        self.timeout = timeout

        # Initialize components
        self.logger = self._setup_logger()
        self.rate_limiter = RateLimiter(rate_limit)
        self.proxy_manager = ProxyManager() if use_proxy else None
        self.session_manager = SessionManager()

        # Statistics
        self.stats = {
            'requests_made': 0,
            'requests_failed': 0,
            'items_scraped': 0,
            'start_time': datetime.now(),
            'errors': []
        }

        self.logger.info(f"Initialized {name} scraper")

    def _setup_logger(self) -> logging.Logger:
        """Set up logger for the scraper"""
        logger = logging.getLogger(f"scraper.{self.name}")
        logger.setLevel(logging.INFO)

        if not logger.handlers:
            handler = logging.FileHandler(f'scraping_system/logs/{self.name}.log')
            formatter = logging.Formatter(
                '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
            )
            handler.setFormatter(formatter)
            logger.addHandler(handler)

            # Console handler
            console_handler = logging.StreamHandler()
            console_handler.setFormatter(formatter)
            logger.addHandler(console_handler)

        return logger

    def _get_session(self) -> requests.Session:
        """Get a configured session with retry logic"""
        session = self.session_manager.get_session()

        retry_strategy = Retry(
            total=self.max_retries,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS", "POST"]
        )

        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)

        return session

    def _get_headers(self) -> Dict[str, str]:
        """Get randomized headers to avoid detection"""
        user_agents = [
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
            'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
        ]

        return {
            'User-Agent': random.choice(user_agents),
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1'
        }

    def fetch(
        self,
        url: str,
        method: str = 'GET',
        data: Optional[Dict] = None,
        headers: Optional[Dict] = None,
        **kwargs
    ) -> Optional[requests.Response]:
        """
        Fetch a URL with retry logic, rate limiting, and proxy rotation

        Args:
            url: URL to fetch
            method: HTTP method (GET, POST, etc.)
            data: Request data for POST requests
            headers: Custom headers
            **kwargs: Additional arguments for requests

        Returns:
            Response object or None if failed
        """
        # Apply rate limiting
        self.rate_limiter.wait()

        session = self._get_session()
        request_headers = self._get_headers()

        if headers:
            request_headers.update(headers)

        proxies = None
        if self.use_proxy and self.proxy_manager:
            proxies = self.proxy_manager.get_proxy()

        for attempt in range(self.max_retries):
            try:
                self.logger.info(f"Fetching {url} (attempt {attempt + 1}/{self.max_retries})")

                response = session.request(
                    method=method,
                    url=url,
                    headers=request_headers,
                    data=data,
                    proxies=proxies,
                    timeout=self.timeout,
                    **kwargs
                )

                response.raise_for_status()
                self.stats['requests_made'] += 1

                self.logger.info(f"Successfully fetched {url}")
                return response

            except requests.exceptions.RequestException as e:
                self.logger.warning(f"Request failed (attempt {attempt + 1}): {str(e)}")
                self.stats['requests_failed'] += 1

                if self.use_proxy and self.proxy_manager:
                    # Rotate proxy on failure
                    proxies = self.proxy_manager.get_proxy()

                if attempt < self.max_retries - 1:
                    # Exponential backoff
                    wait_time = (2 ** attempt) + random.uniform(0, 1)
                    self.logger.info(f"Waiting {wait_time:.2f}s before retry")
                    time.sleep(wait_time)
                else:
                    self.logger.error(f"All retry attempts failed for {url}")
                    self.stats['errors'].append({
                        'url': url,
                        'error': str(e),
                        'timestamp': datetime.now().isoformat()
                    })

        return None

    def parse_html(self, html_content: str) -> BeautifulSoup:
        """Parse HTML content using BeautifulSoup"""
        return BeautifulSoup(html_content, 'html.parser')

    def extract_json(self, response: requests.Response) -> Optional[Dict]:
        """Extract JSON from response"""
        try:
            return response.json()
        except json.JSONDecodeError as e:
            self.logger.error(f"Failed to parse JSON: {str(e)}")
            return None

    def save_raw_data(self, data: Any, filename: str):
        """Save raw scraped data"""
        filepath = f'scraping_system/data/raw/{filename}'

        with open(filepath, 'w', encoding='utf-8') as f:
            if isinstance(data, (dict, list)):
                json.dump(data, f, indent=2, ensure_ascii=False)
            else:
                f.write(str(data))

        self.logger.info(f"Saved raw data to {filepath}")

    def get_stats(self) -> Dict[str, Any]:
        """Get scraper statistics"""
        runtime = (datetime.now() - self.stats['start_time']).total_seconds()

        return {
            **self.stats,
            'runtime_seconds': runtime,
            'success_rate': (
                (self.stats['requests_made'] - self.stats['requests_failed']) /
                self.stats['requests_made'] * 100
            ) if self.stats['requests_made'] > 0 else 0
        }

    @abstractmethod
    def scrape(self, *args, **kwargs) -> Any:
        """
        Main scraping method to be implemented by subclasses

        Returns:
            Scraped data in appropriate format
        """
        pass

    @abstractmethod
    def parse(self, response: requests.Response) -> Any:
        """
        Parse response data - to be implemented by subclasses

        Args:
            response: Response object from fetch()

        Returns:
            Parsed data
        """
        pass

    def __enter__(self):
        """Context manager entry"""
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit - cleanup resources"""
        self.logger.info(f"Scraper {self.name} finished. Stats: {self.get_stats()}")
        self.session_manager.close()
