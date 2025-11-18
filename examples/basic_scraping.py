"""
Basic scraping example
Demonstrates how to scrape properties from multiple sources
"""

import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scraping_system.scrapers.property.zillow_scraper import ZillowScraper
from scraping_system.scrapers.property.realtor_scraper import RealtorScraper
from scraping_system.core.database_manager import DatabaseManager


def main():
    """Main function"""
    print("=== Basic Property Scraping Example ===\n")

    # Example 1: Scrape from Zillow
    print("1. Scraping properties from Zillow...")
    with ZillowScraper() as zillow:
        properties = zillow.scrape(
            location="Austin, TX",
            max_pages=2
        )
        print(f"   Found {len(properties)} properties")

        if properties:
            print(f"   Sample property: {properties[0].get('address')}")

    # Example 2: Scrape from Realtor.com
    print("\n2. Scraping properties from Realtor.com...")
    with RealtorScraper() as realtor:
        properties = realtor.scrape(
            city="Austin",
            state="TX",
            max_results=50
        )
        print(f"   Found {len(properties)} properties")

    # Example 3: Save to database
    print("\n3. Saving properties to database...")
    db = DatabaseManager()

    saved_count = db.bulk_insert_properties(properties)
    print(f"   Saved {saved_count} properties to database")

    # Get statistics
    stats = db.get_stats()
    print(f"   Total properties in DB: {stats['total_properties']}")

    db.close()

    print("\n=== Scraping Complete ===")


if __name__ == '__main__':
    main()
