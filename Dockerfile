FROM python:3.11-slim

# Set environment variables
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Copy application code
COPY scraping_system/ ./scraping_system/
COPY *.py ./

# Create necessary directories
RUN mkdir -p scraping_system/logs scraping_system/data/raw scraping_system/data/processed scraping_system/data/models

# Set permissions
RUN chmod -R 755 scraping_system/

# Default command
CMD ["python", "-m", "scraping_system.main"]
