#!/usr/bin/env bash
# docker-entrypoint.sh
set -e

echo "=== NAAC SSR On-Premise Application Booting ==="

# 1. Dynamically rewrite Prisma provider from SQLite to PostgreSQL
echo "Configuring Prisma for PostgreSQL production environment..."
sed -i 's/provider[[:space:]]*=[[:space:]]*"sqlite"/provider = "postgresql"/g' prisma/schema.prisma
sed -i 's|url[[:space:]]*=[[:space:]]*"file:.*"|url = env("DATABASE_URL")|g' prisma/schema.prisma

# 2. Wait for PostgreSQL database container to be online and accepting connections
if [ -n "$DATABASE_URL" ]; then
  # Parse host and port from DATABASE_URL: postgresql://user:password@host:port/dbname
  DB_HOST=$(echo "$DATABASE_URL" | sed -e 's|^.*//||' -e 's|:.*$||' -e 's|^.*@||' -e 's|/.*$||')
  DB_PORT=$(echo "$DATABASE_URL" | sed -e 's|^.*//||' -e 's|^.*:||' -e 's|/.*$||')
  
  # Set defaults if parsing yields empty results
  DB_HOST=${DB_HOST:-db}
  DB_PORT=${DB_PORT:-5432}
  
  echo "Checking database connection on host: $DB_HOST, port: $DB_PORT..."
  until nc -z -w 5 "$DB_HOST" "$DB_PORT"; do
    echo "PostgreSQL at $DB_HOST:$DB_PORT is unavailable - sleeping..."
    sleep 2
  done
  echo "PostgreSQL is online and ready!"
else
  echo "WARNING: DATABASE_URL environment variable is not defined!"
fi

# 3. Generate PostgreSQL client and run database schemas sync
echo "Compiling database client drivers..."
npx prisma generate

echo "Pushing accreditation schema mappings and indices to the database..."
npx prisma db push --skip-generate

# 4. Boot production application
echo "Starting production Web server on port 3000..."
exec node dist/server.cjs
