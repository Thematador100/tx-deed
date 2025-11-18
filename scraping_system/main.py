"""
Main entry point for the enterprise scraping system
"""

import argparse
import logging
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from scraping_system.scrapers.property.zillow_scraper import ZillowScraper
from scraping_system.scrapers.property.realtor_scraper import RealtorScraper
from scraping_system.scrapers.tax_records.county_tax_scraper import CountyTaxScraper
from scraping_system.pipelines.data_cleaner import DataCleaner
from scraping_system.pipelines.data_validator import DataValidator
from scraping_system.pipelines.data_transformer import DataTransformer
from scraping_system.core.database_manager import DatabaseManager, DatabaseType
from scraping_system.data_science.analysis.property_analyzer import PropertyAnalyzer
from scraping_system.data_science.ml_models.lead_scoring import LeadScoringModel


def setup_logging(level=logging.INFO):
    """Setup logging configuration"""
    logging.basicConfig(
        level=level,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler('scraping_system/logs/main.log')
        ]
    )


def scrape_properties(args):
    """Scrape properties from various sources"""
    logger = logging.getLogger("main")
    logger.info(f"Starting property scrape for: {args.location}")

    all_properties = []

    # Scrape from Zillow
    if args.source in ['all', 'zillow']:
        logger.info("Scraping Zillow...")
        with ZillowScraper() as scraper:
            properties = scraper.scrape(args.location, max_pages=args.max_pages)
            all_properties.extend(properties)
            logger.info(f"Scraped {len(properties)} properties from Zillow")

    # Scrape from Realtor.com
    if args.source in ['all', 'realtor']:
        logger.info("Scraping Realtor.com...")
        city, state = args.location.split(',')
        with RealtorScraper() as scraper:
            properties = scraper.scrape(city.strip(), state.strip(), max_results=args.max_results)
            all_properties.extend(properties)
            logger.info(f"Scraped {len(properties)} properties from Realtor.com")

    logger.info(f"Total properties scraped: {len(all_properties)}")

    # Process data through pipeline
    if all_properties:
        process_data(all_properties, args)

    return all_properties


def scrape_tax_records(args):
    """Scrape tax records from county websites"""
    logger = logging.getLogger("main")
    logger.info(f"Starting tax records scrape for: {args.county}")

    with CountyTaxScraper(county=args.county) as scraper:
        records = scraper.scrape('delinquent', max_results=args.max_results)
        logger.info(f"Scraped {len(records)} tax records")

        if records:
            process_data(records, args)

    return records


def process_data(data, args):
    """Process scraped data through pipeline"""
    logger = logging.getLogger("main")
    logger.info("Processing data through pipeline...")

    # Clean data
    cleaner = DataCleaner()
    cleaned_data = cleaner.clean_bulk(data)
    logger.info(f"Cleaned {len(cleaned_data)} records")

    # Validate data
    validator = DataValidator()
    valid_data, invalid_data = validator.validate_bulk(cleaned_data)
    logger.info(f"Validated: {len(valid_data)} valid, {len(invalid_data)} invalid")

    # Transform data
    transformer = DataTransformer()
    transformed_data = transformer.transform_bulk(valid_data)
    logger.info(f"Transformed {len(transformed_data)} records")

    # Save to database
    if args.save_db:
        db = DatabaseManager(db_type=DatabaseType.SQLITE)
        count = db.bulk_insert_properties(transformed_data)
        logger.info(f"Saved {count} properties to database")
        db.close()

    return transformed_data


def analyze_data(args):
    """Analyze property data"""
    logger = logging.getLogger("main")
    logger.info("Analyzing property data...")

    # Load data from database
    db = DatabaseManager(db_type=DatabaseType.SQLITE)
    properties = db.query_properties(limit=args.limit)
    logger.info(f"Loaded {len(properties)} properties from database")

    if not properties:
        logger.warning("No properties found in database")
        return

    # Analyze
    analyzer = PropertyAnalyzer()
    analysis = analyzer.analyze_dataset(properties)

    # Print insights
    insights = analyzer.generate_insights(analysis)
    print("\n=== Property Analysis Insights ===")
    for insight in insights:
        print(f"  • {insight}")

    # Generate leads
    if args.generate_leads:
        logger.info("Generating lead scores...")
        lead_scorer = LeadScoringModel()
        top_leads = lead_scorer.get_top_leads(properties, limit=10)

        print("\n=== Top 10 Leads ===")
        for i, lead in enumerate(top_leads, 1):
            score = lead['lead_score']
            print(f"\n{i}. {lead.get('address', 'Unknown')}")
            print(f"   Score: {score['total_score']:.2f} ({score['lead_temperature']})")
            print(f"   Price: ${lead.get('price', 0):,.0f}")

    db.close()


def main():
    """Main function"""
    parser = argparse.ArgumentParser(
        description="Enterprise Real Estate Scraping and Data Science System"
    )

    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Scrape properties command
    scrape_parser = subparsers.add_parser('scrape', help='Scrape property data')
    scrape_parser.add_argument('--location', required=True, help='Location to scrape (e.g., "Austin, TX")')
    scrape_parser.add_argument('--source', choices=['all', 'zillow', 'realtor', 'redfin'], default='all')
    scrape_parser.add_argument('--max-pages', type=int, default=10, help='Maximum pages to scrape')
    scrape_parser.add_argument('--max-results', type=int, default=200, help='Maximum results')
    scrape_parser.add_argument('--save-db', action='store_true', help='Save to database')

    # Scrape tax records command
    tax_parser = subparsers.add_parser('tax', help='Scrape tax records')
    tax_parser.add_argument('--county', required=True, choices=['travis', 'harris', 'dallas', 'bexar'])
    tax_parser.add_argument('--max-results', type=int, default=1000)
    tax_parser.add_argument('--save-db', action='store_true')

    # Analyze command
    analyze_parser = subparsers.add_parser('analyze', help='Analyze property data')
    analyze_parser.add_argument('--limit', type=int, default=1000, help='Number of properties to analyze')
    analyze_parser.add_argument('--generate-leads', action='store_true', help='Generate lead scores')

    # Logging level
    parser.add_argument('--log-level', choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'], default='INFO')

    args = parser.parse_args()

    # Setup logging
    setup_logging(getattr(logging, args.log_level))

    # Execute command
    if args.command == 'scrape':
        scrape_properties(args)
    elif args.command == 'tax':
        scrape_tax_records(args)
    elif args.command == 'analyze':
        analyze_data(args)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
