"""
Property data visualization tools
Creates charts and maps for property data analysis
"""

import logging
from typing import Dict, List, Optional


class PropertyVisualizer:
    """Creates visualizations for property data"""

    def __init__(self):
        self.logger = logging.getLogger("property_visualizer")

    def create_price_distribution_chart(self, properties: List[Dict], output_path: str):
        """Create price distribution histogram"""
        try:
            import matplotlib.pyplot as plt
            import numpy as np

            prices = [p['price'] for p in properties if p.get('price')]

            if not prices:
                self.logger.warning("No price data to visualize")
                return

            plt.figure(figsize=(10, 6))
            plt.hist(prices, bins=50, edgecolor='black', alpha=0.7)
            plt.xlabel('Price ($)')
            plt.ylabel('Frequency')
            plt.title('Property Price Distribution')
            plt.grid(True, alpha=0.3)

            # Format x-axis as currency
            ax = plt.gca()
            ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1000:.0f}K'))

            plt.tight_layout()
            plt.savefig(output_path, dpi=300, bbox_inches='tight')
            plt.close()

            self.logger.info(f"Saved price distribution chart to {output_path}")

        except ImportError:
            self.logger.error("matplotlib not installed")

    def create_property_map(self, properties: List[Dict], output_path: str):
        """Create property location map"""
        try:
            import folium
            from folium.plugins import MarkerCluster

            # Get properties with coordinates
            props_with_coords = [
                p for p in properties
                if p.get('latitude') and p.get('longitude')
            ]

            if not props_with_coords:
                self.logger.warning("No coordinate data to map")
                return

            # Calculate center point
            avg_lat = sum(p['latitude'] for p in props_with_coords) / len(props_with_coords)
            avg_lon = sum(p['longitude'] for p in props_with_coords) / len(props_with_coords)

            # Create map
            m = folium.Map(location=[avg_lat, avg_lon], zoom_start=11)

            # Add marker cluster
            marker_cluster = MarkerCluster().add_to(m)

            # Add markers
            for prop in props_with_coords:
                popup_html = f"""
                <b>{prop.get('address', 'Unknown')}</b><br>
                Price: ${prop.get('price', 0):,.0f}<br>
                Beds: {prop.get('bedrooms', 'N/A')} | Baths: {prop.get('bathrooms', 'N/A')}<br>
                Sqft: {prop.get('square_feet', 'N/A'):,}
                """

                folium.Marker(
                    location=[prop['latitude'], prop['longitude']],
                    popup=folium.Popup(popup_html, max_width=300),
                    icon=folium.Icon(color='blue', icon='home', prefix='fa')
                ).add_to(marker_cluster)

            m.save(output_path)
            self.logger.info(f"Saved property map to {output_path}")

        except ImportError:
            self.logger.error("folium not installed")

    def create_market_trends_chart(self, market_data: Dict, output_path: str):
        """Create market trends line chart"""
        try:
            import matplotlib.pyplot as plt
            import matplotlib.dates as mdates
            from datetime import datetime

            monthly_data = market_data.get('price_trends', {}).get('monthly_averages', {})

            if not monthly_data:
                self.logger.warning("No trend data to visualize")
                return

            # Parse dates and values
            dates = [datetime.strptime(month, '%Y-%m') for month in sorted(monthly_data.keys())]
            values = [monthly_data[month.strftime('%Y-%m')] for month in dates]

            plt.figure(figsize=(12, 6))
            plt.plot(dates, values, marker='o', linewidth=2, markersize=8)
            plt.xlabel('Month')
            plt.ylabel('Average Price ($)')
            plt.title('Market Price Trends')
            plt.grid(True, alpha=0.3)

            # Format axes
            ax = plt.gca()
            ax.xaxis.set_major_formatter(mdates.DateFormatter('%b %Y'))
            ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda x, p: f'${x/1000:.0f}K'))
            plt.xticks(rotation=45)

            plt.tight_layout()
            plt.savefig(output_path, dpi=300, bbox_inches='tight')
            plt.close()

            self.logger.info(f"Saved trends chart to {output_path}")

        except ImportError:
            self.logger.error("matplotlib not installed")

    def generate_dashboard_html(self, analysis: Dict, output_path: str):
        """Generate interactive HTML dashboard"""
        html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <title>Property Analysis Dashboard</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }}
        .container {{ max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }}
        h1 {{ color: #333; border-bottom: 3px solid #4CAF50; padding-bottom: 10px; }}
        h2 {{ color: #555; margin-top: 30px; }}
        .metric-grid {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }}
        .metric-card {{ background: #f9f9f9; padding: 20px; border-radius: 6px; border-left: 4px solid #4CAF50; }}
        .metric-value {{ font-size: 28px; font-weight: bold; color: #4CAF50; }}
        .metric-label {{ color: #666; margin-top: 5px; }}
        table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
        th, td {{ padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }}
        th {{ background-color: #4CAF50; color: white; }}
        tr:hover {{ background-color: #f5f5f5; }}
    </style>
</head>
<body>
    <div class="container">
        <h1>Property Analysis Dashboard</h1>

        <h2>Summary Statistics</h2>
        <div class="metric-grid">
            <div class="metric-card">
                <div class="metric-value">{analysis.get('summary_stats', {}).get('total_properties', 0)}</div>
                <div class="metric-label">Total Properties</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analysis.get('summary_stats', {}).get('avg_price', 0):,.0f}</div>
                <div class="metric-label">Average Price</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${analysis.get('summary_stats', {}).get('median_price', 0):,.0f}</div>
                <div class="metric-label">Median Price</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{analysis.get('summary_stats', {}).get('avg_sqft', 0):,.0f}</div>
                <div class="metric-label">Avg Square Feet</div>
            </div>
        </div>

        <h2>Price Analysis</h2>
        <table>
            <tr>
                <th>Metric</th>
                <th>Value</th>
            </tr>
            <tr>
                <td>Mean Price</td>
                <td>${analysis.get('price_analysis', {}).get('mean', 0):,.2f}</td>
            </tr>
            <tr>
                <td>Median Price</td>
                <td>${analysis.get('price_analysis', {}).get('median', 0):,.2f}</td>
            </tr>
            <tr>
                <td>Standard Deviation</td>
                <td>${analysis.get('price_analysis', {}).get('std_dev', 0):,.2f}</td>
            </tr>
        </table>

        <h2>Top Locations</h2>
        <table>
            <tr>
                <th>City</th>
                <th>Count</th>
                <th>Avg Price</th>
                <th>Median Price</th>
            </tr>
"""

        # Add location data
        for city, data in list(analysis.get('location_analysis', {}).items())[:10]:
            html_content += f"""
            <tr>
                <td>{city}</td>
                <td>{data['count']}</td>
                <td>${data.get('avg_price', 0):,.0f}</td>
                <td>${data.get('median_price', 0):,.0f}</td>
            </tr>
"""

        html_content += """
        </table>
    </div>
</body>
</html>
"""

        with open(output_path, 'w') as f:
            f.write(html_content)

        self.logger.info(f"Generated dashboard HTML at {output_path}")
