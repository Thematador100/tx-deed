# Node.js base image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy shared utilities first
COPY services/shared ./shared

# Copy package files
COPY services/scout-agents/news-scraper/package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY services/scout-agents/news-scraper/index.js ./

# Run the agent
CMD ["node", "index.js"]
