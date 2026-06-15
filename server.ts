import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import * as dotenv from "dotenv";
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import morgan from 'morgan';

import { apiRouter } from './src/server/routes/api';
import { errorHandler } from './src/server/middleware/error';
import { logger } from './src/server/logger';
import { ExpressAuth } from "@auth/express";
import { authConfig } from "./src/server/config/auth";
import { customAuthRouter } from './src/server/routes/customAuth';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // --- Security & Middleware ---
  app.set("trust proxy", true);
  const publicBaseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", publicBaseUrl],
        connectSrc: ["'self'", "wss:", publicBaseUrl],
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
      // Allow requests with no origin, or 'null' origin (often sent by browser redirects)
      if (!origin || origin === 'null') return callback(null, true);
      
      // In development or if explicitly allowed, accept the origin
      if (process.env.NODE_ENV !== 'production' || allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
        return callback(new Error(msg), false);
      }
    },
    credentials: true,
  }));
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000,
    message: 'Too many requests'
  });
  app.use('/api', limiter);

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 requests
    skipSuccessfulRequests: true, // Only count failed attempts
    message: { error: 'Account locked due to too many failed attempts. Please try again in 15 minutes.' }
  });
  app.use(['/api/auth/login', '/api/auth/callback/credentials'], authLimiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));

  // --- Health Check (used by Render's health probe) ---
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- Custom Auth Routes ---
  app.use("/api/auth", customAuthRouter);

  // --- Auth.js Routes ---
  app.use("/api/auth/*", ExpressAuth(authConfig));

  // --- API Routes ---
  app.use('/api', apiRouter);

  // --- Vite / Frontend Setup ---
  // Default to production mode (serving static files) unless explicitly set to "development".
  // This prevents starting the resource-intensive Vite dev server if NODE_ENV is missing on Render.
  if (process.env.NODE_ENV === "development") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Bulletproof path resolution for Render (handles if cwd is dist or project root)
    const distPath = __dirname.endsWith('dist') ? __dirname : path.join(process.cwd(), 'dist');
    
    // Serve static files, but handle /assets explicitly to return 404 if missing
    app.use('/assets', express.static(path.join(distPath, 'assets')));
    app.use('/assets', (req, res) => { res.status(404).send('Not Found'); });
    
    app.use(express.static(distPath, { index: false }));
    
    // Serve index.html for all other routes, and prevent browser caching
    app.get('*', (req, res) => {
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- Centralized Error Handling ---
  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`UACAS Server running on http://localhost:${PORT}`);
  });
}

startServer();
