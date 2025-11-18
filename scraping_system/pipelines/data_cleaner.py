"""
Data cleaning pipeline
Cleans and standardizes scraped data
"""

import re
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime


class DataCleaner:
    """Cleans and standardizes scraped property data"""

    def __init__(self):
        self.logger = logging.getLogger("data_cleaner")

    def clean_property_data(self, property_data: Dict) -> Dict:
        """
        Clean property data

        Args:
            property_data: Raw property data

        Returns:
            Cleaned property data
        """
        cleaned = {}

        # Clean address fields
        cleaned['address'] = self.clean_address(property_data.get('address'))
        cleaned['city'] = self.clean_city(property_data.get('city'))
        cleaned['state'] = self.clean_state(property_data.get('state'))
        cleaned['zip_code'] = self.clean_zip_code(property_data.get('zip_code'))

        # Clean numeric fields
        cleaned['price'] = self.clean_price(property_data.get('price'))
        cleaned['bedrooms'] = self.clean_bedrooms(property_data.get('bedrooms'))
        cleaned['bathrooms'] = self.clean_bathrooms(property_data.get('bathrooms'))
        cleaned['square_feet'] = self.clean_square_feet(property_data.get('square_feet'))
        cleaned['lot_size'] = self.clean_lot_size(property_data.get('lot_size'))
        cleaned['year_built'] = self.clean_year_built(property_data.get('year_built'))

        # Clean categorical fields
        cleaned['property_type'] = self.clean_property_type(property_data.get('property_type'))

        # Copy other fields
        for key in ['property_id', 'latitude', 'longitude', 'data_source', 'raw_data']:
            if key in property_data:
                cleaned[key] = property_data[key]

        # Add cleaning metadata
        cleaned['cleaned_at'] = datetime.now().isoformat()

        return cleaned

    def clean_address(self, address: Optional[str]) -> Optional[str]:
        """Clean and standardize address"""
        if not address:
            return None

        # Remove extra whitespace
        address = ' '.join(address.split())

        # Standardize abbreviations
        address = re.sub(r'\bSt\.?\b', 'Street', address, flags=re.IGNORECASE)
        address = re.sub(r'\bAve\.?\b', 'Avenue', address, flags=re.IGNORECASE)
        address = re.sub(r'\bRd\.?\b', 'Road', address, flags=re.IGNORECASE)
        address = re.sub(r'\bDr\.?\b', 'Drive', address, flags=re.IGNORECASE)
        address = re.sub(r'\bLn\.?\b', 'Lane', address, flags=re.IGNORECASE)
        address = re.sub(r'\bBlvd\.?\b', 'Boulevard', address, flags=re.IGNORECASE)
        address = re.sub(r'\bPkwy\.?\b', 'Parkway', address, flags=re.IGNORECASE)

        # Capitalize properly
        address = address.title()

        return address.strip()

    def clean_city(self, city: Optional[str]) -> Optional[str]:
        """Clean city name"""
        if not city:
            return None

        city = ' '.join(city.split())
        city = city.title()

        return city.strip()

    def clean_state(self, state: Optional[str]) -> Optional[str]:
        """Clean and standardize state"""
        if not state:
            return None

        state = state.strip().upper()

        # Map full state names to abbreviations
        state_map = {
            'TEXAS': 'TX',
            'CALIFORNIA': 'CA',
            'FLORIDA': 'FL',
            'NEW YORK': 'NY',
            # Add more as needed
        }

        return state_map.get(state, state)

    def clean_zip_code(self, zip_code: Optional[str]) -> Optional[str]:
        """Clean ZIP code"""
        if not zip_code:
            return None

        # Extract 5-digit ZIP
        match = re.search(r'(\d{5})', str(zip_code))

        if match:
            return match.group(1)

        return None

    def clean_price(self, price: Any) -> Optional[float]:
        """Clean price value"""
        if price is None:
            return None

        # Remove currency symbols and commas
        if isinstance(price, str):
            price = re.sub(r'[^0-9.]', '', price)

        try:
            price_float = float(price)

            # Validate price range
            if 0 < price_float < 1_000_000_000:  # Reasonable range
                return price_float

        except (ValueError, TypeError):
            pass

        return None

    def clean_bedrooms(self, bedrooms: Any) -> Optional[int]:
        """Clean bedrooms count"""
        if bedrooms is None:
            return None

        try:
            beds = int(float(bedrooms))

            # Validate range
            if 0 <= beds <= 50:
                return beds

        except (ValueError, TypeError):
            pass

        return None

    def clean_bathrooms(self, bathrooms: Any) -> Optional[float]:
        """Clean bathrooms count"""
        if bathrooms is None:
            return None

        try:
            baths = float(bathrooms)

            # Validate range
            if 0 <= baths <= 50:
                return baths

        except (ValueError, TypeError):
            pass

        return None

    def clean_square_feet(self, square_feet: Any) -> Optional[int]:
        """Clean square footage"""
        if square_feet is None:
            return None

        # Remove commas
        if isinstance(square_feet, str):
            square_feet = square_feet.replace(',', '')

        try:
            sqft = int(float(square_feet))

            # Validate range
            if 0 < sqft < 100_000:
                return sqft

        except (ValueError, TypeError):
            pass

        return None

    def clean_lot_size(self, lot_size: Any) -> Optional[float]:
        """Clean lot size"""
        if lot_size is None:
            return None

        # Handle different units (sqft, acres)
        if isinstance(lot_size, str):
            lot_size = lot_size.replace(',', '')

            # Convert acres to sqft
            if 'acre' in lot_size.lower():
                match = re.search(r'([\d.]+)', lot_size)
                if match:
                    acres = float(match.group(1))
                    return acres * 43560  # Convert to sqft

            lot_size = re.sub(r'[^0-9.]', '', lot_size)

        try:
            lot_float = float(lot_size)

            if 0 < lot_float < 10_000_000:
                return lot_float

        except (ValueError, TypeError):
            pass

        return None

    def clean_year_built(self, year_built: Any) -> Optional[int]:
        """Clean year built"""
        if year_built is None:
            return None

        try:
            year = int(float(year_built))

            # Validate range
            current_year = datetime.now().year
            if 1800 <= year <= current_year:
                return year

        except (ValueError, TypeError):
            pass

        return None

    def clean_property_type(self, property_type: Optional[str]) -> Optional[str]:
        """Clean and standardize property type"""
        if not property_type:
            return None

        property_type = property_type.strip().lower()

        # Standardize property types
        type_map = {
            'single family': 'Single Family',
            'single-family': 'Single Family',
            'sfr': 'Single Family',
            'condo': 'Condo',
            'condominium': 'Condo',
            'townhouse': 'Townhouse',
            'townhome': 'Townhouse',
            'multi-family': 'Multi-Family',
            'multifamily': 'Multi-Family',
            'apartment': 'Multi-Family',
            'land': 'Land',
            'vacant land': 'Land',
            'commercial': 'Commercial',
            'mobile': 'Mobile/Manufactured',
            'manufactured': 'Mobile/Manufactured'
        }

        return type_map.get(property_type, property_type.title())

    def clean_bulk(self, properties: List[Dict]) -> List[Dict]:
        """
        Clean multiple properties

        Args:
            properties: List of property dictionaries

        Returns:
            List of cleaned properties
        """
        cleaned_properties = []

        for prop in properties:
            try:
                cleaned = self.clean_property_data(prop)
                cleaned_properties.append(cleaned)
            except Exception as e:
                self.logger.error(f"Error cleaning property: {str(e)}")
                continue

        self.logger.info(f"Cleaned {len(cleaned_properties)}/{len(properties)} properties")

        return cleaned_properties
