#!/bin/bash

# Stop development environment for Busap

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

echo "Stopping Busap development environment..."

# Stop application stack
cd "$PROJECT_DIR"
docker-compose down

# Stop Appwrite
cd "$PROJECT_DIR/docker/appwrite"
docker-compose down

echo "Development environment stopped."
