#!/bin/bash

# ==================================================================
# TEST SINGLE COUNTY SCRAPER
# Quick test of the scraping system on one county
# ==================================================================

set -e

echo "🧪 Test Single County Scraper"
echo "============================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Get Supabase project URL
PROJECT_REF=$(grep 'project_id' .supabase/config.toml | cut -d '"' -f2 2>/dev/null || echo "")

if [ -z "$PROJECT_REF" ]; then
    echo -e "${YELLOW}⚠️  Not linked to Supabase project${NC}"
    echo "Run: supabase link --project-ref YOUR_PROJECT_REF"
    exit 1
fi

SUPABASE_URL="https://${PROJECT_REF}.supabase.co"

# Get anon key
SUPABASE_ANON_KEY=$(grep 'VITE_SUPABASE_ANON_KEY' .env 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "")

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}⚠️  SUPABASE_ANON_KEY not found in .env${NC}"
    read -p "Enter your Anon Key: " SUPABASE_ANON_KEY
fi

# Get county and state from user
COUNTY=${1:-"Harris"}
STATE=${2:-"Texas"}
TYPE=${3:-"tax_deed"}

echo -e "${BLUE}Test Configuration:${NC}"
echo "  County: $COUNTY"
echo "  State: $STATE"
echo "  Type: $TYPE"
echo ""

# Test the scraper
echo "Starting test scrape..."
echo ""

RESPONSE=$(curl -s -X POST \
    "${SUPABASE_URL}/functions/v1/scrape-county" \
    -H "Authorization: Bearer ${SUPABASE_ANON_KEY}" \
    -H "Content-Type: application/json" \
    -d "{
        \"county\": \"${COUNTY}\",
        \"state\": \"${STATE}\",
        \"type\": \"${TYPE}\",
        \"force\": true
    }")

echo "$RESPONSE" | jq .

# Check if successful
if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
    RECORDS_FOUND=$(echo "$RESPONSE" | jq -r '.recordsFound')
    RECORDS_INSERTED=$(echo "$RESPONSE" | jq -r '.recordsInserted')
    DURATION=$(echo "$RESPONSE" | jq -r '.duration')

    echo ""
    echo -e "${GREEN}✅ Test completed successfully!${NC}"
    echo ""
    echo "Results:"
    echo "  Records Found: $RECORDS_FOUND"
    echo "  Records Inserted: $RECORDS_INSERTED"
    echo "  Duration: ${DURATION}ms"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠️  Test may have failed${NC}"
    echo "Check the error message above"
    echo ""
fi

# Ask if user wants to test another county
echo ""
read -p "Test another county? (y/n): " test_another

if [ "$test_another" = "y" ]; then
    echo ""
    read -p "Enter county name: " new_county
    read -p "Enter state name: " new_state
    exec "$0" "$new_county" "$new_state" "$TYPE"
fi
