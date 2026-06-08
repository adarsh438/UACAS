# UACAS Deployment Guide

This guide ensures a smooth production deployment of the University Accreditation & Compliance Automation System.

## Prerequisites
- Node.js 20+
- PostgreSQL (for Production) or SQLite (for Development)
- Docker & Docker Compose (Optional)
- Google Cloud Project with Gemini AI API enabled

## 1. Environment Configuration
Create a `.env` file from the provided `.env.example`:

```env
DATABASE_URL="postgresql://user:pass@host:5432/db"
GEMINI_API_KEY="your-gemini-api-key"
JWT_SECRET="generate-a-long-random-string"
APP_URL="https://your-domain.com"
```

## 2. Infrastructure Setup (Docker Deployment)
The application includes a fully optimized containerized deployment using Docker Compose, spinning up the consolidated Node/React app and a PostgreSQL 15 database.

### Step 2.1: Pre-requisites
Ensure you have Docker and Docker Compose installed on your target server.

### Step 2.2: Launch the Services
Start the containers in detached (background) mode:
```bash
docker compose up --build -d
```

### Step 2.3: Automatic Schema Migrations
During container startup, the `docker-entrypoint.sh` script automatically:
1. Swaps the Prisma provider from SQLite (`sqlite`) to PostgreSQL (`postgresql`) inside the container.
2. Waits for the PostgreSQL database container to become healthy.
3. Automatically generates the PostgreSQL-compatible Prisma client.
4. Executes `npx prisma db push` to synchronize all NAAC schema tables and relations directly to your PostgreSQL database.

### Step 2.4: Seed Initial Data (Optional)
Since the production container executes in a pruned environment without development tools like `tsx`, you can seed the PostgreSQL database directly from your local host machine (where devDependencies are installed) by directing the database URL to the exposed PostgreSQL port `5432`:
```bash
# On your local host workspace:
DATABASE_URL="postgresql://uacas:password@localhost:5432/uacas" npx tsx prisma/seed.ts
```
This will populate the production PostgreSQL database with the complete 5-year NAAC dataset for the dashboard and reports.

## 3. Manual Installation (Bare Metal)

### Step 3.1: Install Dependencies
```bash
npm install
```

### Step 3.2: Database Migration
```bash
# Generate the Prisma client
npx prisma generate

# Apply migrations to the production database
npx prisma db push
```

### Step 3.3: Seed Initial Data
```bash
npx tsx prisma/seed.ts
```

### Step 3.4: Build & Start
```bash
npm run build
npm run start
```

## 4. Multi-Tenant Considerations
UACAS is designed for multi-tenancy. To add a new university:
1. Use the administrative portal (or direct DB access) to create a new `University` entry.
2. Users linked to that `universityId` will only see records for their institution.

## 5. Security Checklist
- Ensure environment variables are never committed to VCS.
- Use HTTPS for all communications.
- Rotate the Gemini API key every 90 days.
- Schedule daily database backups of the `postgres_data` volume.
- **Helmet**: The application uses Helmet by default to set secure HTTP headers.
- **Rate Limiting**: An IP-based rate limiter is configured (`max 1000 requests per 15 minutes`). Adjust this in `server.ts` according to peak load.
- **CORS**: Ensure the `cors` middleware origins in `server.ts` match your specific deployment domains.
- **Firebase Auth Verification**: User ID tokens mapped to the `Authorization` header are strictly enforced via the `requireAuth` middleware for all data endpoints.
- **Input Validation**: All POST/PUT endpoints enforce strict runtime schema validation using `zod`.
- **Centralized Logging**: `winston` and `morgan` are active in production to stream standard structured logs to `stdout`.

## 6. Render.com File Storage
To prevent evidence files from being lost on every deployment, you must configure a persistent disk:
1. In Render Dashboard, go to your Web Service settings.
2. Under "Disks", add a new disk:
   - Name: `uacas-uploads`
   - Mount Path: `/app/uploads`
   - Size: `10 GB`
3. Under "Environment", add:
   - Key: `UPLOAD_PATH`
   - Value: `/app/uploads/evidence`

If you do not configure a Render Disk, uploads will be saved to the ephemeral `./uploads/evidence` directory and will be permanently lost when the app is next deployed.
