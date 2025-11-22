# 🗺️ How To Add New Counties

The system can scrape **any of the 3000+ US counties** by adding a simple configuration. No code changes needed!

---

## ⚡ Quick Add (2 minutes)

### Step 1: Find the County's Data Source

Google: `"[County Name] [State] delinquent tax list"`

Example: "Wake County NC delinquent tax list"

### Step 2: Identify the Data Format

Look for:
- ✅ CSV download button
- ✅ Excel/PDF download
- ✅ Online database/search tool
- ✅ API endpoint (rare)

### Step 3: Add to `county-configs.json`

```json
{
  "counties": {
    "NC": {
      "Wake County": {
        "url": "https://www.wake.gov/departments-government/tax-administration/delinquent-taxes",
        "dataSource": "csv",
        "csvUrl": "https://www.wake.gov/downloads/delinquent-tax-list.csv",
        "enabled": true,
        "runFrequency": "daily"
      }
    }
  }
}
```

**Done!** The scraper will automatically handle this county.

---

## 📋 Configuration Options

### Required Fields:

```json
{
  "url": "County website URL",
  "dataSource": "csv|pdf|database|api|html",
  "enabled": true|false
}
```

### Optional Fields:

```json
{
  "csvUrl": "Direct link to CSV file",
  "pdfUrl": "Direct link to PDF file",
  "apiUrl": "API endpoint",
  "apiKey": "API key if required",
  "searchUrl": "URL for searchable database",
  "runFrequency": "daily|weekly|monthly",
  "notes": "Any special instructions"
}
```

---

## 🎯 Data Source Types

### CSV (Easiest - 80% of counties)

**When to use:** County provides downloadable CSV file

```json
{
  "dataSource": "csv",
  "csvUrl": "https://county.gov/downloads/delinquent.csv"
}
```

**Expected CSV format:**
- Must have headers in first row
- Common columns: address, owner, tax_amount, years_delinquent

### PDF (Medium difficulty)

**When to use:** County provides PDF with tabular data

```json
{
  "dataSource": "pdf",
  "pdfUrl": "https://county.gov/delinquent-list.pdf"
}
```

**Requires:** `npm install pdf-parse`

### Database (Harder)

**When to use:** County has online searchable database

```json
{
  "dataSource": "database",
  "searchUrl": "https://county.gov/tax-search"
}
```

**Requires:** `npm install puppeteer`

### API (Rare but easiest)

**When to use:** County provides official API

```json
{
  "dataSource": "api",
  "apiUrl": "https://api.county.gov/delinquent-properties",
  "apiKey": "optional-api-key"
}
```

### HTML (Last resort)

**When to use:** Data only in HTML tables, no download option

```json
{
  "dataSource": "html",
  "url": "https://county.gov/tax-list-page"
}
```

**Requires:** `npm install cheerio puppeteer`

---

## 📍 Adding Multiple Counties At Once

You can add entire states at once:

```json
{
  "counties": {
    "CA": {
      "Los Angeles County": {
        "url": "...",
        "dataSource": "csv",
        "enabled": true
      },
      "San Diego County": {
        "url": "...",
        "dataSource": "pdf",
        "enabled": true
      },
      "Orange County": {
        "url": "...",
        "dataSource": "database",
        "enabled": true
      }
    }
  }
}
```

---

## 🔍 Finding Data Sources for Any County

### Method 1: County Tax Collector Website

```
1. Google "[County Name] tax collector"
2. Look for "Delinquent Taxes" or "Tax Sales" page
3. Check for download/export options
```

### Method 2: State-Level Resources

Many states provide centralized lists:
- **Texas:** comptroller.texas.gov
- **Florida:** floridarevenue.com
- **Georgia:** dor.georgia.gov

### Method 3: Property Search Tools

If county has property search:
1. Search for properties
2. Look for "Export Results" option
3. Note the export URL

---

## 🚀 Real Examples

### Example 1: Wake County, NC (CSV)

