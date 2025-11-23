#!/bin/bash

# Setup script for TX Deed Scraping Agents
# This script sets up the environment and installs dependencies

set -e

echo "========================================="
echo "TX Deed Scraping Agents Setup"
echo "========================================="
echo ""

# Check Python version
echo "Checking Python version..."
python_version=$(python3 --version 2>&1 | awk '{print $2}')
echo "Found Python $python_version"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Install Playwright browsers
echo "Installing Playwright browsers..."
playwright install chromium

# Create necessary directories
echo "Creating directories..."
mkdir -p logs
mkdir -p config
mkdir -p data

# Copy environment template if .env doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp .env.example .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your actual credentials!"
    echo ""
fi

# Set permissions
chmod +x agent_orchestrator.py

echo ""
echo "========================================="
echo "✓ Setup complete!"
echo "========================================="
echo ""
echo "Next steps:"
echo "1. Edit .env file with your Supabase and API credentials"
echo "2. Review config/counties.json and enable/disable counties"
echo "3. Run a test scrape: python agent_orchestrator.py --mode once"
echo "4. Start daemon mode: python agent_orchestrator.py --mode daemon"
echo ""
echo "Or use Docker:"
echo "  docker-compose up -d"
echo ""
