# Tax Sale Data Scraper Services

This directory contains scraper services for various tax sale data sources.

## Architecture

```
scrapers/
├── base/
│   ├── BaseScraper.js         # Abstract base class for all scrapers
│   └── ScraperConfig.js       # Configuration management
├── sources/
│   ├── TaxSaleResourcesScraper.js
│   └── [future sources]
├── transformers/
│   ├── PropertyTransformer.js # Normalize property data
│   └── AddressNormalizer.js   # Standardize addresses
├── scheduler/
│   └── ScraperScheduler.js    # Automated execution
└── utils/
    ├── ProxyManager.js        # Proxy rotation
    ├── RateLimiter.js         # Rate limiting
    └── ErrorHandler.js        # Error handling & retry logic
```

## Features

- **Multi-source support**: Easily add new data sources
- **AI-powered extraction**: LLM-based data parsing for dynamic sites
- **Proxy rotation**: Avoid IP blocks
- **Rate limiting**: Respectful scraping
- **Automatic retries**: Exponential backoff
- **Data normalization**: Consistent schema across sources
- **Address validation**: Integration with Smarty API
- **Scheduled execution**: Automated data updates

## Usage

See individual scraper documentation for specific usage instructions.
