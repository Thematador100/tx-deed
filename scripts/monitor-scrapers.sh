#!/bin/bash

# ==================================================================
# SCRAPER MONITORING SCRIPT
# Real-time monitoring of nationwide scraping progress
# ==================================================================

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
CYAN='\033[0;36m'
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

# Get anon key for queries
SUPABASE_ANON_KEY=$(grep 'anon_key' .env 2>/dev/null | cut -d '=' -f2 | tr -d '"' || echo "")

if [ -z "$SUPABASE_ANON_KEY" ]; then
    echo -e "${YELLOW}⚠️  Using service role key for queries${NC}"
    SUPABASE_ANON_KEY="$SUPABASE_SERVICE_ROLE_KEY"
fi

# Function to get dashboard stats
get_dashboard() {
    curl -s "${SUPABASE_URL}/rest/v1/rpc/scraper_dashboard" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
}

# Function to get recent logs
get_recent_logs() {
    curl -s "${SUPABASE_URL}/rest/v1/scraper_logs?select=county,state,status,records_found,records_inserted,created_at&order=created_at.desc&limit=10" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
}

# Function to get proxy health
get_proxy_health() {
    curl -s "${SUPABASE_URL}/rest/v1/proxy_health_view?select=*" \
        -H "apikey: ${SUPABASE_ANON_KEY}" \
        -H "Authorization: Bearer ${SUPABASE_ANON_KEY}"
}

# Clear screen function
clear_screen() {
    clear
    echo -e "${CYAN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}║     🤖 AUTONOMOUS AI SCRAPER - LIVE MONITORING           ║${NC}"
    echo -e "${CYAN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Main monitoring loop
while true; do
    clear_screen

    # Get dashboard data
    DASHBOARD=$(get_dashboard)

    if [ -n "$DASHBOARD" ] && [ "$DASHBOARD" != "[]" ]; then
        PENDING=$(echo "$DASHBOARD" | jq -r '.[0].pending_tasks // 0')
        ACTIVE=$(echo "$DASHBOARD" | jq -r '.[0].active_tasks // 0')
        COMPLETED=$(echo "$DASHBOARD" | jq -r '.[0].completed_tasks // 0')
        FAILED=$(echo "$DASHBOARD" | jq -r '.[0].failed_tasks // 0')
        ACTIVE_PROXIES=$(echo "$DASHBOARD" | jq -r '.[0].active_proxies // 0')
        COUNTIES_24H=$(echo "$DASHBOARD" | jq -r '.[0].counties_scraped_24h // 0')
        PROPERTIES_24H=$(echo "$DASHBOARD" | jq -r '.[0].properties_added_24h // 0')

        echo -e "${BLUE}📊 Dashboard Overview${NC}"
        echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
        echo ""
        echo -e "  ${YELLOW}⏳ Pending:${NC}   $PENDING tasks"
        echo -e "  ${GREEN}▶ Active:${NC}     $ACTIVE tasks"
        echo -e "  ${GREEN}✅ Completed:${NC}  $COMPLETED tasks"
        echo -e "  ${RED}❌ Failed:${NC}    $FAILED tasks"
        echo ""
        echo -e "  ${CYAN}🔄 Active Proxies:${NC}        $ACTIVE_PROXIES"
        echo -e "  ${CYAN}🏘️  Counties (24h):${NC}       $COUNTIES_24H"
        echo -e "  ${CYAN}🏠 Properties (24h):${NC}      $PROPERTIES_24H"
        echo ""
    else
        echo -e "${YELLOW}⚠️  Unable to fetch dashboard data${NC}"
        echo ""
    fi

    # Recent scraping activity
    echo -e "${BLUE}📋 Recent Scraping Activity${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    LOGS=$(get_recent_logs)

    if [ -n "$LOGS" ] && [ "$LOGS" != "[]" ]; then
        echo "$LOGS" | jq -r '.[] |
            "\(.county), \(.state) | " +
            (if .status == "success" then "✅"
             elif .status == "failed" then "❌"
             else "⚠️" end) +
            " \(.status) | Found: \(.records_found) | Inserted: \(.records_inserted)"' | head -5
    else
        echo -e "${YELLOW}No recent activity${NC}"
    fi

    echo ""

    # Proxy health
    echo -e "${BLUE}🔄 Proxy Health${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    PROXY_HEALTH=$(get_proxy_health)

    if [ -n "$PROXY_HEALTH" ] && [ "$PROXY_HEALTH" != "[]" ]; then
        echo "$PROXY_HEALTH" | jq -r '.[] |
            "  \(.provider): \(.active)/\(.total) active | Success: \(.avg_success_rate * 100 | floor)%"'
    else
        echo -e "${YELLOW}No proxy data available${NC}"
    fi

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${CYAN}Press Ctrl+C to exit | Refreshing every 5 seconds...${NC}"

    sleep 5
done
