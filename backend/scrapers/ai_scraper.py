"""AI-powered scraper using LLMs for intelligent data extraction."""
from typing import List, Dict, Any, Optional
import json
from loguru import logger
from .base import BaseScraper
from config import settings

class AITaxSaleScraper(BaseScraper):
    """
    Advanced scraper that uses Claude/GPT to intelligently extract
    tax sale data from any website structure.
    """

    def __init__(self, source_name: str, base_url: str):
        super().__init__(source_name)
        self.base_url = base_url
        self._init_llm_client()

    def _init_llm_client(self):
        """Initialize LLM client (Claude or OpenAI)."""
        if settings.anthropic_api_key:
            from anthropic import Anthropic
            self.llm_client = Anthropic(api_key=settings.anthropic_api_key)
            self.llm_provider = "anthropic"
            logger.info("Using Claude for AI extraction")
        elif settings.openai_api_key:
            from openai import OpenAI
            self.llm_client = OpenAI(api_key=settings.openai_api_key)
            self.llm_provider = "openai"
            logger.info("Using OpenAI for AI extraction")
        else:
            logger.warning("No LLM API key configured - AI extraction disabled")
            self.llm_client = None

    async def scrape(self, url: Optional[str] = None) -> List[Dict[str, Any]]:
        """Scrape using AI-powered extraction."""
        if not self.llm_client:
            logger.error("LLM client not initialized")
            return []

        target_url = url or self.base_url

        try:
            logger.info(f"AI scraping {target_url}")

            # Fetch page content
            html = await self.fetch_page(target_url)

            # Extract text content (remove scripts, styles)
            soup = self.parse_html(html)
            for script in soup(["script", "style", "nav", "footer", "header"]):
                script.decompose()

            # Get clean text
            text_content = soup.get_text(separator='\n', strip=True)

            # Truncate if too long (LLM context limits)
            max_chars = 50000
            if len(text_content) > max_chars:
                text_content = text_content[:max_chars] + "...[truncated]"

            # Use LLM to extract structured data
            properties = await self._extract_with_llm(text_content, target_url)

            self.properties = properties
            logger.info(f"AI extracted {len(properties)} properties")
            return properties

        except Exception as e:
            logger.error(f"AI scraping failed: {e}")
            raise

    async def _extract_with_llm(self, content: str, url: str) -> List[Dict[str, Any]]:
        """Use LLM to extract tax sale properties from content."""
        prompt = f"""
You are a tax sale property data extraction expert. Extract ALL tax sale properties from the following webpage content.

For each property, extract these fields (use null if not found):
- parcel_id: Parcel/Property ID number
- owner: Owner name
- address: Full property address
- city, state, zip_code: Location details
- county: County name
- starting_bid: Starting bid amount (number only)
- minimum_bid: Minimum bid amount (number only)
- tax_amount: Tax amount owed (number only)
- assessed_value: Assessed property value (number only)
- auction_date: Auction/sale date (YYYY-MM-DD format)
- auction_time: Auction time
- auction_location: Auction location/venue
- property_type: Property type (Residential, Commercial, Land, etc.)
- description: Brief description

Return ONLY a valid JSON array of objects. No explanations, no markdown, just the JSON array.

Example format:
[
  {{
    "parcel_id": "123-456-789",
    "owner": "John Doe",
    "address": "123 Main St",
    "city": "Houston",
    "state": "TX",
    "zip_code": "77001",
    "county": "Harris",
    "starting_bid": 50000,
    "tax_amount": 5000,
    "auction_date": "2025-12-15",
    "property_type": "Residential"
  }}
]

Webpage content:
{content}

JSON array of properties:"""

        try:
            if self.llm_provider == "anthropic":
                response = self.llm_client.messages.create(
                    model="claude-3-5-sonnet-20241022",
                    max_tokens=4096,
                    messages=[{"role": "user", "content": prompt}]
                )
                extracted_text = response.content[0].text
            else:  # OpenAI
                response = self.llm_client.chat.completions.create(
                    model="gpt-4-turbo-preview",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0
                )
                extracted_text = response.choices[0].message.content

            # Parse JSON response
            # Remove markdown code blocks if present
            extracted_text = extracted_text.strip()
            if extracted_text.startswith('```'):
                lines = extracted_text.split('\n')
                extracted_text = '\n'.join(lines[1:-1])

            properties_data = json.loads(extracted_text)

            # Add metadata
            properties = []
            for prop in properties_data:
                prop['source'] = self.source_name
                prop['listing_url'] = url
                prop['status'] = 'Upcoming'

                # Generate ID
                prop['id'] = self.generate_property_id(
                    self.source_name,
                    prop.get('parcel_id'),
                    prop.get('address', '')
                )

                properties.append(prop)

            return properties

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse LLM response as JSON: {e}")
            logger.debug(f"LLM response: {extracted_text[:500]}")
            return []
        except Exception as e:
            logger.error(f"LLM extraction error: {e}")
            return []

    def parse_property(self, element: Any) -> Dict[str, Any]:
        """Not used in AI scraper."""
        pass


async def scrape_with_ai(url: str, source_name: Optional[str] = None) -> List[Dict[str, Any]]:
    """
    Convenience function to scrape any tax sale website using AI.

    Args:
        url: URL to scrape
        source_name: Optional source name (will be extracted from URL if not provided)

    Returns:
        List of property dictionaries
    """
    if not source_name:
        from urllib.parse import urlparse
        source_name = urlparse(url).netloc

    async with AITaxSaleScraper(source_name, url) as scraper:
        return await scraper.scrape()
