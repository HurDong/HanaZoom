FROM node:18-alpine AS base

# pnpm 설치 (한 번만)
RUN npm install -g pnpm --no-fund --no-audit

FROM base AS deps
WORKDIR /app

# 의존성만 먼저 설치 (캐시 최적화)
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prefer-offline

FROM base AS builder
WORKDIR /app

# 의존성 복사 (재설치 없이)
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 빌드 환경 변수 설정
ENV NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# Next.js 빌드 (간단한 방식)
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://localhost:8080
ENV NEXT_TELEMETRY_DISABLED=1

# 사용자 생성 (보안)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 필요한 파일들 복사
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# .next 폴더 복사
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# 프로덕션 의존성 설치
RUN pnpm install --prod --frozen-lockfile

USER nextjs

EXPOSE 3000

ENV PORT=3000

CMD ["pnpm", "start"]