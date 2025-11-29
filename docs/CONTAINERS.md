# Container Development Guide

Guide for using Docker or Podman for local development with Annie's Health Journal.

## Container Runtime

This project supports both **Podman** and **Docker**. The Makefile automatically detects which runtime you have installed.

### Why Podman? (Recommended for Linux)

- **Daemonless**: No background service required
- **Rootless**: Run containers without root privileges
- **Compatible**: Drop-in replacement for Docker
- **Systemd Integration**: Native systemd support
- **Security**: Better isolation and security model

### Why Docker?

- **Cross-platform**: Works on Windows, macOS, Linux
- **Wide adoption**: Extensive ecosystem and tooling
- **Desktop app**: Easy-to-use GUI available

---

## Installation

### Podman

**Fedora/RHEL/CentOS:**
```bash
sudo dnf install podman podman-compose
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install podman podman-compose
```

**Arch Linux:**
```bash
sudo pacman -S podman podman-compose
```

**Verify:**
```bash
podman --version
podman-compose --version
```

### Docker

Follow official installation guide: https://docs.docker.com/engine/install/

**Verify:**
```bash
docker --version
docker-compose --version
```

### Command Aliases (Optional)

Make Podman a drop-in replacement for Docker:

```bash
echo "alias docker='podman'" >> ~/.bashrc
echo "alias docker-compose='podman-compose'" >> ~/.bashrc
source ~/.bashrc
```

---

## Quick Start

### Recommended Approach: Hybrid Development

Run **dependencies in containers**, but **app code locally**:

```bash
# 1. Start dependencies (MongoDB, Redis, Mongo Express)
make deps-up

# 2. Run backend and frontend locally
make dev
```

**What runs where:**
- ✅ **MongoDB** - Container
- ✅ **Redis** - Container
- ✅ **Mongo Express** - Container (web UI)
- ⚡ **Backend** - Local (`npm run dev`)
- ⚡ **Frontend** - Local (`npm run dev`)

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
- **Database:** annies-health-journal
- **Connection String:** `mongodb://admin:admin123@localhost:27017/annies-health-journal?authSource=admin`

### Mongo Express (Web UI)
- **URL:** http://localhost:8081
- **Username:** admin
- **Password:** admin
- **Purpose:** Database visualization and management

### Redis
- **Port:** 6379
- **Purpose:** Caching and session storage (future use)

### Backend (Full Docker Mode)
- **Port:** 3000
- **URL:** http://localhost:3000
- **API:** http://localhost:3000/api

### Frontend (Full Docker Mode)
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

## Common Workflows

### Starting Fresh Development Session

```bash
# Start dependencies
make deps-up

# Start local development servers
cd backend && npm run dev

# In another terminal
cd frontend && npm run dev
```

### Resetting Database

```bash
# Stop and remove all data
make deps-clean

# Start fresh
make deps-up
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
Connection string: mongodb://admin:admin123@localhost:27017/annies-health-journal?authSource=admin
```

### Debugging in Containers

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
docker exec -it annies-health-journal-backend-dev sh
docker exec -it annies-health-journal-mongodb sh
```

**Inspect network:**
```bash
docker network inspect annies-health-journal-network
```

---

## Podman-Specific Features

### Rootless Containers

Podman runs rootless by default (as your user):

```bash
# Check if running rootless
podman info | grep rootless

# Run container as your user
podman run --rm -it alpine sh
```

### Systemd Integration

Run containers as systemd services:

**Generate systemd unit:**
```bash
# Generate unit for MongoDB
podman generate systemd --name annies-health-journal-mongodb --files

# Move to systemd user directory
mkdir -p ~/.config/systemd/user/
mv container-annies-health-journal-mongodb.service ~/.config/systemd/user/

# Enable and start
systemctl --user daemon-reload
systemctl --user enable --now container-annies-health-journal-mongodb
```

**Auto-start on boot:**
```bash
# Enable lingering (start user services on boot)
loginctl enable-linger $USER
```

**Manage service:**
```bash
# Status
systemctl --user status container-annies-health-journal-mongodb

# Restart
systemctl --user restart container-annies-health-journal-mongodb

# Logs
journalctl --user -u container-annies-health-journal-mongodb -f
```

### Volume Backup/Restore (Podman)

**Create backup:**
```bash
podman run --rm \
  -v annies-health-journal_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-backup.tar.gz /data
```

**Restore backup:**
```bash
podman run --rm \
  -v annies-health-journal_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mongodb-backup.tar.gz -C /
```

---

## Environment Variables

### Backend in Docker

Set in `docker-compose.dev.yml`:

```yaml
environment:
  NODE_ENV: development
  MONGODB_URI: mongodb://admin:admin123@mongodb:27017/annies-health-journal?authSource=admin
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
MONGODB_URI=mongodb://admin:admin123@localhost:27017/annies-health-journal?authSource=admin
```

**Solution (Docker):**
```bash
# Use service name in docker-compose
MONGODB_URI=mongodb://admin:admin123@mongodb:27017/annies-health-journal?authSource=admin
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
docker volume rm annies-health-journal_mongodb_data

# Restart
docker-compose up -d mongodb
```

### Podman: Permission Denied Errors

**Problem:** Cannot write to mounted volumes

**Solution:**
```bash
# Use :Z flag for SELinux systems
-v ./data:/data:Z

# Or set permissions
chmod -R 755 ./data
```

### Podman: Compose Not Found

**Problem:** `podman-compose: command not found`

**Solution:**
```bash
# Install podman-compose
pip3 install podman-compose

# Or use podman native (experimental)
podman compose up
```

---

## Best Practices

### Development

1. **Use dependencies in Docker, app locally** for best developer experience
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

### Security (Podman)

1. **Run rootless** (default behavior)
2. **Use SELinux labels** (:Z flag) on SELinux systems
3. **Drop capabilities** when not needed
4. **Enable user namespaces** for better isolation

### General

- Keep Dockerfiles simple and readable
- Use `.env` files for environment-specific configs
- Document all environment variables
- Regularly update base images for security patches

---

## Useful Commands

### Docker/Podman

```bash
# System information
podman info
docker info

# Clean up everything
podman system prune -af --volumes
docker system prune -af --volumes

# Check resource usage
podman stats
docker stats

# Inspect container
podman inspect <container>
docker inspect <container>

# View container processes
podman top <container>
docker top <container>
```

### Podman-Specific

```bash
# Export container filesystem
podman export <container> > filesystem.tar

# Generate Kubernetes YAML
podman generate kube <container> > app.yaml

# Generate systemd unit
podman generate systemd --name <container> --files
```

---

## Resources

### Docker
- [Docker Documentation](https://docs.docker.com)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [MongoDB Docker Hub](https://hub.docker.com/_/mongo)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

### Podman
- [Podman Documentation](https://docs.podman.io)
- [Podman Compose GitHub](https://github.com/containers/podman-compose)
- [Podman vs Docker](https://docs.podman.io/en/latest/markdown/podman-docker.1.html)
- [Rootless Tutorial](https://github.com/containers/podman/blob/main/docs/tutorials/rootless_tutorial.md)

---

**Last Updated**: 2025-11-29
