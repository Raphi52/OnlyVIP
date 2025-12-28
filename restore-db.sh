#!/bin/bash
# Restore database from backup

echo "⚠️  This will REPLACE the current database with the backup!"
read -p "Are you sure? (y/N) " confirm

if [ "$confirm" != "y" ]; then
    echo "Cancelled."
    exit 0
fi

echo "Restoring database..."

# Stop the app to prevent connections
docker stop viponly-app

# Restore from dump
docker exec -i viponly-db pg_restore -U viponly -d viponly --clean --if-exists < ./backups/viponly_backup.dump

# Restart app
docker start viponly-app

echo "✅ Database restored!"
