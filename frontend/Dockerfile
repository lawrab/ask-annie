# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy only frontend package files
COPY frontend/package*.json ./

# Install dependencies (use install instead of ci since no lock file in subdirectory)
RUN npm install --production=false

# Copy frontend source code
COPY frontend/ ./

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
