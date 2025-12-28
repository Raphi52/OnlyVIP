# syntax=docker/dockerfile:1.4

# Build stage - using Alpine 3.18 for OpenSSL 1.1 compatibility with Prisma
FROM node:20-alpine3.18 AS builder

WORKDIR /app

# Copy package files first (for better caching)
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies with cache mount
RUN --mount=type=cache,target=/root/.npm \
    npm ci --legacy-peer-deps

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build with cache
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Production stage
FROM node:20-alpine3.18 AS runner

WORKDIR /app

ENV NODE_ENV=production

# Install ffmpeg for video processing
RUN apk add --no-cache ffmpeg

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built assets
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Create uploads directory
RUN mkdir -p /app/public/uploads/media && \
    chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
