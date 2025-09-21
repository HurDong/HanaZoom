#!/bin/bash

# 개발 서버 재시작 스크립트
echo "🔄 개발 서버를 재시작합니다..."

# 기존 프로세스 종료
pkill -f "next dev" || true

# 캐시 정리
rm -rf .next
rm -rf node_modules/.cache

# 의존성 재설치 (필요시)
# npm install

# 개발 서버 시작
echo "🚀 개발 서버를 시작합니다..."
npm run dev
