# Win With Deeds - Tax Deed Investment Platform

A comprehensive platform for tax deed investors featuring AI-powered tools, nationwide auction tracking, property listings marketplace, and professional resources.

## 🎯 Overview

**Win With Deeds** is the premier tax deed investment platform that combines:
- **Nationwide Auction Calendar**: Track upcoming tax sales across all 50 states
- **User Marketplace**: List and sell your own tax deed properties
- **Property Database**: Search and analyze thousands of properties
- **AI Tools**: Automated deal analysis, buyer matching, and property valuation
- **Membership Tiers**: Flexible plans from Pro Investor to Elite Mentee to Syndicate

---

## 🚀 Key Features

### 1. **Nationwide Upcoming Sales Calendar** 🗓️
Browse tax deed, tax lien, and sheriff sales happening across the United States.

**Features:**
- Filter by state, county, and sale type
- Registration deadlines and deposit requirements
- Direct links to county websites
- Contact information for each sale
- Updated weekly via automated scraper

**Pages:**
- `/upcoming-sales` - Public calendar view (no login required)

**Implementation:**
- Component: `src/pages/UpcomingSales.jsx`
- Scraper: `tools/scrape-upcoming-sales.js`
- Database: `upcoming_sales` table

---

### 2. **User Property Listings** 🏠
Investors can list their tax deed properties for sale on the marketplace.

**Features:**
- Create detailed property listings with all relevant info
- Upload multiple images (planned)
- Set pricing and property details
- Manage listing status (active/withdrawn/sold)
- Track views and engagement

**Pages:**
- `/add-listing` - Create new property listing
- `/my-listings` - View and manage your listings
- `/properties` - Browse all marketplace properties

**Implementation:**
- Components: `src/pages/AddListing.jsx`, `src/pages/MyListings.jsx`
- Database: `user_listings` table

---

### 3. **Membership System** 💳

Three tiers designed for different investor needs:

#### **Pro Investor** - $99/month
- Full property database access
- Basic AI deal analysis
- 10 Buyer-Match searches/month
- Standard support

#### **Mentee Elite** - $299/month (Most Popular)
- Everything in Pro Investor
- AI Dispo Copilot & Deal Microsites
- Deal Rescue Engine (3 deals/mo)
- Exclusive mentee webinars
- Direct Q&A with mentors
- Priority support

#### **Syndicate** - Custom Pricing
- Everything in Mentee Elite
- Unlimited AI tool usage
- Team accounts & collaboration
- API access
- Dedicated account manager

**Pages:**
- `/membership` - View plans and pricing
- `/checkout` - Stripe payment integration (in progress)

---

### 4. **Property Intelligence** 🔍

**Tax Delinquent Leads**
- Properties with outstanding tax obligations
- Multiple status levels (Initial Notice, Final Notice, Lien Filed, etc.)
- Panel and table views
- Import CSV functionality

**Redeemable Deeds**
- Properties in redemption period
- Track redemption deadlines
- Calculate redemption amounts by state
- Skip trace and AI valuation tools

**Pages:**
- `/tax-delinquent-leads`
- `/redeemable-deeds`
- `/calendar` - Personal auction tracking calendar

---

### 5. **AI-Powered Tools** 🤖

- **Scout AI Agents**: Automated property hunting 24/7
- **Deal Dossier**: Instant due diligence reports
- **Buyer-Match Graph**: Find top 20 likely buyers
- **AI Dispo Copilot**: Generate deal microsites
- **Deal Rescue Engine**: Revive stalled deals
- **Property Uploader**: AI-powered CSV/PDF parsing

**Pages:**
- `/ai-workforce`
- `/buyer-match`
- `/deal-microsite`
- `/deal-rescue`

---

## 📦 Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Stripe account (for payments)

### 1. Clone and Install
```bash
git clone <repository-url>
cd tx-deed
npm install
```

### 2. Environment Variables
Create a `.env` file in the root:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_service_key
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_key
```

### 3. Database Setup
Run the SQL schema to create all necessary tables:
```bash
psql -h your_db_host -U your_user -d your_database -f supabase_schema.sql
```

Or execute directly in Supabase SQL Editor:
```sql
-- Copy contents of supabase_schema.sql
```

**Tables Created:**
- `user_listings` - User property listings
- `upcoming_sales` - Nationwide auction calendar
- `subscriptions` - Membership tracking
- `user_favorites` - Saved properties
- `usage_tracking` - Tier limit tracking

### 4. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000`

---

## 🗄️ Database Schema

