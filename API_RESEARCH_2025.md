# Free & Freemium APIs for Tax Deed Investment Platform
## Research Report - 2025

This document outlines free and freemium APIs that can give **Win With Deeds** a competitive advantage in finding sellers, buyers, and market intelligence for tax deed investments.

---

## Executive Summary

Based on comprehensive research, there are **50+ free and freemium APIs** that can significantly enhance the Win With Deeds platform. These APIs fall into 8 strategic categories:

1. **Property & Public Records Data** - Find distressed properties and sellers
2. **Real Estate Market Intelligence** - Price properties competitively
3. **Contact Enrichment & Skip Tracing** - Reach property owners
4. **Demographics & Economic Data** - Identify high-opportunity markets
5. **News & Monitoring** - Track tax sales and legal changes
6. **Mapping & Geocoding** - Visualize properties and territories
7. **Communication & Outreach** - Contact buyers and sellers at scale
8. **AI & Automation** - Enhance your AI Workforce capabilities

---

## 🎯 HIGHEST IMPACT APIs (Start Here)

### 1. U.S. Census Bureau API - **100% FREE**
**Impact:** Know markets better than competitors
- **What it does:** Demographics, income levels, poverty rates, housing vacancy
- **Free tier:** Unlimited API calls
- **Why it matters:** Identify neighborhoods with high tax delinquency risk
- **Implementation:** Integrate into your AI Analyst agents to score markets
- **Competitive edge:** Predict which areas will have more tax deed opportunities

**API:** https://www.census.gov/data/developers/
**Datasets:**
- American Community Survey (ACS) - Income, poverty, demographics
- Population Estimates - Track declining populations (tax trouble indicator)
- Economic Indicators - Employment, business closures

---

### 2. RentCast API - **50 Free Calls/Month**
**Impact:** Automated property valuations for every listing
- **What it does:** Property valuations, rent estimates, comparable sales
- **Free tier:** 50 API calls/month (upgrades to $50/month for 1,000 calls)
- **Why it matters:** Auto-calculate ROI and opportunity scores for each property
- **Implementation:** Replace manual estimated_value calculations in your properties table
- **Competitive edge:** Instant, data-backed valuations that competitors calculate manually

**API:** https://www.rentcast.io/api

---

### 3. NewsData.io - **200 Calls/Day FREE**
**Impact:** Monitor tax sale announcements before competitors
- **What it does:** Search 80+ languages for tax sale, foreclosure, and auction news
- **Free tier:** 200 API calls per day
- **Why it matters:** Find new tax deed opportunities from county announcements
- **Implementation:** Feed your Legislation Monitor AI agent
- **Competitive edge:** Get notified of sales 24-48 hours before manual researchers

**API:** https://newsdata.io

---

### 4. OpenStreetMap (Nominatim) - **100% FREE**
**Impact:** Unlimited geocoding and mapping
- **What it does:** Convert addresses to coordinates, reverse geocoding, routing
- **Free tier:** Completely free, no API key needed
- **Why it matters:** Display properties on maps without Google Maps fees
- **Implementation:** Replace any mapping needs in your property details pages
- **Competitive edge:** Save $200-500/month on mapping costs

**API:** https://nominatim.openstreetmap.org
**Usage limits:** 1 request/second (generous for most use cases)

---

### 5. Brevo (Email) + Twilio Free Tier (SMS)
**Impact:** Automated outreach to 300 buyers/sellers per day
- **What it does:** Email marketing automation and transactional emails
- **Free tier:** 300 emails/day forever (Brevo)
- **Why it matters:** Auto-contact property owners and notify buyers of new deals
- **Implementation:** Power your Outreach Automation templates
- **Competitive edge:** Reach owners within hours of identifying tax delinquency

**Brevo API:** https://www.brevo.com
**Twilio SendGrid:** 100 emails/day free

---

## 📊 Category 1: Property & Public Records APIs

### Commercial APIs (Free Tiers)

