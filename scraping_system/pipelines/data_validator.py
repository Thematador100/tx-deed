"""
Data validation pipeline
Validates data quality and completeness
"""

import logging
from typing import Dict, List, Optional, Tuple
from datetime import datetime


class DataValidator:
    """Validates property data quality"""

    # Required fields for a valid property record
    REQUIRED_FIELDS = ['address', 'city', 'state']

    # Optional but important fields
    IMPORTANT_FIELDS = ['zip_code', 'property_type', 'bedrooms', 'bathrooms', 'square_feet']

    def __init__(self, strict: bool = False):
        """
        Initialize validator

        Args:
            strict: If True, require all important fields
        """
        self.strict = strict
        self.logger = logging.getLogger("data_validator")

    def validate_property(self, property_data: Dict) -> Tuple[bool, List[str]]:
        """
        Validate a property record

        Args:
            property_data: Property data dictionary

        Returns:
            Tuple of (is_valid, list_of_errors)
        """
        errors = []

        # Check required fields
        for field in self.REQUIRED_FIELDS:
            if not property_data.get(field):
                errors.append(f"Missing required field: {field}")

        # Check important fields in strict mode
        if self.strict:
            for field in self.IMPORTANT_FIELDS:
                if not property_data.get(field):
                    errors.append(f"Missing important field: {field}")

        # Validate data types and ranges
        type_errors = self._validate_types(property_data)
        errors.extend(type_errors)

        # Validate business rules
        rule_errors = self._validate_business_rules(property_data)
        errors.extend(rule_errors)

        is_valid = len(errors) == 0

        if not is_valid:
            self.logger.warning(f"Validation failed: {errors}")

        return is_valid, errors

    def _validate_types(self, property_data: Dict) -> List[str]:
        """Validate data types"""
        errors = []

        # Numeric fields
        numeric_fields = {
            'price': (float, int),
            'bedrooms': int,
            'bathrooms': (float, int),
            'square_feet': int,
            'lot_size': (float, int),
            'year_built': int
        }

        for field, expected_type in numeric_fields.items():
            value = property_data.get(field)

            if value is not None:
                if not isinstance(value, expected_type):
                    errors.append(f"Invalid type for {field}: expected {expected_type}, got {type(value)}")

        # String fields
        string_fields = ['address', 'city', 'state', 'zip_code', 'property_type']

        for field in string_fields:
            value = property_data.get(field)

            if value is not None and not isinstance(value, str):
                errors.append(f"Invalid type for {field}: expected str, got {type(value)}")

        # Coordinate fields
        if 'latitude' in property_data and property_data['latitude'] is not None:
            lat = property_data['latitude']
            if not isinstance(lat, (float, int)) or not (-90 <= lat <= 90):
                errors.append(f"Invalid latitude: {lat}")

        if 'longitude' in property_data and property_data['longitude'] is not None:
            lon = property_data['longitude']
            if not isinstance(lon, (float, int)) or not (-180 <= lon <= 180):
                errors.append(f"Invalid longitude: {lon}")

        return errors

    def _validate_business_rules(self, property_data: Dict) -> List[str]:
        """Validate business rules"""
        errors = []

        # Price validation
        price = property_data.get('price')
        if price is not None:
            if price <= 0:
                errors.append(f"Invalid price: {price} (must be positive)")
            elif price < 1000:
                errors.append(f"Suspiciously low price: {price}")
            elif price > 100_000_000:
                errors.append(f"Suspiciously high price: {price}")

        # Bedrooms validation
        bedrooms = property_data.get('bedrooms')
        if bedrooms is not None:
            if bedrooms < 0:
                errors.append(f"Invalid bedrooms: {bedrooms} (cannot be negative)")
            elif bedrooms > 20:
                errors.append(f"Suspiciously high bedroom count: {bedrooms}")

        # Bathrooms validation
        bathrooms = property_data.get('bathrooms')
        if bathrooms is not None:
            if bathrooms < 0:
                errors.append(f"Invalid bathrooms: {bathrooms} (cannot be negative)")
            elif bathrooms > 20:
                errors.append(f"Suspiciously high bathroom count: {bathrooms}")

        # Square feet validation
        square_feet = property_data.get('square_feet')
        if square_feet is not None:
            if square_feet <= 0:
                errors.append(f"Invalid square feet: {square_feet} (must be positive)")
            elif square_feet < 100:
                errors.append(f"Suspiciously low square footage: {square_feet}")
            elif square_feet > 50_000:
                errors.append(f"Suspiciously high square footage: {square_feet}")

        # Year built validation
        year_built = property_data.get('year_built')
        if year_built is not None:
            current_year = datetime.now().year
            if year_built < 1800:
                errors.append(f"Invalid year built: {year_built} (too old)")
            elif year_built > current_year:
                errors.append(f"Invalid year built: {year_built} (future year)")

        # Cross-field validation
        if bedrooms is not None and bathrooms is not None:
            if bathrooms > bedrooms * 2:
                errors.append(f"Unusual bed/bath ratio: {bedrooms} beds, {bathrooms} baths")

        if square_feet is not None and bedrooms is not None:
            if bedrooms > 0:
                sqft_per_bed = square_feet / bedrooms
                if sqft_per_bed < 50:
                    errors.append(f"Unusually small square footage per bedroom: {sqft_per_bed}")
                elif sqft_per_bed > 5000:
                    errors.append(f"Unusually large square footage per bedroom: {sqft_per_bed}")

        return errors

    def validate_bulk(self, properties: List[Dict]) -> Tuple[List[Dict], List[Dict]]:
        """
        Validate multiple properties

        Args:
            properties: List of property dictionaries

        Returns:
            Tuple of (valid_properties, invalid_properties_with_errors)
        """
        valid_properties = []
        invalid_properties = []

        for prop in properties:
            is_valid, errors = self.validate_property(prop)

            if is_valid:
                valid_properties.append(prop)
            else:
                prop['validation_errors'] = errors
                invalid_properties.append(prop)

        self.logger.info(
            f"Validated {len(properties)} properties: "
            f"{len(valid_properties)} valid, {len(invalid_properties)} invalid"
        )

        return valid_properties, invalid_properties

    def get_completeness_score(self, property_data: Dict) -> float:
        """
        Calculate completeness score for a property

        Args:
            property_data: Property data dictionary

        Returns:
            Completeness score (0-100)
        """
        all_fields = self.REQUIRED_FIELDS + self.IMPORTANT_FIELDS + [
            'price', 'lot_size', 'year_built', 'latitude', 'longitude',
            'property_id', 'county', 'owner_name'
        ]

        filled_fields = sum(1 for field in all_fields if property_data.get(field) is not None)
        total_fields = len(all_fields)

        score = (filled_fields / total_fields) * 100

        return round(score, 2)

    def get_quality_metrics(self, properties: List[Dict]) -> Dict:
        """
        Get quality metrics for a dataset

        Args:
            properties: List of property dictionaries

        Returns:
            Quality metrics dictionary
        """
        if not properties:
            return {}

        valid_count = 0
        completeness_scores = []

        for prop in properties:
            is_valid, _ = self.validate_property(prop)
            if is_valid:
                valid_count += 1

            completeness_scores.append(self.get_completeness_score(prop))

        return {
            'total_properties': len(properties),
            'valid_properties': valid_count,
            'invalid_properties': len(properties) - valid_count,
            'validity_rate': (valid_count / len(properties)) * 100,
            'average_completeness': sum(completeness_scores) / len(completeness_scores),
            'min_completeness': min(completeness_scores),
            'max_completeness': max(completeness_scores)
        }
