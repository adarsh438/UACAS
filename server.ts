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

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = parseInt(process.env.PORT || '3000', 10);

  // --- Security & Middleware ---
  app.use(helmet({
    contentSecurityPolicy: false, 
  }));
  app.use(cors());
  
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000,
    message: 'Too many requests'
  });
  app.use('/api', limiter);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));

  app.use(morgan('combined', { stream: { write: (message: string) => logger.info(message.trim()) } }));

  // --- Health Check (used by Render's health probe) ---
  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // --- API Routes ---
  app.use('/api', apiRouter);

  // --- Vite / Frontend Setup ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  // --- Centralized Error Handling ---
  app.use(errorHandler);

  app.listen(PORT, "0.0.0.0", () => {
    logger.info(`UACAS Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
