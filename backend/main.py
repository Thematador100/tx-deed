"""FastAPI application for tax sale scraping service."""
from typing import List, Optional, Dict, Any
from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, HTTPException, BackgroundTasks, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from loguru import logger
import sys

from config import settings
from models import PropertySchema
from database import init_db, get_session, PropertyDatabase
from scraper_orchestrator import ScraperOrchestrator, scrape_custom_url
from scrapers import COUNTY_CONFIGS

# Configure logging
logger.remove()
logger.add(
    sys.stdout,
    format="<green>{time:YYYY-MM-DD HH:mm:ss}</green> | <level>{level: <8}</level> | <cyan>{name}</cyan>:<cyan>{function}</cyan> - <level>{message}</level>",
    level=settings.log_level
)
logger.add("logs/app.log", rotation="500 MB", retention="10 days", level=settings.log_level)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    logger.info("Starting Tax Sale Scraping Service")
    await init_db()
    logger.info("Database initialized")

    yield

    # Shutdown
    logger.info("Shutting down Tax Sale Scraping Service")

# Create FastAPI app
app = FastAPI(
    title="Tax Sale Scraping API",
    description="Advanced web scraping service for tax sale properties",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/")
async def root():
    """Root endpoint with API information."""
    return {
        "name": "Tax Sale Scraping API",
        "version": "1.0.0",
        "status": "operational",
        "endpoints": {
            "properties": "/api/properties",
            "scrape": "/api/scrape",
            "sources": "/api/sources",
            "stats": "/api/stats"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy"}

# ============================================================================
# Property Endpoints
# ============================================================================

@app.get("/api/properties", response_model=List[PropertySchema])
async def get_properties(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=500),
    state: Optional[str] = None,
    county: Optional[str] = None,
    source: Optional[str] = None,
    min_bid: Optional[float] = None,
    max_bid: Optional[float] = None,
    status: Optional[str] = None,
    session: AsyncSession = Depends(get_session)
):
    """
    Get tax sale properties with filters.

    - **skip**: Number of records to skip (pagination)
    - **limit**: Maximum number of records to return
    - **state**: Filter by state code (e.g., "TX", "GA")
    - **county**: Filter by county name
    - **source**: Filter by data source
    - **min_bid**: Minimum starting bid
    - **max_bid**: Maximum starting bid
    - **status**: Filter by status (e.g., "Upcoming")
    """
    db = PropertyDatabase(session)
    properties = await db.get_properties(
        skip=skip,
        limit=limit,
        state=state,
        county=county,
        source=source,
        min_bid=min_bid,
        max_bid=max_bid,
        status=status
    )
    return properties

@app.get("/api/properties/{property_id}", response_model=PropertySchema)
async def get_property(
    property_id: str,
    session: AsyncSession = Depends(get_session)
):
    """Get a specific property by ID."""
    db = PropertyDatabase(session)
    property_obj = await db.get_property(property_id)

    if not property_obj:
        raise HTTPException(status_code=404, detail="Property not found")

    return property_obj

@app.get("/api/properties/upcoming/auctions", response_model=List[PropertySchema])
async def get_upcoming_auctions(
    days_ahead: int = Query(30, ge=1, le=365),
    limit: int = Query(100, ge=1, le=500),
    session: AsyncSession = Depends(get_session)
):
    """Get upcoming auctions within specified number of days."""
    db = PropertyDatabase(session)
    properties = await db.get_upcoming_auctions(days_ahead=days_ahead, limit=limit)
    return properties

@app.get("/api/properties/search", response_model=List[PropertySchema])
async def search_properties(
    q: str = Query(..., min_length=2),
    limit: int = Query(50, ge=1, le=200),
    session: AsyncSession = Depends(get_session)
):
    """Search properties by address, owner, or parcel ID."""
    db = PropertyDatabase(session)
    properties = await db.search_properties(query=q, limit=limit)
    return properties

# ============================================================================
# Scraping Endpoints
# ============================================================================

@app.post("/api/scrape/all")
async def scrape_all_sources(
    background_tasks: BackgroundTasks,
    include_ai: bool = False
):
    """
    Trigger scraping of all configured sources.

    This runs in the background and returns immediately.
    """
    async def run_scraping():
        orchestrator = ScraperOrchestrator()
        results = await orchestrator.scrape_all_sources(include_ai=include_ai)
        logger.info(f"Background scraping completed: {results}")

    background_tasks.add_task(run_scraping)

    return {
        "status": "started",
        "message": "Scraping job started in background"
    }

@app.post("/api/scrape/source")
async def scrape_source(
    source_type: str = Query(..., description="Source type: tax_sale_resources, county, ai"),
    county_key: Optional[str] = None,
    state: Optional[str] = None,
    county: Optional[str] = None,
    url: Optional[str] = None,
    source_name: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Scrape a specific source.

    - **source_type**: Type of scraper (tax_sale_resources, county, ai)
    - **county_key**: County key for county scraper (e.g., "harris-tx")
    - **state**: State filter for tax_sale_resources
    - **county**: County filter for tax_sale_resources
    - **url**: URL for AI scraper
    - **source_name**: Optional source name for AI scraper
    """
    orchestrator = ScraperOrchestrator()

    kwargs = {}
    if county_key:
        kwargs['county_key'] = county_key
    if state:
        kwargs['state'] = state
    if county:
        kwargs['county'] = county
    if url:
        kwargs['url'] = url
    if source_name:
        kwargs['source_name'] = source_name

    try:
        properties = await orchestrator.scrape_source(source_type, **kwargs)
        return {
            "status": "success",
            "properties_scraped": len(properties),
            "source_type": source_type
        }
    except Exception as e:
        logger.error(f"Scraping failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/scrape/custom-url")
async def scrape_custom(
    url: str = Query(..., description="URL to scrape"),
    source_name: Optional[str] = None,
    background_tasks: BackgroundTasks = None
):
    """
    Scrape a custom URL using AI-powered extraction.

    Requires ANTHROPIC_API_KEY or OPENAI_API_KEY to be configured.
    """
    try:
        properties = await scrape_custom_url(url, source_name)
        return {
            "status": "success",
            "properties_scraped": len(properties),
            "url": url
        }
    except Exception as e:
        logger.error(f"Custom URL scraping failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Information Endpoints
# ============================================================================

@app.get("/api/sources")
async def get_sources(session: AsyncSession = Depends(get_session)):
    """Get list of all data sources and available scrapers."""
    db = PropertyDatabase(session)
    active_sources = await db.get_sources()

    return {
        "active_sources": active_sources,
        "available_scrapers": {
            "tax_sale_resources": {
                "name": "TaxSaleResources.com",
                "type": "Aggregator",
                "states": ["All"]
            },
            "counties": {
                "name": "County Tax Sales",
                "type": "County-specific",
                "available": list(COUNTY_CONFIGS.keys()),
                "configs": COUNTY_CONFIGS
            },
            "ai_scraper": {
                "name": "AI-Powered Scraper",
                "type": "Universal",
                "description": "Can scrape any tax sale website"
            }
        }
    }

@app.get("/api/stats")
async def get_stats(session: AsyncSession = Depends(get_session)):
    """Get database statistics."""
    db = PropertyDatabase(session)
    stats = await db.get_stats()
    return stats

@app.get("/api/counties")
async def get_available_counties():
    """Get list of pre-configured county scrapers."""
    return {
        "counties": COUNTY_CONFIGS,
        "total": len(COUNTY_CONFIGS)
    }

# ============================================================================
# Admin Endpoints
# ============================================================================

@app.post("/api/admin/cleanup")
async def cleanup_old_properties(
    days: int = Query(90, ge=30, le=365),
    session: AsyncSession = Depends(get_session)
):
    """Deactivate properties older than specified days."""
    db = PropertyDatabase(session)
    count = await db.deactivate_old_properties(days=days)
    return {
        "status": "success",
        "properties_deactivated": count
    }

# ============================================================================
# Run Application
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.api_host,
        port=settings.api_port,
        reload=True
    )
