#!/bin/bash

# ==================================================================
# PROXY POOL INITIALIZATION SCRIPT
# Sets up BrightData and other proxy services
# ==================================================================

set -e

echo "🔄 Initializing Proxy Pool"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Get Supabase project URL
PROJECT_REF=$(grep 'project_id' .supabase/config.toml | cut -d '"' -f2)
SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

# Get service role key
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_SERVICE_ROLE_KEY not set${NC}"
    echo "Get it from: https://app.supabase.com/project/${PROJECT_REF}/settings/api"
    echo ""
    read -p "Enter your Service Role Key: " SUPABASE_SERVICE_ROLE_KEY
fi

# Check if .env.scraper exists
if [ ! -f ".env.scraper" ]; then
    echo -e "${YELLOW}⚠️  .env.scraper not found${NC}"
    echo ""
    echo "Do you have BrightData credentials? (y/n)"
    read -r has_brightdata

    if [ "$has_brightdata" = "y" ]; then
        echo "Enter BrightData username:"
        read -r brightdata_username
        echo "Enter BrightData password:"
        read -rs brightdata_password

        cat > .env.scraper << EOF
BRIGHTDATA_USERNAME=$brightdata_username
BRIGHTDATA_PASSWORD=$brightdata_password
EOF

        echo -e "${GREEN}✅ Created .env.scraper${NC}"
    else
        echo -e "${YELLOW}⚠️  Skipping BrightData setup${NC}"
        echo "The scraper will use free proxies (lower success rate)"
        exit 0
    fi
fi

# Load environment variables
source .env.scraper

# Initialize BrightData proxies
if [ -n "$BRIGHTDATA_USERNAME" ] && [ -n "$BRIGHTDATA_PASSWORD" ]; then
    echo "Setting up BrightData proxy pool..."

    curl -X POST \
        "${SUPABASE_URL}/functions/v1/proxy-manager" \
        -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
        -H "Content-Type: application/json" \
        -d "{
            \"action\": \"setup_brightdata\",
            \"username\": \"${BRIGHTDATA_USERNAME}\",
            \"password\": \"${BRIGHTDATA_PASSWORD}\"
        }" | jq .

    echo ""
    echo -e "${GREEN}✅ BrightData proxies initialized${NC}"
else
    echo -e "${YELLOW}⚠️  BrightData credentials not found${NC}"
fi

# Health check
echo ""
echo "Running proxy health check..."

curl -X POST \
    "${SUPABASE_URL}/functions/v1/proxy-manager" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d '{"action": "health_check"}' | jq .

echo ""
echo -e "${GREEN}✅ Proxy pool initialized${NC}"
echo ""
echo "View proxy status in Supabase:"
echo "SELECT * FROM proxy_health_view;"
