import jwt from 'jsonwebtoken';

// ─────────────────────────────────────────────────────────────
//  JWT Configuration
//  Replaces @auth/express (Auth.js) which was causing 404 errors
// ─────────────────────────────────────────────────────────────

export const JWT_SECRET = (() => {
  const secret = process.env.JWT_SECRET || process.env.AUTH_SECRET;
  if (process.env.NODE_ENV === 'production') {
    if (!secret) throw new Error('JWT_SECRET environment variable must be set in production');
    if (secret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');
    return secret;
  }
  return secret || 'uacas-enterprise-dev-only-jwt-secret-do-not-use-in-prod-00000000000';
})();

export const JWT_EXPIRES_IN = '7d'; // Token TTL
export const COOKIE_NAME = 'auth_token'; // HttpOnly cookie name

// ── Token Payload shape ──────────────────────────────────────
export interface TokenPayload {
  id: string;
  email: string;
  name: string;
  role: string;
  universityId: string;
  departmentId?: string | null;
}

// ── Sign a new JWT ───────────────────────────────────────────
export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// ── Verify and decode a JWT ──────────────────────────────────
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
