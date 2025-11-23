# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only frontend package files
COPY frontend/package*.json ./

# Install dependencies (use install instead of ci since no lock file in subdirectory)
RUN npm install --production=false

# Copy frontend source code
COPY frontend/ ./

# Build arguments - Railway passes environment variables as build args
ARG VITE_API_URL
ARG VITE_ENV=production
ARG VITE_APP_NAME="Ask Annie"
ARG VITE_APP_VERSION="0.2.0-alpha"
ARG VITE_ENABLE_VOICE_RECORDING=true
ARG VITE_ENABLE_NOTIFICATIONS=true

# Make them available as environment variables for the build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_ENV=${VITE_ENV}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_APP_VERSION=${VITE_APP_VERSION}
ENV VITE_ENABLE_VOICE_RECORDING=${VITE_ENABLE_VOICE_RECORDING}
ENV VITE_ENABLE_NOTIFICATIONS=${VITE_ENABLE_NOTIFICATIONS}

# Build the application (runs frontend's build script, not workspace root)
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
