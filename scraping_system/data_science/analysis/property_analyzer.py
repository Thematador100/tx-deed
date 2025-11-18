"""
Property data analysis tools
"""

import logging
from typing import Dict, List, Optional
from collections import Counter
import statistics


class PropertyAnalyzer:
    """Analyzes property data and generates insights"""

    def __init__(self):
        self.logger = logging.getLogger("property_analyzer")

    def analyze_dataset(self, properties: List[Dict]) -> Dict:
        """
        Comprehensive analysis of a property dataset

        Args:
            properties: List of property dictionaries

        Returns:
            Analysis results dictionary
        """
        if not properties:
            return {}

        analysis = {
            'summary_stats': self.get_summary_statistics(properties),
            'price_analysis': self.analyze_prices(properties),
            'location_analysis': self.analyze_by_location(properties),
            'property_type_analysis': self.analyze_by_type(properties),
            'market_segments': self.segment_market(properties),
            'outliers': self.detect_outliers(properties),
            'trends': self.identify_trends(properties)
        }

        return analysis

    def get_summary_statistics(self, properties: List[Dict]) -> Dict:
        """Get summary statistics for the dataset"""
        stats = {
            'total_properties': len(properties),
            'properties_with_price': sum(1 for p in properties if p.get('price')),
            'avg_price': None,
            'median_price': None,
            'avg_sqft': None,
            'avg_bedrooms': None,
            'avg_bathrooms': None,
            'avg_price_per_sqft': None
        }

        # Price statistics
        prices = [p['price'] for p in properties if p.get('price')]
        if prices:
            stats['avg_price'] = round(statistics.mean(prices), 2)
            stats['median_price'] = round(statistics.median(prices), 2)
            stats['min_price'] = min(prices)
            stats['max_price'] = max(prices)
            stats['price_std_dev'] = round(statistics.stdev(prices), 2) if len(prices) > 1 else 0

        # Square footage statistics
        sqfts = [p['square_feet'] for p in properties if p.get('square_feet')]
        if sqfts:
            stats['avg_sqft'] = round(statistics.mean(sqfts), 2)
            stats['median_sqft'] = round(statistics.median(sqfts), 2)

        # Bedrooms
        bedrooms = [p['bedrooms'] for p in properties if p.get('bedrooms')]
        if bedrooms:
            stats['avg_bedrooms'] = round(statistics.mean(bedrooms), 2)

        # Bathrooms
        bathrooms = [p['bathrooms'] for p in properties if p.get('bathrooms')]
        if bathrooms:
            stats['avg_bathrooms'] = round(statistics.mean(bathrooms), 2)

        # Price per sqft
        price_per_sqfts = [p['price_per_sqft'] for p in properties if p.get('price_per_sqft')]
        if price_per_sqfts:
            stats['avg_price_per_sqft'] = round(statistics.mean(price_per_sqfts), 2)
            stats['median_price_per_sqft'] = round(statistics.median(price_per_sqfts), 2)

        return stats

    def analyze_prices(self, properties: List[Dict]) -> Dict:
        """Analyze price distribution and trends"""
        prices = [p['price'] for p in properties if p.get('price')]

        if not prices:
            return {}

        # Price distribution by range
        price_ranges = {
            'under_100k': sum(1 for p in prices if p < 100000),
            '100k_200k': sum(1 for p in prices if 100000 <= p < 200000),
            '200k_300k': sum(1 for p in prices if 200000 <= p < 300000),
            '300k_500k': sum(1 for p in prices if 300000 <= p < 500000),
            '500k_750k': sum(1 for p in prices if 500000 <= p < 750000),
            '750k_1m': sum(1 for p in prices if 750000 <= p < 1000000),
            'over_1m': sum(1 for p in prices if p >= 1000000)
        }

        # Calculate percentiles
        sorted_prices = sorted(prices)
        n = len(sorted_prices)

        analysis = {
            'price_distribution': price_ranges,
            'percentiles': {
                'p10': sorted_prices[int(n * 0.1)] if n > 0 else None,
                'p25': sorted_prices[int(n * 0.25)] if n > 0 else None,
                'p50': sorted_prices[int(n * 0.5)] if n > 0 else None,
                'p75': sorted_prices[int(n * 0.75)] if n > 0 else None,
                'p90': sorted_prices[int(n * 0.9)] if n > 0 else None
            },
            'mean': statistics.mean(prices),
            'median': statistics.median(prices),
            'mode': statistics.mode(prices) if len(set(prices)) < len(prices) else None,
            'std_dev': statistics.stdev(prices) if len(prices) > 1 else 0
        }

        return analysis

    def analyze_by_location(self, properties: List[Dict]) -> Dict:
        """Analyze properties by location"""
        city_data = {}

        for prop in properties:
            city = prop.get('city')
            if not city:
                continue

            if city not in city_data:
                city_data[city] = []

            city_data[city].append(prop)

        # Calculate stats for each city
        location_analysis = {}

        for city, props in city_data.items():
            prices = [p['price'] for p in props if p.get('price')]
            sqfts = [p['square_feet'] for p in props if p.get('square_feet')]

            location_analysis[city] = {
                'count': len(props),
                'avg_price': round(statistics.mean(prices), 2) if prices else None,
                'median_price': round(statistics.median(prices), 2) if prices else None,
                'avg_sqft': round(statistics.mean(sqfts), 2) if sqfts else None,
                'price_range': {
                    'min': min(prices) if prices else None,
                    'max': max(prices) if prices else None
                }
            }

        # Sort by property count
        sorted_locations = dict(
            sorted(
                location_analysis.items(),
                key=lambda x: x[1]['count'],
                reverse=True
            )
        )

        return sorted_locations

    def analyze_by_type(self, properties: List[Dict]) -> Dict:
        """Analyze properties by type"""
        type_data = {}

        for prop in properties:
            prop_type = prop.get('property_type') or 'Unknown'

            if prop_type not in type_data:
                type_data[prop_type] = []

            type_data[prop_type].append(prop)

        # Calculate stats for each type
        type_analysis = {}

        for prop_type, props in type_data.items():
            prices = [p['price'] for p in props if p.get('price')]

            type_analysis[prop_type] = {
                'count': len(props),
                'percentage': round(len(props) / len(properties) * 100, 2),
                'avg_price': round(statistics.mean(prices), 2) if prices else None,
                'median_price': round(statistics.median(prices), 2) if prices else None
            }

        return type_analysis

    def segment_market(self, properties: List[Dict]) -> Dict:
        """Segment properties into market categories"""
        segments = {
            'starter_homes': [],  # Under $200K, 1-2 bed
            'family_homes': [],   # $200K-$500K, 3-4 bed
            'luxury_homes': [],   # Over $500K
            'investment_properties': [],  # Multi-family or cheap
            'fixer_uppers': []   # Old properties, low price per sqft
        }

        for prop in properties:
            price = prop.get('price', 0)
            bedrooms = prop.get('bedrooms', 0)
            property_age = prop.get('property_age', 0)
            price_per_sqft = prop.get('price_per_sqft', 0)

            # Categorize
            if price < 200000 and bedrooms <= 2:
                segments['starter_homes'].append(prop)
            elif 200000 <= price < 500000 and 3 <= bedrooms <= 4:
                segments['family_homes'].append(prop)
            elif price >= 500000:
                segments['luxury_homes'].append(prop)

            # Investment properties
            if prop.get('property_type') and 'multi' in prop['property_type'].lower():
                segments['investment_properties'].append(prop)

            # Fixer uppers
            if property_age > 50 and price_per_sqft < 100:
                segments['fixer_uppers'].append(prop)

        # Calculate segment stats
        segment_stats = {}

        for segment, props in segments.items():
            if props:
                segment_stats[segment] = {
                    'count': len(props),
                    'percentage': round(len(props) / len(properties) * 100, 2),
                    'avg_price': round(statistics.mean([p['price'] for p in props if p.get('price')]), 2)
                }

        return segment_stats

    def detect_outliers(self, properties: List[Dict]) -> Dict:
        """Detect outlier properties"""
        outliers = {
            'high_price': [],
            'low_price': [],
            'large_size': [],
            'small_size': [],
            'unusual_ratios': []
        }

        prices = [p['price'] for p in properties if p.get('price')]
        sqfts = [p['square_feet'] for p in properties if p.get('square_feet')]

        if not prices or not sqfts:
            return outliers

        # Calculate thresholds using IQR method
        def get_outlier_bounds(values):
            sorted_vals = sorted(values)
            n = len(sorted_vals)
            q1 = sorted_vals[int(n * 0.25)]
            q3 = sorted_vals[int(n * 0.75)]
            iqr = q3 - q1
            lower = q1 - 1.5 * iqr
            upper = q3 + 1.5 * iqr
            return lower, upper

        price_lower, price_upper = get_outlier_bounds(prices)
        sqft_lower, sqft_upper = get_outlier_bounds(sqfts)

        # Find outliers
        for prop in properties:
            price = prop.get('price')
            sqft = prop.get('square_feet')

            if price and price > price_upper:
                outliers['high_price'].append(prop)
            elif price and price < price_lower:
                outliers['low_price'].append(prop)

            if sqft and sqft > sqft_upper:
                outliers['large_size'].append(prop)
            elif sqft and sqft < sqft_lower:
                outliers['small_size'].append(prop)

            # Unusual ratios
            if prop.get('bedrooms') and prop.get('bathrooms'):
                if prop['bathrooms'] > prop['bedrooms'] * 1.5:
                    outliers['unusual_ratios'].append(prop)

        return outliers

    def identify_trends(self, properties: List[Dict]) -> Dict:
        """Identify market trends from data"""
        trends = {
            'most_common_property_type': None,
            'price_trend': 'stable',
            'popular_bedroom_count': None,
            'popular_cities': []
        }

        # Most common property type
        property_types = [p['property_type'] for p in properties if p.get('property_type')]
        if property_types:
            type_counts = Counter(property_types)
            trends['most_common_property_type'] = type_counts.most_common(1)[0][0]

        # Popular bedroom count
        bedrooms = [p['bedrooms'] for p in properties if p.get('bedrooms')]
        if bedrooms:
            bedroom_counts = Counter(bedrooms)
            trends['popular_bedroom_count'] = bedroom_counts.most_common(1)[0][0]

        # Popular cities
        cities = [p['city'] for p in properties if p.get('city')]
        if cities:
            city_counts = Counter(cities)
            trends['popular_cities'] = [city for city, count in city_counts.most_common(5)]

        return trends

    def generate_insights(self, analysis: Dict) -> List[str]:
        """
        Generate human-readable insights from analysis

        Args:
            analysis: Analysis results from analyze_dataset()

        Returns:
            List of insight strings
        """
        insights = []

        summary = analysis.get('summary_stats', {})
        price_analysis = analysis.get('price_analysis', {})
        segments = analysis.get('market_segments', {})

        # General insights
        if summary.get('total_properties'):
            insights.append(
                f"Dataset contains {summary['total_properties']} properties "
                f"with an average price of ${summary.get('avg_price', 0):,.0f}"
            )

        # Price insights
        if price_analysis.get('median'):
            insights.append(
                f"Median price is ${price_analysis['median']:,.0f}, "
                f"with 50% of properties priced between "
                f"${price_analysis['percentiles']['p25']:,.0f} and "
                f"${price_analysis['percentiles']['p75']:,.0f}"
            )

        # Market segment insights
        if segments:
            largest_segment = max(segments.items(), key=lambda x: x[1]['count'])
            insights.append(
                f"Largest market segment is '{largest_segment[0]}' "
                f"with {largest_segment[1]['count']} properties "
                f"({largest_segment[1]['percentage']}%)"
            )

        return insights
