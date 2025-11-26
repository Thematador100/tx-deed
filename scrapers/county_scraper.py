#!/usr/bin/env python3

"""
Texas County Tax Deed Scraper
A template for scraping tax deed listings from Texas county websites
"""

Requirements:
    pip install requests beautifulsoup4 supabase python-dotenv

Environment variables needed (.env):
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_key
"""

import os
import sys
import json
import time
from datetime import datetime
from typing import List, Dict, Optional
import requests
from bs4 import BeautifulSoup
from supabase import create_client, Client

# Load environment variables
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass  # dotenv not available (e.g., in production)

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL', 'https://aedapqfuegbqzuetkxd.supabase.co')
SUPABASE_KEY = os.getenv('SUPABASE_KEY', '')  # Add your service role key here


class CountyScraper:
    """Base class for county tax deed scrapers"""
    
    def __init__(self, county_name: str, county_id: str):
        self.county_name = county_name
        self.county_id = county_id
        self.supabase: Optional[Client] = None
        
        if SUPABASE_KEY:
            self.supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
        
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def scrape(self) -> List[Dict]:
        """Override this method in county-specific scrapers"""
        raise NotImplementedError("Each county must implement its own scrape method")
    
    def save_to_database(self, properties: List[Dict]) -> bool:
        """Save scraped properties to Supabase"""
        if not self.supabase:
            print("⚠️  Supabase client not initialized. Add SUPABASE_KEY to .env")
            return False
        
        try:
            # Upsert properties (insert or update if exists)
            result = self.supabase.table('properties').upsert(properties).execute()
            print(f"✅ Saved {len(properties)} properties to database")
            return True
        except Exception as e:
            print(f"❌ Error saving to database: {e}")
            return False
    
    def save_to_json(self, properties: List[Dict], filename: str = None) -> str:
        """Save scraped properties to JSON file"""
        if filename is None:
            filename = f"{self.county_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        filepath = os.path.join('scrapers', 'data', filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        
        with open(filepath, 'w') as f:
            json.dump(properties, f, indent=2)
        
        print(f"💾 Saved data to {filepath}")
        return filepath


class HarrisCountyScraper(CountyScraper):
    """Scraper for Harris County (Houston) tax deed listings"""
    
    def __init__(self):
        super().__init__("Harris County", "harris")
        self.base_url = "https://www.hctax.net/Property/listings/taxsalelisting"
    
    def scrape(self) -> List[Dict]:
        """
        Scrape Harris County tax deed listings from hctax.net
        """
        print(f"🔍 Scraping {self.county_name}...")
        
        properties = []
        
        try:
            # Make request to Harris County tax sale page
            response = self.session.get(self.base_url)
            response.raise_for_status()
            
            # Parse HTML
            soup = BeautifulSoup(response.text, 'html.parser')
            
            # Find all property listings
            # Properties are in <li class="row listing"> elements
            property_rows = soup.find_all('li', class_='listing')
            
            print(f"Found {len(property_rows)} properties")
            
            for row in property_rows:
                try:
                    # Extract address components
                    address_elem = row.find('span', class_='address')
                    city_elem = row.find('span', class_='city')
                    state_elem = row.find('span', class_='state')
                    zip_elem = row.find('span', class_='zip')
                    
                    # Extract property details
                    precinct_elem = row.find('span', class_='precinct')
                    
                    # Find account and cause numbers in text-nowrap elements
                    account_text = ""
                    cause_text = ""
                    for text_elem in row.find_all('span', class_='text-nowrap'):
                        text = text_elem.get_text(strip=True)
                        if 'Account#' in text:
                            account_text = text.replace('Account#:', '').strip()
                        elif 'Cause#' in text or 'SuitNumber' in text_elem.get('class', []):
                            cause_text = text.replace('Cause#:', '').strip()
                    
                    # Extract financial values
                    adjudged_value_elem = row.find('span', class_='adjudgedValue')
                    min_bid_elem = row.find('span', class_='minBid')
                    
                    # Build property data dictionary
                    property_data = {
                        'address': address_elem.text.strip() if address_elem else '',
                        'city': city_elem.text.strip() if city_elem else 'Houston',
                        'county': self.county_name,
                        'state': state_elem.text.strip() if state_elem else 'TX',
                        'zip': zip_elem.text.strip() if zip_elem else '',
                        'precinct': precinct_elem.text.strip() if precinct_elem else '',
                        'account_number': account_text,
                        'cause_number': cause_text,
                        'adjudged_value': self._parse_currency(adjudged_value_elem.text if adjudged_value_elem else '0'),
                        'minimum_bid': self._parse_currency(min_bid_elem.text if min_bid_elem else '0'),
                        'scraped_at': datetime.now().isoformat()
                    }
                    
                    properties.append(property_data)
                    
                except Exception as e:
                    print(f"⚠️  Error parsing property row: {e}")
                    continue
            
        except Exception as e:
            print(f"❌ Error scraping {self.county_name}: {e}")
        
        print(f"✅ Found {len(properties)} properties in {self.county_name}")
        return properties
    
    def _parse_currency(self, value: str) -> float:
        """Helper method to parse currency strings to float"""
        try:
            # Remove $, commas, and whitespace, then convert to float
            cleaned = value.replace('$', '').replace(',', '').strip()
            return float(cleaned) if cleaned else 0.0
        except (ValueError, AttributeError):
            return 0.0


class DallasCountyScraper(CountyScraper):
    """Scraper for Dallas County tax deed listings"""
    
    def __init__(self):
        super().__init__("Dallas County", "dallas")
        # Update with actual Dallas County URL
        self.base_url = "https://www.dallascounty.org/"
    
    def scrape(self) -> List[Dict]:
        # TODO: Implement Dallas County scraping logic
        print(f"⚠️  {self.county_name} scraper not yet implemented")
        return []


def main():
    """Main scraping function"""
    print("🚀 Starting Texas Tax Deed Scraper\n")
    
    # Initialize scrapers
    scrapers = [
        HarrisCountyScraper(),
        # Add more counties here
    ]
    
    all_properties = []
    
    for scraper in scrapers:
        try:
            properties = scraper.scrape()
            
            if properties:
                # Save to JSON
                scraper.save_to_json(properties)
                
                # Save to database (if configured)
                scraper.save_to_database(properties)
                
                all_properties.extend(properties)
            
            # Be polite - add delay between scrapers
            time.sleep(2)
            
        except Exception as e:
            print(f"❌ Error running {scraper.county_name} scraper: {e}")
    
    print(f"\n✨ Scraping complete! Total properties found: {len(all_properties)}")


if __name__ == "__main__":
    main()
