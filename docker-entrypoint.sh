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

# ── 3. TCP-level wait for the database port to be open ───────────────────────
# Parse host and port from DATABASE_URL (handles postgresql:// and postgres://)
DB_HOST=$(echo "$DATABASE_URL" | sed -E 's|.*://[^@]+@([^:/]+).*|\1|')
DB_PORT=$(echo "$DATABASE_URL" | sed -E 's|.*:([0-9]+)/.*|\1|')
DB_PORT="${DB_PORT:-5432}"

echo "Waiting for TCP connection to $DB_HOST:$DB_PORT ..."
TCP_RETRIES=30
until nc -z -w 3 "$DB_HOST" "$DB_PORT" 2>/dev/null; do
  TCP_RETRIES=$((TCP_RETRIES - 1))
  if [ "$TCP_RETRIES" -le 0 ]; then
    echo "ERROR: Database TCP port $DB_HOST:$DB_PORT never opened. Exiting."
    exit 1
  fi
  echo "  TCP not open yet, retrying in 3s... ($TCP_RETRIES attempts left)"
  sleep 3
done
echo "TCP connection to $DB_HOST:$DB_PORT is open."

# ── 4. Push schema to the database ───────────────────────────────────────────
# NOTE: prisma generate was already run in the Dockerfile builder stage and the
# pre-built PostgreSQL client was copied into the image. No need to re-run it.
echo "Pushing schema to database..."
RETRIES=20
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
