"""Database operations and management."""
from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import select, update, delete, and_, or_
from loguru import logger
from models import Base, TaxSaleProperty, PropertySchema
from config import settings

# Create async engine
engine = create_async_engine(
    settings.database_url,
    echo=False,
    future=True
)

# Create session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False
)

async def init_db():
    """Initialize database tables."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")

async def get_session() -> AsyncSession:
    """Get database session."""
    async with AsyncSessionLocal() as session:
        yield session

class PropertyDatabase:
    """Database operations for tax sale properties."""

    def __init__(self, session: AsyncSession):
        self.session = session

    async def upsert_property(self, property_data: Dict[str, Any]) -> TaxSaleProperty:
        """Insert or update a property."""
        try:
            # Check if property exists
            result = await self.session.execute(
                select(TaxSaleProperty).where(TaxSaleProperty.id == property_data['id'])
            )
            existing = result.scalar_one_or_none()

            if existing:
                # Update existing property
                for key, value in property_data.items():
                    if key != 'id':
                        setattr(existing, key, value)
                existing.updated_at = datetime.utcnow()
                property_obj = existing
                logger.debug(f"Updated property {property_data['id']}")
            else:
                # Create new property
                property_obj = TaxSaleProperty(**property_data)
                self.session.add(property_obj)
                logger.debug(f"Created property {property_data['id']}")

            await self.session.commit()
            await self.session.refresh(property_obj)
            return property_obj

        except Exception as e:
            await self.session.rollback()
            logger.error(f"Error upserting property: {e}")
            raise

    async def upsert_properties(self, properties: List[Dict[str, Any]]) -> int:
        """Bulk insert or update properties."""
        count = 0
        for prop_data in properties:
            try:
                await self.upsert_property(prop_data)
                count += 1
            except Exception as e:
                logger.error(f"Failed to upsert property: {e}")
                continue

        logger.info(f"Upserted {count} properties")
        return count

    async def get_property(self, property_id: str) -> Optional[TaxSaleProperty]:
        """Get property by ID."""
        result = await self.session.execute(
            select(TaxSaleProperty).where(TaxSaleProperty.id == property_id)
        )
        return result.scalar_one_or_none()

    async def get_properties(
        self,
        skip: int = 0,
        limit: int = 100,
        state: Optional[str] = None,
        county: Optional[str] = None,
        source: Optional[str] = None,
        min_bid: Optional[float] = None,
        max_bid: Optional[float] = None,
        status: Optional[str] = None,
        is_active: bool = True
    ) -> List[TaxSaleProperty]:
        """Get properties with filters."""
        query = select(TaxSaleProperty)

        # Apply filters
        filters = [TaxSaleProperty.is_active == is_active]

        if state:
            filters.append(TaxSaleProperty.state == state.upper())
        if county:
            filters.append(TaxSaleProperty.county.ilike(f"%{county}%"))
        if source:
            filters.append(TaxSaleProperty.source == source)
        if status:
            filters.append(TaxSaleProperty.status == status)
        if min_bid is not None:
            filters.append(TaxSaleProperty.starting_bid >= min_bid)
        if max_bid is not None:
            filters.append(TaxSaleProperty.starting_bid <= max_bid)

        query = query.where(and_(*filters))
        query = query.order_by(TaxSaleProperty.auction_date.asc())
        query = query.offset(skip).limit(limit)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_upcoming_auctions(
        self,
        days_ahead: int = 30,
        limit: int = 100
    ) -> List[TaxSaleProperty]:
        """Get upcoming auctions within specified days."""
        from datetime import timedelta

        cutoff_date = datetime.utcnow() + timedelta(days=days_ahead)

        query = select(TaxSaleProperty).where(
            and_(
                TaxSaleProperty.is_active == True,
                TaxSaleProperty.auction_date.isnot(None),
                TaxSaleProperty.auction_date <= cutoff_date,
                TaxSaleProperty.auction_date >= datetime.utcnow()
            )
        ).order_by(TaxSaleProperty.auction_date.asc()).limit(limit)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def search_properties(self, query: str, limit: int = 50) -> List[TaxSaleProperty]:
        """Search properties by address, owner, or parcel ID."""
        search_query = select(TaxSaleProperty).where(
            and_(
                TaxSaleProperty.is_active == True,
                or_(
                    TaxSaleProperty.address.ilike(f"%{query}%"),
                    TaxSaleProperty.owner.ilike(f"%{query}%"),
                    TaxSaleProperty.parcel_id.ilike(f"%{query}%")
                )
            )
        ).limit(limit)

        result = await self.session.execute(search_query)
        return result.scalars().all()

    async def get_sources(self) -> List[str]:
        """Get list of all data sources."""
        from sqlalchemy import distinct

        query = select(distinct(TaxSaleProperty.source)).where(
            TaxSaleProperty.is_active == True
        )
        result = await self.session.execute(query)
        return [row[0] for row in result.all()]

    async def get_stats(self) -> Dict[str, Any]:
        """Get database statistics."""
        from sqlalchemy import func

        # Total properties
        total_query = select(func.count()).select_from(TaxSaleProperty).where(
            TaxSaleProperty.is_active == True
        )
        total_result = await self.session.execute(total_query)
        total = total_result.scalar()

        # Properties by state
        state_query = select(
            TaxSaleProperty.state,
            func.count()
        ).where(
            TaxSaleProperty.is_active == True
        ).group_by(TaxSaleProperty.state)
        state_result = await self.session.execute(state_query)
        by_state = {row[0]: row[1] for row in state_result.all() if row[0]}

        # Properties by source
        source_query = select(
            TaxSaleProperty.source,
            func.count()
        ).where(
            TaxSaleProperty.is_active == True
        ).group_by(TaxSaleProperty.source)
        source_result = await self.session.execute(source_query)
        by_source = {row[0]: row[1] for row in source_result.all()}

        return {
            'total_properties': total,
            'by_state': by_state,
            'by_source': by_source
        }

    async def deactivate_old_properties(self, days: int = 90):
        """Deactivate properties older than specified days."""
        from datetime import timedelta

        cutoff_date = datetime.utcnow() - timedelta(days=days)

        query = update(TaxSaleProperty).where(
            TaxSaleProperty.scraped_at < cutoff_date
        ).values(is_active=False)

        result = await self.session.execute(query)
        await self.session.commit()

        logger.info(f"Deactivated {result.rowcount} old properties")
        return result.rowcount
