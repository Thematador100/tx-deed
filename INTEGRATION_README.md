# Tracerfy & Melissa Data Integration - Buy Module

This document describes the integration of Tracerfy skip tracing and Melissa Data address verification services into the Buy Module.

## Overview

The Buy Module provides comprehensive property research capabilities by combining:

1. **Melissa Data** - Address verification and property data enrichment
2. **Tracerfy** - Skip tracing to find property owner contact information

## Features

### 1. Address Verification (Melissa Data)
- Validates and standardizes property addresses
- Returns accurate geocoordinates (latitude/longitude)
- Provides county information and timezone data
- Includes delivery point validation
- Supports all US addresses with 240+ country support

### 2. Property Data Enrichment (Melissa Data)
- Enriches property information with additional data
- Returns property characteristics (when available)
- Provides assessed and market values
- Includes historical transaction data

### 3. Skip Tracing (Tracerfy)
- Finds property owner contact information with 97% accuracy
- Returns phone numbers and email addresses
- Provides related contacts and relatives
- Includes confidence scoring for results
- Processes results within minutes

## Setup Instructions

### 1. Install Dependencies

All required dependencies are already included in `package.json`. If you need to reinstall:

```bash
npm install
```

### 2. Configure API Keys

Create a `.env` file in the root directory (use `.env.example` as a template):

```bash
cp .env.example .env
```

Edit `.env` and add your API keys:

```env
# Tracerfy API
VITE_TRACERFY_API_KEY=your_tracerfy_api_key_here
VITE_TRACERFY_API_URL=https://api.tracerfy.com/v1

# Melissa Data API
VITE_MELISSA_LICENSE_KEY=your_melissa_license_key_here
VITE_MELISSA_API_URL=https://address.melissadata.net/v3/WEB/GlobalAddress/doGlobalAddress
```

### 3. Get API Keys

#### Tracerfy API Key
1. Visit [https://tracerfy.com/](https://tracerfy.com/)
2. Create an account or log in
3. Navigate to API settings in your dashboard
4. Generate a new API key
5. Add credits to your account (pricing starts at $0.009 per lead)

#### Melissa Data License Key
1. Visit [https://www.melissa.com/](https://www.melissa.com/)
2. Sign up for an account
3. Subscribe to the Global Address Verification API
4. Get your license key from the developer portal
5. Free trial available with 1,000 credits for $4.95

## File Structure

```
src/
├── pages/
│   └── BuyModule.jsx           # Main Buy Module page component
├── services/
│   ├── tracerfyService.js      # Tracerfy API service
│   └── melissaDataService.js   # Melissa Data API service
└── App.jsx                     # Updated with /buy-module route
```

## Usage

### Accessing the Buy Module

Once logged in, navigate to: `/buy-module`

The page is protected and requires authentication.

### Using the Interface

1. **Search Tab**
   - Enter property address details (street, city, state, zip)
   - Choose from four action buttons:
     - **Verify Address Only** - Quick address validation
     - **Get Property Data** - Address verification + property enrichment
     - **Skip Trace Owner** - Find owner contact information
     - **Full Analysis** - Run all services in sequence

2. **Verified Tab**
   - View standardized address
   - See geocoordinates and location data
   - Check verification status and result codes

3. **Property Data Tab**
   - View enriched property information
   - See property characteristics (when available)
   - Access market and assessed values

4. **Contacts Tab**
   - View owner phone numbers and emails
   - See confidence score for results
   - Access related contacts and relatives
   - Click-to-call and click-to-email functionality

## API Service Documentation

### Tracerfy Service (`src/services/tracerfyService.js`)

#### Functions

**`skipTraceSingle(propertyData)`**
- Skip trace a single property address
- Returns: phone numbers, emails, relatives, confidence score

**`skipTraceBulk(properties)`**
- Process multiple properties at once
- Returns: bulk results with job ID

**`getPricing()`**
- Get current pricing information
- Returns: pricing tiers and rates

**`getAccountBalance()`**
- Check account credit balance
- Returns: available credits and balance

### Melissa Data Service (`src/services/melissaDataService.js`)

#### Functions

**`verifyAddress(addressData)`**
- Verify and standardize an address
- Returns: verified address with geocoordinates

**`enrichPropertyData(addressData)`**
- Enrich address with property data
- Returns: verified address + property information

**`verifyAddressBatch(addresses)`**
- Verify multiple addresses in batch
- Returns: batch results with verification status

**Helper Functions:**
- `parseAddress(fullAddress)` - Parse address string into components
- `formatAddress(addressData)` - Format address object into string

## Error Handling

Both services include comprehensive error handling:

- Missing API keys return user-friendly error messages
- API errors are caught and returned in a consistent format
- Network errors are handled gracefully
- All functions return `{ success: boolean, data/error: any }` format

## Best Practices

1. **API Key Security**
   - Never commit `.env` file to version control
   - Keep API keys secure and rotate regularly
   - Use environment variables for all sensitive data

2. **Rate Limiting**
   - Melissa Data batch processing includes delays to respect rate limits
   - Monitor your API usage to avoid overages
   - Consider implementing client-side caching for repeated queries

3. **Cost Management**
   - Display Tracerfy credit balance to users
   - Warn users before running expensive operations
   - Track API usage for billing purposes

4. **Data Privacy**
   - Handle skip trace data responsibly
   - Comply with applicable data privacy regulations
   - Secure storage of personal information

## Pricing

### Tracerfy
- **Cost**: $0.009 per lead (less than 1 cent)
- **Accuracy**: 97% claimed accuracy rate
- **Volume**: Supports bulk processing
- **Payment**: Pay-as-you-go, no minimum contract

### Melissa Data
- **Trial**: 1,000 credits for $4.95
- **Production**: Custom pricing based on volume
- **Free Tier**: May be available for testing
- **Support**: 24/7 customer support available

## Troubleshooting

### Common Issues

**"API key is not configured" error**
- Ensure `.env` file exists in project root
- Check that environment variables are prefixed with `VITE_`
- Restart development server after adding environment variables

**No results returned**
- Verify the address is valid and complete
- Check API account has sufficient credits
- Review API response codes in browser console

**Network errors**
- Check internet connectivity
- Verify API endpoints are accessible
- Check for CORS issues in browser console

## Support

### Tracerfy Support
- Website: [https://tracerfy.com/](https://tracerfy.com/)
- Email: support@tracerfy.com
- Documentation: [https://tracerfy.com/api-docs](https://tracerfy.com/api-docs)

### Melissa Data Support
- Website: [https://www.melissa.com/](https://www.melissa.com/)
- Documentation: [https://docs.melissa.com/](https://docs.melissa.com/)
- Support Portal: [https://support.melissa.com/](https://support.melissa.com/)

## Future Enhancements

Potential improvements for the Buy Module:

1. **Bulk Processing UI**
   - CSV upload for batch address verification
   - Bulk skip tracing with progress tracking
   - Export results to CSV/Excel

2. **Advanced Property Data**
   - Integration with additional property databases
   - Historical transaction timeline
   - Comparable properties (comps) analysis

3. **Contact Management**
   - Save skip trace results to database
   - Track outreach attempts and responses
   - Integration with CRM systems

4. **Analytics Dashboard**
   - API usage tracking and reporting
   - Cost analysis and budget management
   - Success rate monitoring

## License

This integration is part of the Win With Deeds platform. Refer to the main project license for terms and conditions.

---

**Last Updated**: November 2025
**Version**: 1.0.0
