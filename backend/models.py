"""Database models for tax sale properties."""
from datetime import datetime
from typing import Optional
from sqlalchemy import String, Float, Integer, DateTime, Text, Boolean
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column
from pydantic import BaseModel, Field

class Base(DeclarativeBase):
    """Base class for SQLAlchemy models."""
    pass

class TaxSaleProperty(Base):
    """Tax sale property database model."""
    __tablename__ = "tax_sale_properties"

    id: Mapped[str] = mapped_column(String, primary_key=True)
    source: Mapped[str] = mapped_column(String, index=True)  # Source website

    # Property Information
    parcel_id: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    owner: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    address: Mapped[str] = mapped_column(String)
    city: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    state: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    zip_code: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    county: Mapped[Optional[str]] = mapped_column(String, nullable=True, index=True)

    # Financial Information
    starting_bid: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    minimum_bid: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    tax_amount: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    assessed_value: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Auction Information
    auction_date: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True, index=True)
    auction_time: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    auction_location: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String, default="Upcoming")

    # Property Details
    property_type: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    bedrooms: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    bathrooms: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    sqft: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    lot_size: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    year_built: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)

    # Coordinates
    latitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    longitude: Mapped[Optional[float]] = mapped_column(Float, nullable=True)

    # Additional Data
    description: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    image_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    listing_url: Mapped[Optional[str]] = mapped_column(String, nullable=True)

    # Metadata
    scraped_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

class PropertySchema(BaseModel):
    """Pydantic schema for API responses."""
    id: str
    source: str
    parcel_id: Optional[str] = None
    owner: Optional[str] = None
    address: str
    city: Optional[str] = None
    state: Optional[str] = None
    zip_code: Optional[str] = None
    county: Optional[str] = None
    starting_bid: Optional[float] = None
    minimum_bid: Optional[float] = None
    tax_amount: Optional[float] = None
    assessed_value: Optional[float] = None
    auction_date: Optional[datetime] = None
    auction_time: Optional[str] = None
    auction_location: Optional[str] = None
    status: str = "Upcoming"
    property_type: Optional[str] = None
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    sqft: Optional[int] = None
    lot_size: Optional[str] = None
    year_built: Optional[int] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    listing_url: Optional[str] = None
    scraped_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
