# Podman-Specific Guide

Podman is the default container runtime for Ask Annie development on Linux systems.

## Why Podman?

- **Daemonless**: No background service required
- **Rootless**: Run containers without root privileges
- **Compatible**: Drop-in replacement for Docker
- **Systemd Integration**: Native systemd support
- **Security**: Better isolation and security model

## Installation

### Fedora/RHEL/CentOS/Rocky

```bash
sudo dnf install podman podman-compose
```

### Ubuntu/Debian

```bash
sudo apt update
sudo apt install podman podman-compose
```

### Arch Linux

```bash
sudo pacman -S podman podman-compose
```

## Podman vs Docker Commands

Podman is designed as a drop-in replacement for Docker:

| Docker Command | Podman Command | Description |
|----------------|----------------|-------------|
| `docker run` | `podman run` | Run a container |
| `docker ps` | `podman ps` | List containers |
| `docker images` | `podman images` | List images |
| `docker-compose` | `podman-compose` | Compose orchestration |

**Alias Docker to Podman (Optional):**
```bash
echo "alias docker='podman'" >> ~/.bashrc
echo "alias docker-compose='podman-compose'" >> ~/.bashrc
source ~/.bashrc
```

## Rootless Containers

Podman runs rootless by default (as your user):

```bash
# Check if running rootless
podman info | grep rootless

# Run container as your user
podman run --rm -it alpine sh
```

### Rootless Networking

Podman rootless uses slirp4netns for networking. No additional configuration needed.

**Port Binding:**
```bash
# Bind to privileged ports (< 1024) requires capability
# But our services use high ports (3000, 5173, etc.) so no issue
```

## Using Podman with Ask Annie

### Start Dependencies

```bash
make deps-up
```

This runs:
```bash
podman-compose up -d mongodb redis mongo-express
```

### Check Running Containers

```bash
podman ps

# Or using make
make ps
```

### View Logs

```bash
podman-compose logs -f mongodb

# Or using make
make deps-logs
```

### Execute Commands in Containers

```bash
# MongoDB shell
podman exec -it ask-annie-mongodb mongosh

# Or using make
make db-shell
```

## Systemd Integration

Run containers as systemd services (optional):

### Generate Systemd Unit

```bash
# Generate systemd unit for MongoDB
podman generate systemd --name ask-annie-mongodb --files

# Move to systemd user directory
mkdir -p ~/.config/systemd/user/
mv container-ask-annie-mongodb.service ~/.config/systemd/user/

# Enable and start
systemctl --user daemon-reload
systemctl --user enable --now container-ask-annie-mongodb
```

### Auto-Start on Boot

```bash
# Enable lingering (start user services on boot)
loginctl enable-linger $USER
```

### Manage Service

```bash
# Status
systemctl --user status container-ask-annie-mongodb

# Restart
systemctl --user restart container-ask-annie-mongodb

# Stop
systemctl --user stop container-ask-annie-mongodb

# View logs
journalctl --user -u container-ask-annie-mongodb -f
```

## Podman Compose Specifics

### Version Compatibility

podman-compose supports docker-compose.yml format:

```yaml
version: '3.8'  # Fully supported
```

### Known Differences

1. **Networking**: Podman creates networks differently but compatibility is good
2. **Volumes**: Named volumes work identically
3. **Health Checks**: Fully supported

### Troubleshooting Compose

```bash
# If podman-compose has issues, try:
podman-compose down
podman-compose up -d --force-recreate

# Check compose version
podman-compose --version
```

## Podman Networking

### Create Network

```bash
podman network create ask-annie-network
```

### List Networks

```bash
podman network ls
```

### Inspect Network

```bash
podman network inspect ask-annie-network
```

### Container Connectivity

Containers can reference each other by service name:

```bash
# Backend connects to MongoDB
MONGODB_URI=mongodb://mongodb:27017/ask-annie
```

## Volumes and Storage

### List Volumes

```bash
podman volume ls
```

### Inspect Volume

```bash
podman volume inspect ask-annie_mongodb_data
```

### Backup Volume

```bash
# Create backup
podman run --rm \
  -v ask-annie_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/mongodb-backup.tar.gz /data

# Restore backup
podman run --rm \
  -v ask-annie_mongodb_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/mongodb-backup.tar.gz -C /
```

### Clean Up Volumes

```bash
# Remove all unused volumes
podman volume prune

# Remove specific volume
podman volume rm ask-annie_mongodb_data
```

## Security Best Practices

### Running Rootless

```bash
# Always run as your user (default)
podman run --rm -it alpine id
# Should show your UID, not 0 (root)
```

### SELinux Context

On SELinux systems (Fedora, RHEL, etc.):

```bash
# Volumes may need :Z flag for proper SELinux labelling
podman run -v ./data:/data:Z alpine ls /data
```

### Capabilities

Drop unnecessary capabilities:

```bash
podman run --rm \
  --cap-drop=all \
  --cap-add=chown,setuid,setgid \
  alpine
```

## Performance

### Storage Driver

Check current driver:
```bash
podman info | grep graphDriverName
```

Recommended: **overlay** (default)

### Resource Limits

Set CPU and memory limits:

```bash
podman run \
  --cpus=2 \
  --memory=1g \
  mongo:6
```

In docker-compose.yml:
```yaml
services:
  mongodb:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 1G
```

## Migrating from Docker

### Import Docker Images

```bash
# Save image from Docker
docker save mongo:6 -o mongo.tar

# Load into Podman
podman load -i mongo.tar
```

### Import Docker Volumes

```bash
# Export from Docker
docker run --rm \
  -v docker_volume:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/volume.tar.gz /data

# Import to Podman
podman volume create podman_volume
podman run --rm \
  -v podman_volume:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/volume.tar.gz -C /
```

## Common Issues

### "Permission Denied" Errors

**Problem:** Cannot write to mounted volumes

**Solution:**
```bash
# Use :Z flag for SELinux systems
-v ./data:/data:Z

# Or set permissions
chmod -R 755 ./data
```

### "Cannot Connect to Service"

**Problem:** Backend can't connect to MongoDB

**Solution:**
```bash
# Use service name in compose:
mongodb://mongodb:27017

# Use localhost for host connections:
mongodb://localhost:27017
```

### Port Already in Use

**Problem:** Port binding fails

**Solution:**
```bash
# Find what's using port
sudo lsof -i :27017

# Kill process or use different port
```

### Compose Not Found

**Problem:** `podman-compose: command not found`

**Solution:**
```bash
# Install podman-compose
pip3 install podman-compose

# Or use podman native (experimental)
podman compose up
```

## Useful Commands

```bash
# System information
podman info

# Clean up everything
podman system prune -af --volumes

# Export container filesystem
podman export <container> > filesystem.tar

# Check resource usage
podman stats

# Inspect container
podman inspect ask-annie-mongodb

# View container processes
podman top ask-annie-mongodb

# Generate Kubernetes YAML
podman generate kube ask-annie-mongodb > mongodb.yaml
```

## Resources

- [Podman Documentation](https://docs.podman.io)
- [Podman Compose GitHub](https://github.com/containers/podman-compose)
- [Podman vs Docker](https://docs.podman.io/en/latest/markdown/podman-docker.1.html)
- [Rootless Tutorial](https://github.com/containers/podman/blob/main/docs/tutorials/rootless_tutorial.md)

---

**Document Version:** 1.0
**Last Updated:** 2024-01-25
**Maintained By:** Development Team
