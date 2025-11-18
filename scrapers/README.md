# Texas County Tax Deed Scrapers

Automated scrapers for collecting tax deed listings from Texas county websites.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd scrapers
pip install -r requirements.txt
```

### 2. Configure Environment

Create a `.env` file in the scrapers directory:

```bash
SUPABASE_URL=https://aedapqfuegbqztuetkxd.supabase.co
SUPABASE_KEY=your_service_role_key_here
```

> **Note:** Get your Supabase service role key from the Supabase dashboard under Settings > API

### 3. Run a Scraper

```bash
# Scrape Harris County (Houston)
python county_scraper.py harris

# Scrape Dallas County
python county_scraper.py dallas

# Scrape Travis County (Austin)
python county_scraper.py travis
```

## 📋 How It Works

1. **Scrapes** county tax deed websites for property listings
2. **Extracts** property details (address, value, auction date, etc.)
3. **Saves** data to:
   - Supabase database (automatically syncs with the web app)
   - Local JSON files (in `scrapers/data/`)

## 🏛️ Supported Counties

| County | City | Status | Scraper Class |
|--------|------|--------|---------------|
| Harris | Houston | ⚠️ Template | `HarrisCountyScraper` |
| Dallas | Dallas | ⏳ Not Implemented | `DallasCountyScraper` |
| Travis | Austin | ⏳ Not Implemented | `TravisCountyScraper` |
| Tarrant | Fort Worth | ⏳ Not Implemented | - |
| Bexar | San Antonio | ⏳ Not Implemented | - |

## 🛠️ Implementing a New County Scraper

### Step 1: Find the County Website

Research the county's tax deed sale website. Common sources:
- County tax assessor website
- County clerk website
- Sheriff's office website
- Third-party auction platforms (Bid4Assets, GovEase, etc.)

### Step 2: Create Scraper Class

```python
class YourCountyScraper(CountyScraper):
    def __init__(self):
        super().__init__("Your County", "your-county-id")
        self.base_url = "https://county-website.com/tax-sales"

    def scrape(self) -> List[Dict]:
        # 1. Make HTTP request
        response = self.session.get(self.base_url)
        soup = BeautifulSoup(response.text, 'html.parser')

        # 2. Find property listings
        property_rows = soup.find_all('div', class_='property')

        # 3. Extract data
        properties = []
        for row in property_rows:
            properties.append({
                'address': row.find('span', class_='address').text,
                'city': 'Your City',
                'county': self.county_name,
                'state': 'TX',
                'zip': row.find('span', class_='zip').text,
                'assessed_value': parse_currency(row.find('span', class_='value').text),
                'minimum_bid': parse_currency(row.find('span', class_='bid').text),
                'auction_date': row.find('span', class_='date').text,
                # ... other fields
            })

        return properties
```

### Step 3: Register Scraper

Add to `COUNTY_SCRAPERS` dictionary:

```python
COUNTY_SCRAPERS = {
    'harris': HarrisCountyScraper,
    'your-county-id': YourCountyScraper,  # Add this line
}
```

### Step 4: Test

```bash
python county_scraper.py your-county-id
```

## 📊 Data Schema

Each property should have these fields:

```python
{
    'address': str,           # Street address
    'city': str,             # City name
    'county': str,           # County name
    'state': str,            # State (TX)
    'zip': str,              # ZIP code
    'property_type': str,    # Single Family, Condo, Land, etc.
    'assessed_value': float, # County assessed value
    'minimum_bid': float,    # Minimum bid amount
    'auction_date': str,     # Auction date (YYYY-MM-DD)
    'tax_amount_owed': float,# Total taxes owed
    'year_delinquent': int,  # Year first delinquent
    'scraped_at': str        # ISO timestamp
}
```

## 🔧 Tips for Scraping

### 1. Inspect the HTML Structure

Use browser DevTools:
- Right-click on a property listing → Inspect
- Find the CSS selectors for each data field
- Look for consistent class names or IDs

### 2. Handle Pagination

```python
def scrape(self):
    properties = []
    page = 1

    while True:
        url = f"{self.base_url}?page={page}"
        response = self.session.get(url)
        # ... parse properties ...

        if not has_next_page:
            break
        page += 1

    return properties
```

### 3. Respect Rate Limits

```python
import time

for i, url in enumerate(urls):
    response = self.session.get(url)
    # Process response

    # Be polite - wait between requests
    time.sleep(1)  # 1 second delay
```

### 4. Handle Errors Gracefully

```python
try:
    response = self.session.get(url)
    response.raise_for_status()
except requests.RequestException as e:
    print(f"Error fetching {url}: {e}")
    continue
```

## 🌐 Integration with Web App

When a scraper saves properties to Supabase, they automatically appear in:
1. **County Scraper** page (as results)
2. **Properties** page (in the main listings)
3. **Dashboard** (featured properties)

The web app subscribes to database changes in real-time!

## 📝 Example: Finding County Websites

### Harris County (Houston)
- **Tax Office:** https://www.hctax.net/
- **Delinquent Tax Sales:** Check constable or tax office websites
- Often sold via third-party platforms

### Dallas County
- **Tax Office:** https://www.dallascad.org/
- **Sheriff Sales:** https://www.dallascounty.org/department/sheriff/

### Travis County (Austin)
- **Tax Office:** https://tax-office.traviscountytx.gov/
- **Delinquent Sales:** Check county website for auction dates

## 🤝 Contributing

To add support for a new county:
1. Research the county's tax sale website
2. Implement a scraper class (use `HarrisCountyScraper` as template)
3. Test thoroughly
4. Update this README with the new county

## ⚖️ Legal & Ethical Considerations

- ✅ **DO:** Scrape publicly available tax deed data
- ✅ **DO:** Respect robots.txt and rate limits
- ✅ **DO:** Add delays between requests
- ❌ **DON'T:** Overwhelm county servers
- ❌ **DON'T:** Scrape personal/private information
- ❌ **DON'T:** Resell data without proper licensing

This data is typically public record, but always verify terms of use for each website.

## 📞 Support

For questions or issues:
1. Check the county website's Terms of Service
2. Review the scraper code comments
3. Test with a single county first
4. Monitor the `scrapers/data/` folder for JSON output

---

**Happy Scraping! 🏛️💰**
