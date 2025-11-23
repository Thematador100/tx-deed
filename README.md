# 🏠 Win With Deeds - Enterprise Tax Deed Investment Platform

> The most advanced tax deed intelligence platform ever created. Real data, real AI, real results.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-18.2-blue.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Latest-green.svg)](https://supabase.com/)
[![AI Powered](https://img.shields.io/badge/AI-Claude%20%26%20GPT-purple.svg)](https://www.anthropic.com/)

---

## 🌟 What Makes This Platform Different

This is **NOT** a prototype. This is a **fully functional enterprise platform** with:

✅ **Real county scrapers** - Configurable for 300+ US counties
✅ **Real skip tracing** - BatchSkipTracing API integration for owner contact data
✅ **Real AI analysis** - Claude AI for property analysis, deal scoring, risk assessment
✅ **Real SMS/Email** - Telnyx + Resend for compliant outreach
✅ **Real buyer matching** - OpenAI embeddings for semantic property-buyer matching
✅ **Real marketplace** - Buy/sell listings with offers and escrow
✅ **No fake data** - All mock data removed, only real database queries

---

## 🚀 Features

### 🔍 Data Collection
- **County Scrapers**: Automated scraping of tax deed auctions from 300+ counties
- **Configurable Selectors**: Admin interface to configure scraper for any county website
- **Scheduled Runs**: Cron jobs for daily/weekly scraping
- **Smart Deduplication**: Automatic detection and merging of duplicate properties
- **API Integration**: Support for counties with official APIs

### 🕵️ Skip Tracing
- **Owner Contact Data**: Phone numbers, emails, addresses via BatchSkipTracing
- **Alternative Sources**: TLOxp integration for premium data
- **Historical Data**: Previous addresses, relatives, associates
- **Credit System**: Pay-per-use skip tracing with user credits
- **Cache Results**: Avoid duplicate charges for same property

### 🤖 AI Intelligence
- **Property Analysis**: Claude AI analyzes deals, calculates opportunity scores
- **Risk Assessment**: Identifies red flags, environmental risks, market conditions
- **Pricing Recommendations**: AI-suggested bid prices based on market data
- **Deal Scoring**: 0-100 opportunity score based on ROI, equity, location
- **Investment Strategies**: Suggests fix-flip, buy-hold, wholesale, development

### 🎯 Scout Agents
- **Automated Property Discovery**: AI agents find deals matching your criteria
- **County Targeting**: Set which counties to monitor
- **Smart Filters**: Property type, beds/baths, minimum score, max price
- **Real-time Notifications**: Email/SMS when matches are found
- **Performance Tracking**: See how many deals each agent has found

### 📧 Outreach Campaigns
- **SMS/MMS via Telnyx**: Send text messages with property photos
- **Email via Resend**: Professional email templates
- **TCPA Compliant**: Built-in consent tracking and DNC list checking
- **Campaign Management**: Create sequences, schedule sends, track engagement
- **Template Library**: Pre-built templates for property inquiries, deal alerts
- **Opt-out Handling**: Automatic "STOP" command processing

### 🏪 Marketplace
- **List Deals**: Sell wholesale deals, assignments, or deeds
- **Buyer Matching**: AI finds top 20 buyers for any property
- **Offers System**: Make offers, counter-offers, track deal status
- **Proof of Funds**: Verify buyer qualifications
- **NDA Gating**: Require NDAs for sensitive deals
- **Escrow Integration**: Connect to title companies for closing

### 📊 Analytics & Reporting
- **Dashboard**: Total investments, successful bids, portfolio value
- **Scout Performance**: Properties found, match rate, agent efficiency
- **Campaign Metrics**: Open rates, click rates, replies, conversions
- **ROI Tracking**: Profit/loss on each deal
- **Market Insights**: County-level trends, appreciation rates

### 📚 Education Library
- **50-State Tax Laws**: Complete guide to tax deeds and liens in every state
- **County Procedures**: Auction registration, bidding rules, payment methods
- **Redemption Periods**: State-by-state redemption timelines and penalties
- **Video Courses**: Step-by-step training on tax deed investing
- **Case Studies**: Real deals with analysis and outcomes

### 🔐 Security & Compliance
- **Row-Level Security**: Users can only see their own data
- **API Key Encryption**: Secure storage of third-party API credentials
- **10DLC Registration**: Compliant SMS sending with Telnyx
- **TCPA Tracking**: Consent verification before outreach
- **CAN-SPAM**: Automatic unsubscribe links in all emails
- **Audit Logs**: Track all user activity and API calls

---

## 🏗️ Architecture

### Frontend
- **React 18.2** - Modern UI with hooks
- **Vite** - Lightning-fast dev server and build
- **TailwindCSS** - Utility-first styling
- **Radix UI** - Accessible component primitives
- **Framer Motion** - Smooth animations
- **React Router** - Client-side routing

### Backend
- **Supabase** - PostgreSQL database, auth, edge functions
- **Supabase Edge Functions** - Serverless TypeScript functions
- **PostgreSQL** - Relational database with full-text search
- **pgvector** - Vector embeddings for AI matching
- **Row-Level Security** - Database-level access control

### APIs & Integrations
- **Anthropic Claude** - AI property analysis
- **OpenAI** - Text embeddings for buyer matching
- **Telnyx** - SMS/MMS/Voice
- **Resend** - Transactional email
- **BatchSkipTracing** - Owner contact data
- **Smarty Streets** - Address validation
- **Stripe** - Payment processing
- **Puppeteer** - Browser automation for scraping

### Infrastructure
- **Puppeteer/Playwright** - Headless browser for scrapers
- **Cron Jobs** - Scheduled scraper runs
- **BullMQ** - Job queue for background processing
- **Redis** - Caching and session storage
- **Proxy Network** - Residential proxies for scraping

---

## 📦 Installation

### Prerequisites
- Node.js 18+ and npm
- Supabase account (free tier works)
- API keys for integrations (see .env.example)

### Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/tx-deed.git
cd tx-deed

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your API keys

# 4. Run database migrations
# In Supabase Studio, run the SQL from supabase/migrations/001_complete_platform_schema.sql

# 5. Deploy Edge Functions (optional, for scrapers/AI)
supabase functions deploy county-scraper
supabase functions deploy skip-trace
supabase functions deploy ai-analysis
supabase functions deploy send-sms
supabase functions deploy send-email
supabase functions deploy buyer-match

# 6. Start development server
npm run dev

# 7. Open http://localhost:3000
```

---

## 🔧 Configuration

### Database Setup

1. **Create Supabase Project**: Go to [supabase.com](https://supabase.com) and create a new project

2. **Run Migrations**: Copy the SQL from `supabase/migrations/001_complete_platform_schema.sql` and run in Supabase SQL Editor

3. **Enable Extensions**: Ensure `pg_cron` and `vector` extensions are enabled

4. **Set Up API Keys**: Insert your API keys into the `api_keys` table:

```sql
INSERT INTO api_keys (service_name, api_key_encrypted, is_global) VALUES
('Anthropic', 'sk-ant-your-key-here', true),
('OpenAI', 'sk-your-key-here', true),
('Telnyx', 'KEYyour-key-here', true),
('Resend', 're_your-key-here', true),
('BatchSkipTracing', 'your-key-here', true);
```

### County Scraper Configuration

To add a new county scraper:

1. **Add County to Database**:
```sql
INSERT INTO us_counties (state_code, state_name, county_name, tax_sale_type, redemption_period_months, online_auction_available)
VALUES ('GA', 'Georgia', 'Fulton', 'deed', 12, true);
```

2. **Configure Scraper**:
```sql
INSERT INTO scraper_configs (county_id, scraper_type, target_url, selectors)
VALUES (
  '<county-id-from-above>',
  'puppeteer',
  'https://county-auction-website.com/listings',
  '{
    "property_row": "tr.property-row",
    "parcel_id": ".parcel-id",
    "address": ".address",
    "owner": ".owner-name",
    "starting_bid": ".bid-amount",
    "auction_date": ".auction-date"
  }'::jsonb
);
```

3. **Test Scraper**:
```javascript
import { runCountyScraper } from '@/services/api';
const result = await runCountyScraper('county-id-here');
```

---

## 🎯 Usage

### Running County Scrapers

```javascript
// From admin dashboard or API
import { runCountyScraper } from '@/services/api';

const result = await runCountyScraper(countyId);
console.log(`Found ${result.properties_found} properties`);
```

### Performing Skip Trace

```javascript
import { performSkipTrace } from '@/services/api';

const result = await performSkipTrace(propertyId);
console.log(`Found ${result.phones_found} phone numbers`);
```

### AI Property Analysis

```javascript
import { analyzeProperty } from '@/services/api';

const analysis = await analyzeProperty(propertyId);
console.log(`Opportunity Score: ${analysis.opportunity_score}/100`);
console.log(`Recommended Bid: $${analysis.recommended_bid}`);
```

### Sending SMS Outreach

```javascript
import { sendSMS } from '@/services/api';

await sendSMS({
  toPhone: '+14155551234',
  message: 'Hi, I\'m interested in purchasing your property at 123 Main St. Cash offer, quick close. Call me at 555-0100.',
  propertyId: 'property-id-here'
});
```

### Matching Buyers to Property

```javascript
import { matchBuyers } from '@/services/api';

const result = await matchBuyers(propertyId, 20);
console.log(`Found ${result.total_matches} matching buyers`);

result.top_matches.forEach(buyer => {
  console.log(`${buyer.buyer_name}: ${buyer.match_score}/100`);
});
```

---

## 📊 Database Schema

### Core Tables
- `profiles` - User accounts with subscription tiers
- `properties` - Complete property database
- `us_counties` - County configuration for all US counties
- `scraper_configs` - Scraper settings per county
- `scraper_runs` - Execution logs and results

### Skip Tracing & Outreach
- `skip_trace_results` - Owner contact information
- `outreach_campaigns` - Email/SMS campaigns
- `outreach_messages` - Individual messages sent
- `dnc_list` - Do Not Call registry

### AI & Matching
- `scout_agents` - User's automated deal-finding agents
- `buyer_profiles` - Buyer preferences with embeddings
- `marketplace_listings` - Properties for sale
- `offers` - Buy/sell offer management

### Education & Content
- `library_items` - Videos, PDFs, articles
- `state_tax_laws` - 50-state legal database

---

## 🔑 API Reference

### Supabase Edge Functions

All Edge Functions require authentication via Bearer token.

#### County Scraper
```typescript
POST /functions/v1/county-scraper
{
  "county_id": "uuid"
}
```

#### Skip Trace
```typescript
POST /functions/v1/skip-trace
{
  "property_id": "uuid"
}
```

#### AI Analysis
```typescript
POST /functions/v1/ai-analysis
{
  "property_id": "uuid"
}
```

#### Send SMS
```typescript
POST /functions/v1/send-sms
{
  "to_phone": "+14155551234",
  "message": "Your message here",
  "property_id": "uuid" // optional
}
```

#### Send Email
```typescript
POST /functions/v1/send-email
{
  "to_email": "buyer@example.com",
  "subject": "New Property Alert",
  "template_id": "deal_alert",
  "variables": { ... }
}
```

#### Buyer Match
```typescript
POST /functions/v1/buyer-match
{
  "property_id": "uuid",
  "max_matches": 20
}
```

---

## 💰 Pricing & Credits

### Subscription Tiers
- **Pro Investor**: $99/mo - Database access, 10 buyer searches/month
- **Mentee Elite**: $299/mo - AI tools, 3 Deal Rescue uses, webinars, priority support
- **Syndicate**: Custom - Team accounts, API access, dedicated account manager

### Usage-Based Pricing
- Skip Trace: $0.25 per property
- SMS: $0.0079 per message
- Email: $0.0001 per message
- AI Analysis: Included in subscription

---

## 🛠️ Development

### Project Structure
```
tx-deed/
├── src/
│   ├── components/       # React components
│   ├── pages/           # Page components
│   ├── contexts/        # React contexts
│   ├── lib/             # Utilities
│   ├── services/        # API integrations
│   └── hooks/           # Custom React hooks
├── supabase/
│   ├── functions/       # Edge Functions
│   └── migrations/      # SQL migrations
├── public/              # Static assets
└── tools/               # Build tools
```

### Running Tests
```bash
npm run test
```

### Building for Production
```bash
npm run build
```

### Deploying
```bash
# Deploy to Vercel, Netlify, or similar
npm run build
# Upload dist/ folder
```

---

## 🤝 Contributing

This is a proprietary platform, but we welcome feedback and bug reports.

---

## 📄 License

Proprietary. All rights reserved.

---

## 🆘 Support

- **Documentation**: See `/docs` folder
- **Email**: support@winwithdeeds.com
- **Discord**: [Join our community](https://discord.gg/winwithdeeds)

---

## 🎉 What's Next?

- [ ] Mobile apps (iOS/Android)
- [ ] Advanced analytics dashboard
- [ ] Deal calculator tool
- [ ] Automated title search integration
- [ ] Lender network expansion

---

**Built with ❤️ by tax deed investors, for tax deed investors.**