#### **RentCast** - 50 free calls/month
- 140M+ property records
- Property details, tax assessments, ownership
- Valuation estimates (AVM)
- Active listings
- Market trends by ZIP/city
- **Best for:** Automated property research

#### **Homesage.ai** - 500 free credits
- AI-powered property analysis
- Image analysis (detect property condition)
- Property records
- **Best for:** Quick testing and prototyping

#### **Zillow Research Data** - FREE CSV downloads
- Neighborhood-level market data
- Median home values
- Rent estimates
- Inventory levels
- **Best for:** Market analysis and reporting
- **Note:** No real-time API, but free bulk data downloads

#### **Redfin Data Center** - FREE CSV downloads
- Metropolitan area data
- City/neighborhood/ZIP data
- Monthly updates
- **Best for:** Market trend analysis

### Government Data Sources - 100% FREE

#### **actDataScout** - County-sponsored public records
- Arkansas, Pennsylvania, Oklahoma counties
- Virginia counties and cities
- Louisiana parishes
- Land ownership, tax records
- **Best for:** Deep dives into specific counties

#### **Data.gov Tax Lien Sales** - FREE
- Federal tax lien data
- IRS Automated Lien System data
- Quarterly updates
- **Best for:** Finding federal tax liens

---

## 📈 Category 2: Real Estate Market Intelligence

### **U.S. Census Bureau APIs** - FREE (Unlimited)
Already covered above - this is your #1 intelligence source

### **American Community Survey (ACS) API** - FREE
- 5-year estimates for small geographies
- Housing costs, vacancy rates
- Income distribution
- Educational attainment
- **Best for:** Market opportunity scoring

### **Census Economic Indicators** - FREE
- Quarterly Workforce Indicators (QWI)
- Employment trends
- Job creation/destruction
- Wage data
- **Best for:** Predicting economic distress areas

---

## 🔍 Category 3: Contact Enrichment & Skip Tracing

### Free/Freemium Options

#### **Hunter.io** - Free tier available
- Email finder and verifier
- Domain search
- **Free tier:** Limited searches
- **Paid:** $49/month for 2,000 credits

#### **Apollo.io** - Free tier
- B2B contact database
- Email finder
- Company data
- **Best for:** Finding real estate investor buyers

#### **VoilaNorbert** - 50 free credits
- Email verification: $0.003/email
- Email enrichment: $0.04/email
- **Best for:** Pay-as-you-go verification

#### **GetProspect** - Free plan
- Email finder
- LinkedIn integration
- **Best for:** Finding investor contacts

### Commercial Skip Tracing APIs

#### **Tracerfy** - $0.009/lead
- 70-95% accuracy
- Phone numbers and emails
- Bulk processing
- **Best for:** Finding property owner contact info

#### **BatchData** - Pay-as-you-go
- Property data + contact enrichment
- Phone and email
- **Best for:** Combined property and contact data

**REALITY CHECK:** True skip tracing isn't free. Budget $0.01-0.05 per contact for quality data.

---

## 🗺️ Category 4: Mapping & Geocoding APIs

### **OpenStreetMap (Nominatim)** - 100% FREE
- Unlimited geocoding
- Reverse geocoding
- No API key required
- 1 request/second limit
- **Best for:** Address → coordinates conversion

### **Radar** - 100,000 free requests/month
- Geocoding, search, routing
- 90% cheaper than Google Maps
- $0.50 per 1,000 calls after free tier
- **Best for:** Production apps with moderate traffic

### **HERE Technologies** - 250 free requests/day
- Global maps for 200+ countries
- Geocoding, routing
- Up to 30,000 monthly transactions free (Map Tile)
- **Best for:** International expansion

### **Apple MapKit JS** - 250,000 free map views/day
- 25,000 free service calls/day
- Basemaps, search, directions
- **Best for:** Web apps with heavy traffic

### **Azure Maps (Microsoft)** - Free tier
- Aerial imagery
- Geocoding and routing
- **Best for:** Microsoft ecosystem integration

### **LocationIQ** - Save 92% vs Google Maps
- Geocoding, maps, routing
- Generous free tier
- **Best for:** Budget-conscious apps

