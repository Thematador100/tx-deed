#!/bin/bash

# ==================================================================
# START NATIONWIDE SCRAPING
# Begins autonomous scraping of all US counties
# ==================================================================

set -e

echo "🚀 Starting Nationwide Property Scraping"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

# Configuration
WORKER_COUNT=${1:-10}  # Default 10 workers

echo -e "${BLUE}Configuration:${NC}"
echo "  Workers: $WORKER_COUNT"
echo "  Project: $PROJECT_REF"
echo ""

# Start the orchestrator
echo "Starting scraper orchestrator..."
echo ""

RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/scraper-orchestrator" \
    -H "Authorization: Bearer ${SUPABASE_SERVICE_ROLE_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
        \"action\": \"start\",
        \"workerCount\": ${WORKER_COUNT}
    }")

echo "$RESPONSE" | jq .

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    echo ""
    echo -e "${GREEN}✅ Scraping started successfully!${NC}"
    echo ""
    echo "===================================="
    echo "📊 Monitoring"
    echo "===================================="
    echo ""
    echo "View real-time progress:"
    echo "  ./scripts/monitor-scrapers.sh"
    echo ""
    echo "Or check the dashboard in Supabase:"
    echo "  SELECT * FROM scraper_dashboard;"
    echo ""
    echo "View recent logs:"
    echo "  SELECT county, state, status, records_found"
    echo "  FROM scraper_logs"
    echo "  ORDER BY created_at DESC LIMIT 50;"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Scraping may not have started correctly${NC}"
    echo "Check the error message above"
fi
