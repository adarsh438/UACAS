# Multi-stage production build for NAAC SSR System
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
# --ignore-scripts prevents postinstall (prisma generate) from running before schema is present
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# Copy code and configuration files
COPY tsconfig.json vite.config.ts index.html ./
COPY prisma ./prisma
COPY src ./src
COPY server.ts ./server.ts

# Patch schema to PostgreSQL BEFORE generating the client so the built binary
# targets the PostgreSQL engine (not SQLite). The entrypoint will also patch
# the schema at boot, but having the right binary pre-built avoids a slow
# `prisma generate` inside the container on every cold start.
RUN sed -i 's/provider[[:space:]]*=[[:space:]]*"sqlite"/provider = "postgresql"/g' prisma/schema.prisma && \
    sed -i 's|url[[:space:]]*=[[:space:]]*"file:.*"|url = env("DATABASE_URL")|g' prisma/schema.prisma

# Generate Prisma PostgreSQL client and build the production bundle
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime packages:
#   openssl        - required by Prisma PostgreSQL driver
#   bash           - used by docker-entrypoint.sh
#   curl           - general utility
#   netcat-openbsd - provides `nc` used in entrypoint DB readiness check
RUN apk add --no-cache openssl bash curl netcat-openbsd

# Set production environment
ENV NODE_ENV=production

# Install only production dependencies
# --ignore-scripts prevents postinstall (prisma generate) before the schema is present;
# the pre-built PostgreSQL Prisma client is copied from the builder stage below
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# Copy compiled production bundle from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Copy the pre-built PostgreSQL Prisma client (both the JS wrapper and the engine binary)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Copy the prisma CLI so `npx prisma db push` works without downloading it
COPY --from=builder /app/node_modules/.bin/prisma ./node_modules/.bin/prisma
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose Express application port
EXPOSE 3000

# Configure entrypoint to initialise database before booting the app
ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]