### User Listings Table
```sql
CREATE TABLE user_listings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  title VARCHAR(255),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  county VARCHAR(100),
  property_type VARCHAR(50),
  description TEXT,
  price DECIMAL(12,2),
  images TEXT[],
  parcel_id VARCHAR(100),
  acreage DECIMAL(10,2),
  bedrooms INTEGER,
  bathrooms DECIMAL(3,1),
  square_feet INTEGER,
  year_built INTEGER,
  redemption_period_ends DATE,
  sale_date DATE,
  liens_amount DECIMAL(12,2),
  estimated_value DECIMAL(12,2),
  status VARCHAR(20) DEFAULT 'active',
  views INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Upcoming Sales Table
```sql
CREATE TABLE upcoming_sales (
  id UUID PRIMARY KEY,
  state VARCHAR(2),
  county VARCHAR(100),
  sale_date DATE,
  sale_time TIME,
  location_name TEXT,
  location_address TEXT,
  registration_deadline DATE,
  deposit_required BOOLEAN,
  deposit_amount DECIMAL(12,2),
  sale_type VARCHAR(50),
  num_properties INTEGER,
  website_url TEXT,
  contact_phone VARCHAR(20),
  contact_email VARCHAR(100),
  notes TEXT,
  source_url TEXT,
  last_verified TIMESTAMP,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

---

## 🕷️ Scraper Setup

The scraper collects upcoming tax sales from county websites nationwide.

### Run Manually
```bash
node tools/scrape-upcoming-sales.js
```

### Schedule (Recommended)
Run weekly via cron job or cloud scheduler:
```cron
0 3 * * 0 cd /path/to/tx-deed && node tools/scrape-upcoming-sales.js
```

### Adding New Counties
1. Add county config to `COUNTY_CONFIGS` array
2. Create scraper function (e.g., `scrapeCountyNameST()`)
3. Update switch statement in `scrapeAll()`

**Current Coverage:**
- Georgia: Fulton County
- Florida: Miami-Dade County
- Arizona: Maricopa County
- Texas: Harris County

---

## 🎨 Tech Stack

### Frontend
- **React 18** - UI framework
- **React Router** - Navigation
- **Tailwind CSS** - Styling
- **Radix UI** - Component primitives
- **Framer Motion** - Animations
- **Lucide React** - Icons
- **date-fns** - Date manipulation

### Backend
- **Supabase** - Database, Auth, Storage
- **PostgreSQL** - Relational database
- **Row Level Security** - Data protection

### Payments
- **Stripe** - Subscription management

### Build Tools
- **Vite** - Build tool & dev server
- **ESLint** - Code linting

---

## 📂 Project Structure

```
tx-deed/
├── src/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── Navbar.jsx       # Main navigation
│   │   ├── Footer.jsx
│   │   └── PropertyCard.jsx
│   ├── pages/
│   │   ├── AddListing.jsx       # NEW: Add property listing
│   │   ├── MyListings.jsx       # NEW: Manage listings
│   │   ├── UpcomingSales.jsx    # NEW: Nationwide sales
│   │   ├── Properties.jsx       # Browse marketplace
│   │   ├── TaxDelinquentLeads.jsx
│   │   ├── RedeemableDeeds.jsx
│   │   ├── Membership.jsx
│   │   ├── Dashboard.jsx
│   │   └── admin/           # Admin panel
│   ├── contexts/
│   │   └── SupabaseAuthContext.jsx
│   ├── lib/
│   │   ├── customSupabaseClient.js
│   │   ├── mockData.js
│   │   └── utils.js
│   └── App.jsx              # Routes
├── tools/
│   └── scrape-upcoming-sales.js  # NEW: Scraper service
├── supabase_schema.sql           # NEW: Database schema
├── package.json
└── vite.config.js
```

---

## 🧪 Testing

### Manual Testing Checklist

#### User Listings
- [ ] Create new listing with all fields
- [ ] View "My Listings" page
- [ ] Edit listing status (activate/deactivate)
- [ ] Delete listing with confirmation
- [ ] Verify RLS (can't edit others' listings)

#### Upcoming Sales
- [ ] Browse sales without login (public access)
- [ ] Filter by state
- [ ] Filter by county search
- [ ] Filter by sale type
- [ ] Click external links to county websites

#### Navigation
- [ ] Verify "Upcoming Sales" in guest nav
- [ ] Verify "My Listings" dropdown for members
- [ ] Test mobile responsive menu
- [ ] Verify protected routes redirect to login

#### Database
- [ ] Verify user_listings table created
- [ ] Verify upcoming_sales table created
- [ ] Test RLS policies
- [ ] Test triggers (updated_at)

---

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel --prod
```

### Deploy to Netlify
```bash
netlify deploy --prod
```

### Environment Variables in Production
Don't forget to set all environment variables in your hosting platform:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`

---

## 📈 Future Enhancements

### Planned Features
- [ ] Image upload for listings (Supabase Storage)
- [ ] Stripe subscription integration
- [ ] Usage tracking per membership tier
- [ ] Favorites/saved properties
- [ ] Property messaging system
- [ ] Enhanced scraper with 50+ counties
- [ ] Email notifications for new sales
- [ ] Mobile app (React Native)
- [ ] Advanced AI property analysis
- [ ] Integration with MLS data

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

---

## 📝 License

This project is proprietary and confidential.

---

## 👥 Support

- **Documentation**: See this README
- **Issues**: Open a GitHub issue
- **Email**: support@winwithdeeds.com (if configured)

---

## 🎉 What's New

### Latest Update: Comprehensive Platform Expansion

**New Features Added:**

1. **Nationwide Upcoming Sales Calendar**
   - Public access (no login required)
   - Filter by state, county, type
   - Weekly automated updates
   - Direct county website links

2. **User Property Listings**
   - Create detailed listings
   - Manage your properties
   - Track views and performance
   - Activate/deactivate listings

3. **Complete Database Schema**
   - `user_listings` table
   - `upcoming_sales` table
   - `subscriptions` table
   - `user_favorites` table
   - `usage_tracking` table
   - Full RLS policies

4. **Scraper Service**
   - Automated data collection
   - Template for 50+ counties
   - Configurable schedule
   - Error handling & logging

5. **Enhanced Navigation**
   - "Upcoming Sales" in public nav
   - "My Listings" dropdown for members
   - Mobile responsive improvements

---

## 📞 Contact

**Win With Deeds**
Your Premier Tax Deed Investment Platform

Built with ❤️ for real estate investors
