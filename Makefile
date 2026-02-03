.PHONY: help up down logs restart build clean install dev test lint format migrate seed db-studio

# Default target
help:
	@echo "Busap - Intercity Bus Transportation Platform"
	@echo ""
	@echo "Usage:"
	@echo "  make up          - Start all services with Docker Compose"
	@echo "  make down        - Stop all services"
	@echo "  make logs        - Follow logs from all services"
	@echo "  make restart     - Restart all services"
	@echo "  make build       - Build all applications"
	@echo "  make clean       - Clean all build artifacts and node_modules"
	@echo "  make install     - Install dependencies"
	@echo "  make dev         - Start development servers (without Docker)"
	@echo "  make test        - Run tests"
	@echo "  make lint        - Run linters"
	@echo "  make format      - Format code"
	@echo "  make migrate     - Run database migrations"
	@echo "  make seed        - Seed database with test data"
	@echo "  make db-studio   - Open Prisma Studio"
	@echo ""
	@echo "Individual services:"
	@echo "  make up-db       - Start only database services (postgres, redis)"
	@echo "  make up-appwrite - Start Appwrite services"
	@echo "  make logs-api    - Follow API logs"
	@echo "  make logs-web    - Follow Web logs"

# Docker Compose commands
up:
	docker compose up -d

up-db:
	docker compose up -d postgres redis

up-appwrite:
	docker compose up -d appwrite appwrite-mariadb appwrite-redis appwrite-influxdb appwrite-telegraf

down:
	docker compose down

logs:
	docker compose logs -f

logs-api:
	docker compose logs -f api

logs-web:
	docker compose logs -f web

restart:
	docker compose restart

# Build commands
build:
	pnpm build

clean:
	pnpm clean
	docker compose down -v
	rm -rf node_modules apps/*/node_modules packages/*/node_modules
	rm -rf apps/*/.next apps/*/.expo apps/*/dist packages/*/dist

# Development commands
install:
	pnpm install

dev:
	pnpm dev

dev-api:
	pnpm --filter @busap/api dev

dev-web:
	pnpm --filter @busap/web dev

dev-mobile:
	pnpm --filter @busap/mobile dev

# Testing & Quality
test:
	pnpm test

lint:
	pnpm lint

format:
	pnpm format

typecheck:
	pnpm typecheck

# Database commands
migrate:
	pnpm --filter @busap/api prisma migrate dev

migrate-deploy:
	pnpm --filter @busap/api prisma migrate deploy

seed:
	pnpm --filter @busap/api prisma db seed

db-studio:
	pnpm --filter @busap/api prisma studio

db-reset:
	pnpm --filter @busap/api prisma migrate reset

# Generate Prisma client
generate:
	pnpm --filter @busap/api prisma generate

# Production build
build-prod:
	docker compose -f docker-compose.prod.yml build

deploy:
	docker compose -f docker-compose.prod.yml up -d