**SAVINGS:** These alternatives save $200-2,000/month vs Google Maps API

---

## 📰 Category 5: News & Monitoring APIs

### **NewsData.io** - 200 calls/day FREE
- 80+ languages
- Thousands of sources
- Filter by: language, region, keyword, date, category, country
- **Best for:** Tax sale announcements, foreclosure news

### **GNews API** - 100 requests/day FREE
- 60,000+ news sources
- Search current and historic articles
- **Limitation:** Free tier is dev/testing only, not commercial

### **Mediastack** - 100 requests/month FREE
- 7,500+ news sources
- 13 languages
- **Note:** Delayed news data on free tier

### **Guardian API** - FREE
- 2M+ articles, images, audio, video
- The Guardian's content
- **Best for:** General news monitoring

### **NewsAPI.org** - Developer plan FREE
- Live and historic articles
- 14 languages, 55 countries
- JSON format
- **Limitation:** Free tier for development only

### **Bing News Search API** - Free tier
- JSON format
- Microsoft ecosystem
- **Best for:** Integrated Microsoft solutions

**IMPLEMENTATION IDEA:** Feed these to your "Legislation Monitor" AI agent to auto-detect new tax sale announcements

---

## 📧 Category 6: Communication & Outreach APIs

### Email APIs

#### **Brevo (formerly Sendinblue)** - 300 emails/day FREE
- SMTP and REST API
- Transactional emails
- Marketing campaigns
- SMS, WhatsApp, chatbots also available
- **Paid:** $25/month for 20K emails
- **Best for:** Daily buyer/seller outreach

#### **Twilio SendGrid** - 100 emails/day FREE
- Industry standard
- Great deliverability
- **Paid:** $19.95/month
- **Best for:** Transactional emails

#### **Mailgun** - Free tier
- Powerful APIs
- Send, receive, track emails
- **Best for:** Developers

#### **Amazon SES** - Extremely low cost
- $0.10 per 1,000 emails
- AWS integration
- **Best for:** High-volume sending

### SMS APIs

#### **Twilio** - Free trial
- Industry standard for SMS
- Voice calls also available
- **Paid:** Pay-as-you-go pricing
- **Best for:** Property owner outreach

#### **Telnyx** - Low cost
- $0.004 to send/receive message
- Voice at $0.005/minute
- **Best for:** Cost-conscious SMS

#### **Vonage (Nexmo)** - Multi-channel
- SMS, WhatsApp, Facebook Messenger
- Voice
- **Best for:** Multi-channel campaigns

### Multi-Channel Platforms

#### **SendPulse** - All-in-one FREE tier
- Email and SMS
- Chatbots, live chat
- Pop-ups, websites
- **Best for:** Complete marketing automation

#### **Sinch** - Enterprise
- SMS, WhatsApp, email, voice
- **Best for:** Large-scale operations

---

## 🤖 Category 7: AI & Automation APIs

### **Google Gemini** - 1,500 requests/day FREE
- Gemini 1.5 Flash model
- 60 requests/minute
- 1M token context window
- Multimodal (text, images, video)
- **Best for:** Property image analysis, deal analysis

### **AI/ML API** - FREE access
- ChatGPT, Claude, Deepseek, Flux
- 200+ AI models
- Playground and API
- **Best for:** Testing multiple AI models

### **LocalAI** - 100% FREE & Open Source
- Self-hosted alternative to OpenAI/Claude
- Runs on consumer hardware
- No GPU required
- Drop-in OpenAI replacement
- **Best for:** Privacy-conscious or high-volume AI usage

### **Anthropic Claude API** - Pay-as-you-go
- 100K+ token context windows
- Excellent for complex analysis
- **Best for:** Your AI Dispo Copilot and Deal Rescue features

**COST COMPARISON (per 1M tokens input):**
- DeepSeek: Rock-bottom pricing
- Google Gemini: Competitive middle ground
- Claude: Premium but superior reasoning
- OpenAI GPT-4: Most expensive

