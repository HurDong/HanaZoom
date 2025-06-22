FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json pnpm-lock.yaml ./
RUN npm install -g pnpm --no-fund --no-audit && \
    pnpm install --frozen-lockfile

# Copy only necessary source files
COPY next.config.* .
COPY tsconfig.json .
COPY public ./public
COPY app ./app
COPY components ./components
COPY styles ./styles
COPY types ./types
COPY lib ./lib
COPY hooks ./hooks
COPY data ./data

# Build the application
ENV NEXT_PUBLIC_API_URL=http://54.180.109.147:8080
ENV NODE_ENV=production
RUN pnpm build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy only production necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/pnpm-lock.yaml ./pnpm-lock.yaml

# Install only production dependencies
RUN npm install -g pnpm --no-fund --no-audit && \
    pnpm install --prod --frozen-lockfile

EXPOSE 3000

ENV NODE_ENV=production
ENV NEXT_PUBLIC_API_URL=http://54.180.109.147:8080

CMD ["npm", "start", "--", "--hostname", "0.0.0.0"]