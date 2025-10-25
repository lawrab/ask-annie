# Container Development Guide (Podman/Docker)

This guide covers using Podman or Docker for local development with Ask Annie.

## Container Runtime

This project supports both **Podman** and **Docker**. The Makefile automatically detects which runtime you have installed.

### Using Podman (Recommended for Linux)

Podman is a daemonless container engine that's compatible with Docker commands and doesn't require root privileges.

**Installation:**
```bash
# Fedora/RHEL/CentOS
sudo dnf install podman podman-compose

# Ubuntu/Debian
sudo apt install podman podman-compose

# Arch Linux
sudo pacman -S podman podman-compose
```

**Verify installation:**
```bash
podman --version
podman-compose --version
```

### Using Docker

**Installation:**
```bash
# Follow official Docker installation guide for your OS
# https://docs.docker.com/engine/install/
```

**Note:** The Makefile will automatically use `podman-compose` if available, otherwise falls back to `docker-compose`.

---

## Quick Start

### Dependencies in Containers, App Runs Locally (Recommended)

This is the **recommended approach** for Ask Annie development:

```bash
# 1. Start dependencies (MongoDB + Redis + Mongo Express)
make deps-up

# 2. Run backend and frontend locally
make dev
```

**What runs where:**
- ✅ **MongoDB** - Runs in Podman/Docker container
- ✅ **Redis** - Runs in Podman/Docker container
- ✅ **Mongo Express** - Runs in Podman/Docker container (web UI)
- ⚡ **Backend (Node.js)** - Runs locally with `npm run dev`
- ⚡ **Frontend (Vite)** - Runs locally with `npm run dev`

**Advantages:**
- Fast hot-reloading and HMR
- Easy debugging with breakpoints
- Direct file system access
- Better IDE integration
- No container overhead for app code
- Consistent database environment

---

## Available Services

### MongoDB
- **Port:** 27017
- **Username:** admin
- **Password:** admin123
- **Database:** ask-annie
- **Connection String:** `mongodb://admin:admin123@localhost:27017/ask-annie?authSource=admin`

### Mongo Express (Web UI)
- **URL:** http://localhost:8081
- **Username:** admin
- **Password:** admin
- **Purpose:** Database visualisation and management

### Redis
- **Port:** 6379
- **Purpose:** Caching and session storage (future use)

### Backend (when using full Docker)
- **Port:** 3000
- **URL:** http://localhost:3000
- **API:** http://localhost:3000/api

### Frontend (when using full Docker)
- **Port:** 5173
- **URL:** http://localhost:5173

---

## Makefile Commands

### Dependency Management

```bash
# Start MongoDB, Redis, Mongo Express
make deps-up

# Stop dependencies
make deps-down

# View dependency logs
make deps-logs

# Remove all containers and volumes (fresh start)
make deps-clean
```

### Full Stack Docker

```bash
# Start all services (including backend/frontend)
make dev-up

# Stop all services
make dev-down

# View logs from all services
make dev-logs

# Restart services
make dev-restart

# Show running containers
make ps
```

### Database Utilities

```bash
# Open MongoDB shell
make db-shell

# Open Mongo Express web UI
make db-ui

# Open Redis CLI
make redis-cli
```

### Local Development

```bash
# Install all npm dependencies
make install

# Run backend + frontend locally (not in Docker)
make dev

# Run tests
make test

# Lint code
make lint

# Clean all builds and node_modules
make clean
```

### Help

```bash
# Show all available commands
make help
```

---

## Docker Compose Files

### docker-compose.yml

Core services (MongoDB, Redis, Mongo Express):

```yaml
services:
  mongodb:     # MongoDB 6
  mongo-express:  # Web UI for MongoDB
  redis:       # Redis 7 for caching
```

**Usage:**
```bash
docker-compose up -d
```

### docker-compose.dev.yml

Development services (backend, frontend):

```yaml
services:
  backend:     # Express API with hot reload
  frontend:    # Vite dev server with HMR
```

