"""
Data models for scraped property and deed information
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field, validator
from enum import Enum


class PropertyType(str, Enum):
    SINGLE_FAMILY = "Single Family"
    MULTI_FAMILY = "Multi Family"
    CONDO = "Condo"
    TOWNHOUSE = "Townhouse"
    LAND = "Land"
    COMMERCIAL = "Commercial"
    INDUSTRIAL = "Industrial"
    UNKNOWN = "Unknown"


class DeedType(str, Enum):
    TAX_DEED = "Tax Deed"
    TAX_LIEN = "Tax Lien"
    FORECLOSURE = "Foreclosure"
    SHERIFF_SALE = "Sheriff Sale"
    REDEEMABLE_DEED = "Redeemable Deed"
    CONSTABLE_SALE = "Constable Sale"


class PropertyStatus(str, Enum):
    UPCOMING = "Upcoming"
    ACTIVE = "Active"
    SOLD = "Sold"
    CANCELLED = "Cancelled"
    REDEEMED = "Redeemed"


class ScrapedProperty(BaseModel):
    """Model for scraped property data"""

    # Identifiers
    external_id: Optional[str] = None
    account_number: Optional[str] = None
    parcel_id: Optional[str] = None

    # Location
    address: str
    city: Optional[str] = None
    county: str
    state: str = "TX"
    zip_code: Optional[str] = None

    # Property Details
    property_type: PropertyType = PropertyType.UNKNOWN
    bedrooms: Optional[int] = None
    bathrooms: Optional[float] = None
    sqft: Optional[int] = None
    lot_size: Optional[str] = None
    year_built: Optional[int] = None

    # Financial Information
    appraised_value: Optional[float] = None
    assessed_value: Optional[float] = None
    minimum_bid: Optional[float] = None
    opening_bid: Optional[float] = None
    taxes_owed: Optional[float] = None
    total_debt: Optional[float] = None

    # Sale Information
    deed_type: DeedType
    status: PropertyStatus = PropertyStatus.UPCOMING
    sale_date: Optional[datetime] = None
    auction_date: Optional[datetime] = None
    sale_location: Optional[str] = None
    case_number: Optional[str] = None

    # Additional Data
    owner_name: Optional[str] = None
    legal_description: Optional[str] = None
    redemption_period: Optional[int] = None  # days
    notes: Optional[str] = None

    # Metadata
    source_url: Optional[str] = None
    scraped_at: datetime = Field(default_factory=datetime.now)
    last_updated: Optional[datetime] = None

    # Calculated Fields
    estimated_roi: Optional[float] = None
    opportunity_score: Optional[int] = None

    # Geographic Data
    latitude: Optional[float] = None
    longitude: Optional[float] = None

    @validator('opportunity_score')
    def validate_score(cls, v):
        if v is not None and (v < 0 or v > 100):
            raise ValueError('Opportunity score must be between 0 and 100')
        return v

    def calculate_roi(self) -> Optional[float]:
        """Calculate estimated ROI"""
        if self.appraised_value and self.minimum_bid and self.minimum_bid > 0:
            roi = ((self.appraised_value - self.minimum_bid) / self.minimum_bid) * 100
            self.estimated_roi = round(roi, 2)
            return self.estimated_roi
        return None

    def calculate_opportunity_score(self) -> int:
        """
        Calculate opportunity score based on multiple factors
        Score: 0-100 (higher is better)
        """
        score = 0

        # ROI component (40 points max)
        if self.estimated_roi:
            if self.estimated_roi >= 100:
                score += 40
            elif self.estimated_roi >= 50:
                score += 30
            elif self.estimated_roi >= 25:
                score += 20
            else:
                score += 10

        # Value component (20 points max)
        if self.appraised_value:
            if 50000 <= self.appraised_value <= 300000:  # Sweet spot
                score += 20
            elif 300000 < self.appraised_value <= 500000:
                score += 15
            else:
                score += 10

        # Property type component (15 points max)
        if self.property_type in [PropertyType.SINGLE_FAMILY, PropertyType.MULTI_FAMILY]:
            score += 15
        elif self.property_type in [PropertyType.CONDO, PropertyType.TOWNHOUSE]:
            score += 10
        else:
            score += 5

        # Data completeness (15 points max)
        complete_fields = sum([
            bool(self.bedrooms),
            bool(self.bathrooms),
            bool(self.sqft),
            bool(self.year_built),
            bool(self.appraised_value)
        ])
        score += complete_fields * 3

        # Recent listing (10 points max)
        if self.sale_date:
            days_until_sale = (self.sale_date - datetime.now()).days
            if 30 <= days_until_sale <= 90:
                score += 10
            elif 7 <= days_until_sale < 30:
                score += 7
            else:
                score += 3

        self.opportunity_score = min(score, 100)
        return self.opportunity_score

    def to_supabase_dict(self) -> dict:
        """Convert to dictionary for Supabase insertion"""
        return {
            "external_id": self.external_id,
            "address": self.address,
            "city": self.city,
            "county": self.county,
            "state": self.state,
            "zip_code": self.zip_code,
            "property_type": self.property_type.value,
            "bedrooms": self.bedrooms,
            "bathrooms": self.bathrooms,
            "sqft": self.sqft,
            "lot_size": self.lot_size,
            "year_built": self.year_built,
            "price": self.minimum_bid or self.opening_bid,
            "estimated_value": self.appraised_value or self.assessed_value,
            "auction_date": self.sale_date.isoformat() if self.sale_date else None,
            "status": self.status.value,
            "listing_type": self.deed_type.value.lower().replace(" ", "_"),
            "opportunity_score": self.opportunity_score,
            "roi": self.estimated_roi,
            "latitude": self.latitude,
            "longitude": self.longitude,
            "source_url": self.source_url,
            "scraped_at": self.scraped_at.isoformat()
        }


class ScraperRun(BaseModel):
    """Model for tracking scraper execution"""
    county: str
    started_at: datetime = Field(default_factory=datetime.now)
    completed_at: Optional[datetime] = None
    status: str = "running"  # running, completed, failed
    properties_found: int = 0
    properties_saved: int = 0
    errors: List[str] = []

    def mark_complete(self, success: bool = True):
        self.completed_at = datetime.now()
        self.status = "completed" if success else "failed"
