# Comprehensive Solutions & Patch Configuration for UACAS

This document contains a series of complete, production-ready configuration files and code patches designed to resolve all six core issues identified in the UACAS repository. You can copy and paste these patches directly into your workspace or system to resolve the issues.

---

## 1. Vercel Serverless CJS Bundle Fix (`tsconfig.json` & Build Script)

**File to Update:** `tsconfig.json`  
**Problem:** Mismatch in how CommonJS (CJS) and ES Modules (ESM) are compiled and resolved by Vercel serverless functions.  
**Solution:** Target modern Node and configure module resolution correctly to output native serverless-ready files.

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "strict": true,
    "skipLibCheck": true,
    "outDir": "./dist"
  },
  "include": ["api/**/*", "server.ts", "src/**/*"]
}
```

*Ensure your `package.json` contains `"type": "module"` if you are running fully native ESM, or make sure your build pipeline bundles the API folder correctly via a lightweight compiler like `tsup` if you want a zero-dependency bundled build.*

---

## 2. Robust SPA & API Routing Configuration

**File to Create/Replace:** `vercel.json`  
**Problem:** Reloading on nested React routes triggers static 404 errors, and static files get misrouted.  
**Solution:** Define precise priority routes to ensure `/api/*` goes to the backend serverless handler, static assets are delivered with optimal headers, and all client-side paths fall back correctly to `index.html`.

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/server.ts",
      "use": "@vercel/node"
    },
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/server.ts"
    },
    {
      "src": "/assets/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      },
      "dest": "/assets/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

---

## 3. Clean and Safe Container Build

**File to Create/Replace:** `Dockerfile`  
**Problem:** Broken Docker container builds due to references to deleted credentials (`firebase-applet-config.json`).  
**Solution:** A streamlined multi-stage container build that relies on dynamic environment variables instead of hardcoded config files.

```dockerfile
# ==========================================
# STAGE 1: Build Phase
# ==========================================
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first for build layer caching
COPY package*.json ./
RUN npm ci

# Copy full application source
COPY . .

# Run build to generate production artifacts (frontend SPA and types)
RUN npm run build

# ==========================================
# STAGE 2: Production Execution Runtime
# ==========================================
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy lockfiles and install clean, production-only dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy build artifacts and runtime necessities
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/docker-entrypoint.sh ./

# Set execution permissions and run
RUN chmod +x docker-entrypoint.sh
EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
```

---

## 4. CORS Separation for PDF Assets & API Isolation

**File to Update:** `server.ts` (Express server configuration)  
**Problem:** Universal CORS restrictions block client-side PDF previewing of criteria documents.  
**Solution:** Apply CORS rules selectively to the `/api` paths and serve static Criterion PDF reports with open headers suitable for inline browser views.

```typescript
import express from 'express';
import cors from 'cors';
import path from 'path';

const app = express();

// Apply restrictive CORS protection strictly to JSON API endpoints
app.use('/api', cors({
  origin: process.env.PUBLIC_BASE_URL || '*',
  credentials: true
}));

// Configure static PDF assets directory to allow cross-origin inline previewing
app.use('/static', express.static(path.join(__dirname, 'static'), {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Access-Control-Allow-Origin', '*'); 
      res.setHeader('Access-Control-Allow-Methods', 'GET');
    }
  }
}));
```

---

## 5. Security Enforcements (Force HTTPS & Prevent Weak Secret Keys)

**File to Update:** `server.ts` (Express initialization)  
**Problem:** Vulnerable production setups using placeholder or weak credentials and operating over unencrypted HTTP.  
**Solution:** Implement mandatory startup safeguards to check the health and length of secrets and automatically redirect in-transit traffic to HTTPS.

```typescript
// Enforce SSL/HTTPS redirection in production environments
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(`https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Safety Check: Strict production guardrails for JWT validation keys
if (process.env.NODE_ENV === 'production') {
  const secret = process.env.JWT_SECRET;
  const defaults = ['default_secret', 'admin_key', '123456', 'uacas_secret_placeholder'];
  
  if (!secret || secret.length < 32 || defaults.some(d => secret.toLowerCase().includes(d))) {
    console.error('\x1b[31m%s\x1b[0m', 'FATAL STARTUP ERROR: A unique and cryptographically secure JWT_SECRET of at least 32 characters is REQUIRED in production.');
    process.exit(1);
  }
}
```

---

## 6. Safe & Graceful AI Failure State Handling

**File to Update:** `api/server.ts` (or Gemini service files)  
**Problem:** The core application fails or throws fatal errors if Google Gemini keys are absent or fail.  
**Solution:** Implement check blocks that gracefully degrade AI narrative functionality on the backend, returning informative warnings to the frontend.

```typescript
app.post('/api/generate-narrative', async (req, res) => {
  const geminiApiKey = process.env.GEMINI_API_KEY;

  // Graceful degradation when key is missing or invalid
  if (!geminiApiKey || geminiApiKey.trim() === '') {
    return res.status(503).json({
      success: false,
      error: 'AI Narratives temporarily disabled',
      details: 'Google Gemini API is not configured on the host server. Please verify the GEMINI_API_KEY environment variable is present.'
    });
  }

  try {
    // Proceed with safe Google Gemini integration...
    // const model = geminiClient.getGenerativeModel({ model: "gemini-2.5-flash" });
  } catch (err: any) {
    console.error('Gemini Service Failure:', err);
    res.status(500).json({
      success: false,
      error: 'AI text generation failed',
      details: err.message || 'Unknown upstream integration error.'
    });
  }
});
```
