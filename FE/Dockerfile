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
ENV NEXT_PUBLIC_API_URL=http://54.180.109.147:8080
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Next.js 빌드 (캐시 활용)
RUN pnpm build

FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://54.180.109.147:8080
ENV NEXT_TELEMETRY_DISABLED=1

# 사용자 생성 (보안)
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Next.js 빌드 결과물만 복사
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]