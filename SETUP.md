# Win With Deeds - Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ (check `.nvmrc` for exact version)
- npm or yarn
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Thematador100/tx-deed.git
   cd tx-deed
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Then edit `.env` and add your Supabase credentials:
   - Go to https://app.supabase.com
   - Select your project (or create a new one)
   - Go to Settings → API
   - Copy the `Project URL` → paste as `VITE_SUPABASE_URL`
   - Copy the `anon/public` key → paste as `VITE_SUPABASE_ANON_KEY`

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Build for Production

```bash
npm run build
```

The production-ready files will be in the `dist/` directory.

---

## Environment Variables

### Required

| Variable | Description | Where to Find |
|----------|-------------|---------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anonymous key | Supabase Dashboard → Settings → API → Project API keys → anon/public |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key for payments | (none) |
| `VITE_APP_ENV` | Environment identifier | development |

---

## Deployment

### Netlify (Recommended for Frontend)

1. **Connect your repository**
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Connect your GitHub repository

2. **Configure build settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18` (or version from `.nvmrc`)

3. **Add environment variables**
   - Go to Site settings → Environment variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Add any other required environment variables

4. **Deploy**
   - Click "Deploy site"
   - Netlify will automatically redeploy on every push to your main branch

### Vercel (Alternative)

1. **Connect repository**
   - Go to https://vercel.com
   - Click "New Project" → Import your Git repository

2. **Configure**
   - Framework Preset: Vite
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

3. **Add environment variables**
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

4. **Deploy**
   - Click "Deploy"

---

## Backend Setup (Supabase)

### Database Tables

Your Supabase project needs the following tables. You can create them using the Supabase SQL Editor:

**Core Tables:**
- `profiles` - User profiles with role-based access
- `properties` - Property listings
- `lead_uploads` - File upload tracking
- `library_items` - Content library
- `scout_agents` - AI agent run tracking

**Admin Panel:**
- API Keys management (via Supabase Vault)
- User management
- Transaction tracking

### Edge Functions

The application uses several Supabase Edge Functions. Deploy them using the Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Deploy functions (if you have a functions/ directory)
supabase functions deploy
```

**Required Edge Functions:**
- `manage-api-key` - API key vault CRUD
- `test-api-key` - Connection testing
- `run-scout-agent` - AI property scouting
- `smarty-autocomplete` - Address autocomplete
- `property-lookup` - Property data enrichment

### Third-Party API Keys

Configure these in the admin panel (`/admin/api-keys`):

1. **Smarty** - Address validation
   - Get API key from https://www.smarty.com
   - Service name: `smarty`

2. **OpenAI** - AI analysis
   - Get API key from https://platform.openai.com
   - Service name: `openai`

3. **Google AI** - Alternative LLM
   - Get API key from https://ai.google.dev
   - Service name: `google-ai`

4. **Google Document AI** - OCR processing
   - Get credentials from https://cloud.google.com/document-ai
   - Service name: `google-doc-ai`

5. **Stripe** - Payment processing (optional)
   - Get API keys from https://dashboard.stripe.com

---

## Security Notes

- ✅ **Never commit `.env` files** - They contain sensitive credentials
- ✅ **Use environment variables** - All secrets should be in `.env`
- ✅ **Enable Row Level Security (RLS)** - Configure in Supabase for all tables
- ✅ **Rotate keys regularly** - Update API keys periodically
- ✅ **Use HTTPS only** - Never expose credentials over HTTP

---

## Troubleshooting

### "Missing Supabase environment variables" error

**Cause:** `.env` file is missing or incorrectly configured

**Solution:**
1. Check that `.env` file exists in the project root
2. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set
3. Restart the development server after changing `.env`

### Build fails on Netlify/Vercel

**Cause:** Environment variables not set in hosting platform

**Solution:**
1. Go to your deployment settings
2. Add all `VITE_*` environment variables
3. Trigger a new deploy

### API calls return 401 Unauthorized

**Cause:** Row Level Security (RLS) policies not configured

**Solution:**
1. Go to Supabase Dashboard → Authentication → Policies
2. Set up RLS policies for each table
3. Ensure authenticated users have appropriate access

### Edge Functions not working

**Cause:** Functions not deployed or environment variables missing

**Solution:**
1. Deploy functions using Supabase CLI: `supabase functions deploy`
2. Check function logs in Supabase Dashboard → Edge Functions
3. Verify all required API keys are in the vault

---

## Development Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

---

## Tech Stack

- **Frontend:** React 18, Vite, TailwindCSS
- **Backend:** Supabase (PostgreSQL + Edge Functions)
- **Auth:** Supabase Auth (JWT-based)
- **Payments:** Stripe
- **AI:** OpenAI, Google AI
- **Hosting:** Netlify (recommended) or Vercel

---

## Support

For issues or questions:
1. Check the [BACKEND_ASSESSMENT.md](./BACKEND_ASSESSMENT.md) for architecture details
2. Review Supabase documentation: https://supabase.com/docs
3. Check project issues on GitHub

---

## License

[Add your license information here]
