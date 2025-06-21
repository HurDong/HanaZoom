#!/bin/bash

echo "🚀 Starting deployment process..."

# 1. Pull latest changes from current branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "📥 Pulling latest changes from git branch: $CURRENT_BRANCH"
git pull origin $CURRENT_BRANCH

# 2. Stop only if containers are running
echo "🛑 Stopping running containers..."
docker-compose ps | grep Up && docker-compose down || echo "No containers to stop."

# 3. Start containers with build only if needed
echo "🚀 Building & Starting containers..."
docker-compose up --build -d

# 4. Clean up only dangling images (optional)
echo "🧹 Cleaning up dangling images..."
docker image prune -f

# 5. Check container status
echo "🔍 Checking container status..."
docker-compose ps

# 6. Show logs of the last 10 lines for each service
for service in frontend backend db; do
  echo "📋 Recent logs from $service:"
  docker-compose logs --tail=10 $service
done

echo "✅ Deployment completed!"
