#!/bin/bash

# Auto-deploy script for VipOnly
# Triggered by GitHub webhook

set -e

DEPLOY_DIR="${DEPLOY_DIR:-/deploy}"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

log "=== Starting deployment ==="

cd "$DEPLOY_DIR"

# Pull latest changes
log "Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

# Rebuild and restart containers
log "Rebuilding Docker containers..."
docker compose build --no-cache app

log "Restarting containers..."
docker compose up -d app

# Cleanup old images
log "Cleaning up old images..."
docker image prune -f

log "=== Deployment complete ==="
