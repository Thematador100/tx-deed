"""Command-line interface for the scraping service."""
import asyncio
import argparse
from loguru import logger
import sys

from database import init_db, AsyncSessionLocal, PropertyDatabase
from scraper_orchestrator import ScraperOrchestrator, quick_scrape_texas, scrape_custom_url
from scrapers import COUNTY_CONFIGS

def setup_logging():
    """Configure logging for CLI."""
    logger.remove()
    logger.add(
        sys.stdout,
        format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | <level>{message}</level>",
        level="INFO"
    )

async def scrape_all_cmd():
    """Scrape all configured sources."""
    logger.info("Scraping all sources...")
    orchestrator = ScraperOrchestrator()
    results = await orchestrator.scrape_all_sources()

    logger.info("Results:")
    for source, count in results.items():
        logger.info(f"  {source}: {count} properties")

    total = sum(results.values())
    logger.success(f"Total: {total} properties scraped")

async def scrape_source_cmd(args):
    """Scrape a specific source."""
    orchestrator = ScraperOrchestrator()

    kwargs = {}
    if args.county:
        kwargs['county_key'] = args.county
    if args.state:
        kwargs['state'] = args.state
    if args.url:
        kwargs['url'] = args.url

    logger.info(f"Scraping {args.type}...")
    properties = await orchestrator.scrape_source(args.type, **kwargs)
    logger.success(f"Scraped {len(properties)} properties")

async def scrape_url_cmd(args):
    """Scrape a custom URL."""
    logger.info(f"Scraping {args.url} with AI...")
    properties = await scrape_custom_url(args.url, args.name)
    logger.success(f"Scraped {len(properties)} properties")

async def list_sources_cmd():
    """List all available sources."""
    logger.info("Available county scrapers:")
    for key, config in COUNTY_CONFIGS.items():
        logger.info(f"  {key}: {config['county']} County, {config['state']}")

    logger.info("\nOther scrapers:")
    logger.info("  - tax_sale_resources: TaxSaleResources.com")
    logger.info("  - ai: AI-powered scraper (requires API key)")

async def stats_cmd():
    """Show database statistics."""
    async with AsyncSessionLocal() as session:
        db = PropertyDatabase(session)
        stats = await db.get_stats()

    logger.info("Database Statistics:")
    logger.info(f"  Total properties: {stats['total_properties']}")

    logger.info("\n  By State:")
    for state, count in stats['by_state'].items():
        logger.info(f"    {state}: {count}")

    logger.info("\n  By Source:")
    for source, count in stats['by_source'].items():
        logger.info(f"    {source}: {count}")

async def init_db_cmd():
    """Initialize database."""
    logger.info("Initializing database...")
    await init_db()
    logger.success("Database initialized")

def main():
    """Main CLI entry point."""
    setup_logging()

    parser = argparse.ArgumentParser(
        description="Tax Sale Scraping CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter
    )

    subparsers = parser.add_subparsers(dest='command', help='Commands')

    # Init command
    subparsers.add_parser('init', help='Initialize database')

    # Scrape all command
    subparsers.add_parser('scrape-all', help='Scrape all configured sources')

    # Scrape source command
    scrape_parser = subparsers.add_parser('scrape', help='Scrape a specific source')
    scrape_parser.add_argument('type', choices=['tax_sale_resources', 'county', 'ai'])
    scrape_parser.add_argument('--county', help='County key (for county scraper)')
    scrape_parser.add_argument('--state', help='State code (for tax_sale_resources)')
    scrape_parser.add_argument('--url', help='URL (for AI scraper)')

    # Scrape URL command
    url_parser = subparsers.add_parser('scrape-url', help='Scrape a custom URL with AI')
    url_parser.add_argument('url', help='URL to scrape')
    url_parser.add_argument('--name', help='Source name (optional)')

    # List sources command
    subparsers.add_parser('list-sources', help='List all available sources')

    # Stats command
    subparsers.add_parser('stats', help='Show database statistics')

    # Quick Texas scrape
    subparsers.add_parser('quick-tx', help='Quick scrape of Texas sources')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        return

    # Run async command
    try:
        if args.command == 'init':
            asyncio.run(init_db_cmd())
        elif args.command == 'scrape-all':
            asyncio.run(scrape_all_cmd())
        elif args.command == 'scrape':
            asyncio.run(scrape_source_cmd(args))
        elif args.command == 'scrape-url':
            asyncio.run(scrape_url_cmd(args))
        elif args.command == 'list-sources':
            asyncio.run(list_sources_cmd())
        elif args.command == 'stats':
            asyncio.run(stats_cmd())
        elif args.command == 'quick-tx':
            asyncio.run(quick_scrape_texas())
    except KeyboardInterrupt:
        logger.info("Interrupted by user")
    except Exception as e:
        logger.error(f"Error: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
