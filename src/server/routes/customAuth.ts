import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import { logger } from '../logger';
import { signToken, verifyToken, COOKIE_NAME, JWT_EXPIRES_IN } from '../config/auth';

// ─────────────────────────────────────────────────────────────
//  Custom Auth Router
//  Self-contained JWT-based authentication.
//  Replaces the broken @auth/express (Auth.js) adapter.
//
//  Endpoints:
//   POST /api/auth/login           — email + password → JWT cookie
//   POST /api/auth/logout          — clears auth cookie
//   GET  /api/auth/me              — returns current user from JWT
//   POST /api/auth/forgot-password — send password reset email
//   POST /api/auth/reset-password  — reset password via token
// ─────────────────────────────────────────────────────────────

export const customAuthRouter = Router();
const prisma = new PrismaClient();

// Cookie options — HttpOnly prevents JS access (XSS mitigation)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  path: '/',
};

// ── Email transporter (for password reset) ───────────────────
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'localhost',
  port: parseInt(process.env.SMTP_PORT || '25', 10),
  auth: process.env.SMTP_USER
    ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    : undefined,
});

// ── Helper: extract token from request ───────────────────────
function extractToken(req: Request): string | null {
  // 1. Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // 2. HttpOnly cookie (manual parsing since we avoid cookie-parser dep)
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ────────────────────────────────────────────────────────────
//  POST /api/auth/login
// ────────────────────────────────────────────────────────────
customAuthRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const emailStr = String(email).trim().toLowerCase();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    const user = await prisma.user.findUnique({ where: { email: emailStr } });

    if (!user || !user.password) {
      // Log failed attempt (don't reveal whether user exists)
      await prisma.loginAttempt.create({
        data: { email: emailStr, ipAddress: String(ip), success: false },
      }).catch(() => {}); // Non-fatal
      logger.warn(`Failed login attempt for ${emailStr} from ${ip}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isValid = await bcrypt.compare(String(password), user.password);
    if (!isValid) {
      await prisma.loginAttempt.create({
        data: { email: emailStr, ipAddress: String(ip), success: false },
      }).catch(() => {});
      logger.warn(`Wrong password for ${emailStr} from ${ip}`);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Success — log and issue token
    await prisma.loginAttempt.create({
      data: { email: emailStr, ipAddress: String(ip), success: true },
    }).catch(() => {});

    const payload = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      universityId: user.universityId,
      departmentId: user.departmentId,
    };

    const token = signToken(payload);

    // Set HttpOnly cookie
    res.cookie(COOKIE_NAME, token, COOKIE_OPTIONS);

    logger.info(`User ${emailStr} logged in successfully from ${ip}`);
    return res.json({
      success: true,
      user: payload,
      token, // Also return in body so frontend can use Authorization header if needed
    });
  } catch (err) {
    logger.error(`Login error: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ────────────────────────────────────────────────────────────
//  POST /api/auth/logout
// ────────────────────────────────────────────────────────────
customAuthRouter.post('/logout', (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: '/' });
  return res.json({ success: true, message: 'Logged out successfully' });
});

// ────────────────────────────────────────────────────────────
//  GET /api/auth/me
//  Replaces Auth.js /api/auth/session
// ────────────────────────────────────────────────────────────
customAuthRouter.get('/me', async (req: Request, res: Response) => {
  try {
    const token = extractToken(req);
    if (!token) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const payload = verifyToken(token);
    if (!payload) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      return res.status(401).json({ error: 'Token invalid or expired' });
    }

    // Optionally re-fetch from DB to get latest role/data
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        universityId: true,
        departmentId: true,
        image: true,
      },
    });

    if (!user) {
      res.clearCookie(COOKIE_NAME, { path: '/' });
      return res.status(401).json({ error: 'User no longer exists' });
    }

    return res.json({ user });
  } catch (err) {
    logger.error(`/me error: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ────────────────────────────────────────────────────────────
//  POST /api/auth/forgot-password
// ────────────────────────────────────────────────────────────
customAuthRouter.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    const user = await prisma.user.findUnique({ where: { email: String(email).trim().toLowerCase() } });
    if (!user) {
      // Don't reveal email existence
      return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    await prisma.passwordResetToken.create({
      data: {
        tokenHash,
        userId: user.id,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      },
    });

    const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;

    // Log to console for local/on-premise deployments without SMTP
    console.log(`\n========================================\nPASSWORD RESET FOR ${email}:\n${resetUrl}\n========================================\n`);
    logger.info(`Password reset requested for ${email}. Reset URL: ${resetUrl}`);

    // Attempt email send (best-effort)
    transporter.sendMail({
      from: process.env.FROM_EMAIL || 'no-reply@uacas.edu',
      to: email,
      subject: 'UACAS — Password Reset Request',
      html: `
        <div style="font-family: sans-serif; padding: 20px; max-width: 500px;">
          <h2 style="color: #1e293b;">Password Reset</h2>
          <p>You requested a password reset for your UACAS Enterprise account. Click the link below to set a new password:</p>
          <a href="${resetUrl}" style="display:inline-block; padding: 12px 24px; background: #2563EB; color: #fff; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 16px 0;">Reset Password</a>
          <p style="color: #64748b; font-size: 13px;">This link expires in 24 hours. If you did not request this, please ignore this email.</p>
        </div>
      `,
    }).catch((err) => logger.warn(`Email send failed (non-fatal): ${err}`));

    return res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
  } catch (err) {
    logger.error(`Forgot password error: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ────────────────────────────────────────────────────────────
//  POST /api/auth/reset-password
// ────────────────────────────────────────────────────────────
customAuthRouter.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }
    if (String(newPassword).length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const tokenHash = crypto.createHash('sha256').update(String(token)).digest('hex');
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(String(newPassword), 12);

    await prisma.user.update({
      where: { id: resetRecord.userId },
      data: { password: hashedPassword },
    });

    await prisma.passwordResetToken.delete({ where: { id: resetRecord.id } });

    logger.info(`Password reset successful for user ${resetRecord.user.email}`);
    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (err) {
    logger.error(`Reset password error: ${err}`);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
