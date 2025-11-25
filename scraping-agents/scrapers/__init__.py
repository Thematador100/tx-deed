"""
County-specific scrapers for Texas deed data
"""
from scrapers.harris.harris_scraper import HarrisCountyScraper
from scrapers.travis.travis_scraper import TravisCountyScraper
from scrapers.dallas.dallas_scraper import DallasCountyScraper

# Scraper registry mapping county names to scraper classes
SCRAPER_REGISTRY = {
    'harris': HarrisCountyScraper,
    'travis': TravisCountyScraper,
    'dallas': DallasCountyScraper,
    # Add more counties as they're implemented
}


def get_scraper(county_name: str, config: dict):
    """
    Get the appropriate scraper for a county

    Args:
        county_name: Name of the county (lowercase)
        config: Configuration dictionary for the county

    Returns:
        Scraper instance or None if not found
    """
    county_key = county_name.lower().replace(' ', '_')
    scraper_class = SCRAPER_REGISTRY.get(county_key)

    if scraper_class:
        return scraper_class(config)
    else:
        raise ValueError(f"No scraper found for county: {county_name}")


__all__ = [
    'HarrisCountyScraper',
    'TravisCountyScraper',
    'DallasCountyScraper',
    'SCRAPER_REGISTRY',
    'get_scraper'
]
