"""Scheduled tasks for automated scraping."""
import asyncio
from datetime import datetime
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
from loguru import logger

from config import settings
from scraper_orchestrator import ScraperOrchestrator
from database import AsyncSessionLocal, PropertyDatabase

# Create scheduler
scheduler = AsyncIOScheduler()

async def scheduled_scrape_all():
    """Scheduled task to scrape all sources."""
    logger.info("Starting scheduled scraping job")
    start_time = datetime.now()

    try:
        orchestrator = ScraperOrchestrator()
        results = await orchestrator.scrape_all_sources(include_ai=False)

        duration = (datetime.now() - start_time).total_seconds()
        total_properties = sum(results.values())

        logger.info(
            f"Scheduled scraping completed in {duration:.2f}s. "
            f"Total properties: {total_properties}. Results: {results}"
        )

        return {
            "status": "success",
            "duration_seconds": duration,
            "total_properties": total_properties,
            "results": results
        }

    except Exception as e:
        logger.error(f"Scheduled scraping failed: {e}")
        return {"status": "error", "error": str(e)}

async def scheduled_cleanup():
    """Scheduled task to clean up old properties."""
    logger.info("Starting scheduled cleanup job")

    try:
        async with AsyncSessionLocal() as session:
            db = PropertyDatabase(session)
            count = await db.deactivate_old_properties(days=90)

        logger.info(f"Cleanup completed. Deactivated {count} properties")
        return {"status": "success", "properties_deactivated": count}

    except Exception as e:
        logger.error(f"Scheduled cleanup failed: {e}")
        return {"status": "error", "error": str(e)}

def init_scheduler():
    """Initialize and configure the scheduler."""
    logger.info("Initializing task scheduler")

    # Schedule main scraping job
    scheduler.add_job(
        scheduled_scrape_all,
        trigger=CronTrigger.from_crontab(settings.scrape_schedule_cron),
        id='scrape_all',
        name='Scrape all tax sale sources',
        replace_existing=True,
        misfire_grace_time=3600  # 1 hour grace time
    )

    # Schedule cleanup job (weekly)
    scheduler.add_job(
        scheduled_cleanup,
        trigger=CronTrigger(day_of_week='sun', hour=3, minute=0),
        id='cleanup',
        name='Clean up old properties',
        replace_existing=True
    )

    logger.info(f"Scheduled jobs: {[job.id for job in scheduler.get_jobs()]}")

def start_scheduler():
    """Start the scheduler."""
    scheduler.start()
    logger.info("Scheduler started")

def stop_scheduler():
    """Stop the scheduler."""
    scheduler.shutdown()
    logger.info("Scheduler stopped")

# Standalone scheduler runner
async def run_scheduler():
    """Run scheduler as standalone service."""
    init_scheduler()
    start_scheduler()

    logger.info("Scheduler is running. Press Ctrl+C to exit.")

    try:
        # Keep the script running
        while True:
            await asyncio.sleep(60)
    except (KeyboardInterrupt, SystemExit):
        logger.info("Shutting down scheduler...")
        stop_scheduler()

if __name__ == "__main__":
    asyncio.run(run_scheduler())