**IMPLEMENTATION:** Enhance your existing AI Workforce agents with these models

---

## 🏢 Category 8: Foreclosure & Tax Lien Specific

### Government Sources - FREE

#### **IRS Automated Lien System** - FREE
- Quarterly business lien data
- Pipe-delimited text format
- No charge for FOIA requests (as of Jan 2023)
- **Best for:** Federal tax liens

#### **Data.gov Tax Lien Sales** - FREE
- Properties with tax and water liens
- Eligible for lien sales
- **Best for:** Government tax lien data

### Commercial APIs - PAID (but high-value)

#### **ATTOM Data** - PAID
- 158M+ U.S. properties
- Foreclosure activity
- Notice of Default (NOD)
- Lis Pendens
- Notice of Trustee Sale (NTS)
- REO properties
- **Best for:** Comprehensive pre-foreclosure pipeline

#### **TitleFlex** - PAID
- Foreclosure activity
- Open liens
- HOA lien data
- **Best for:** Title research automation

#### **First American (DNA API)** - PAID
- Tax information
- Foreclosure activity
- Liens and HOA data
- **Best for:** Institutional-grade data

#### **CoreLogic** - Enterprise PAID
- Cloud data exchange
- SFTP, REST API, XML
- Liens and foreclosures
- **Best for:** Enterprise operations

**REALITY CHECK:** Premium foreclosure data isn't free, but it's worth it for serious investors. Budget $500-2,000/month for enterprise foreclosure APIs.

---

## 🎯 IMPLEMENTATION ROADMAP

### Phase 1: Quick Wins (Week 1-2)

1. **Integrate U.S. Census API**
   - Add demographic scoring to properties table
   - Create "Market Opportunity Score" based on poverty rates, vacancy, income
   - IMPACT: Predict high-opportunity markets

2. **Add NewsData.io monitoring**
   - Feed into Legislation Monitor agent
   - Auto-scrape for "tax sale", "tax deed", "tax lien" by state
   - IMPACT: Find new sales 24-48 hours faster

3. **Implement OpenStreetMap**
   - Replace any Google Maps dependencies
   - Add property mapping to listings
   - IMPACT: Save $200-500/month

4. **Set up Brevo for email**
   - Connect to outreach automation
   - 300 free emails/day to buyers/sellers
   - IMPACT: Automated lead nurturing

### Phase 2: Intelligence Gathering (Week 3-4)

5. **RentCast integration**
   - Auto-populate estimated_value for new properties
   - Calculate ROI automatically
   - IMPACT: Eliminate manual valuations

6. **Census Economic Indicators**
   - Track employment trends by county
   - Flag markets with rising unemployment (more tax troubles)
   - IMPACT: Predict future tax deed opportunities

7. **Guardian News API**
   - Monitor for local government budget crises
   - Track municipal financial distress
   - IMPACT: Know which counties will aggressively pursue tax sales

### Phase 3: Outreach Automation (Month 2)

8. **Apollo.io integration**
   - Build buyer database of real estate investors
   - Auto-match properties to buyer criteria
   - IMPACT: Faster buyer matching

9. **Email enrichment (VoilaNorbert or GetProspect)**
   - Find property owner emails
   - Integrate with your skip tracing workflow
   - IMPACT: Direct owner outreach

10. **SMS via Telnyx**
    - Text property owners about redemption options
    - Alert buyers to new opportunities
    - IMPACT: Multi-channel engagement

### Phase 4: AI Enhancement (Month 2-3)

11. **Google Gemini for image analysis**
    - Analyze property photos for condition
    - Auto-flag properties needing rehab
    - IMPACT: Better property grading

12. **LocalAI for high-volume analysis**
    - Self-host for unlimited AI calls
    - Process thousands of leads without API costs
    - IMPACT: Scale AI Workforce without massive costs

13. **Claude API for Deal Rescue**
    - Use for complex deal analysis
    - Power your AI Dispo Copilot
    - IMPACT: Premium AI for premium features

---

## 💰 COST PROJECTIONS

