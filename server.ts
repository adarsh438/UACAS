import express from "express";
import path from "path";
import * as dotenv from "dotenv";
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { apiRouter } from './src/server/routes/api';
import { errorHandler } from './src/server/middleware/error';
import { logger } from './src/server/logger';
import { customAuthRouter } from './src/server/routes/customAuth';

dotenv.config();

// ─────────────────────────────────────────────────────────────
//  createApp — builds and returns the configured Express app.
//  Exported so Vercel can import it as a serverless handler.
//  Also called by startServer() for local/Docker/Render deployments.
// ─────────────────────────────────────────────────────────────
export async function createApp() {
  const app = express();
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';

  // --- Security & Middleware ---
  app.set("trust proxy", true);

  // Enforce SSL/HTTPS redirection in production environments
  if (process.env.NODE_ENV === 'production') {
    app.use((req, res, next) => {
      if (req.headers['x-forwarded-proto'] !== 'https' && req.headers['x-forwarded-proto']) {
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
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "fonts.googleapis.com"],
        fontSrc: ["'self'", "fonts.gstatic.com", "cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", publicBaseUrl, "api.dicebear.com"],
        connectSrc: ["'self'", "wss:", publicBaseUrl],
        formAction: ["'self'"],
      }
    }
  }));

  const allowedOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map(o => o.trim())
    : [process.env.APP_URL || 'http://localhost:3000'];

  if (process.env.NODE_ENV === 'development') {
    allowedOrigins.push('http://localhost:5173', 'http://localhost:3000');
  }

  app.use('/api', cors({
    origin: (origin, callback) => {
      if (!origin || origin === 'null') return callback(null, true);
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('CORS policy: Origin not allowed'), false);
      }
    },
    credentials: true,
  }));

  // General API rate limiter
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000,
    message: 'Too many requests',
  });
  app.use('/api', limiter);

  // Stricter rate limit on login
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    skipSuccessfulRequests: true,
    message: { error: 'Too many login attempts. Please try again in 15 minutes.' },
  });
  app.use('/api/auth/login', authLimiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));

  // Configure static PDF assets directory to allow cross-origin inline previewing
  app.use('/static', express.static(path.join(process.cwd(), 'static'), {
    setHeaders: (res, filePath) => {
      if (path.extname(filePath) === '.pdf') {
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Access-Control-Allow-Origin', '*'); 
        res.setHeader('Access-Control-Allow-Methods', 'GET');
      }
    }
  }));

  // --- Health Check ---
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Auth Routes (custom JWT) ---
  app.use("/api/auth", customAuthRouter);

  // --- API Routes ---
  app.use('/api', apiRouter);

  // --- Static Frontend (production/Vercel/Render) ---
  if (process.env.NODE_ENV === "development") {
    // Development server is started via Vite plugin directly. We do not need to createViteServer here because it's handled by npm run dev script.
    console.log("Running in development mode");
  } else {
    // Works whether cwd is the project root or the dist directory
    const distPath = __dirname.endsWith('dist') ? __dirname : path.join(process.cwd(), 'dist');

    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.use('/assets', (_req, res) => { res.status(404).send('Not Found'); });
    app.use(express.static(distPath, { index: false }));

    // SPA fallback — serve index.html for all non-API routes
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.use(errorHandler);
  return app;
}

// ─────────────────────────────────────────────────────────────
//  Vercel serverless export
//  Vercel imports this file and calls the exported handler for
//  every incoming request. No app.listen() needed.
// ─────────────────────────────────────────────────────────────
let _vercelApp: any = null;
export default async function handler(req: any, res: any) {
  if (!_vercelApp) {
    _vercelApp = await createApp();
  }
  return _vercelApp(req, res);
}

// ─────────────────────────────────────────────────────────────
//  Local / Docker / Render startup
//  Only runs when executed directly (not imported by Vercel).
// ─────────────────────────────────────────────────────────────
async function startServer() {
  const app = await createApp();
  const PORT = parseInt(process.env.PORT || '3000', 10);
  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`UACAS Server running on http://localhost:${PORT}`);
  });
}

// Run only when this file is the entry point (local/Render/Docker)
// In Vercel, the file is imported — not run directly — so this is skipped.
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('server.ts') ||
  process.argv[1].endsWith('server.cjs') ||
  process.argv[1].endsWith('server.js')
);
if (isDirectRun) {
  startServer();
}
