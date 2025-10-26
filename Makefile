.PHONY: help install dev up down logs clean restart ps typecheck

# Detect container runtime (podman or docker)
CONTAINER_RUNTIME := $(shell command -v podman 2>/dev/null)
ifndef CONTAINER_RUNTIME
	CONTAINER_RUNTIME := $(shell command -v docker 2>/dev/null)
endif

# Use podman-compose if available, otherwise docker-compose
COMPOSE := $(shell command -v podman-compose 2>/dev/null)
ifndef COMPOSE
	COMPOSE := $(shell command -v docker-compose 2>/dev/null)
endif

# Default target
help:
	@echo "Ask Annie - Development Commands"
	@echo ""
	@echo "Container Runtime: $(CONTAINER_RUNTIME)"
	@echo "Compose Tool: $(COMPOSE)"
	@echo ""
	@echo "Dependencies:"
	@echo "  make deps-up          Start MongoDB and Redis containers"
	@echo "  make deps-down        Stop dependency containers"
	@echo "  make deps-logs        View dependency logs"
	@echo "  make deps-clean       Remove all containers and volumes"
	@echo ""
	@echo "Container Management:"
	@echo "  make dev-up           Start all services in containers (optional)"
	@echo "  make dev-down         Stop all container services"
	@echo "  make dev-logs         View all container logs"
	@echo "  make dev-restart      Restart all container services"
	@echo ""
	@echo "Local Development:"
	@echo "  make install          Install all dependencies"
	@echo "  make dev              Run backend + frontend locally"
	@echo "  make test             Run all tests"
	@echo "  make lint             Lint all code"
	@echo "  make typecheck        TypeScript type checking"
	@echo ""
	@echo "Database:"
	@echo "  make db-shell         Open MongoDB shell"
	@echo "  make db-ui            Open Mongo Express (localhost:8081)"
	@echo "  make redis-cli        Open Redis CLI"
	@echo ""
	@echo "Utilities:"
	@echo "  make ps               Show running containers"
	@echo "  make clean            Clean all builds and dependencies"

# Dependency services only
deps-up:
	$(COMPOSE) up -d mongodb redis mongo-express
	@echo "✓ MongoDB running on localhost:27017"
	@echo "✓ Redis running on localhost:6379"
	@echo "✓ Mongo Express UI on localhost:8081 (admin/admin)"

deps-down:
	$(COMPOSE) down

deps-logs:
	$(COMPOSE) logs -f mongodb redis

deps-clean:
	$(COMPOSE) down -v
	@echo "✓ All containers and volumes removed"

# Full stack with containers
dev-up:
	$(CONTAINER_RUNTIME) network create ask-annie-network 2>/dev/null || true
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml up -d
	@echo "✓ All services started"
	@echo "  - Frontend: http://localhost:5173"
	@echo "  - Backend:  http://localhost:3000"
	@echo "  - MongoDB:  localhost:27017"
	@echo "  - Mongo UI: http://localhost:8081"

dev-down:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml down

dev-logs:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml logs -f

dev-restart:
	$(COMPOSE) -f docker-compose.yml -f docker-compose.dev.yml restart

# Local development
install:
	npm run install:all

dev:
	npm run dev

test:
	npm test

lint:
	npm run lint

typecheck:
	@echo "Running TypeScript checks..."
	@cd backend && npm run typecheck
	@cd frontend && npm run typecheck
	@echo "✓ TypeScript checks passed"

# Database utilities
db-shell:
	$(CONTAINER_RUNTIME) exec -it ask-annie-mongodb mongosh -u admin -p admin123 --authenticationDatabase admin ask-annie

db-ui:
	@echo "Opening Mongo Express at http://localhost:8081"
	@echo "Username: admin"
	@echo "Password: admin"
	@xdg-open http://localhost:8081 2>/dev/null || open http://localhost:8081 2>/dev/null || echo "Navigate to http://localhost:8081"

redis-cli:
	$(CONTAINER_RUNTIME) exec -it ask-annie-redis redis-cli

# Utilities
ps:
	$(COMPOSE) ps

clean:
	rm -rf node_modules
	rm -rf backend/node_modules backend/dist
	rm -rf frontend/node_modules frontend/dist
	@echo "✓ All dependencies and builds removed"
