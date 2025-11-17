# 🏆 Win With Deeds - Tax Deed Investment Platform

**The Ultimate AI-Powered Tax Deed Investment Platform**

Win With Deeds is a comprehensive SaaS platform designed for serious real estate investors specializing in tax deed properties. Built with cutting-edge AI technology, it provides data-driven insights, automation tools, and a complete deal management workflow.

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: v20.19.1 (specified in `.nvmrc`)
- **npm**: Latest version
- **Supabase Account**: For backend services
- **Stripe Account**: For payment processing

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tx-deed
   ```

2. **Install Node.js version**
   ```bash
   nvm use
   # or manually install Node.js v20.19.1
   ```

3. **Install dependencies**
   ```bash
   npm install
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env and add your Stripe publishable key
   ```

5. **Update Stripe Price IDs**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
   - Create products for "Pro Investor" ($99) and "Mentee Elite" ($299)
   - Copy the price IDs
   - Update `src/pages/Membership.jsx` lines 58 and 72 with your actual Stripe price IDs

6. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

7. **Build for production**
   ```bash
   npm run build
   ```

---

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- React 18.2.0 + Vite 4.4.5
- Tailwind CSS 3.3.3
- Radix UI Component Library
- Framer Motion (animations)
- React Router DOM 6.16.0

**Backend:**
- Supabase (PostgreSQL, Auth, Real-time, Serverless Functions)
- Stripe (Payment Processing)
- Smarty API (Address Verification)

**AI/ML:**
- OpenAI Integration
- Google AI
- DeepSeek
- Custom AI Workforce Agents

### Project Structure

```
tx-deed/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── ui/          # Shadcn/Radix UI primitives
│   │   └── ...          # Custom components
│   ├── pages/           # Page components (40+ pages)
│   │   ├── admin/       # Admin-only pages
│   │   └── ...          # Member pages
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── lib/             # Utilities and config
│   └── main.jsx         # App entry point
├── plugins/             # Custom Vite plugins
├── tools/               # Build tools
├── public/              # Static assets
└── Configuration files
```

---

## ✨ Core Features

### 🎯 Investment Tools

1. **Property Database & Discovery**
   - Browse upcoming tax deed auctions
   - Advanced filtering (price, ROI, type, deal stage)
   - Comprehensive property analytics
   - Interactive maps and demographics

2. **Buyer-Match Graph (AI-Powered)**
   - AI analyzes deed and flip records
   - Ranks top 20 buyers for specific properties
   - Personalized match reasoning
   - Close deals faster with targeted outreach

3. **AI Dispo Copilot**
   - Automated price recommendations
   - One-click deal microsite generation
   - Compliant outreach sequence automation
   - Professional deal presentation

4. **Deal Rescue Engine**
   - Revive stalled deals with new buyer connections
   - Revised pricing strategies
   - Objection-handling scripts
   - Invoice tracking for services

5. **Document Automation**
   - Pre-filled assignment documents
   - Automated addenda generation
   - Proof of Funds (POF) request automation
   - Seamless escrow handoff

### 📊 Lead Management

6. **Lead Marketplace**
   - Peer-to-peer lead trading
   - Buy/sell vetted tax deed leads
   - Quality assurance system
   - Lead verification

7. **Upcoming Auctions & Leads**
   - County-specific auction schedules
   - Curated lead lists from multiple counties
   - Real-time auction information
   - Lead categorization and tracking

8. **Lead Upload System**
   - Bulk lead import functionality
   - CSV/Excel support
   - Lead validation and processing
   - Custom field mapping

### 🤖 AI Workforce

9. **AI Agent Dashboard**
   - County Data Scraper agents
   - News API Scraper
   - Legislation Monitor
   - LLM Processors (OpenAI, Google, DeepSeek)
   - Real-time agent status tracking

10. **Property Lookup Tool**
    - Address autocomplete via Smarty API
    - Real-time property detail retrieval
    - Comprehensive property analysis
    - Historical data access

### 📈 Deal Management

11. **My Pipeline**
    - Visual deal pipeline
    - Deal stage tracking
    - Status updates and notes
    - Performance analytics

12. **Calendar & Scheduling**
    - Auction date tracking
    - Event management
    - Timeline visualization
    - Deadline alerts

13. **Funding Portal**
    - Funding request submission
    - Property application system
    - WinWithDeeds Capital access
    - Submission tracking

### 🎓 Learning & Support

14. **Librarian AI Chat**
    - Pre-trained on platform courses
    - Tax deed law expertise
    - Redemption period guidance
    - Surplus fund information
    - 24/7 Q&A support

15. **Developer Hub**
    - API documentation
    - Code examples (Python, Node.js)
    - Integration guides
    - Supabase patterns

### 👥 Membership Tiers

**Pro Investor** - $99/month
- Full Access to Property Database
- Basic AI Deal Analysis
- Buyer-Match Graph (10 searches/month)
- Standard Support

**Mentee Elite** - $299/month
- Everything in Pro Investor
- AI Dispo Copilot & Deal Microsites
- Deal Rescue Engine (3 deals/month)
- Exclusive Mentee-Only Webinars
- Direct Q&A with Mentors
- Scout Agent Access
- Priority Support

**Syndicate** - Custom Pricing
- Everything in Mentee Elite
- Team Collaboration Tools
- API Access & Integration
- White-label Options
- Dedicated Account Manager

### 🔐 Admin Features

16. **Admin Dashboard**
    - User management (CRUD operations)
    - Transaction monitoring
    - Revenue analytics
    - Subscription tracking

17. **Content Management**
    - Resource library management
    - Educational material curation
    - Video and document management

18. **Integration Management**
    - Third-party API configuration
    - API Key Vault (secure credential management)
    - Integration health monitoring

19. **AI Workforce Management**
    - Agent configuration
    - Data source monitoring
    - Processing job tracking
    - Performance metrics

20. **Affiliate Program Management**
    - Partner application review
    - Commission tracking
    - Performance analytics
    - Payout management

---

## 🔐 Security & Authentication

### Authentication Flow
- Email/password authentication via Supabase Auth
- JWT-based session management
- Automatic token refresh
- Secure password reset flow

### User Roles
- **member**: Standard investor features
- **admin**: Full platform management access
- **Mentee Elite**: Premium features + mentorship access

### Route Protection
- `ProtectedRoute`: Requires authentication
- `RoleProtectedRoute`: Requires specific roles
- `AdminRoute`: Admin-only access

---

## 🗄️ Database Schema

### Core Tables

**profiles**
- User information and role management
- Links to Supabase Auth

**properties**
- Tax deed property listings
- Auction details and analytics
- Property characteristics and valuations

**saved_properties**
- User property favorites
- Custom notes and tags

**upcoming_sales**
- Auction schedule by county
- Sale details and information

**marketplace_leads**
- Peer-to-peer lead listings
- Verification status
- Seller contact information

**lead_sources**
- AI agent data sources
- Status and last run timestamps

**invoices**
- Deal Rescue Engine invoices
- Payment tracking

**funding_submissions**
- Funding portal applications
- Approval workflow

**library_items**
- Educational content
- Videos, documents, courses

**transactions**
- Payment history
- Stripe integration records

**notifications**
- User notifications
- Real-time updates

---

## 🔌 API Integration

### Supabase Functions
- `smarty-autocomplete`: Address autocomplete
- `property-lookup`: Property details retrieval

### Third-Party Services
- **Stripe**: Payment processing and subscriptions
- **Smarty API**: Address verification and enrichment
- **OpenAI**: AI-powered analysis and recommendations
- **Google AI**: Alternative LLM processing
- **DeepSeek**: Specialized AI processing

---

## 🚀 Deployment

### Environment Configuration

Create a `.env` file with:

```env
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_actual_key
```

### Production Build

```bash
# Build the application
npm run build

