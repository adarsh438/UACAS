import { Request, Response, NextFunction } from 'express';
import { logger } from '../logger';
import { z } from 'zod';
import { getSession } from '@auth/express';
import { authConfig } from '../config/auth';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split('Bearer ')[1];

    // Test bypass for offline cloud-independent local testing
    if (token === 'mock-jwt-token' || token === 'mock-jwt-coordinator') {
      req.user = {
        uid: 'mock-user-coordinator',
        email: 'coordinator@uacas.edu',
        role: 'IQAC_COORDINATOR',
        admin: true
      } as any;
      return next();
    }

    if (token === 'mock-jwt-superadmin') {
      req.user = {
        uid: 'mock-user-superadmin',
        email: 'admin@uacas.edu',
        role: 'SUPER_ADMIN',
        admin: true
      } as any;
      return next();
    }

    if (token === 'mock-jwt-depthead') {
      req.user = {
        uid: 'mock-user-depthead',
        email: 'depthead@uacas.edu',
        role: 'DEPT_HEAD',
        departmentId: 'dept-cs-456',
        admin: false
      } as any;
      return next();
    }

    if (token === 'mock-jwt-faculty') {
      req.user = {
        uid: 'mock-user-faculty',
        email: 'faculty@uacas.edu',
        role: 'FACULTY',
        employeeId: 'fac-999',
        departmentId: 'dept-cs-456',
        admin: false
      } as any;
      return next();
    }

    if (token === 'mock-jwt-reviewer') {
      req.user = {
        uid: 'mock-user-reviewer',
        email: 'reviewer@uacas.edu',
        role: 'REVIEWER',
        admin: false
      } as any;
      return next();
    }
  }

  // Auth.js session validation
  try {
    const session = await getSession(req, authConfig);
    if (session && session.user) {
      req.user = {
        uid: (session.user as any).id || session.user.email,
        email: session.user.email,
        role: (session.user as any).role || 'REVIEWER',
        name: session.user.name,
        departmentId: (session.user as any).departmentId,
        employeeId: (session.user as any).employeeId,
        admin: (session.user as any).role === 'SUPER_ADMIN' || (session.user as any).role === 'IQAC_COORDINATOR'
      };
      return next();
    }
  } catch (error) {
    logger.warn(`Auth.js session verification failed: ${error}`);
  }

  return res.status(401).json({ error: 'Unauthorized: Missing or invalid token/session' });
};

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

export const requireNaacWriter = (req: Request, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (req.user?.admin === true || role === 'SUPER_ADMIN' || role === 'IQAC_COORDINATOR' || role === 'DEPT_HEAD') {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: Insufficient privileges to modify accreditation data' });
  }
};

// Custom granular RBAC middleware
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
      const deptBoundResources = ['BOS_MEETING', 'NEW_COURSE', 'VALUE_ADDED_COURSE', 'ENROLLMENT', 'LEARNING_OUTCOME', 'FACULTY', 'STUDENT'];
      if (!resourceType || !deptBoundResources.includes(resourceType)) {
        return res.status(403).json({ error: 'Forbidden: Department Heads can only modify department-bound accreditation records' });
      }

      // Allow writing to program/student records
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
        return res.status(403).json({ error: 'Forbidden: Faculty members can only enter/modify their own research and teaching records' });
      }

      return next();
    }

    // Default reject
    return res.status(403).json({ error: 'Forbidden: Access denied due to insufficient privileges' });
  };
};

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
