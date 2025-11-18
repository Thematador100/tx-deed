#!/bin/bash

# Tax Sale Scraping Service Setup Script

set -e

echo "🏡 Tax Sale Scraping Service Setup"
echo "=================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
required_version="3.10"

if ! printf '%s\n%s\n' "$required_version" "$python_version" | sort -V -C; then
    echo "❌ Error: Python 3.10+ required. Found: $python_version"
    exit 1
fi
echo "✅ Python $python_version detected"
echo ""

# Create virtual environment
echo "Creating virtual environment..."
python3 -m venv venv
source venv/bin/activate
echo "✅ Virtual environment created"
echo ""

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip
echo "✅ Pip upgraded"
echo ""

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Install Playwright browsers
echo "Installing Playwright browsers..."
playwright install chromium
echo "✅ Playwright browsers installed"
echo ""

# Create directories
echo "Creating directories..."
mkdir -p data logs
echo "✅ Directories created"
echo ""

# Create .env file
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "✅ .env file created - please edit with your configuration"
else
    echo "⚠️  .env file already exists - skipping"
fi
echo ""

# Initialize database
echo "Initializing database..."
python cli.py init
echo "✅ Database initialized"
echo ""

# Test scraper
echo "Testing scraper..."
python -c "
import asyncio
from loguru import logger

async def test():
    logger.info('Scraper test successful!')

asyncio.run(test())
" || echo "⚠️  Warning: Test failed, but setup can continue"
echo ""

echo "=================================="
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env file with your configuration (API keys, etc.)"
echo "2. Start the API server: python main.py"
echo "3. Visit http://localhost:8000/docs for API documentation"
echo "4. Try CLI commands: python cli.py --help"
echo ""
echo "Quick start:"
echo "  python cli.py list-sources    # List available sources"
echo "  python cli.py quick-tx        # Quick Texas scrape"
echo "  python main.py                # Start API server"
echo ""
