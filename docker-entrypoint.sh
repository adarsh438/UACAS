#!/usr/bin/env bash
# docker-entrypoint.sh
set -e

echo "=== UACAS Enterprise Application Booting ==="

# ── 1. Rewrite Prisma schema: SQLite → PostgreSQL ────────────────────────────
echo "Configuring Prisma for PostgreSQL..."
sed -i 's/provider[[:space:]]*=[[:space:]]*"sqlite"/provider = "postgresql"/g' prisma/schema.prisma
sed -i 's|url[[:space:]]*=[[:space:]]*"file:.*"|url = env("DATABASE_URL")|g' prisma/schema.prisma

# ── 2. Validate DATABASE_URL ─────────────────────────────────────────────────
if [ -z "$DATABASE_URL" ]; then
  echo "ERROR: DATABASE_URL is not set. Cannot continue."
  exit 1
fi
echo "DATABASE_URL is set. Connecting to PostgreSQL..."

# ── 3. Generate the PostgreSQL Prisma client ─────────────────────────────────
# The builder stage pre-generated a SQLite client; we need the PostgreSQL one.
echo "Generating Prisma client for PostgreSQL..."
npx prisma generate

# ── 4. Push schema to the database (with retry for cold-start DB) ────────────
echo "Pushing schema to database..."
RETRIES=10
until npx prisma db push --skip-generate 2>&1; do
  RETRIES=$((RETRIES - 1))
  if [ "$RETRIES" -le 0 ]; then
    echo "ERROR: prisma db push failed after all retries. Exiting."
    exit 1
  fi
  echo "Database not ready yet, retrying in 3s... ($RETRIES retries left)"
  sleep 3
done
echo "Schema pushed successfully!"

# ── 5. Start the production server ───────────────────────────────────────────
echo "Starting UACAS server..."
exec node dist/server.cjs