**URL:** https://www.wake.gov/departments-government/tax-administration/delinquent-taxes

**Data:** CSV download button

**Config:**
```json
{
  "Wake County": {
    "url": "https://www.wake.gov/tax/delinquent",
    "dataSource": "csv",
    "csvUrl": "https://www.wake.gov/downloads/tax-delinquent.csv",
    "enabled": true,
    "runFrequency": "daily"
  }
}
```

### Example 2: Orange County, FL (Database)

**URL:** https://www.octaxcol.com/

**Data:** Searchable database, no direct download

**Config:**
```json
{
  "Orange County": {
    "url": "https://www.octaxcol.com/delinquent",
    "dataSource": "database",
    "searchUrl": "https://www.octaxcol.com/search",
    "enabled": true,
    "runFrequency": "daily",
    "notes": "Requires Puppeteer to interact with search form"
  }
}
```

### Example 3: Miami-Dade County, FL (API)

**URL:** https://www.miamidade.gov/

**Data:** They have a property API

**Config:**
```json
{
  "Miami-Dade County": {
    "url": "https://www.miamidade.gov/property",
    "dataSource": "api",
    "apiUrl": "https://api.miamidade.gov/property/delinquent",
    "enabled": true,
    "runFrequency": "daily"
  }
}
```

---

## 🎯 Priority List (Top Markets)

### Mega Markets (Do First)
- Harris County, TX (Houston) - 4.7M people
- Los Angeles County, CA - 10M people
- Cook County, IL (Chicago) - 5.3M people
- Maricopa County, AZ (Phoenix) - 4.5M people
- Miami-Dade County, FL - 2.7M people

### Major Markets
- Dallas County, TX
- Orange County, CA
- San Diego County, CA
- Riverside County, CA
- Clark County, NV (Las Vegas)

### Your Specific Targets
✅ **Texas:** Harris, Dallas, Tarrant, Bexar, Travis
✅ **Georgia:** Fulton, DeKalb, Gwinnett, Cobb (Metro Atlanta)
✅ **Florida:** Miami-Dade, Broward, Palm Beach, Orange, Hillsborough
✅ **North Carolina:** Mecklenburg, Wake, Guilford
✅ **Connecticut:** Fairfield, Hartford, New Haven
✅ **Delaware:** New Castle, Kent, Sussex

---

## 🔧 Testing New Counties

After adding a county:

```bash
# Test with just that county enabled
node services/scout-agents/county-scraper/universal-scraper.js
```

Check logs for:
- ✅ "Scraping [County Name]..."
- ✅ "X leads saved"
- ❌ Any errors

---

## 💡 Pro Tips

1. **Start with your target states** - Focus on TX, GA, FL, NC first
2. **Enable counties gradually** - Don't enable all 3000 at once!
3. **Check data quality** - Manually verify first 10 properties from each county
4. **Monitor run times** - Some counties take longer than others
5. **Update URLs** - Counties change websites, keep configs updated

---

## 📊 Current Coverage

The system currently has configs for:
- **Texas:** 5 counties (Harris, Dallas, Tarrant, Bexar, Travis)
- **Georgia:** 4 counties (Fulton, DeKalb, Gwinnett, Cobb)
- **Florida:** 6 counties (Miami-Dade, Broward, Palm Beach, Orange, Hillsborough, Pinellas)
- **North Carolina:** 3 counties (Mecklenburg, Wake, Guilford)
- **Connecticut:** 3 counties (Fairfield, Hartford, New Haven)
- **Delaware:** 3 counties (New Castle, Kent, Sussex)

**Total:** 24 counties configured, ready to scale to 3000+

---

## 🚀 Next Steps

1. **Research** - Find data sources for your priority counties
2. **Add Configs** - Update `county-configs.json`
3. **Test** - Run scraper and verify data quality
4. **Enable** - Set `enabled: true` for production
5. **Monitor** - Check logs daily for errors

---

Need help adding a specific county? Just provide:
1. County name and state
2. URL to their delinquent tax page
3. I'll help you create the config!
