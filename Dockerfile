# Multi-stage production build for NAAC SSR System
# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy code and configuration files
COPY tsconfig.json vite.config.ts index.html tailwind.config.js postcss.config.js ./
COPY prisma ./prisma
COPY src ./src
COPY server.ts ./server.ts

# Generate the initial client and build the production bundle
RUN npx prisma generate
RUN npm run build

# Stage 2: Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

# Install production-required runtime packages (like openssl for Prisma Postgres drivers, and bash/curl)
RUN apk add --no-cache openssl bash curl

# Set production environment
ENV NODE_ENV=production

# Copy built package definitions and install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled production bundle from the builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy startup scripts
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose Express application port
EXPOSE 3000

# Configure entrypoint to initialize database before booting
ENTRYPOINT ["/bin/bash", "/app/docker-entrypoint.sh"]
