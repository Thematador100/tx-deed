"""
Lead scoring model
Scores and ranks leads based on multiple factors
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime


class LeadScoringModel:
    """Model for scoring and ranking property leads"""

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize lead scoring model

        Args:
            config: Scoring configuration
        """
        self.logger = logging.getLogger("lead_scoring")
        self.config = config or self._default_config()

    def _default_config(self) -> Dict:
        """Get default scoring configuration"""
        return {
            'weights': {
                'property_value': 0.20,
                'location_quality': 0.15,
                'price_opportunity': 0.25,
                'property_condition': 0.15,
                'market_factors': 0.15,
                'tax_status': 0.10
            },
            'thresholds': {
                'hot_lead': 80,
                'warm_lead': 60,
                'cold_lead': 40
            }
        }

    def score_lead(self, property_data: Dict) -> Dict:
        """
        Score a single lead

        Args:
            property_data: Property data dictionary

        Returns:
            Scoring results with breakdown
        """
        scores = {
            'property_value': self._score_property_value(property_data),
            'location_quality': self._score_location(property_data),
            'price_opportunity': self._score_price_opportunity(property_data),
            'property_condition': self._score_condition(property_data),
            'market_factors': self._score_market_factors(property_data),
            'tax_status': self._score_tax_status(property_data)
        }

        # Calculate weighted total score
        weights = self.config['weights']
        total_score = sum(
            scores[category] * weights[category]
            for category in scores.keys()
        )

        # Determine lead temperature
        thresholds = self.config['thresholds']
        if total_score >= thresholds['hot_lead']:
            lead_temperature = 'Hot'
        elif total_score >= thresholds['warm_lead']:
            lead_temperature = 'Warm'
        elif total_score >= thresholds['cold_lead']:
            lead_temperature = 'Cold'
        else:
            lead_temperature = 'Very Cold'

        # Generate recommendations
        recommendations = self._generate_recommendations(property_data, scores)

        return {
            'total_score': round(total_score, 2),
            'lead_temperature': lead_temperature,
            'score_breakdown': scores,
            'recommendations': recommendations,
            'scored_at': datetime.now().isoformat()
        }

    def _score_property_value(self, property_data: Dict) -> float:
        """Score based on property value (0-100)"""
        price = property_data.get('price', 0)

        if not price:
            return 50  # Neutral score if no price

        # Optimal investment range varies by market
        # This is an example for median markets
        if 100000 <= price <= 300000:
            return 90  # Sweet spot for investors
        elif 50000 <= price < 100000:
            return 80  # Good value
        elif 300000 <= price <= 500000:
            return 70  # Decent
        elif price < 50000:
            return 60  # Very cheap, might have issues
        else:
            return 40  # Too expensive for typical investors

    def _score_location(self, property_data: Dict) -> float:
        """Score based on location quality"""
        score = 50  # Start neutral

        # Walk score
        walk_score = property_data.get('walk_score', 0)
        if walk_score:
            score += (walk_score / 100) * 20

        # Crime score
        crime_data = property_data.get('crime_score', {})
        crime_score = crime_data.get('crime_score', 0)
        if crime_score:
            score += (crime_score / 100) * 20

        # School quality
        schools = property_data.get('nearby_schools', [])
        if schools:
            avg_rating = sum(s.get('rating', 0) for s in schools) / len(schools)
            score += (avg_rating / 10) * 10

        return min(100, score)

    def _score_price_opportunity(self, property_data: Dict) -> float:
        """Score based on price opportunity"""
        score = 50

        # Price per sqft comparison
        price_per_sqft = property_data.get('price_per_sqft', 0)

        # Compare to market average (assuming $150/sqft average)
        market_avg = 150

        if price_per_sqft and market_avg:
            discount = ((market_avg - price_per_sqft) / market_avg) * 100

            if discount >= 30:
                score = 100  # Excellent deal
            elif discount >= 20:
                score = 90  # Great deal
            elif discount >= 10:
                score = 75  # Good deal
            elif discount >= 0:
                score = 60  # Fair price
            else:
                score = 40  # Overpriced

        # Tax delinquency opportunity
        if property_data.get('is_tax_delinquent'):
            score += 20  # Bonus for potential negotiation

        # Days on market
        dom = property_data.get('days_on_market', 0)
        if dom > 90:
            score += 10  # Motivated seller likely

        return min(100, score)

    def _score_condition(self, property_data: Dict) -> float:
        """Score based on property condition"""
        score = 70  # Assume average condition

        # Age of property
        property_age = property_data.get('property_age', 0)

        if property_age:
            if property_age < 10:
                score = 90  # Nearly new
            elif property_age < 20:
                score = 80  # Good condition likely
            elif property_age < 30:
                score = 70  # Average
            elif property_age < 50:
                score = 60  # Older, may need updates
            else:
                score = 50  # Very old, likely needs work

        # Recent renovations (if data available)
        if property_data.get('recently_renovated'):
            score += 20

        return min(100, score)

    def _score_market_factors(self, property_data: Dict) -> float:
        """Score based on market factors"""
        score = 60  # Start slightly above neutral

        # Property type demand
        property_type = property_data.get('property_category', '')

        high_demand_types = ['Residential - Single Family', 'Residential - Multi-Family']
        if property_type in high_demand_types:
            score += 20

        # Market appreciation potential
        # (Would use historical data and trends)

        # Inventory levels in area
        # (Would query database for area inventory)

        return min(100, score)

    def _score_tax_status(self, property_data: Dict) -> float:
        """Score based on tax status"""
        if property_data.get('is_tax_delinquent'):
            # Tax delinquent can be good (opportunity) or bad (risks)
            delinquent_amount = property_data.get('delinquent_amount', 0)
            property_value = property_data.get('price', 0)

            if property_value and delinquent_amount:
                delinquency_ratio = delinquent_amount / property_value

                if delinquency_ratio < 0.05:  # Less than 5%
                    return 85  # Small delinquency, good opportunity
                elif delinquency_ratio < 0.10:  # 5-10%
                    return 75
                else:  # Over 10%
                    return 60  # High risk

            return 70  # Default for delinquent

        # Current on taxes
        return 90

    def _generate_recommendations(self, property_data: Dict, scores: Dict) -> List[str]:
        """Generate actionable recommendations"""
        recommendations = []

        # Low price opportunity score
        if scores['price_opportunity'] < 60:
            recommendations.append(
                "Consider negotiating price or look for better deals in the market"
            )

        # Location concerns
        if scores['location_quality'] < 50:
            recommendations.append(
                "Location quality is below average. Factor in higher risk or longer hold time"
            )

        # Condition issues
        if scores['property_condition'] < 60:
            recommendations.append(
                "Property may need significant repairs. Budget for renovations"
            )

        # Tax delinquency
        if property_data.get('is_tax_delinquent'):
            recommendations.append(
                "Property has tax delinquency. Verify total owed and factor into offer"
            )

        # High overall score
        if scores['price_opportunity'] > 80:
            recommendations.append(
                "Strong price opportunity. Act quickly to secure this deal"
            )

        # Days on market
        dom = property_data.get('days_on_market', 0)
        if dom > 120:
            recommendations.append(
                f"Property has been on market for {dom} days. Seller may be motivated"
            )

        return recommendations

    def score_bulk(self, properties: List[Dict]) -> List[Dict]:
        """
        Score multiple leads

        Args:
            properties: List of property dictionaries

        Returns:
            List of properties with scores added
        """
        scored_properties = []

        for prop in properties:
            try:
                score_result = self.score_lead(prop)
                prop['lead_score'] = score_result
                scored_properties.append(prop)
            except Exception as e:
                self.logger.error(f"Error scoring lead: {str(e)}")
                continue

        # Sort by score
        scored_properties.sort(
            key=lambda x: x['lead_score']['total_score'],
            reverse=True
        )

        self.logger.info(f"Scored {len(scored_properties)} leads")

        return scored_properties

    def get_top_leads(self, properties: List[Dict], limit: int = 10) -> List[Dict]:
        """
        Get top leads by score

        Args:
            properties: List of properties
            limit: Number of top leads to return

        Returns:
            Top leads
        """
        scored = self.score_bulk(properties)
        return scored[:limit]

    def segment_leads(self, properties: List[Dict]) -> Dict[str, List[Dict]]:
        """
        Segment leads by temperature

        Args:
            properties: List of properties

        Returns:
            Dictionary of leads by temperature
        """
        segments = {
            'Hot': [],
            'Warm': [],
            'Cold': [],
            'Very Cold': []
        }

        scored = self.score_bulk(properties)

        for prop in scored:
            temperature = prop['lead_score']['lead_temperature']
            segments[temperature].append(prop)

        return segments
