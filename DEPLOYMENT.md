# Deployment Guide for AI Features

This guide covers deploying the 4 new AI-powered features to your Supabase project.

## Prerequisites

1. **Supabase CLI** - Install if not already installed:
   ```bash
   npm install -g supabase
   ```

2. **Supabase Project** - Ensure you're linked to your project:
   ```bash
   supabase link --project-ref YOUR_PROJECT_REF
   ```

3. **API Keys** - Configure these in Admin > API Keys:
   - `openai` - OpenAI API key
   - `google_maps` - Google Maps API key (optional, for location features)

## Step 1: Run Database Migrations

Apply the new table schemas:

```bash
supabase db push
```

This creates tables for:
- `deal_rescue_analyses` - Stores deal rescue analysis results
- `dispo_copilot_results` - Stores pricing, microsite, and outreach content
- `deal_dossiers` - Stores comprehensive due diligence reports

## Step 2: Deploy Edge Functions

Deploy all 4 edge functions:

```bash
# Deploy all functions
supabase functions deploy buyer-match
supabase functions deploy deal-rescue
supabase functions deploy dispo-copilot
supabase functions deploy deal-dossier
```

Or deploy all at once:

```bash
for func in buyer-match deal-rescue dispo-copilot deal-dossier; do
  supabase functions deploy $func
done
```

## Step 3: Verify Deployments

Check function logs:

```bash
supabase functions list
```

Test a function:

```bash
curl -L -X POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/buyer-match' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{"property_id": "YOUR_PROPERTY_ID", "limit": 5}'
```

## Step 4: Configure API Keys in Admin Panel

1. Navigate to `/admin/api-keys` in your application
2. Add the following API keys:

### OpenAI (Required for all AI features)
- **Service Name**: `openai`
- **API Key**: Your OpenAI API key
- **Usage**: Powers all AI analysis, content generation, and recommendations

### Google Maps (Optional but recommended)
- **Service Name**: `google_maps`
- **API Key**: Your Google Maps API key
- **Usage**: Geocoding, neighborhood insights, location analysis

## Features Deployed

### 1. Buyer-Match Graph (`/buyer-match`)
- **Edge Function**: `buyer-match`
- **Database**: Uses existing `transactions` and `profiles` tables
- **Features**:
  - Analyzes transaction history
  - Ranks top 20 buyers by match score
  - Generates AI-powered buyer pitches
  - Provides contact information

### 2. Deal Rescue Engine (`/deal-rescue`)
- **Edge Function**: `deal-rescue`
- **Database**: `deal_rescue_analyses` table
- **Features**:
  - Diagnoses why deals are stalling
  - Provides 3 pricing strategies
  - Suggests new buyer personas
  - Generates objection-handling scripts
  - Creates prioritized action plans

### 3. AI Dispo Copilot (`/deal-microsite`)
- **Edge Function**: `dispo-copilot`
- **Database**: `dispo_copilot_results` table
- **Features**:
  - Price recommendations (aggressive/moderate/conservative)
  - Microsite content generation (headlines, descriptions, CTAs)
  - 10DLC-compliant email and SMS outreach sequences
  - Unique microsite URLs

### 4. AI Deal Dossier (`/deal-dossier`)
- **Edge Function**: `deal-dossier`
- **Database**: `deal_dossiers` table
- **Features**:
  - Comprehensive due diligence reports
  - Title & liens analysis
  - Risk assessment with mitigation strategies
  - Market analysis
  - Investment scorecard (4 metrics)
  - Due diligence checklist
  - Red flags and green flags
  - Comparable sales
  - Neighborhood insights

## Troubleshooting

### Edge Function Errors

Check function logs:
```bash
supabase functions logs buyer-match
```

### Database Permission Issues

Verify RLS policies are enabled:
```sql
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('deal_rescue_analyses', 'dispo_copilot_results', 'deal_dossiers');
```

### API Key Issues

Test API key from admin panel using the "Test Connection" button for each service.

## Cost Considerations

### OpenAI API Costs

Approximate costs per request:
- **Buyer-Match**: ~$0.01-0.02 (gpt-3.5-turbo)
- **Deal Rescue**: ~$0.05-0.10 (gpt-4o-mini)
- **Dispo Copilot**: ~$0.05-0.15 (gpt-4o-mini, multiple generations)
- **Deal Dossier**: ~$0.05-0.10 (gpt-4o-mini)

Monthly estimate for 100 properties analyzed:
- **Buyer-Match**: $1-2
- **Deal Rescue**: $5-10
- **Dispo Copilot**: $5-15
- **Deal Dossier**: $5-10
- **Total**: ~$16-37/month for 100 analyses

### Google Maps API Costs

- Geocoding: $5 per 1,000 requests
- Places API: $17 per 1,000 requests

With caching, typical usage for 100 properties: ~$1-3/month

## Next Steps

1. ✅ Deploy functions
2. ✅ Run migrations
3. ✅ Configure API keys
4. 🧪 Test each feature with a sample property
5. 📊 Monitor usage and costs
6. 🚀 Roll out to users

## Support

For issues or questions:
1. Check function logs: `supabase functions logs <function-name>`
2. Review database logs: `supabase db logs`
3. Test API keys in Admin > API Keys panel
