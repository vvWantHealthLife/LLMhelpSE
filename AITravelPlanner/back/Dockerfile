# Use ARG to allow switching base image (defaults to official Docker Hub)
ARG BASE_NODE_IMAGE=node:18-alpine
FROM ${BASE_NODE_IMAGE}

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
ENTRYPOINT ["node"]
CMD ["server.js"]