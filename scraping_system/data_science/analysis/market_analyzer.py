"""
Market trend analysis and forecasting
"""

import logging
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import statistics


class MarketAnalyzer:
    """Analyzes real estate market trends"""

    def __init__(self):
        self.logger = logging.getLogger("market_analyzer")

    def analyze_market_health(self, properties: List[Dict], sales_data: Optional[List[Dict]] = None) -> Dict:
        """
        Analyze overall market health

        Args:
            properties: List of active listings
            sales_data: List of recent sales

        Returns:
            Market health metrics
        """
        health = {
            'market_temperature': self._calculate_market_temperature(properties),
            'inventory_level': len(properties),
            'price_trends': self._analyze_price_trends(properties),
            'supply_demand': self._analyze_supply_demand(properties, sales_data),
            'market_score': 0
        }

        # Calculate overall market score
        health['market_score'] = self._calculate_market_score(health)

        return health

    def _calculate_market_temperature(self, properties: List[Dict]) -> str:
        """
        Calculate market temperature (hot, warm, cold)

        Args:
            properties: List of properties

        Returns:
            Market temperature string
        """
        # Factors:
        # - Days on market
        # - Price reductions
        # - List to sale price ratio

        dom_values = [p.get('days_on_market', 0) for p in properties if p.get('days_on_market')]

        if not dom_values:
            return 'Unknown'

        avg_dom = statistics.mean(dom_values)

        if avg_dom < 30:
            return 'Hot'
        elif avg_dom < 60:
            return 'Warm'
        else:
            return 'Cold'

    def _analyze_price_trends(self, properties: List[Dict]) -> Dict:
        """Analyze price trends over time"""
        # Group properties by month if created_at available
        monthly_data = defaultdict(list)

        for prop in properties:
            created_at = prop.get('created_at')
            price = prop.get('price')

            if created_at and price:
                # Extract month
                try:
                    dt = datetime.fromisoformat(created_at)
                    month_key = dt.strftime('%Y-%m')
                    monthly_data[month_key].append(price)
                except:
                    continue

        # Calculate monthly averages
        monthly_averages = {}
        for month, prices in monthly_data.items():
            monthly_averages[month] = statistics.mean(prices)

        # Determine trend
        trend = 'stable'
        if len(monthly_averages) >= 2:
            months = sorted(monthly_averages.keys())
            first_month_avg = monthly_averages[months[0]]
            last_month_avg = monthly_averages[months[-1]]

            change_percent = ((last_month_avg - first_month_avg) / first_month_avg) * 100

            if change_percent > 5:
                trend = 'increasing'
            elif change_percent < -5:
                trend = 'decreasing'

        return {
            'trend': trend,
            'monthly_averages': monthly_averages,
            'change_percent': change_percent if 'change_percent' in locals() else 0
        }

    def _analyze_supply_demand(
        self,
        properties: List[Dict],
        sales_data: Optional[List[Dict]]
    ) -> Dict:
        """Analyze supply and demand balance"""
        supply = len(properties)

        if sales_data:
            # Calculate sales velocity
            sales_per_month = len(sales_data)

            # Calculate months of supply
            months_of_supply = supply / sales_per_month if sales_per_month > 0 else float('inf')

            # Determine market type
            if months_of_supply < 3:
                market_type = "Seller's Market"
            elif months_of_supply < 6:
                market_type = "Balanced Market"
            else:
                market_type = "Buyer's Market"

            return {
                'current_supply': supply,
                'monthly_sales': sales_per_month,
                'months_of_supply': round(months_of_supply, 2),
                'market_type': market_type
            }

        return {
            'current_supply': supply,
            'market_type': 'Unknown'
        }

    def _calculate_market_score(self, health_metrics: Dict) -> float:
        """
        Calculate overall market health score (0-100)

        Args:
            health_metrics: Market health metrics

        Returns:
            Market score
        """
        score = 50.0  # Start at neutral

        # Temperature affects score
        temp = health_metrics.get('market_temperature', '').lower()
        if temp == 'hot':
            score += 20
        elif temp == 'warm':
            score += 10
        elif temp == 'cold':
            score -= 10

        # Price trend affects score
        price_trend = health_metrics.get('price_trends', {}).get('trend')
        if price_trend == 'increasing':
            score += 15
        elif price_trend == 'decreasing':
            score -= 15

        # Supply/demand affects score
        supply_demand = health_metrics.get('supply_demand', {})
        market_type = supply_demand.get('market_type', '')

        if market_type == "Seller's Market":
            score += 15
        elif market_type == "Buyer's Market":
            score -= 10

        # Ensure score is between 0 and 100
        score = max(0, min(100, score))

        return round(score, 2)

    def identify_investment_opportunities(
        self,
        properties: List[Dict],
        criteria: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Identify potential investment opportunities

        Args:
            properties: List of properties
            criteria: Investment criteria

        Returns:
            List of investment opportunities
        """
        criteria = criteria or {
            'max_price': 300000,
            'min_bedrooms': 2,
            'target_price_per_sqft': 150,
            'preferred_types': ['Single Family', 'Multi-Family']
        }

        opportunities = []

        for prop in properties:
            score = self._score_investment_opportunity(prop, criteria)

            if score > 60:  # Minimum score threshold
                prop['investment_score'] = score
                opportunities.append(prop)

        # Sort by score
        opportunities.sort(key=lambda x: x['investment_score'], reverse=True)

        return opportunities

    def _score_investment_opportunity(self, property_data: Dict, criteria: Dict) -> float:
        """Score an investment opportunity"""
        score = 0.0

        # Price check
        price = property_data.get('price', 0)
        if price > 0 and price < criteria['max_price']:
            score += 20

        # Bedrooms check
        bedrooms = property_data.get('bedrooms', 0)
        if bedrooms >= criteria['min_bedrooms']:
            score += 15

        # Price per sqft check
        price_per_sqft = property_data.get('price_per_sqft', 0)
        target = criteria['target_price_per_sqft']

        if price_per_sqft > 0:
            if price_per_sqft < target * 0.8:  # 20% below target
                score += 25
            elif price_per_sqft < target:
                score += 15

        # Property type check
        prop_type = property_data.get('property_category', '')
        if prop_type in criteria['preferred_types']:
            score += 15

        # Tax delinquency bonus (opportunity)
        if property_data.get('is_tax_delinquent'):
            score += 15

        # Condition indicators
        property_age = property_data.get('property_age', 0)
        if 0 < property_age < 20:  # Relatively new
            score += 10

        return score

    def compare_markets(self, markets: Dict[str, List[Dict]]) -> Dict:
        """
        Compare multiple markets

        Args:
            markets: Dictionary mapping market names to property lists

        Returns:
            Comparison results
        """
        comparison = {}

        for market_name, properties in markets.items():
            prices = [p['price'] for p in properties if p.get('price')]
            sqfts = [p['square_feet'] for p in properties if p.get('square_feet')]
            price_per_sqfts = [p['price_per_sqft'] for p in properties if p.get('price_per_sqft')]

            comparison[market_name] = {
                'count': len(properties),
                'avg_price': round(statistics.mean(prices), 2) if prices else None,
                'median_price': round(statistics.median(prices), 2) if prices else None,
                'avg_sqft': round(statistics.mean(sqfts), 2) if sqfts else None,
                'avg_price_per_sqft': round(statistics.mean(price_per_sqfts), 2) if price_per_sqfts else None,
                'price_range': {
                    'min': min(prices) if prices else None,
                    'max': max(prices) if prices else None
                }
            }

        return comparison

    def forecast_price_trend(self, historical_data: List[Dict], months_ahead: int = 6) -> Dict:
        """
        Simple price trend forecast

        Args:
            historical_data: Historical property/sales data
            months_ahead: Number of months to forecast

        Returns:
            Forecast dictionary
        """
        # This is a simplified linear forecast
        # In production, use more sophisticated models (ARIMA, Prophet, etc.)

        # Extract monthly averages
        monthly_prices = defaultdict(list)

        for record in historical_data:
            created_at = record.get('created_at') or record.get('sale_date')
            price = record.get('price') or record.get('sale_price')

            if created_at and price:
                try:
                    dt = datetime.fromisoformat(created_at)
                    month_key = dt.strftime('%Y-%m')
                    monthly_prices[month_key].append(price)
                except:
                    continue

        if len(monthly_prices) < 2:
            return {
                'forecast': [],
                'confidence': 'low',
                'message': 'Insufficient historical data'
            }

        # Calculate monthly averages
        months = sorted(monthly_prices.keys())
        averages = [statistics.mean(monthly_prices[m]) for m in months]

        # Simple linear trend
        if len(averages) >= 2:
            # Calculate slope
            n = len(averages)
            x_mean = (n - 1) / 2
            y_mean = statistics.mean(averages)

            numerator = sum((i - x_mean) * (averages[i] - y_mean) for i in range(n))
            denominator = sum((i - x_mean) ** 2 for i in range(n))

            slope = numerator / denominator if denominator != 0 else 0
            intercept = y_mean - slope * x_mean

            # Generate forecast
            forecast = []
            last_month_dt = datetime.strptime(months[-1], '%Y-%m')

            for i in range(1, months_ahead + 1):
                future_month = last_month_dt + timedelta(days=30 * i)
                month_key = future_month.strftime('%Y-%m')

                predicted_price = intercept + slope * (n + i - 1)

                forecast.append({
                    'month': month_key,
                    'predicted_price': round(predicted_price, 2)
                })

            return {
                'forecast': forecast,
                'trend': 'increasing' if slope > 0 else 'decreasing',
                'monthly_change': round(slope, 2),
                'confidence': 'medium'
            }

        return {
            'forecast': [],
            'confidence': 'low'
        }
