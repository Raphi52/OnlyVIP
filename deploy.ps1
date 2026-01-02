# VipOnly Deploy Script for Windows
# Run this after git pull to rebuild the app

Write-Host "=== VipOnly Deploy ===" -ForegroundColor Cyan

# Pull latest changes
Write-Host "Pulling latest changes..." -ForegroundColor Yellow
git pull

# Rebuild app container
Write-Host "Rebuilding app container..." -ForegroundColor Yellow
docker compose build --no-cache app

# Restart app
Write-Host "Restarting app..." -ForegroundColor Yellow
docker compose up -d --force-recreate app

# Cleanup
Write-Host "Cleaning up old images..." -ForegroundColor Yellow
docker image prune -f

Write-Host "=== Deploy complete! ===" -ForegroundColor Green