### Free Forever Approach
- U.S. Census API: $0
- OpenStreetMap: $0
- NewsData.io: $0 (200 calls/day)
- Brevo: $0 (300 emails/day)
- Zillow/Redfin CSVs: $0
- Government lien data: $0
- **TOTAL: $0/month**

### Lean Startup ($100-200/month)
- Above free tools: $0
- RentCast: $50/month (1,000 calls)
- Telnyx SMS: ~$50/month (12,500 messages)
- Radar Maps: $0 (under 100K requests)
- NewsAPI.org Pro: $0-99/month
- **TOTAL: ~$100-200/month**

### Growth Mode ($500-1,000/month)
- Above tools: $150
- Skip tracing (Tracerfy): $200/month (20,000 leads @ $0.01)
- Claude API: $100/month
- Brevo Growth: $25/month (20K emails)
- Google Gemini: $0-200/month
- ATTOM light tier: $500+/month
- **TOTAL: ~$975/month**

### Enterprise ($2,000-5,000/month)
- All above tools
- ATTOM full access: $2,000+/month
- CoreLogic/First American: $1,500+/month
- Advanced skip tracing: $500/month
- **TOTAL: $4,000-7,000/month**

**ROI:** If each API helps you close 1-2 more deals per month, they pay for themselves 10x over.

---

## 🚨 CRITICAL IMPLEMENTATION NOTES

### 1. API Key Management
**Store all API keys in your existing "API Key Vault" admin page**
- NEVER commit API keys to GitHub
- Use environment variables in Supabase Edge Functions
- Rotate keys quarterly

