#!/bin/bash

# ==================================================================
# AUTONOMOUS AI SCRAPER DEPLOYMENT SCRIPT
# Deploys the world's most advanced property scraping system
# ==================================================================

set -e  # Exit on error

echo "🤖 Autonomous AI Scraper Deployment"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "Install it with: npm install -g supabase"
    exit 1
fi

echo -e "${GREEN}✅ Supabase CLI found${NC}"

# Check if we're linked to a project
if [ ! -f ".supabase/config.toml" ]; then
    echo -e "${YELLOW}⚠️  Not linked to a Supabase project${NC}"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

echo -e "${GREEN}✅ Linked to Supabase project${NC}"

# Step 1: Deploy Database Migration
echo ""
echo "📊 Step 1: Deploying Database Schema"
echo "------------------------------------"

if [ -f "supabase/migrations/20241126_agentic_scraper_system.sql" ]; then
    echo "Pushing database migration..."
    supabase db push
    echo -e "${GREEN}✅ Database schema deployed${NC}"
else
    echo -e "${RED}❌ Migration file not found${NC}"
    exit 1
fi

# Step 2: Deploy Edge Functions
echo ""
echo "🚀 Step 2: Deploying Edge Functions"
echo "-----------------------------------"

FUNCTIONS=(
    "ai-scraper-agent"
    "scraper-orchestrator"
    "proxy-manager"
    "scrape-county"
)

for func in "${FUNCTIONS[@]}"; do
    if [ -d "supabase/functions/$func" ]; then
        echo "Deploying $func..."
        supabase functions deploy "$func" --no-verify-jwt
        echo -e "${GREEN}✅ $func deployed${NC}"
    else
        echo -e "${YELLOW}⚠️  $func directory not found, skipping${NC}"
    fi
done

# Step 3: Configure Secrets
echo ""
echo "🔐 Step 3: Configuring Secrets"
echo "------------------------------"

# Check if .env.scraper exists
if [ -f ".env.scraper" ]; then
    echo "Found .env.scraper file, setting secrets..."

    # Read and set secrets
    while IFS='=' read -r key value; do
        # Skip empty lines and comments
        [[ -z "$key" || "$key" =~ ^#.*$ ]] && continue

        # Remove quotes from value
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//')

        echo "Setting $key..."
        echo "$value" | supabase secrets set "$key" --env-file /dev/stdin
    done < .env.scraper

    echo -e "${GREEN}✅ Secrets configured${NC}"
else
    echo -e "${YELLOW}⚠️  .env.scraper not found${NC}"
    echo "Create .env.scraper with the following format:"
    echo ""
    echo "ANTHROPIC_API_KEY=sk-ant-..."
    echo "BRIGHTDATA_USERNAME=your-username"
    echo "BRIGHTDATA_PASSWORD=your-password"
    echo "TWOCAPTCHA_API_KEY=your-key"
    echo ""
    echo -e "${YELLOW}You can set secrets manually later${NC}"
fi

# Step 4: Verify Deployment
echo ""
echo "🔍 Step 4: Verifying Deployment"
echo "-------------------------------"

# List deployed functions
echo "Checking deployed functions..."
supabase functions list

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "===================================="
echo "🎉 Next Steps"
echo "===================================="
echo ""
echo "1. Initialize Proxy Pool:"
echo "   ./scripts/init-proxies.sh"
echo ""
echo "2. Start Scraping:"
echo "   ./scripts/start-scraping.sh"
echo ""
echo "3. Monitor Progress:"
echo "   ./scripts/monitor-scrapers.sh"
echo ""
echo "4. View Dashboard:"
echo "   Open your Supabase project and run:"
echo "   SELECT * FROM scraper_dashboard;"
echo ""
