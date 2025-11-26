#!/usr/bin/env python3
"""
TRUE Universal County Scraper
Works for ANY county in ANY state without specific configuration
Uses AI + web scraping to automatically find and extract tax deed/lien data
"""

import asyncio
import os
import json
import logging
from typing import List, Dict, Optional
from dataclasses import dataclass, asdict
from datetime import datetime
import re

# Web scraping
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

# AI extraction
import openai

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class Property:
    """Universal property data model"""
    county: str
    state: str
    parcel_number: Optional[str] = None
    address: Optional[str] = None
    owner_name: Optional[str] = None
    tax_amount: Optional[float] = None
    assessed_value: Optional[float] = None
    auction_date: Optional[str] = None
    deed_type: Optional[str] = None  # tax_deed, tax_lien, redeemable_deed
    status: Optional[str] = None
    legal_description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    raw_data: Optional[Dict] = None
    source_url: Optional[str] = None
    scraped_at: str = datetime.now().isoformat()


class UniversalCountyScraper:
    """
    Universal scraper that works for ANY county
    No configuration needed - uses AI to understand the website structure
    """

    def __init__(self, county: str, state: str, use_ai: bool = True, use_proxies: bool = False):
        self.county = county
        self.state = state
        self.use_ai = use_ai
        self.use_proxies = use_proxies

        # AI setup
        self.openai_key = os.getenv('OPENAI_API_KEY')
        if self.use_ai and self.openai_key:
            openai.api_key = self.openai_key

        # Proxy setup
        self.proxies = self._load_proxies() if use_proxies else []
        self.current_proxy_index = 0

        # Browser setup
        self.driver = None

    def _load_proxies(self) -> List[str]:
        """Load proxy list from environment or file"""
        proxy_list = os.getenv('PROXY_LIST', '').split(',')
        return [p.strip() for p in proxy_list if p.strip()]

    def _get_next_proxy(self) -> Optional[str]:
        """Rotate through proxy list"""
        if not self.proxies:
            return None
        proxy = self.proxies[self.current_proxy_index]
        self.current_proxy_index = (self.current_proxy_index + 1) % len(self.proxies)
        return proxy

    def _init_driver(self):
        """Initialize Selenium driver with proxy support"""
        options = Options()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36')

        # Add proxy if enabled
        if self.use_proxies:
            proxy = self._get_next_proxy()
            if proxy:
                options.add_argument(f'--proxy-server={proxy}')
                logger.info(f"Using proxy: {proxy}")

        self.driver = webdriver.Chrome(options=options)
        return self.driver

    async def find_tax_sale_url(self) -> str:
        """
        Step 1: Find the county tax sale/auction website
        Uses Google search + AI to find the correct URL
        """
        logger.info(f"Finding tax sale URL for {self.county} County, {self.state}")

        # Search queries to try
        search_queries = [
            f"{self.county} county {self.state} tax deed sale",
            f"{self.county} county {self.state} tax lien auction",
            f"{self.county} county {self.state} delinquent tax",
            f"{self.county} county {self.state} tax foreclosure",
            f"{self.county} county {self.state} treasurer tax sale",
        ]

        for query in search_queries:
            try:
                # Search using requests (faster than Selenium)
                search_url = f"https://www.google.com/search?q={query.replace(' ', '+')}"
                response = requests.get(search_url, timeout=10, headers={
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                })

                soup = BeautifulSoup(response.content, 'html.parser')

                # Extract URLs from search results
                links = []
                for a in soup.find_all('a', href=True):
                    href = a['href']
                    if '/url?q=' in href and 'google' not in href:
                        url = href.split('/url?q=')[1].split('&')[0]
                        if 'gov' in url or 'county' in url or 'treasurer' in url:
                            links.append(url)

                if links:
                    # Use AI to pick the most relevant URL
                    if self.use_ai and self.openai_key:
                        best_url = await self._ai_pick_best_url(links, query)
                        if best_url:
                            logger.info(f"Found tax sale URL: {best_url}")
                            return best_url
                    else:
                        # Without AI, just return the first .gov link
                        return links[0]

            except Exception as e:
                logger.error(f"Error searching for {query}: {e}")
                continue

        # Fallback: construct likely URL
        fallback = f"https://www.{self.county.lower()}county{self.state.lower()}.gov"
        logger.warning(f"Could not find specific URL, using fallback: {fallback}")
        return fallback

    async def _ai_pick_best_url(self, urls: List[str], query: str) -> Optional[str]:
        """Use AI to select the most relevant URL"""
        try:
            prompt = f"""Given these URLs found for "{query}", which one is most likely the official county tax sale/auction page?
Return ONLY the URL, nothing else.

URLs:
{chr(10).join(f"{i+1}. {url}" for i, url in enumerate(urls))}

Best URL:"""

            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=100,
                temperature=0
            )

            url = response.choices[0].message.content.strip()
            if url in urls:
                return url

        except Exception as e:
            logger.error(f"AI URL selection failed: {e}")

        return None

    async def extract_properties(self, url: str) -> List[Property]:
        """
        Step 2: Extract properties from the tax sale page
        Uses AI to understand page structure and extract data
        """
        logger.info(f"Extracting properties from {url}")

        try:
            # Initialize driver
            if not self.driver:
                self._init_driver()

            self.driver.get(url)
            await asyncio.sleep(2)  # Wait for page load

            # Get page HTML
            html = self.driver.page_source
            soup = BeautifulSoup(html, 'html.parser')

            # Extract text content
            text_content = soup.get_text()

            # Use AI to extract structured data
            if self.use_ai and self.openai_key:
                properties = await self._ai_extract_properties(html, text_content, url)
                return properties
            else:
                # Fallback: regex-based extraction
                return await self._regex_extract_properties(text_content, url)

        except Exception as e:
            logger.error(f"Error extracting properties: {e}")
            return []

        finally:
            if self.driver:
                self.driver.quit()
                self.driver = None

    async def _ai_extract_properties(self, html: str, text: str, url: str) -> List[Property]:
        """Use AI to extract property data from page"""
        try:
            # Truncate HTML if too long
            html_sample = html[:10000] if len(html) > 10000 else html

            prompt = f"""Extract tax deed/lien property information from this webpage.
Return a JSON array of properties with these fields (use null if not found):
- parcel_number
- address
- owner_name
- tax_amount (number)
- assessed_value (number)
- auction_date (YYYY-MM-DD format)
- legal_description

HTML Sample:
{html_sample}

Return ONLY valid JSON array, no other text:"""

            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=2000,
                temperature=0
            )

            json_str = response.choices[0].message.content.strip()

            # Extract JSON from response (handle markdown code blocks)
            if '```' in json_str:
                json_str = json_str.split('```')[1]
                if json_str.startswith('json'):
                    json_str = json_str[4:]

            data = json.loads(json_str)

            # Convert to Property objects
            properties = []
            for item in data:
                prop = Property(
                    county=self.county,
                    state=self.state,
                    parcel_number=item.get('parcel_number'),
                    address=item.get('address'),
                    owner_name=item.get('owner_name'),
                    tax_amount=item.get('tax_amount'),
                    assessed_value=item.get('assessed_value'),
                    auction_date=item.get('auction_date'),
                    legal_description=item.get('legal_description'),
                    source_url=url,
                    raw_data=item
                )
                properties.append(prop)

            logger.info(f"AI extracted {len(properties)} properties")
            return properties

        except Exception as e:
            logger.error(f"AI extraction failed: {e}")
            return []

    async def _regex_extract_properties(self, text: str, url: str) -> List[Property]:
        """Fallback regex-based extraction"""
        properties = []

        # Common patterns
        parcel_pattern = r'(?:Parcel|APN|Tax ID)[\s:]+([A-Z0-9-]+)'
        address_pattern = r'(\d+\s+[A-Za-z0-9\s,]+(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln))'
        amount_pattern = r'\$\s?([\d,]+\.?\d*)'

        # Extract parcels
        parcels = re.findall(parcel_pattern, text, re.IGNORECASE)
        addresses = re.findall(address_pattern, text)
        amounts = [float(a.replace(',', '')) for a in re.findall(amount_pattern, text)]

        # Create properties (best effort)
        max_props = max(len(parcels), len(addresses), len(amounts))
        for i in range(max_props):
            prop = Property(
                county=self.county,
                state=self.state,
                parcel_number=parcels[i] if i < len(parcels) else None,
                address=addresses[i] if i < len(addresses) else None,
                tax_amount=amounts[i] if i < len(amounts) else None,
                source_url=url
            )
            properties.append(prop)

        logger.info(f"Regex extracted {len(properties)} properties")
        return properties

    async def scrape(self) -> List[Property]:
        """Main scraping method"""
        try:
            # Step 1: Find the tax sale URL
            url = await self.find_tax_sale_url()

            # Step 2: Extract properties
            properties = await self.extract_properties(url)

            logger.info(f"Successfully scraped {len(properties)} properties from {self.county}, {self.state}")
            return properties

        except Exception as e:
            logger.error(f"Scraping failed for {self.county}, {self.state}: {e}")
            return []

    def to_dict(self, properties: List[Property]) -> List[Dict]:
        """Convert properties to dictionaries for JSON export"""
        return [asdict(prop) for prop in properties]


async def main():
    """Test the universal scraper"""
    # Example usage
    scraper = UniversalCountyScraper(
        county="Maricopa",
        state="AZ",
        use_ai=True,  # Requires OPENAI_API_KEY
        use_proxies=False  # Set to True and provide PROXY_LIST env var
    )

    properties = await scraper.scrape()

    print(f"\nFound {len(properties)} properties:")
    for prop in properties[:5]:  # Show first 5
        print(f"\n- Parcel: {prop.parcel_number}")
        print(f"  Address: {prop.address}")
        print(f"  Tax Amount: ${prop.tax_amount}")

    # Save to JSON
    output = scraper.to_dict(properties)
    with open('scraped_properties.json', 'w') as f:
        json.dump(output, f, indent=2)

    print(f"\nSaved to scraped_properties.json")


if __name__ == '__main__':
    asyncio.run(main())
