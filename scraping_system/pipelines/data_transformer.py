"""
Data transformation pipeline
Transforms and normalizes data for analysis
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime
import hashlib


class DataTransformer:
    """Transforms property data for storage and analysis"""

    def __init__(self):
        self.logger = logging.getLogger("data_transformer")

    def transform_property(self, property_data: Dict) -> Dict:
        """
        Transform property data

        Args:
            property_data: Cleaned property data

        Returns:
            Transformed property data
        """
        transformed = property_data.copy()

        # Generate unique property ID if not present
        if not transformed.get('property_id'):
            transformed['property_id'] = self.generate_property_id(property_data)

        # Add calculated fields
        transformed['price_per_sqft'] = self.calculate_price_per_sqft(property_data)
        transformed['property_age'] = self.calculate_property_age(property_data)
        transformed['full_address'] = self.format_full_address(property_data)

        # Normalize categorical fields
        transformed['property_category'] = self.categorize_property(property_data)
        transformed['price_range'] = self.categorize_price(property_data.get('price'))
        transformed['size_category'] = self.categorize_size(property_data.get('square_feet'))

        # Add metadata
        transformed['transformed_at'] = datetime.now().isoformat()

        return transformed

    def generate_property_id(self, property_data: Dict) -> str:
        """
        Generate a unique property ID based on address

        Args:
            property_data: Property data

        Returns:
            Unique property ID
        """
        # Create ID from address components
        address = property_data.get('address', '')
        city = property_data.get('city', '')
        state = property_data.get('state', '')
        zip_code = property_data.get('zip_code', '')

        id_string = f"{address}|{city}|{state}|{zip_code}".lower()

        # Generate hash
        property_id = hashlib.md5(id_string.encode()).hexdigest()[:16]

        return f"prop_{property_id}"

    def calculate_price_per_sqft(self, property_data: Dict) -> Optional[float]:
        """Calculate price per square foot"""
        price = property_data.get('price')
        square_feet = property_data.get('square_feet')

        if price and square_feet and square_feet > 0:
            return round(price / square_feet, 2)

        return None

    def calculate_property_age(self, property_data: Dict) -> Optional[int]:
        """Calculate property age"""
        year_built = property_data.get('year_built')

        if year_built:
            current_year = datetime.now().year
            return current_year - year_built

        return None

    def format_full_address(self, property_data: Dict) -> str:
        """Format full address string"""
        parts = []

        if property_data.get('address'):
            parts.append(property_data['address'])
        if property_data.get('city'):
            parts.append(property_data['city'])
        if property_data.get('state'):
            parts.append(property_data['state'])
        if property_data.get('zip_code'):
            parts.append(property_data['zip_code'])

        return ', '.join(parts)

    def categorize_property(self, property_data: Dict) -> str:
        """Categorize property type into broad categories"""
        property_type = property_data.get('property_type', '').lower()

        if 'single' in property_type or 'sfr' in property_type:
            return 'Residential - Single Family'
        elif 'condo' in property_type:
            return 'Residential - Condo'
        elif 'town' in property_type:
            return 'Residential - Townhouse'
        elif 'multi' in property_type or 'apartment' in property_type:
            return 'Residential - Multi-Family'
        elif 'land' in property_type or 'vacant' in property_type:
            return 'Land'
        elif 'commercial' in property_type:
            return 'Commercial'
        else:
            return 'Other'

    def categorize_price(self, price: Optional[float]) -> Optional[str]:
        """Categorize price into ranges"""
        if not price:
            return None

        if price < 100_000:
            return 'Under $100K'
        elif price < 200_000:
            return '$100K-$200K'
        elif price < 300_000:
            return '$200K-$300K'
        elif price < 500_000:
            return '$300K-$500K'
        elif price < 750_000:
            return '$500K-$750K'
        elif price < 1_000_000:
            return '$750K-$1M'
        else:
            return 'Over $1M'

    def categorize_size(self, square_feet: Optional[int]) -> Optional[str]:
        """Categorize property size"""
        if not square_feet:
            return None

        if square_feet < 1000:
            return 'Small (< 1,000 sqft)'
        elif square_feet < 1500:
            return 'Medium (1,000-1,500 sqft)'
        elif square_feet < 2500:
            return 'Large (1,500-2,500 sqft)'
        elif square_feet < 4000:
            return 'Very Large (2,500-4,000 sqft)'
        else:
            return 'Extra Large (4,000+ sqft)'

    def aggregate_by_city(self, properties: List[Dict]) -> Dict[str, Dict]:
        """
        Aggregate properties by city

        Args:
            properties: List of property dictionaries

        Returns:
            Dictionary of city-level aggregations
        """
        city_data = {}

        for prop in properties:
            city = prop.get('city')

            if not city:
                continue

            if city not in city_data:
                city_data[city] = {
                    'count': 0,
                    'total_value': 0,
                    'properties': [],
                    'avg_price': 0,
                    'avg_sqft': 0,
                    'avg_price_per_sqft': 0
                }

            city_data[city]['count'] += 1
            city_data[city]['properties'].append(prop)

            if prop.get('price'):
                city_data[city]['total_value'] += prop['price']

        # Calculate averages
        for city, data in city_data.items():
            if data['count'] > 0:
                prices = [p['price'] for p in data['properties'] if p.get('price')]
                sqfts = [p['square_feet'] for p in data['properties'] if p.get('square_feet')]
                price_per_sqfts = [p.get('price_per_sqft') for p in data['properties'] if p.get('price_per_sqft')]

                data['avg_price'] = sum(prices) / len(prices) if prices else 0
                data['avg_sqft'] = sum(sqfts) / len(sqfts) if sqfts else 0
                data['avg_price_per_sqft'] = sum(price_per_sqfts) / len(price_per_sqfts) if price_per_sqfts else 0

            # Remove raw properties list to save memory
            del data['properties']

        return city_data

    def transform_bulk(self, properties: List[Dict]) -> List[Dict]:
        """
        Transform multiple properties

        Args:
            properties: List of property dictionaries

        Returns:
            List of transformed properties
        """
        transformed_properties = []

        for prop in properties:
            try:
                transformed = self.transform_property(prop)
                transformed_properties.append(transformed)
            except Exception as e:
                self.logger.error(f"Error transforming property: {str(e)}")
                continue

        self.logger.info(f"Transformed {len(transformed_properties)} properties")

        return transformed_properties
