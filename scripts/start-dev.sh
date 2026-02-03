#!/bin/bash

# Start development environment for Busap
# This script starts both Appwrite and the application stack

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Starting Busap development environment..."

# Start Appwrite first (it creates the 'gateway' network)
echo "Starting Appwrite..."
cd "$PROJECT_DIR/docker/appwrite"

# Copy .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    echo "Created .env from .env.example - please review settings"
fi

docker-compose up -d

# Wait for Appwrite to be ready
echo "Waiting for Appwrite to be ready..."
sleep 10

# Start application stack
echo "Starting application stack..."
cd "$PROJECT_DIR"
docker-compose up -d

echo ""
echo "Development environment started!"
echo ""
echo "Services:"
echo "  - Appwrite Console: http://localhost"
echo "  - Web App:          http://localhost:3000"
echo "  - API:              http://localhost:3001"
echo ""
echo "To view logs:"
echo "  docker-compose logs -f"
echo ""
