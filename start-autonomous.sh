#!/bin/bash

###############################################################################
# Autonomous Scraper Startup Script
#
# This script starts the autonomous scraper system and ensures it runs 24/7
#
# Usage:
#   chmod +x start-autonomous.sh
#   ./start-autonomous.sh
###############################################################################

set -e

echo "🤖 Starting Autonomous Property Scraper System..."
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ Error: .env file not found${NC}"
    echo "Please create .env file from .env.example"
    echo "cp .env.example .env"
    exit 1
fi

# Load environment variables
set -a
source .env
set +a

echo -e "${GREEN}✅ Environment loaded${NC}"

# Check required environment variables
required_vars=("SUPABASE_URL" "SUPABASE_SERVICE_KEY")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}❌ Error: $var is not set in .env${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Required environment variables set${NC}"

# Create logs directory
mkdir -p logs
echo -e "${GREEN}✅ Logs directory created${NC}"

# Check if PM2 is installed
if command -v pm2 &> /dev/null; then
    echo -e "${YELLOW}ℹ️  PM2 detected - using PM2 for process management${NC}"

    # Stop existing instance if running
    pm2 delete scraper-autonomous 2>/dev/null || true

    # Start with PM2
    pm2 start ecosystem.config.js
    pm2 save

    echo ""
    echo -e "${GREEN}✅ Autonomous scraper started with PM2${NC}"
    echo ""
    echo "📊 Monitor with: pm2 monit"
    echo "📋 View logs:    pm2 logs scraper-autonomous"
    echo "🔄 Restart:      pm2 restart scraper-autonomous"
    echo "🛑 Stop:         pm2 stop scraper-autonomous"
    echo ""
    echo "To enable auto-start on system boot:"
    echo "  pm2 startup"
    echo "  pm2 save"

else
    echo -e "${YELLOW}ℹ️  PM2 not found - starting with Node.js directly${NC}"
    echo -e "${YELLOW}ℹ️  For production, install PM2: npm install -g pm2${NC}"
    echo ""

    # Start with Node.js
    node server/index.js
fi

echo ""
echo -e "${GREEN}🚀 System is now running autonomously!${NC}"
echo -e "${GREEN}💾 Data will be automatically saved to database${NC}"
echo -e "${GREEN}🔄 System will self-heal from errors${NC}"
echo -e "${GREEN}📅 Scheduled scraping: ${SCRAPER_SCHEDULE:-0 2 * * *}${NC}"