# Preview the build locally
npm run preview
```

The build output will be in the `dist/` directory.

### Deployment Checklist

- [ ] Update Stripe Price IDs in `src/pages/Membership.jsx`
- [ ] Set `VITE_STRIPE_PUBLISHABLE_KEY` environment variable
- [ ] Configure Supabase database tables and policies
- [ ] Set up Supabase authentication providers
- [ ] Deploy Supabase serverless functions
- [ ] Configure custom domain and SSL
- [ ] Set up monitoring and error tracking
- [ ] Test payment flow end-to-end
- [ ] Verify email delivery (Supabase Auth emails)
- [ ] Configure CORS settings if needed
- [ ] Set up automated backups
- [ ] Test all user roles and permissions

---

## 🧪 Development

### Available Scripts

```bash
# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Code Quality

The project includes:
- ESLint configuration
- Tailwind CSS best practices
- Component-based architecture
- TypeScript type definitions (for tooling)

### Mock Data

Mock data is available in `src/lib/mockData.js` for development and testing when the database is unavailable.

---

## 📊 Features by Page

### Public Pages
- Landing page with hero and feature showcase
- Membership pricing
- About page
- Affiliate program information
- Platform tour (guided walkthrough)
- Contact form

### Member Pages
- Dashboard with personalized statistics
- Property browser with advanced filters
- Property detail pages with comprehensive analytics
- Buyer matching tool
- AI dispo copilot
- Deal rescue engine
- Document automation
- Outreach tools
- Lead marketplace
- Upcoming auctions
- Lead upload
- My pipeline (deal tracker)
- Calendar
- Profile management
- Funding portal
- Developer hub
- Property lookup
- Tax delinquent leads
- Redeemable deeds search
- Scout agent (Elite only)

### Admin Pages
- Admin dashboard with platform statistics
- User management (CRUD)
- Transaction history
- Content library management
- API integrations management
- AI workforce management
- Affiliate program management
- API key vault
- Property database management

---

## 🎨 Design System

### Colors
- **Primary**: Purple (#A855F7)
- **Secondary**: Slate gray (various shades)
- **Accent**: Green (success), Blue (info), Red (error)

### Typography
- **Headings**: Manrope (600, 700, 800)
- **Body**: Inter (300-900)

### Components
Built with Radix UI for accessibility:
- Buttons, Inputs, Textareas
- Dialogs, Dropdowns, Tabs
- Tables, Cards
- Toast notifications
- Avatar, Checkbox, Switch, Slider

---

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly
4. Submit a pull request

---

## 📝 License

Private and confidential. All rights reserved.

---

## 🆘 Support

For technical support or questions:
- Email: support@winwithdeeds.com
- Developer Hub: `/developer-hub`
- AI Librarian: Available in-app (bottom-right chat widget)

---

## 🔄 Version History

Current Version: 0.0.0 (Development)

---

## ⚠️ Known Issues

1. **Stripe Price IDs**: Must be updated with real values before production deployment
2. **Security Vulnerabilities**: Some dev dependencies have known vulnerabilities that don't affect production builds
3. **Environment Variables**: Stripe publishable key must be configured

---

## 🎯 Roadmap

- [ ] Mobile app (React Native)
- [ ] Advanced AI recommendations
- [ ] Integration with county auction sites
- [ ] Automated bid submission
- [ ] Portfolio analytics dashboard
- [ ] Social features (investor networking)
- [ ] Educational course platform
- [ ] Live auction streaming
- [ ] Automated due diligence reports
- [ ] Property valuation ML models

---

**Built with ❤️ for Tax Deed Investors**

*Win With Deeds - Your Unfair Advantage in Tax Deed Investing*
