#!/bin/bash

echo "🚀 Starting deployment process..."

# 1. Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin infra/init

# 2. Stop running containers
echo "🛑 Stopping running containers..."
docker-compose down

# 3. Build images (with cache)
echo "🏗️ Building images..."
docker-compose build

# 4. Start containers
echo "🚀 Starting containers..."
docker-compose up -d

# 5. Clean up unused images and volumes
echo "🧹 Cleaning up unused Docker resources..."
docker system prune -f

# 6. Check container status
echo "🔍 Checking container status..."
docker-compose ps

# 7. Show logs of the last 10 lines for each service
echo "📋 Recent logs from services:"
echo "Frontend logs:"
docker-compose logs --tail=10 frontend
echo "Backend logs:"
docker-compose logs --tail=10 backend
echo "Database logs:"
docker-compose logs --tail=10 db

echo "✅ Deployment completed!" 