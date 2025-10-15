#!/bin/bash
set -e

# ============================================
# HanaZoom EC2 배포 스크립트
# t3.medium (4GB) 최적화 버전 (Kibana 제거)
# ============================================

echo "🚀 Starting HanaZoom EC2 Deployment..."

# 변수 설정
COMPOSE_FILE="docker-compose-ec2.yml"
ENV_FILE=".env.ec2"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 스크립트 실행 디렉토리로 이동
cd "$SCRIPT_DIR"

# 환경변수 파일 확인
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found!"
    echo "📝 Please copy env-ec2-template to .env.ec2 and fill in the values."
    echo "   cp env-ec2-template .env.ec2"
    exit 1
fi

# 환경변수 로드
echo "📋 Loading environment variables..."
source "$ENV_FILE"

# 필수 환경변수 확인
required_vars=(
    "ECR_REGISTRY"
    "DB_URL"
    "DB_USERNAME"
    "DB_PASSWORD"
    "REDIS_PASSWORD"
    "MONGO_PASSWORD"
    "KIS_APP_KEY"
    "JWT_SECRET"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo "❌ Error: Required environment variable $var is not set!"
        exit 1
    fi
done

echo "✅ All required environment variables are set."

# AWS CLI 설치 확인
if ! command -v aws &> /dev/null; then
    echo "⚠️  AWS CLI not found. Installing..."
    # Amazon Linux 2/CentOS/RHEL
    if command -v yum &> /dev/null; then
        sudo yum install -y awscli
    # Ubuntu/Debian
    elif command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y awscli
    else
        echo "❌ Unable to install AWS CLI. Please install it manually."
        exit 1
    fi
fi

# ECR 로그인
echo "🔐 Logging in to AWS ECR..."
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin "$ECR_REGISTRY"

if [ $? -ne 0 ]; then
    echo "❌ ECR login failed! Please check your AWS credentials."
    exit 1
fi

echo "✅ ECR login successful."

# Docker 이미지 Pull
echo "📦 Pulling latest Docker images..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull backend

if [ $? -ne 0 ]; then
    echo "❌ Failed to pull Docker images!"
    exit 1
fi

# 기존 컨테이너 중지 및 제거
echo "🛑 Stopping existing containers..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" down

# 사용하지 않는 이미지 정리 (디스크 공간 확보)
echo "🧹 Cleaning up unused Docker images..."
docker image prune -f

# 새 컨테이너 시작
echo "🚀 Starting new containers..."
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

if [ $? -ne 0 ]; then
    echo "❌ Failed to start containers!"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs
    exit 1
fi

# 헬스 체크
echo "🏥 Waiting for services to be healthy..."
sleep 15

# Redis 헬스 체크
echo "⏳ Checking Redis..."
MAX_RETRIES=10
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec hanazoom-redis redis-cli -a "$REDIS_PASSWORD" ping > /dev/null 2>&1; then
        echo "✅ Redis is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "⏳ Waiting for Redis... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 2
done

# MongoDB 헬스 체크
echo "⏳ Checking MongoDB..."
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if docker exec hanazoom-mongodb mongosh --eval "db.adminCommand('ping')" > /dev/null 2>&1; then
        echo "✅ MongoDB is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "⏳ Waiting for MongoDB... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 3
done

# Elasticsearch 헬스 체크
echo "⏳ Checking Elasticsearch..."
RETRY_COUNT=0
MAX_RETRIES=20
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:9200/_cluster/health > /dev/null 2>&1; then
        echo "✅ Elasticsearch is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "⏳ Waiting for Elasticsearch... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

# Backend 헬스 체크
echo "⏳ Checking Backend..."
MAX_RETRIES=30
RETRY_COUNT=0
while [ $RETRY_COUNT -lt $MAX_RETRIES ]; do
    if curl -f http://localhost:8080/actuator/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    RETRY_COUNT=$((RETRY_COUNT+1))
    echo "⏳ Waiting for backend to be ready... ($RETRY_COUNT/$MAX_RETRIES)"
    sleep 5
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
    echo "❌ Backend health check failed after $MAX_RETRIES attempts!"
    echo "📋 Showing backend logs:"
    docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" logs --tail=50 backend
    exit 1
fi

# 최종 상태 확인
echo ""
echo "================================"
echo "📋 Deployment Status"
echo "================================"
docker-compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" ps

echo ""
echo "================================"
echo "📊 Resource Usage"
echo "================================"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "🔍 Useful commands:"
echo "  - View logs:       docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f"
echo "  - View backend:    docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE logs -f backend"
echo "  - Restart:         docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE restart"
echo "  - Stop:            docker-compose -f $COMPOSE_FILE --env-file $ENV_FILE down"
echo "  - Resource stats:  docker stats"
echo ""

