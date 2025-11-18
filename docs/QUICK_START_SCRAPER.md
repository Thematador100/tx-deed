# Quick Start Guide: Tax Sale Data Scraper

## 5-Minute Setup

### Step 1: Get TaxSaleResources Account (2 minutes)

1. Visit [taxsaleresources.com](https://taxsaleresources.com)
2. Sign up for trial ($1.99) or full access ($1,000/month)
3. Note your username and password

### Step 2: Configure in Admin Panel (2 minutes)

1. Log in to Win With Deeds admin panel
2. Navigate to **Admin > Data Sources**
3. Enter your TaxSaleResources credentials:
   - Username: `your-username`
   - Password: `your-password`
4. (Optional) Specify states: `FL, GA, TX, AZ`
5. (Optional) Set max pages: `10`

### Step 3: Run Your First Scrape (1 minute)

1. Click **"Run Scraper"** button
2. Wait for completion (1-5 minutes depending on data volume)
3. View results:
   - Records scraped: `XXX`
   - Records saved: `XXX`

### Step 4: Check Your Data

1. Navigate to **Admin > Properties**
2. Filter by source: `taxsaleresources`
3. Browse the imported properties!

## What You Get

✅ **Property Address & Details**
- Full street address, city, state, ZIP
- Parcel ID and owner name
- Property type, beds, baths, sqft

✅ **Financial Data**
- Opening bid amount
- Assessed value
- Estimated market value
- Tax amount owed

✅ **Sale Information**
- Sale date and time
- Sale location
- Sale type (deed, lien, redeemable)

✅ **Investment Analysis**
- ROI percentage
- Profit potential
- Opportunity score (0-100)
- Location, value, and competition scores

## Automated Scraping

### Enable Scheduler

1. Go to **Admin > Data Sources**
2. Toggle the switch next to TaxSaleResources
3. Scraper will run automatically daily at 2 AM

### Monitor Jobs

View job statistics:
- Total runs
- Success rate
- Records scraped
- Last run time
- Next scheduled run

## Example Data

After running the scraper, you'll see properties like:

```
Property: 123 Main St, Atlanta, GA 30301
Sale Date: December 15, 2025
Opening Bid: $45,000
Estimated Value: $175,000
Opportunity Score: 87/100
ROI: 93%
Profit Potential: $105,000
```

## Testing

Want to test without credentials?

1. Click **"Test"** button in Admin Panel
2. System creates mock properties to verify everything works
3. Check database for test records

## Need Help?

- Full documentation: `docs/TAX_SALE_SCRAPER_INTEGRATION.md`
- Architecture details: `src/services/scrapers/README.md`
- Code examples: `src/services/scrapers/index.js`

## Next Steps

1. ✅ Configure additional states/counties
2. ✅ Set up Smarty API for address validation
3. ✅ Enable automated scheduling
4. ✅ Browse properties in main app
5. ✅ Add properties to your pipeline

---

**Ready to find tax sale opportunities? Start scraping!** 🚀
