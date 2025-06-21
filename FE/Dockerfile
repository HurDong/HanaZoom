FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 매니저 설치 및 의존성 설치
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm --no-fund --no-audit
RUN pnpm install --frozen-lockfile --prod

# 소스 코드 복사 및 빌드
COPY . .
RUN pnpm build

# 프로덕션 이미지
FROM node:18-alpine

WORKDIR /app

# 필요한 파일만 복사
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

EXPOSE 3000

CMD ["npm", "start"] 