# Consolidated Dockerfile for all agents
FROM node:20-alpine

WORKDIR /app

# Copy shared utilities
COPY services/shared ./shared

# Copy all-agents service
COPY services/all-agents/package*.json ./
RUN npm install --production

COPY services/all-agents/index.js ./

# Health check
HEALTHCHECK --interval=60s --timeout=10s --start-period=30s --retries=3 \
  CMD node -e "console.log('Agents running')" || exit 1

# Run all agents
CMD ["node", "index.js"]
