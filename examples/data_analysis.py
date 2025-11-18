"""
Data analysis example
Demonstrates property data analysis and lead scoring
"""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from scraping_system.core.database_manager import DatabaseManager
from scraping_system.data_science.analysis.property_analyzer import PropertyAnalyzer
from scraping_system.data_science.ml_models.lead_scoring import LeadScoringModel
from scraping_system.pipelines.data_cleaner import DataCleaner
from scraping_system.pipelines.data_validator import DataValidator


def main():
    """Main function"""
    print("=== Property Data Analysis Example ===\n")

    # Load data from database
    print("1. Loading data from database...")
    db = DatabaseManager()
    properties = db.query_properties(limit=500)
    print(f"   Loaded {len(properties)} properties")

    if not properties:
        print("   No properties found. Run basic_scraping.py first!")
        return

    # Clean and validate data
    print("\n2. Cleaning and validating data...")
    cleaner = DataCleaner()
    cleaned = cleaner.clean_bulk(properties)

    validator = DataValidator()
    valid_properties, invalid = validator.validate_bulk(cleaned)
    print(f"   Valid: {len(valid_properties)}, Invalid: {len(invalid)}")

    # Analyze data
    print("\n3. Analyzing property data...")
    analyzer = PropertyAnalyzer()
    analysis = analyzer.analyze_dataset(valid_properties)

    # Print summary statistics
    summary = analysis['summary_stats']
    print("\n   === Summary Statistics ===")
    print(f"   Total Properties: {summary['total_properties']}")
    print(f"   Average Price: ${summary.get('avg_price', 0):,.2f}")
    print(f"   Median Price: ${summary.get('median_price', 0):,.2f}")
    print(f"   Average Sqft: {summary.get('avg_sqft', 0):,.0f}")

    # Generate insights
    print("\n   === Insights ===")
    insights = analyzer.generate_insights(analysis)
    for insight in insights:
        print(f"   • {insight}")

    # Score leads
    print("\n4. Scoring leads...")
    lead_scorer = LeadScoringModel()
    top_leads = lead_scorer.get_top_leads(valid_properties, limit=5)

    print("\n   === Top 5 Leads ===")
    for i, lead in enumerate(top_leads, 1):
        score = lead['lead_score']
        print(f"\n   {i}. {lead.get('address', 'Unknown')}")
        print(f"      Score: {score['total_score']:.2f} ({score['lead_temperature']})")
        print(f"      Price: ${lead.get('price', 0):,.0f}")
        print(f"      Recommendations:")
        for rec in score['recommendations'][:2]:
            print(f"        - {rec}")

    db.close()

    print("\n=== Analysis Complete ===")


if __name__ == '__main__':
    main()
