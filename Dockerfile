# syntax=docker/dockerfile:1.7
#
# Multi-stage Dockerfile for the TradingView clone.
#
# Stages:
#   deps     — install npm deps
#   builder  — generate Prisma client + build the Next.js app
#   runner   — minimal runtime image (Next standalone output)
#
# Build:    docker build -t tradeview .
# Run:      docker run -p 3000:3000 --env-file .env tradeview

FROM node:20-alpine AS base
RUN apk add --no-cache libc6-compat

# ─── deps ─────────────────────────────────────────────────────────────────────
FROM base AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ─── builder ──────────────────────────────────────────────────────────────────
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# Generate the Prisma client against whichever provider is configured.
RUN npx prisma generate
# Skip telemetry to keep builds quiet.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# ─── runner ───────────────────────────────────────────────────────────────────
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

# Standalone output: a self-contained server bundle.
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Prisma engines + migrations need to be present at runtime for `migrate deploy`.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
