"""
Agent Orchestrator - Coordinates all autonomous scraping agents
Manages scheduling, execution, and monitoring of county scrapers
"""
import os
import json
import asyncio
from typing import List, Dict, Optional
from datetime import datetime
from loguru import logger
from dotenv import load_dotenv
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
from apscheduler.triggers.cron import CronTrigger

from scrapers import get_scraper
from models.property import ScraperRun
from utils.database import DatabaseManager

load_dotenv()


class AgentOrchestrator:
    """
    Orchestrates autonomous scraping agents across multiple Texas counties
    """

    def __init__(self, config_path: str = "config/counties.json"):
        self.config_path = config_path
        self.counties_config = self.load_config()
        self.scheduler = AsyncIOScheduler()
        self.db = DatabaseManager()
        self.active_runs: Dict[str, ScraperRun] = {}

        logger.info("Agent Orchestrator initialized")

    def load_config(self) -> Dict:
        """Load county configuration from JSON file"""
        try:
            with open(self.config_path, 'r') as f:
                config = json.load(f)
                logger.info(f"Loaded configuration for {len(config['texas_counties'])} counties")
                return config['texas_counties']
        except Exception as e:
            logger.error(f"Error loading config: {str(e)}")
            return {}

    def get_enabled_counties(self) -> List[str]:
        """Get list of counties that have scraping enabled"""
        enabled = [
            county for county, config in self.counties_config.items()
            if config.get('enabled', False)
        ]
        logger.info(f"Found {len(enabled)} enabled counties: {', '.join(enabled)}")
        return enabled

    async def run_county_scraper(self, county: str) -> Optional[ScraperRun]:
        """
        Run scraper for a specific county

        Args:
            county: County name (e.g., 'harris', 'dallas')

        Returns:
            ScraperRun object with results
        """
        if county not in self.counties_config:
            logger.error(f"County {county} not found in configuration")
            return None

        config = self.counties_config[county]

        if not config.get('enabled', False):
            logger.warning(f"Scraper for {county} is disabled")
            return None

        logger.info(f"Starting scraper for {config['name']}")

        try:
            # Get the appropriate scraper for this county
            scraper = get_scraper(county, config)

            # Mark as active
            self.active_runs[county] = ScraperRun(county=county)

            # Run the scraper
            run_result = await scraper.run_scraper()

            # Remove from active runs
            if county in self.active_runs:
                del self.active_runs[county]

            logger.info(
                f"Completed {config['name']} scraper: "
                f"{run_result.properties_saved} properties saved, "
                f"Status: {run_result.status}"
            )

            return run_result

        except Exception as e:
            logger.error(f"Error running scraper for {county}: {str(e)}")
            if county in self.active_runs:
                del self.active_runs[county]
            return None

    async def run_all_scrapers(self) -> List[ScraperRun]:
        """
        Run all enabled county scrapers concurrently

        Returns:
            List of ScraperRun results
        """
        logger.info("Running all enabled county scrapers...")

        enabled_counties = self.get_enabled_counties()

        if not enabled_counties:
            logger.warning("No enabled counties found")
            return []

        # Create tasks for all counties
        tasks = [
            self.run_county_scraper(county)
            for county in enabled_counties
        ]

        # Run all scrapers concurrently
        results = await asyncio.gather(*tasks, return_exceptions=True)

        # Filter out None results and exceptions
        successful_runs = [
            r for r in results
            if r is not None and not isinstance(r, Exception)
        ]

        logger.info(
            f"Completed all scrapers: {len(successful_runs)}/{len(enabled_counties)} "
            f"ran successfully"
        )

        return successful_runs

    async def run_specific_counties(self, counties: List[str]) -> List[ScraperRun]:
        """
        Run scrapers for specific counties

        Args:
            counties: List of county names to scrape

        Returns:
            List of ScraperRun results
        """
        logger.info(f"Running scrapers for: {', '.join(counties)}")

        tasks = [self.run_county_scraper(county) for county in counties]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        successful_runs = [
            r for r in results
            if r is not None and not isinstance(r, Exception)
        ]

        return successful_runs

    def schedule_scrapers(self):
        """
        Set up scheduled scraping jobs based on configuration
        Each county can have its own schedule
        """
        logger.info("Setting up scheduled scraping jobs...")

        for county, config in self.counties_config.items():
            if not config.get('enabled', False):
                continue

            frequency = config.get('update_frequency', 'daily')

            # Determine trigger based on frequency
            if frequency == 'hourly':
                trigger = IntervalTrigger(hours=1)
            elif frequency == 'daily':
                # Run daily at 2 AM local time
                trigger = CronTrigger(hour=2, minute=0)
            elif frequency == 'weekly':
                # Run weekly on Monday at 2 AM
                trigger = CronTrigger(day_of_week='mon', hour=2, minute=0)
            else:
                # Default to daily
                trigger = CronTrigger(hour=2, minute=0)

            # Add job to scheduler
            self.scheduler.add_job(
                self.run_county_scraper,
                trigger=trigger,
                args=[county],
                id=f"scraper_{county}",
                name=f"{config['name']} Scraper",
                replace_existing=True
            )

            logger.info(f"Scheduled {config['name']} scraper ({frequency})")

    def start_scheduler(self):
        """Start the autonomous scheduler"""
        self.schedule_scrapers()
        self.scheduler.start()
        logger.info("Scheduler started - agents will run autonomously")

    def stop_scheduler(self):
        """Stop the scheduler"""
        self.scheduler.shutdown()
        logger.info("Scheduler stopped")

    async def run_once_and_exit(self):
        """Run all scrapers once and exit (useful for manual runs)"""
        results = await self.run_all_scrapers()

        # Print summary
        print("\n" + "="*60)
        print("SCRAPING RUN SUMMARY")
        print("="*60)

        total_properties = sum(r.properties_saved for r in results)
        total_found = sum(r.properties_found for r in results)

        for run in results:
            status_symbol = "✓" if run.status == "completed" else "✗"
            print(f"{status_symbol} {run.county}: {run.properties_saved} saved / {run.properties_found} found")

        print("="*60)
        print(f"Total: {total_properties} properties saved ({total_found} found)")
        print("="*60 + "\n")

        return results

    async def run_daemon(self):
        """Run the orchestrator as a daemon with scheduled jobs"""
        logger.info("Starting Agent Orchestrator in daemon mode...")

        # Start the scheduler
        self.start_scheduler()

        # Keep the daemon running
        try:
            # Run an initial scrape
            await self.run_all_scrapers()

            # Then wait for scheduled jobs
            while True:
                await asyncio.sleep(3600)  # Check every hour

        except KeyboardInterrupt:
            logger.info("Shutting down Agent Orchestrator...")
            self.stop_scheduler()


async def main():
    """Main entry point for the orchestrator"""
    import argparse

    parser = argparse.ArgumentParser(
        description="Autonomous Data Scraping Agent Orchestrator for Texas Deeds"
    )
    parser.add_argument(
        '--mode',
        choices=['once', 'daemon', 'counties'],
        default='once',
        help='Run mode: once (single run), daemon (scheduled), or counties (specific counties)'
    )
    parser.add_argument(
        '--counties',
        nargs='+',
        help='Specific counties to scrape (for counties mode)'
    )

    args = parser.parse_args()

    orchestrator = AgentOrchestrator()

    if args.mode == 'once':
        await orchestrator.run_once_and_exit()

    elif args.mode == 'daemon':
        await orchestrator.run_daemon()

    elif args.mode == 'counties':
        if not args.counties:
            print("Error: --counties argument required for counties mode")
            return

        results = await orchestrator.run_specific_counties(args.counties)
        print(f"\nCompleted scraping {len(results)} counties")


if __name__ == "__main__":
    # Configure logging
    logger.add(
        "logs/orchestrator_{time}.log",
        rotation="1 day",
        retention="30 days",
        level="INFO"
    )

    asyncio.run(main())
