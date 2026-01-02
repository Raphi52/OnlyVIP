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

# Ensure we use HTTPS (no SSH in container)
git remote set-url origin https://github.com/Raphi52/OnlyVIP.git 2>/dev/null || true

# Pull latest changes
log "Pulling latest changes..."
git fetch origin main
git reset --hard origin/main

# Rebuild and restart only the app container
log "Rebuilding Docker containers..."
docker compose build --no-cache app

log "Restarting app container..."
docker compose up -d --no-deps --force-recreate app

# Cleanup old images
log "Cleaning up old images..."
docker image prune -f

log "=== Deployment complete ==="
