# UACAS — University Accreditation & Compliance Automation System

> **Production-ready, on-premise platform** for automating NAAC SSR scoring, evidence management, OBE tracking, and accreditation reporting for Indian universities.

---

## Table of Contents

1. [What is UACAS?](#what-is-uacas)
2. [Requirements](#requirements)
3. [Option A — Quick Start (Local Dev, 5 minutes)](#option-a--quick-start-local-dev-5-minutes)
4. [Option B — Docker Deployment (Recommended for Production)](#option-b--docker-deployment-recommended-for-production)
5. [Option C — Bare Metal / VPS Deployment](#option-c--bare-metal--vps-deployment)
6. [First Login & Seed Data](#first-login--seed-data)
7. [Environment Variables Reference](#environment-variables-reference)
8. [Running Tests](#running-tests)
9. [Core Modules](#core-modules)
10. [Tech Stack](#tech-stack)
11. [Security Notes](#security-notes)

---

## What is UACAS?

UACAS automates the most time-consuming parts of NAAC Self Study Report (SSR) preparation:

- **Live NAAC scoring** across all 7 criteria with real-time CGPA prediction
- **Bulk Excel import** for all criterion data (C1–C7)
- **Evidence Vault** — centralized DVV document management
- **AI-powered narratives** using Google Gemini for SSR text generation
- **OBE Engine** — automated CO-PO attainment calculation
- **Report Engine** — one-click PDF/Excel SSR export
- **Gap Analysis** — flags RED/AMBER metrics that need attention before submission

---

## Requirements

| Tool | Minimum Version | Required For |
|---|---|---|
| **Node.js** | 20+ | All options |
| **npm** | 9+ | All options |
| **Git** | Any | Downloading the code |
| **Docker** | 24+ | Option B only |
| **Docker Compose** | v2+ | Option B only |
| **PostgreSQL** | 15+ | Option C production |

> **Windows users:** All commands below work in **PowerShell** or **Git Bash**.

---

## Option A — Quick Start (Local Dev, 5 minutes)

This uses SQLite (no database server needed). Best for trying out the software.

### Step 1 — Download the code

```bash
git clone https://github.com/adarsh438/UACAS.git
cd UACAS
```

### Step 2 — Install dependencies

```bash
npm install
```

### Step 3 — Create your `.env` file

```bash
# Windows PowerShell
Copy-Item .env.example .env

# Mac / Linux
cp .env.example .env
```

Open `.env` and set at minimum:

```env
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="change-this-to-any-long-random-string"
GEMINI_API_KEY="your-google-gemini-api-key"
PUBLIC_BASE_URL="http://localhost:3000"
NODE_ENV="development"
```

> **Get a free Gemini API key** at [aistudio.google.com](https://aistudio.google.com/). The AI narrative features won't work without it, but all scoring and reporting still functions.

### Step 4 — Set up the database

```bash
npx prisma generate
npx prisma db push
```

### Step 5 — Seed demo data (optional but recommended)

```bash
npx tsx prisma/seed.ts
```

This loads 5 years of realistic NAAC data so the dashboard is populated immediately.

### Step 6 — Start the application

```bash
npm run dev
```

Open your browser at **[http://localhost:3000](http://localhost:3000)**

**Default login credentials (after seeding):**

| Role | Email | Password |
|---|---|---|
| IQAC Coordinator | `admin@university.edu` | `Admin@1234` |
| Department Head | `hod@university.edu` | `Admin@1234` |
| Faculty | `faculty@university.edu` | `Admin@1234` |
| Reviewer | `reviewer@university.edu` | `Admin@1234` |

---

## Option B — Docker Deployment (Recommended for Production)

Runs the full stack (app + PostgreSQL) in containers. No manual database setup needed.

### Step 1 — Download the code

```bash
git clone https://github.com/adarsh438/UACAS.git
cd UACAS
```

### Step 2 — Create your `.env` file

```bash
cp .env.example .env   # Mac/Linux
# OR
Copy-Item .env.example .env   # Windows PowerShell
```

Edit `.env`:

```env
DATABASE_URL="postgresql://uacas:password@db:5432/uacas"
JWT_SECRET="generate-a-long-random-secret-here"
GEMINI_API_KEY="your-google-gemini-api-key"
PUBLIC_BASE_URL="https://your-domain.com"
NODE_ENV="production"
```

### Step 3 — Build and launch

```bash
docker compose up --build -d
```

This automatically:
1. Builds the Node.js + React application image
2. Starts a PostgreSQL 15 database container
3. Waits for the database to be healthy
4. Runs Prisma migrations to create all tables
5. Starts the web server on **port 3000**

### Step 4 — Seed initial data (optional)

```bash
# From your local machine (not inside Docker)
DATABASE_URL="postgresql://uacas:password@localhost:5432/uacas" npx tsx prisma/seed.ts
```

### Step 5 — Access the application

Open **[http://localhost:3000](http://localhost:3000)** (or your server's IP/domain).

### Useful Docker commands

```bash
# View running containers
docker compose ps

# View application logs
docker compose logs -f app

# Stop everything
docker compose down

# Stop and delete all data volumes (destructive!)
docker compose down -v
```

---

## Option C — Bare Metal / VPS Deployment

Best for universities hosting on their own Linux server (Ubuntu/Debian recommended).

### Step 1 — Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2 — Clone and install

```bash
git clone https://github.com/adarsh438/UACAS.git
cd UACAS
npm install
```

### Step 3 — Configure environment

```bash
cp .env.example .env
nano .env
```

Set your PostgreSQL connection string and other variables.

### Step 4 — Database setup

```bash
npx prisma generate
npx prisma db push
npx tsx prisma/seed.ts   # optional demo data
```

### Step 5 — Build for production

```bash
npm run build
```

### Step 6 — Start the server

```bash
npm run start
```

> **For always-on deployment**, use `pm2`:
> ```bash
> npm install -g pm2
> pm2 start dist/server.cjs --name uacas
> pm2 save
> pm2 startup
> ```

---

## First Login & Seed Data

After seeding, the dashboard will show:

- **NAAC Criteria C1–C7** with live scores and CGPA prediction
- **Gap Analysis** — metrics flagged RED/AMBER that need improvement
- **Evidence Vault** — placeholder evidence documents
- **5 academic years** of sample data (2020-21 to 2024-25)

If you skip seeding, the system starts empty — use the **Criterion Forms** (C1–C7) or **Excel Bulk Import** to enter your institution's real data.

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | SQLite: `file:./prisma/dev.db` or PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Any long random string for JWT token signing |
| `GEMINI_API_KEY` | ⚠️ | Google Gemini key — required for AI narrative generation |
| `PUBLIC_BASE_URL` | ✅ | Your deployment URL (e.g. `https://yourdomain.com`) — used in report links |
| `NODE_ENV` | ✅ | `development` or `production` |

---

## Running Tests

The scoring engine has **21 unit tests** covering all 7 NAAC criteria:

```bash
node --import tsx --test src/server/tests/scoring.test.ts
```

Expected output: `pass 21  fail 0`

---

## Core Modules

| Module | Description |
|---|---|
| **NAAC Dashboard** | Live C1–C7 scores, CGPA prediction, gap analysis |
| **Criterion Forms** | Data entry forms for each of the 7 NAAC criteria |
| **Bulk Excel Import** | Upload `.xlsx` templates to batch-import data for C1–C7 |
| **Evidence Vault** | Upload, tag, and manage DVV evidence files by metric code |
| **Report Engine** | Generate Word/PDF SSR reports with institutional branding |
| **OBE Tracking** | CO-PO-PSO mapping and attainment calculation |
| **NBA Module** | Program-level accreditation readiness tracking |
| **AI Narratives** | Gemini-powered SSR text generation for each criterion |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, Recharts, Framer Motion |
| Backend | Node.js, Express, TypeScript |
| Database | Prisma ORM → SQLite (dev) / PostgreSQL (prod) |
| AI | Google Gemini 2.5 Flash |
| Auth | JWT + bcrypt |
| Reports | pdf-lib, ExcelJS, docx |
| Container | Docker + Docker Compose |

---

## Security Notes

- ✅ `.env` is gitignored — your secrets are never pushed to GitHub
- ✅ All API endpoints require JWT authentication (`requireAuth` middleware)
- ✅ Role-based access: `SUPER_ADMIN > IQAC_COORDINATOR > DEPT_HEAD > FACULTY > REVIEWER`
- ✅ Input validation via `zod` on all POST/PUT endpoints
- ✅ HTTP security headers via `helmet`
- ✅ Rate limiting: 1000 requests / 15 minutes per IP
- ⚠️ Change `JWT_SECRET` to a strong random value before going to production
- ⚠️ Use HTTPS in production (configure via Nginx reverse proxy or your cloud provider)

---

**Built for high-stakes university accreditation readiness.** 🎓
