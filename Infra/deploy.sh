#!/bin/bash

echo "🚀 Starting deployment process..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin infra/init

# 2. Stop running containers
echo "🛑 Stopping running containers..."
docker-compose down

# 3. Remove old images
echo "🧹 Cleaning up old images..."
docker-compose rm -f

# 4. Build new images
echo "🏗️ Building new images..."
docker-compose build --no-cache

# 5. Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# 6. Clean up unused images and volumes
echo "🧹 Cleaning up unused Docker resources..."
docker system prune -f

# 7. Check container status
echo "🔍 Checking container status..."
docker-compose ps

# 8. Show logs of the last 10 lines for each service
echo "📋 Recent logs from services:"
echo "Frontend logs:"
docker-compose logs --tail=10 frontend
echo "Backend logs:"
docker-compose logs --tail=10 backend
echo "Database logs:"
docker-compose logs --tail=10 db

echo "✅ Deployment completed!" 