# ==============================================================
# CloudTune Backend - Google Cloud Run Dockerfile
# Base Image: Lightweight Node 20 LTS on Alpine Linux
# ==============================================================
FROM node:20-alpine AS runner

# Create and define app directory
WORKDIR /usr/src/app

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code and upload directories
COPY src/ ./src/
COPY uploads/ ./uploads/

# Cloud Run sets PORT environment variable (default 8080)
ENV PORT=8080
ENV NODE_ENV=production

EXPOSE 8080

# Run service as non-root node user for least-privilege security
USER node

# Start the Node.js API server
CMD ["node", "src/server.js"]
