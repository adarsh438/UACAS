import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { z } from 'zod';
import { verifyToken, COOKIE_NAME } from '../config/auth';

// ─────────────────────────────────────────────────────────────
//  Auth Middleware
//  Uses custom JWT validation — no Auth.js dependency.
// ─────────────────────────────────────────────────────────────

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// ── Helper: extract JWT from request ─────────────────────────
function extractToken(req: Request): string | null {
  // 1. Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  // 2. HttpOnly cookie (manual parsing — no cookie-parser required)
  const cookieHeader = req.headers.cookie || '';
  const match = cookieHeader.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

// ── Mock tokens for offline simulation ───────────────────────
const MOCK_USERS: Record<string, object> = {
  'mock-jwt-token': {
    uid: 'mock-user-coordinator',
    email: 'coordinator@uacas.edu',
    role: 'IQAC_COORDINATOR',
    admin: true,
  },
  'mock-jwt-coordinator': {
    uid: 'mock-user-coordinator',
    email: 'coordinator@uacas.edu',
    role: 'IQAC_COORDINATOR',
    admin: true,
  },
  'mock-jwt-superadmin': {
    uid: 'mock-user-superadmin',
    email: 'admin@uacas.edu',
    role: 'SUPER_ADMIN',
    admin: true,
  },
  'mock-jwt-depthead': {
    uid: 'mock-user-depthead',
    email: 'depthead@uacas.edu',
    role: 'DEPT_HEAD',
    departmentId: 'dept-cs-456',
    admin: false,
  },
  'mock-jwt-faculty': {
    uid: 'mock-user-faculty',
    email: 'faculty@uacas.edu',
    role: 'FACULTY',
    employeeId: 'fac-999',
    departmentId: 'dept-cs-456',
    admin: false,
  },
  'mock-jwt-reviewer': {
    uid: 'mock-user-reviewer',
    email: 'reviewer@uacas.edu',
    role: 'REVIEWER',
    admin: false,
  },
};

// ─────────────────────────────────────────────────────────────
//  requireAuth
// ─────────────────────────────────────────────────────────────
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const token = extractToken(req);

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No authentication token provided' });
  }

  // 1. Check mock tokens for offline simulation
  if (token in MOCK_USERS) {
    req.user = MOCK_USERS[token];
    return next();
  }

  // 2. Verify real JWT
  const payload = verifyToken(token);
  if (!payload) {
    logger.warn(`Invalid or expired JWT from ${req.ip}`);
    return res.status(401).json({ error: 'Unauthorized: Token is invalid or has expired' });
  }

  req.user = {
    uid: payload.id,
    email: payload.email,
    name: payload.name,
    role: payload.role || 'REVIEWER',
    universityId: payload.universityId,
    departmentId: payload.departmentId,
    admin: payload.role === 'SUPER_ADMIN' || payload.role === 'IQAC_COORDINATOR',
  };

  return next();
};

// ─────────────────────────────────────────────────────────────
//  requireRole
// ─────────────────────────────────────────────────────────────
export const requireRole = (role: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const userRole = req.user?.role;
    if (req.user?.admin === true || userRole === 'SUPER_ADMIN' || userRole === role) {
      next();
    } else {
      res.status(403).json({ error: `Forbidden: Requires ${role} role privileges` });
    }
  };
};

// ─────────────────────────────────────────────────────────────
//  requireNaacWriter
// ─────────────────────────────────────────────────────────────
export const requireNaacWriter = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (
    req.user?.admin === true ||
    role === 'SUPER_ADMIN' ||
    role === 'IQAC_COORDINATOR' ||
    role === 'DEPT_HEAD'
  ) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Insufficient privileges to modify accreditation data' });
  }
};

// ─────────────────────────────────────────────────────────────
//  requireAccess — Custom granular RBAC middleware
// ─────────────────────────────────────────────────────────────
export const requireAccess = (action: 'READ' | 'WRITE', resourceType?: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;

    // 1. Super Admin and IQAC Coordinator have unrestricted global read/write access
    if (req.user?.admin === true || role === 'SUPER_ADMIN' || role === 'IQAC_COORDINATOR') {
      return next();
    }

    // 2. Peer Reviewer is strictly read-only
    if (role === 'REVIEWER') {
      if (action === 'READ') {
        return next();
      } else {
        return res.status(403).json({ error: 'Forbidden: Peer Reviewer has strictly read-only access' });
      }
    }

    // 3. Department Head access controls
    if (role === 'DEPT_HEAD') {
      if (action === 'READ') {
        return next();
      }

      // Department Head can only WRITE to department-bound resources
      const deptBoundResources = [
        'BOS_MEETING', 'NEW_COURSE', 'VALUE_ADDED_COURSE',
        'ENROLLMENT', 'LEARNING_OUTCOME', 'FACULTY', 'STUDENT',
      ];
      if (!resourceType || !deptBoundResources.includes(resourceType)) {
        return res.status(403).json({
          error: 'Forbidden: Department Heads can only modify department-bound accreditation records',
        });
      }
      return next();
    }

    // 4. Faculty access controls
    if (role === 'FACULTY') {
      if (action === 'READ') {
        return next();
      }

      // Faculty can only write to their own research (publications) or teaching records (FDPRecord)
      const facultyAllowedResources = ['PUBLICATION', 'FDP_RECORD'];
      if (!resourceType || !facultyAllowedResources.includes(resourceType)) {
        return res.status(403).json({
          error: 'Forbidden: Faculty members can only enter/modify their own research and teaching records',
        });
      }
      return next();
    }

    // Default reject
    return res.status(403).json({ error: 'Forbidden: Access denied due to insufficient privileges' });
  };
};

// ─────────────────────────────────────────────────────────────
//  validate — Zod schema validation middleware
// ─────────────────────────────────────────────────────────────
export const validate = (schema: z.ZodObject<any>) =>
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      return res.status(400).json({ error: 'Validation failed', details: error });
    }
  };
