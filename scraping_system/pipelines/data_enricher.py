"""
Data enrichment pipeline
Enriches property data with additional information
"""

import logging
import requests
from typing import Dict, List, Optional
from datetime import datetime


class DataEnricher:
    """Enriches property data with additional information"""

    def __init__(self, api_keys: Optional[Dict[str, str]] = None):
        """
        Initialize data enricher

        Args:
            api_keys: Dictionary of API keys for various services
        """
        self.logger = logging.getLogger("data_enricher")
        self.api_keys = api_keys or {}

    def enrich_property(self, property_data: Dict) -> Dict:
        """
        Enrich property data with additional information

        Args:
            property_data: Property data dictionary

        Returns:
            Enriched property data
        """
        enriched = property_data.copy()

        # Add geocoding if coordinates missing
        if not enriched.get('latitude') or not enriched.get('longitude'):
            coords = self.geocode_address(property_data)
            if coords:
                enriched['latitude'] = coords['latitude']
                enriched['longitude'] = coords['longitude']

        # Add demographic data
        if enriched.get('zip_code'):
            demographics = self.get_demographics(enriched['zip_code'])
            if demographics:
                enriched['demographics'] = demographics

        # Add school information
        if enriched.get('latitude') and enriched.get('longitude'):
            schools = self.get_nearby_schools(
                enriched['latitude'],
                enriched['longitude']
            )
            if schools:
                enriched['nearby_schools'] = schools

        # Add crime data
        crime_data = self.get_crime_data(property_data)
        if crime_data:
            enriched['crime_score'] = crime_data

        # Add walkability score
        walk_score = self.get_walkability_score(property_data)
        if walk_score:
            enriched['walk_score'] = walk_score

        # Add flood risk
        flood_risk = self.get_flood_risk(property_data)
        if flood_risk:
            enriched['flood_risk'] = flood_risk

        # Add market comparables
        comps = self.get_comparables(property_data)
        if comps:
            enriched['comparables'] = comps

        enriched['enriched_at'] = datetime.now().isoformat()

        return enriched

    def geocode_address(self, property_data: Dict) -> Optional[Dict]:
        """
        Geocode an address to get coordinates

        Args:
            property_data: Property data

        Returns:
            Coordinates dictionary or None
        """
        address = property_data.get('full_address') or self._build_address(property_data)

        if not address:
            return None

        # Use OpenStreetMap Nominatim (free, no API key required)
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': address,
                'format': 'json',
                'limit': 1
            }

            headers = {
                'User-Agent': 'PropertyScrapingSystem/1.0'
            }

            response = requests.get(url, params=params, headers=headers, timeout=10)

            if response.status_code == 200:
                data = response.json()

                if data and len(data) > 0:
                    return {
                        'latitude': float(data[0]['lat']),
                        'longitude': float(data[0]['lon'])
                    }

        except Exception as e:
            self.logger.error(f"Geocoding error: {str(e)}")

        return None

    def _build_address(self, property_data: Dict) -> str:
        """Build address string from components"""
        parts = []

        for field in ['address', 'city', 'state', 'zip_code']:
            if property_data.get(field):
                parts.append(str(property_data[field]))

        return ', '.join(parts)

    def get_demographics(self, zip_code: str) -> Optional[Dict]:
        """
        Get demographic data for a ZIP code

        Args:
            zip_code: ZIP code

        Returns:
            Demographics dictionary
        """
        # This would typically use Census API or similar
        # Example structure:

        demographics = {
            'population': None,
            'median_income': None,
            'median_age': None,
            'education_level': None,
            'employment_rate': None
        }

        # Placeholder - implement with actual API
        # if 'census_api_key' in self.api_keys:
        #     # Call Census API

        return None

    def get_nearby_schools(self, latitude: float, longitude: float) -> Optional[List[Dict]]:
        """
        Get nearby schools

        Args:
            latitude: Latitude
            longitude: Longitude

        Returns:
            List of nearby schools
        """
        # This would use GreatSchools API or similar
        schools = []

        # Placeholder - implement with actual API

        return None

    def get_crime_data(self, property_data: Dict) -> Optional[Dict]:
        """
        Get crime statistics for the area

        Args:
            property_data: Property data

        Returns:
            Crime score dictionary
        """
        # This would use crime data APIs
        crime_data = {
            'crime_score': None,  # 1-100, higher = safer
            'violent_crime_rate': None,
            'property_crime_rate': None
        }

        # Placeholder - implement with actual API

        return None

    def get_walkability_score(self, property_data: Dict) -> Optional[int]:
        """
        Get walkability score

        Args:
            property_data: Property data

        Returns:
            Walk score (0-100)
        """
        # This would use Walk Score API
        # Requires API key

        return None

    def get_flood_risk(self, property_data: Dict) -> Optional[Dict]:
        """
        Get flood risk information

        Args:
            property_data: Property data

        Returns:
            Flood risk dictionary
        """
        flood_risk = {
            'flood_zone': None,  # e.g., 'X', 'A', 'AE'
            'risk_level': None,  # 'Minimal', 'Moderate', 'High'
            'in_100_year_flood_plain': None
        }

        # This would use FEMA API or similar

        return None

    def get_comparables(self, property_data: Dict, radius: float = 0.5) -> Optional[List[Dict]]:
        """
        Get comparable properties

        Args:
            property_data: Property data
            radius: Search radius in miles

        Returns:
            List of comparable properties
        """
        # This would query the database for similar properties
        # in the same area

        comparables = []

        # Placeholder - implement database query

        return None

    def enrich_bulk(self, properties: List[Dict], batch_size: int = 10) -> List[Dict]:
        """
        Enrich multiple properties

        Args:
            properties: List of property dictionaries
            batch_size: Number of properties to enrich in each batch

        Returns:
            List of enriched properties
        """
        enriched_properties = []

        for i in range(0, len(properties), batch_size):
            batch = properties[i:i + batch_size]

            for prop in batch:
                try:
                    enriched = self.enrich_property(prop)
                    enriched_properties.append(enriched)
                except Exception as e:
                    self.logger.error(f"Error enriching property: {str(e)}")
                    enriched_properties.append(prop)  # Add original if enrichment fails

            self.logger.info(
                f"Enriched batch {i // batch_size + 1} "
                f"({min(i + batch_size, len(properties))}/{len(properties)})"
            )

        return enriched_properties

    def calculate_investment_score(self, property_data: Dict) -> Optional[float]:
        """
        Calculate an investment score for a property

        Args:
            property_data: Enriched property data

        Returns:
            Investment score (0-100)
        """
        score = 0.0
        factors = 0

        # Price per sqft (lower is better for investment)
        price_per_sqft = property_data.get('price_per_sqft')
        if price_per_sqft:
            # Assuming average is $150/sqft
            if price_per_sqft < 100:
                score += 20
            elif price_per_sqft < 150:
                score += 15
            elif price_per_sqft < 200:
                score += 10
            factors += 1

        # Crime score (higher is better)
        crime_score = property_data.get('crime_score', {}).get('crime_score')
        if crime_score:
            score += (crime_score / 100) * 20
            factors += 1

        # Walk score (higher is better)
        walk_score = property_data.get('walk_score')
        if walk_score:
            score += (walk_score / 100) * 15
            factors += 1

        # School quality (if available)
        schools = property_data.get('nearby_schools', [])
        if schools:
            avg_school_rating = sum(s.get('rating', 0) for s in schools) / len(schools)
            score += (avg_school_rating / 10) * 15
            factors += 1

        # Property age (newer is often better)
        property_age = property_data.get('property_age')
        if property_age is not None:
            if property_age < 10:
                score += 15
            elif property_age < 20:
                score += 10
            elif property_age < 30:
                score += 5
            factors += 1

        # Tax delinquency (opportunity indicator)
        if property_data.get('is_tax_delinquent'):
            score += 15  # Potential opportunity
            factors += 1

        if factors > 0:
            return round(score / factors * (100 / 100), 2)

        return None
