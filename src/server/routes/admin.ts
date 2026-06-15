// src/server/routes/admin.ts — Super Admin Panel API Routes
import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth, requireRole } from '../middleware/auth';
import { logger } from '../logger';
import bcrypt from 'bcryptjs';

export const adminRouter = Router();
const prisma = new PrismaClient();

// All routes require SUPER_ADMIN role
adminRouter.use(requireAuth, requireRole('SUPER_ADMIN'));

// ─────────────────────────────────────────────
//  GET /admin/institutions — List all institutions
// ─────────────────────────────────────────────
adminRouter.get('/institutions', async (req, res) => {
  try {
    const institutions = await prisma.university.findMany({
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            evidences: true,
            aqarRecords: true,
          }
        },
        subscription: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const enriched = await Promise.all(institutions.map(async (inst) => {
      // Get last login from any user at this institution
      const lastUser = await prisma.user.findFirst({
        where: { universityId: inst.id },
        orderBy: { updatedAt: 'desc' },
        select: { updatedAt: true, name: true },
      });

      // Get score for latest year
      // Note: NaacScore model tracks individual metrics, not overall CGPA.
      const latestScore = null;

      return {
        id: inst.id,
        name: inst.name,
        city: inst.city,
        state: inst.state,
        type: inst.type,
        aisheCode: inst.aisheCode,
        naacGrade: inst.naacGrade,
        createdAt: inst.createdAt,
        stats: {
          users: inst._count.users,
          departments: inst._count.departments,
          evidences: inst._count.evidences,
          aqarRecords: inst._count.aqarRecords,
        },
        subscription: inst.subscription ? {
          plan: inst.subscription.plan,
          status: inst.subscription.status,
          expiresAt: inst.subscription.expiresAt,
        } : null,
        lastActivity: lastUser?.updatedAt || null,
        lastActiveUser: lastUser?.name || null,
        latestScore: latestScore || null,
      };
    }));

    res.json(enriched);
  } catch (e) {
    logger.error(`Failed to list institutions: ${e}`);
    res.status(500).json({ error: 'Failed to fetch institutions' });
  }
});

// ─────────────────────────────────────────────
//  GET /admin/institutions/:id/stats — Detailed institution stats
// ─────────────────────────────────────────────
adminRouter.get('/institutions/:id/stats', async (req, res) => {
  try {
    const { id } = req.params;
    const university = await prisma.university.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            departments: true,
            evidences: true,
            aqarRecords: true,
            nirfParameters: true,
          }
        },
        subscription: true,
      }
    });

    if (!university) {
      return res.status(404).json({ error: 'Institution not found' });
    }

    const users = await prisma.user.findMany({
      where: { universityId: id },
      select: { id: true, name: true, email: true, role: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
    });

    const scores = await prisma.naacScore.findMany({
      where: { universityId: id },
      orderBy: { updatedAt: 'desc' },
      take: 5,
    });

    res.json({
      university: {
        id: university.id,
        name: university.name,
        city: university.city,
        state: university.state,
        type: university.type,
      },
      stats: university._count,
      subscription: university.subscription,
      users,
      recentScores: scores,
    });
  } catch (e) {
    logger.error(`Failed to get institution stats: ${e}`);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─────────────────────────────────────────────
//  POST /admin/institutions — Create new institution
// ─────────────────────────────────────────────
adminRouter.post('/institutions', async (req, res) => {
  try {
    const { name, city, state, type, aisheCode, adminName, adminEmail, adminPassword, plan } = req.body;

    if (!name || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'Name, admin email, and password are required' });
    }

    // Create university
    const university = await prisma.university.create({
      data: {
        name,
        city: city || null,
        state: state || null,
        type: type || null,
        aisheCode: aisheCode || null,
      }
    });

    // Create admin user for this institution
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    await prisma.user.create({
      data: {
        name: adminName || 'Institution Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'IQAC_COORDINATOR',
        universityId: university.id,
      }
    });

    // Create subscription
    const expiresAt = new Date();
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    await prisma.subscription.create({
      data: {
        universityId: university.id,
        plan: plan || 'BASIC',
        expiresAt,
        status: 'ACTIVE',
      }
    });

    res.status(201).json({ success: true, universityId: university.id });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res.status(409).json({ error: 'An institution with that admin email already exists' });
    }
    logger.error(`Failed to create institution: ${e}`);
    res.status(500).json({ error: 'Failed to create institution' });
  }
});

// ─────────────────────────────────────────────
//  PUT /admin/institutions/:id/subscription — Update subscription
// ─────────────────────────────────────────────
adminRouter.put('/institutions/:id/subscription', async (req, res) => {
  try {
    const { id } = req.params;
    const { plan, status, expiresAt } = req.body;

    const subscription = await prisma.subscription.upsert({
      where: { universityId: id },
      update: {
        ...(plan && { plan }),
        ...(status && { status }),
        ...(expiresAt && { expiresAt: new Date(expiresAt) }),
      },
      create: {
        universityId: id,
        plan: plan || 'BASIC',
        status: status || 'ACTIVE',
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      }
    });

    res.json(subscription);
  } catch (e) {
    logger.error(`Failed to update subscription: ${e}`);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
});

// ─────────────────────────────────────────────
//  PUT /admin/institutions/:id/status — Activate/Deactivate
// ─────────────────────────────────────────────
adminRouter.put('/institutions/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // ACTIVE, SUSPENDED

    await prisma.subscription.update({
      where: { universityId: id },
      data: { status },
    });

    res.json({ success: true, status });
  } catch (e) {
    logger.error(`Failed to update status: ${e}`);
    res.status(500).json({ error: 'Failed to update institution status' });
  }
});

// ─────────────────────────────────────────────
//  POST /admin/institutions/:id/reset-password — Reset admin password
// ─────────────────────────────────────────────
adminRouter.post('/institutions/:id/reset-password', async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find the first admin user for this institution
    const adminUser = await prisma.user.findFirst({
      where: { universityId: id, role: { in: ['SUPER_ADMIN', 'IQAC_COORDINATOR'] } },
      orderBy: { createdAt: 'asc' },
    });

    if (!adminUser) {
      return res.status(404).json({ error: 'No admin user found for this institution' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: hashedPassword },
    });

    res.json({ success: true, userEmail: adminUser.email });
  } catch (e) {
    logger.error(`Password reset failed: ${e}`);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// ─────────────────────────────────────────────
//  GET /admin/demo-requests — List all demo requests
// ─────────────────────────────────────────────
adminRouter.get('/demo-requests', async (req, res) => {
  try {
    const requests = await prisma.demoRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    res.json(requests);
  } catch (e) {
    logger.error(`Failed to list demo requests: ${e}`);
    res.status(500).json({ error: 'Failed to fetch demo requests' });
  }
});

// ─────────────────────────────────────────────
//  PUT /admin/demo-requests/:id — Update demo request status
// ─────────────────────────────────────────────
adminRouter.put('/demo-requests/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // NEW, CONTACTED, CONVERTED

    const updated = await prisma.demoRequest.update({
      where: { id },
      data: { status },
    });

    res.json(updated);
  } catch (e) {
    logger.error(`Failed to update demo request: ${e}`);
    res.status(500).json({ error: 'Failed to update demo request' });
  }
});
