"""Orchestrator for managing multiple scrapers."""
import asyncio
from typing import List, Dict, Any, Optional
from loguru import logger
from database import PropertyDatabase, AsyncSessionLocal
from scrapers import (
    TaxSaleResourcesScraper,
    create_county_scraper,
    COUNTY_CONFIGS,
    scrape_with_ai
)

class ScraperOrchestrator:
    """Manages and coordinates multiple scrapers."""

    def __init__(self):
        self.results: Dict[str, List[Dict[str, Any]]] = {}

    async def scrape_all_sources(
        self,
        include_ai: bool = False,
        custom_urls: Optional[List[str]] = None
    ) -> Dict[str, int]:
        """
        Run all configured scrapers.

        Args:
            include_ai: Whether to use AI scraper for custom URLs
            custom_urls: Additional URLs to scrape with AI

        Returns:
            Dictionary with source names and property counts
        """
        logger.info("Starting orchestrated scraping")
        results = {}

        # Scrape TaxSaleResources.com
        try:
            async with TaxSaleResourcesScraper() as scraper:
                properties = await scraper.scrape()
                await self._save_properties(properties)
                results['taxsaleresources.com'] = len(properties)
        except Exception as e:
            logger.error(f"TaxSaleResources scraping failed: {e}")
            results['taxsaleresources.com'] = 0

        # Scrape all configured counties
        for county_key in COUNTY_CONFIGS.keys():
            try:
                scraper = await create_county_scraper(county_key)
                async with scraper:
                    properties = await scraper.scrape()
                    await self._save_properties(properties)
                    results[county_key] = len(properties)
            except Exception as e:
                logger.error(f"County scraping failed for {county_key}: {e}")
                results[county_key] = 0

        # AI scraping for custom URLs
        if include_ai and custom_urls:
            for url in custom_urls:
                try:
                    properties = await scrape_with_ai(url)
                    await self._save_properties(properties)
                    results[url] = len(properties)
                except Exception as e:
                    logger.error(f"AI scraping failed for {url}: {e}")
                    results[url] = 0

        logger.info(f"Scraping completed: {results}")
        return results

    async def scrape_source(
        self,
        source_type: str,
        **kwargs
    ) -> List[Dict[str, Any]]:
        """
        Scrape a specific source.

        Args:
            source_type: Type of scraper ('tax_sale_resources', 'county', 'ai')
            **kwargs: Additional arguments for the scraper

        Returns:
            List of scraped properties
        """
        try:
            if source_type == 'tax_sale_resources':
                async with TaxSaleResourcesScraper() as scraper:
                    properties = await scraper.scrape(
                        state=kwargs.get('state'),
                        county=kwargs.get('county')
                    )
                    await self._save_properties(properties)
                    return properties

            elif source_type == 'county':
                county_key = kwargs.get('county_key')
                if not county_key:
                    raise ValueError("county_key required for county scraper")

                scraper = await create_county_scraper(county_key)
                async with scraper:
                    properties = await scraper.scrape()
                    await self._save_properties(properties)
                    return properties

            elif source_type == 'ai':
                url = kwargs.get('url')
                if not url:
                    raise ValueError("url required for AI scraper")

                properties = await scrape_with_ai(
                    url,
                    source_name=kwargs.get('source_name')
                )
                await self._save_properties(properties)
                return properties

            else:
                raise ValueError(f"Unknown source type: {source_type}")

        except Exception as e:
            logger.error(f"Scraping failed for {source_type}: {e}")
            raise

    async def _save_properties(self, properties: List[Dict[str, Any]]):
        """Save scraped properties to database."""
        if not properties:
            return

        async with AsyncSessionLocal() as session:
            db = PropertyDatabase(session)
            count = await db.upsert_properties(properties)
            logger.info(f"Saved {count} properties to database")

    async def scrape_with_concurrency(
        self,
        sources: List[Dict[str, Any]],
        max_concurrent: int = 3
    ) -> Dict[str, int]:
        """
        Scrape multiple sources concurrently with rate limiting.

        Args:
            sources: List of source configurations
            max_concurrent: Maximum concurrent scrapers

        Returns:
            Results dictionary
        """
        semaphore = asyncio.Semaphore(max_concurrent)
        results = {}

        async def scrape_with_limit(source_config):
            async with semaphore:
                try:
                    source_type = source_config.pop('type')
                    properties = await self.scrape_source(source_type, **source_config)
                    return (source_config.get('name', source_type), len(properties))
                except Exception as e:
                    logger.error(f"Error scraping {source_config}: {e}")
                    return (source_config.get('name', 'unknown'), 0)

        tasks = [scrape_with_limit(source) for source in sources]
        completed = await asyncio.gather(*tasks)

        for name, count in completed:
            results[name] = count

        return results


# Example usage functions
async def quick_scrape_texas():
    """Quick scrape of Texas tax sales."""
    orchestrator = ScraperOrchestrator()

    sources = [
        {'type': 'county', 'county_key': 'harris-tx', 'name': 'Harris County'},
        {'type': 'county', 'county_key': 'travis-tx', 'name': 'Travis County'},
        {'type': 'tax_sale_resources', 'state': 'TX', 'name': 'TaxSaleResources TX'}
    ]

    results = await orchestrator.scrape_with_concurrency(sources, max_concurrent=2)
    logger.info(f"Texas scraping results: {results}")
    return results


async def scrape_custom_url(url: str, source_name: Optional[str] = None):
    """Scrape a custom URL using AI."""
    orchestrator = ScraperOrchestrator()
    properties = await orchestrator.scrape_source(
        'ai',
        url=url,
        source_name=source_name
    )
    logger.info(f"Scraped {len(properties)} properties from {url}")
    return properties
