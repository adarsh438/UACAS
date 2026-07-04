# Multi-stage production build for NAAC SSR System

# ==========================================
# STAGE 1: Build Phase
# ==========================================
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy code and configuration files
COPY . .

# Patch schema to PostgreSQL BEFORE generating the client so the built binary
# targets the PostgreSQL engine (not SQLite).
RUN sed -i 's/provider[[:space:]]*=[[:space:]]*"sqlite"/provider = "postgresql"/g' prisma/schema.prisma && \
    sed -i 's|url[[:space:]]*=[[:space:]]*"file:.*"|url = env("DATABASE_URL")|g' prisma/schema.prisma

# Generate Prisma PostgreSQL client and build the production bundle
RUN npx prisma generate
RUN npm run build

# ==========================================
# STAGE 2: Production Execution Runtime
# ==========================================
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime packages required by Prisma and entrypoint scripts
RUN apk add --no-cache openssl bash curl netcat-openbsd

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled production bundle from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server.ts ./

# Copy the pre-built PostgreSQL Prisma client
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy the prisma CLI
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

EXPOSE 3000

ENTRYPOINT ["/bin/bash", "./docker-entrypoint.sh"]
