# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build arguments for Vite
ARG VITE_API_URL
ARG VITE_ENV=production
ARG VITE_APP_NAME="Ask Annie"
ARG VITE_APP_VERSION="0.2.0-alpha"
ARG VITE_ENABLE_VOICE_RECORDING=true
ARG VITE_ENABLE_NOTIFICATIONS=true

# Build the application
RUN npm run build

# Production stage - serve with Node.js serve
FROM node:20-alpine

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files from builder
COPY --from=builder /app/dist ./dist

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001 && \
    chown -R nodejs:nodejs /app

USER nodejs

# Expose port (Railway will set PORT env var)
EXPOSE 3000

# Start serve
CMD ["sh", "-c", "serve -s dist -p ${PORT:-3000}"]