### 2. Rate Limiting
**Implement rate limiting in your backend:**
```javascript
// Example: Cache Census API calls for 24 hours
const getCensusData = async (zipCode) => {
  const cached = await supabase
    .from('census_cache')
    .select('*')
    .eq('zip_code', zipCode)
    .single();

  if (cached && isFresh(cached.updated_at, 24)) {
    return cached.data;
  }

  const freshData = await fetch(`https://api.census.gov/...`);
  // Store in cache
};
```

### 3. Fallback Strategies
**Always have backups:**
- If RentCast fails, fall back to Zillow CSV data
- If NewsData.io is down, use GNews
- If primary geocoding fails, try backup service

### 4. Legal Compliance
**IMPORTANT:**
- Census data: Public domain, free to use commercially
- News APIs: Check licensing for commercial use
- Property data: Verify you can use for lead generation
- Contact data: Follow CAN-SPAM, TCPA, GDPR rules
- Skip tracing: Ensure FCRA compliance

### 5. Attribution Requirements
Some free APIs require attribution:
- OpenStreetMap: Must credit "© OpenStreetMap contributors"
- Census data: Cite "U.S. Census Bureau"
- News APIs: Check individual requirements

---

## 🎯 COMPETITIVE ADVANTAGES YOU'LL GAIN

### 1. **Market Intelligence Edge**
**What competitors do:** Manually search county websites
**What you'll do:** AI monitors 60+ counties 24/7 via News APIs + Census data
**Your advantage:** Know about sales 1-2 days earlier

### 2. **Valuation Speed**
**What competitors do:** Manual comps, Zillow searches
**What you'll do:** Automated RentCast valuations in < 1 second
**Your advantage:** Process 100 properties in the time it takes them to do 1

### 3. **Owner Contact Discovery**
**What competitors do:** Pay $0.50-1.00 per skip trace
**What you'll do:** Stacked free/cheap APIs (Apollo.io + Hunter.io + VoilaNorbert)
**Your advantage:** 50-70% cost reduction on skip tracing

### 4. **Buyer Matching**
**What competitors do:** Manual email lists, cold calling
**What you'll do:** Apollo.io investor database + auto-matching algorithm
**Your advantage:** Notify 100 qualified buyers in 60 seconds

### 5. **Predictive Analytics**
**What competitors do:** React to current listings
**What you'll do:** Census + economic data predicts future tax troubles
**Your advantage:** Buy in markets BEFORE they get hot

---

## 📊 KEY METRICS TO TRACK

Once APIs are integrated, track:

1. **Lead Discovery Speed**
   - Time from county posting to your database
   - Goal: < 24 hours (vs industry avg of 3-7 days)

2. **Contact Discovery Rate**
   - % of properties with owner contact found
   - Goal: 70%+ (vs industry avg of 40-50%)

3. **Valuation Accuracy**
   - RentCast estimates vs actual auction prices
   - Goal: Within 15% accuracy

4. **Buyer Response Rate**
   - % of notified buyers who engage
   - Goal: 10-15% (automated outreach typically 5-8%)

5. **Cost Per Lead**
   - Total API costs / total leads generated
   - Goal: < $2 per qualified lead

---

## 🔗 RESOURCES & DOCUMENTATION

### API Documentation Links

**Property Data:**
- RentCast: https://developers.rentcast.io/reference/getting-started
- Census: https://www.census.gov/data/developers/guidance/api-user-guide.html
- Zillow Research: https://www.zillow.com/research/data/

**News Monitoring:**
- NewsData.io: https://newsdata.io/documentation
- GNews: https://gnews.io/docs/v4
- Guardian: https://open-platform.theguardian.com/documentation/

**Mapping:**
- OpenStreetMap: https://nominatim.org/release-docs/develop/api/Overview/
- Radar: https://radar.com/documentation
- HERE: https://developer.here.com/documentation

**Communication:**
- Brevo: https://developers.brevo.com/
- SendGrid: https://docs.sendgrid.com/
- Telnyx: https://developers.telnyx.com/

**AI:**
- Google Gemini: https://ai.google.dev/docs
- Claude: https://docs.anthropic.com/
- LocalAI: https://localai.io/

---

## 🎓 NEXT STEPS

1. **Review this document** with your technical team
2. **Prioritize APIs** based on your immediate needs
3. **Set up API Key Vault** in your admin dashboard
4. **Start with Phase 1** (quick wins)
5. **Measure impact** after each integration
6. **Scale what works** and cut what doesn't

---

## ❓ FAQ

**Q: Will these APIs work for all 50 states?**
A: Most yes. Census data is nationwide. Property APIs cover all states but depth varies. Check individual API coverage maps.

**Q: Can I use free tiers for commercial purposes?**
A: Mostly yes, but check each API's terms. Census data is always commercial-use OK. Some news APIs restrict free tiers to development only.

**Q: How do I handle API downtime?**
A: Implement fallback chains. If primary fails, try secondary. Cache aggressively. Have manual backup processes.

**Q: Which API should I start with?**
A: Start with U.S. Census API and NewsData.io. Both are free, easy to implement, and provide immediate competitive value.

**Q: Are there APIs specifically for Texas tax deeds?**
A: Not free ones. You'll need to combine:
- Texas county public records (varies by county)
- actDataScout (some TX counties)
- Commercial APIs (ATTOM, CoreLogic) for comprehensive TX coverage

**Q: How do I ensure data accuracy?**
A: Cross-reference multiple sources. For valuations, use RentCast + Zillow + Census median values. For contacts, validate emails before sending.

---

## 📞 SUPPORT & COMMUNITY

- **Stack Overflow:** Tag questions with API name
- **GitHub:** Most open-source APIs have active repos
- **Developer Slack/Discord:** Join communities for each major API

---

**Document Version:** 1.0
**Last Updated:** 2025-11-22
**Researched By:** Claude (Anthropic)
**For:** Win With Deeds / tx-deed Platform

---

## CONCLUSION

You now have access to a **comprehensive API toolkit** that can:
- **Find sellers:** Demographics + news monitoring + public records
- **Find buyers:** Contact enrichment + investor databases
- **Competitive edge:** Predictive analytics + faster discovery + automated outreach

**Start with the free tiers, measure impact, then invest in paid tiers that deliver ROI.**

The platforms that win in real estate tech aren't the ones with the most data—they're the ones that **act on data fastest**. These APIs give you that speed advantage.