**Usage:**
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
```

---

## Environment Variables

### Backend in Docker

Set in `docker-compose.dev.yml`:

```yaml
environment:
  NODE_ENV: development
  MONGODB_URI: mongodb://admin:admin123@mongodb:27017/ask-annie?authSource=admin
  JWT_SECRET: dev-secret-change-in-production
  ALLOWED_ORIGINS: http://localhost:5173
  REDIS_URL: redis://redis:6379
```

### Frontend in Docker

Set in `docker-compose.dev.yml`:

```yaml
environment:
  VITE_API_URL: http://localhost:3000/api
  VITE_ENV: development
```

---

## Common Workflows

### Starting Fresh Development Session

```bash
# 1. Start dependencies
make deps-up

# 2. Start local development servers
cd backend
npm run dev

# In another terminal
cd frontend
npm run dev
```

### Resetting Database

```bash
# Stop and remove all data
make deps-clean

# Start fresh
make deps-up

# Database is now empty
```

### Viewing MongoDB Data

**Option 1: Mongo Express (Web UI)**
```bash
make db-ui
# Opens http://localhost:8081 in browser
```

**Option 2: MongoDB Shell**
```bash
make db-shell

# In the shell:
db.checkins.find().pretty()
db.users.find()
```

**Option 3: MongoDB Compass**
```
Connection string: mongodb://admin:admin123@localhost:27017/ask-annie?authSource=admin
```

### Debugging in Docker

**View logs:**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f mongodb
docker-compose logs -f backend
```

**Access container shell:**
```bash
docker exec -it ask-annie-backend-dev sh
docker exec -it ask-annie-mongodb sh
```

**Inspect network:**
```bash
docker network inspect ask-annie-network
```

---

## Troubleshooting

### Port Already in Use

**Problem:** Port 27017, 3000, or 5173 already in use

**Solution:**
```bash
# Find process using port
lsof -i :27017
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Cannot Connect to MongoDB

**Problem:** Backend can't connect to MongoDB

**Solution (Local Development):**
```bash
# Use localhost in .env
MONGODB_URI=mongodb://admin:admin123@localhost:27017/ask-annie?authSource=admin
```

**Solution (Docker):**
```bash
# Use service name in docker-compose
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/ask-annie?authSource=admin
```

### Container Won't Start

**Problem:** Service fails to start

**Solution:**
```bash
# Check logs
docker-compose logs <service-name>

# Remove and rebuild
docker-compose down
docker-compose up -d --build

# Remove volumes (nuclear option)
make deps-clean
```

### Hot Reload Not Working

**Problem:** Changes not reflected in Docker

**Solution:**
- Ensure volumes are mounted correctly in `docker-compose.dev.yml`
- Restart the service: `docker-compose restart backend`
- Check file permissions on mounted volumes

### MongoDB Authentication Failed

**Problem:** Can't authenticate to MongoDB

**Solution:**
```bash
# Stop containers
docker-compose down

# Remove volumes
docker volume rm ask-annie_mongodb_data

# Restart
docker-compose up -d mongodb
```

---

## Production Docker Setup

### Backend Dockerfile (Production)

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["npm", "start"]
```

### Frontend Dockerfile (Production)

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### Production Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - '3000:3000'
    environment:
      NODE_ENV: production
      MONGODB_URI: ${MONGODB_URI}
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - mongodb

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - '80:80'
    depends_on:
      - backend
```

---

## Best Practices

### Development

1. **Use dependencies in Docker, app locally** for best DX
2. **Use named volumes** for data persistence
3. **Use health checks** to ensure services are ready
4. **Mount source code as volumes** for hot reload
5. **Use .dockerignore** to exclude unnecessary files

### Production

1. **Multi-stage builds** for smaller images
2. **Run as non-root user** for security
3. **Use specific image versions** (not `latest`)
4. **Set resource limits** for containers
5. **Use secrets management** for sensitive data

### General

- Keep Dockerfiles simple and readable
- Use `.env` files for environment-specific configs
- Document all environment variables
- Regularly update base images for security patches

---

## Resources

- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

---

**Document Version:** 1.0
**Last Updated:** 2024-01-25
**Maintained By:** Development Team
