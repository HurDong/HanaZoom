FROM node:18-alpine AS builder

WORKDIR /app

# 패키지 매니저 설치 및 의존성 설치 (개발 의존성 포함)
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm --no-fund --no-audit
# --prod 플래그 제거하여 devDependencies도 설치
RUN pnpm install

# 소스 코드 복사 및 빌드
COPY . .
# 빌드 전에 환경 변수 설정
ENV NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NODE_ENV=production
RUN pnpm build

# 프로덕션 이미지
FROM node:18-alpine

WORKDIR /app

# 필요한 파일들 복사
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
# tsconfig.json도 복사 (경로 별칭 설정을 위해)
COPY --from=builder /app/tsconfig.json ./

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://54.180.109.147:8080

CMD ["npm", "start", "--", "--hostname", "0.0.0.0"] 