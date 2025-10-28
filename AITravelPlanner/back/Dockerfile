# syntax=docker/dockerfile:1
FROM node:18-alpine

WORKDIR /app
ENV NODE_ENV=production

# Install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source
COPY server.js ./server.js
COPY scripts ./scripts

# Expose port and start server
EXPOSE 3000
CMD ["node", "server.js"]