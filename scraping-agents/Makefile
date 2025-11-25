.PHONY: help setup install run-once run-daemon run-county clean test docker-build docker-up docker-down logs

help:
	@echo "TX Deed Scraping Agents - Available Commands"
	@echo "=============================================="
	@echo "setup          - Run initial setup"
	@echo "install        - Install dependencies"
	@echo "run-once       - Run scrapers once and exit"
	@echo "run-daemon     - Run in daemon mode (scheduled)"
	@echo "run-county     - Run specific county (usage: make run-county COUNTY=harris)"
	@echo "test           - Run tests"
	@echo "docker-build   - Build Docker image"
	@echo "docker-up      - Start Docker containers"
	@echo "docker-down    - Stop Docker containers"
	@echo "logs           - View logs"
	@echo "clean          - Clean temporary files"

setup:
	@chmod +x setup.sh
	@./setup.sh

install:
	@pip install -r requirements.txt
	@playwright install chromium

run-once:
	@python agent_orchestrator.py --mode once

run-daemon:
	@python agent_orchestrator.py --mode daemon

run-county:
	@python agent_orchestrator.py --mode counties --counties $(COUNTY)

test:
	@echo "Running tests..."
	@python -m pytest tests/ -v

docker-build:
	@docker-compose build

docker-up:
	@docker-compose up -d
	@echo "Containers started. View logs with: make logs"

docker-down:
	@docker-compose down

logs:
	@docker-compose logs -f scraping-agents

clean:
	@echo "Cleaning temporary files..."
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete
	@find . -type f -name "*.pyo" -delete
	@find . -type f -name "*.log" -delete
	@echo "Clean complete!"
