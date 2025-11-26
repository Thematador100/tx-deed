#!/bin/bash

# ==================================================================
# SETUP VERIFICATION SCRIPT
# Checks if all prerequisites are configured correctly
# ==================================================================

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

ISSUES=0

echo "🔍 Verifying Scraper Setup"
echo "========================="
echo ""

# Check 1: Supabase CLI
echo -n "Checking Supabase CLI... "
if command -v supabase &> /dev/null; then
    echo -e "${GREEN}✅ Installed${NC}"
else
    echo -e "${RED}❌ Not found${NC}"
    echo "   Install with: npm install -g supabase"
    ISSUES=$((ISSUES + 1))
fi

# Check 2: Project linked
echo -n "Checking Supabase link... "
if [ -f ".supabase/config.toml" ]; then
    PROJECT_REF=$(grep 'project_id' .supabase/config.toml | cut -d '"' -f2)
    echo -e "${GREEN}✅ Linked to $PROJECT_REF${NC}"
else
    echo -e "${RED}❌ Not linked${NC}"
    echo "   Run: supabase link --project-ref YOUR_PROJECT_REF"
    ISSUES=$((ISSUES + 1))
fi

# Check 3: Migration file exists
echo -n "Checking migration file... "
if [ -f "supabase/migrations/20241126_agentic_scraper_system.sql" ]; then
    echo -e "${GREEN}✅ Found${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
    echo "   Migration file not found"
    ISSUES=$((ISSUES + 1))
fi

# Check 4: Edge functions exist
echo -n "Checking edge functions... "
REQUIRED_FUNCTIONS=("ai-scraper-agent" "scraper-orchestrator" "proxy-manager" "scrape-county")
MISSING_FUNCTIONS=()

for func in "${REQUIRED_FUNCTIONS[@]}"; do
    if [ ! -d "supabase/functions/$func" ]; then
        MISSING_FUNCTIONS+=("$func")
    fi
done

if [ ${#MISSING_FUNCTIONS[@]} -eq 0 ]; then
    echo -e "${GREEN}✅ All present${NC}"
else
    echo -e "${RED}❌ Missing: ${MISSING_FUNCTIONS[*]}${NC}"
    ISSUES=$((ISSUES + 1))
fi

# Check 5: .env file
echo -n "Checking .env file... "
if [ -f ".env" ]; then
    if grep -q "VITE_SUPABASE_URL" .env && grep -q "VITE_SUPABASE_ANON_KEY" .env; then
        echo -e "${GREEN}✅ Configured${NC}"
    else
        echo -e "${YELLOW}⚠️  Incomplete${NC}"
        echo "   Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
        ISSUES=$((ISSUES + 1))
    fi
else
    echo -e "${RED}❌ Missing${NC}"
    echo "   Create .env with Supabase credentials"
    ISSUES=$((ISSUES + 1))
fi

# Check 6: .env.scraper file
echo -n "Checking .env.scraper... "
if [ -f ".env.scraper" ]; then
    HAS_AI_KEY=false

    if grep -q "ANTHROPIC_API_KEY=" .env.scraper && ! grep -q "ANTHROPIC_API_KEY=sk-ant-api03-\.\.\." .env.scraper; then
        HAS_AI_KEY=true
    fi

    if grep -q "OPENAI_API_KEY=" .env.scraper && ! grep -q "OPENAI_API_KEY=sk-\.\.\." .env.scraper; then
        HAS_AI_KEY=true
    fi

    if [ "$HAS_AI_KEY" = true ]; then
        echo -e "${GREEN}✅ AI key configured${NC}"
    else
        echo -e "${YELLOW}⚠️  No AI key found${NC}"
        echo "   Add ANTHROPIC_API_KEY or OPENAI_API_KEY"
        ISSUES=$((ISSUES + 1))
    fi

    # Check for proxy config (optional)
    if grep -q "BRIGHTDATA_USERNAME=" .env.scraper && ! grep -q "your-username-here" .env.scraper; then
        echo "   ${BLUE}ℹ️  BrightData proxies configured${NC}"
    else
        echo "   ${YELLOW}ℹ️  No proxies configured (optional but recommended)${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Not found${NC}"
    echo "   Copy .env.scraper.example to .env.scraper and configure"
    ISSUES=$((ISSUES + 1))
fi

# Check 7: Scripts executable
echo -n "Checking script permissions... "
if [ -x "scripts/deploy-scrapers.sh" ] && [ -x "scripts/start-scraping.sh" ]; then
    echo -e "${GREEN}✅ Executable${NC}"
else
    echo -e "${YELLOW}⚠️  Not executable${NC}"
    echo "   Run: chmod +x scripts/*.sh"
fi

# Check 8: Database migration status (if linked)
if [ -f ".supabase/config.toml" ]; then
    echo -n "Checking database migration... "

    # Try to check if tables exist
    DB_STATUS=$(supabase db diff 2>&1 || echo "unknown")

    if [[ $DB_STATUS == *"No schema changes detected"* ]]; then
        echo -e "${GREEN}✅ Migrated${NC}"
    elif [[ $DB_STATUS == *"unknown"* ]]; then
        echo -e "${YELLOW}⚠️  Cannot verify (run: supabase db push)${NC}"
    else
        echo -e "${YELLOW}⚠️  Pending changes${NC}"
        echo "   Run: supabase db push"
        ISSUES=$((ISSUES + 1))
    fi
fi

# Summary
echo ""
echo "================================="
if [ $ISSUES -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    echo ""
    echo "You're ready to start scraping:"
    echo "  1. Deploy: ./scripts/deploy-scrapers.sh"
    echo "  2. Test: ./scripts/test-single-county.sh"
    echo "  3. Start: ./scripts/start-scraping.sh"
else
    echo -e "${RED}❌ Found $ISSUES issue(s)${NC}"
    echo ""
    echo "Please fix the issues above before proceeding."
    echo "See QUICKSTART.md for detailed setup instructions."
fi

echo "================================="
echo ""

exit $ISSUES
