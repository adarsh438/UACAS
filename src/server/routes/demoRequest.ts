// src/server/routes/demoRequest.ts — Public Demo Request API
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { logger } from '../logger';
import { z } from 'zod';

export const demoRequestRouter = Router();
const prisma = new PrismaClient();

const demoSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  institution: z.string().min(2, 'Institution name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  message: z.string().optional(),
});

// POST /api/demo-request — Public, no auth required
demoRequestRouter.post('/', async (req, res) => {
  try {
    const parsed = demoSchema.parse(req.body);
    const demo = await prisma.demoRequest.create({
      data: {
        name: parsed.name,
        institution: parsed.institution,
        email: parsed.email,
        phone: parsed.phone || null,
        message: parsed.message || null,
      }
    });
    res.status(201).json({ success: true, id: demo.id });
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return res.status(400).json({ error: 'Validation failed', details: e.errors });
    }
    logger.error(`Demo request failed: ${e}`);
    res.status(500).json({ error: 'Failed to submit demo request' });
  }
});
