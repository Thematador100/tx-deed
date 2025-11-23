#!/bin/bash

# Quick run script for scraping agents

set -e

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Parse command line arguments
MODE=${1:-once}
COUNTIES=${2:-}

echo "========================================="
echo "Running TX Deed Scraping Agents"
echo "Mode: $MODE"
echo "========================================="
echo ""

if [ "$MODE" == "counties" ] && [ -n "$COUNTIES" ]; then
    python agent_orchestrator.py --mode counties --counties $COUNTIES
else
    python agent_orchestrator.py --mode $MODE
fi
