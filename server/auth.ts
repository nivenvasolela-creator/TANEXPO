import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { getDb } from './db.js';
import { normalizePhone } from './phone.js';

export interface AuthUser {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: 'tourist' | 'provider' | 'admin';
  touristProfile: any;
  providerProfile: any;
  createdAt: string;
  token: string;
}

declare global {
  namespace Express {
    interface Request {
      authUser?: AuthUser;
    }
  }
}

const SCRYPT_PREFIX = 'scrypt$v1$';
const SCRYPT_KEYLEN = 64;
const SESSION_TTL_DAYS = Math.max(1, Number(process.env.SESSION_TTL_DAYS) || 7);
export const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

function scryptAsync(password: string, salt: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, SCRYPT_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt);
  return `${SCRYPT_PREFIX}${salt}$${derived.toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  storedHash: string | null | undefined
): Promise<{ valid: boolean; needsRehash: boolean }> {
  if (!storedHash || typeof storedHash !== 'string') {
    await scryptAsync(password, '00000000000000000000000000000000');
    return { valid: false, needsRehash: false };
  }

  if (storedHash.startsWith(SCRYPT_PREFIX)) {
    const rest = storedHash.slice(SCRYPT_PREFIX.length);
    const parts = rest.split('$');
    if (parts.length !== 2) {
      await scryptAsync(password, '00000000000000000000000000000000');
      return { valid: false, needsRehash: false };
    }
    const [salt, keyHex] = parts;
    if (!salt || !keyHex || !/^[a-f0-9]+$/i.test(keyHex)) {
      await scryptAsync(password, '00000000000000000000000000000000');
      return { valid: false, needsRehash: false };
    }
    const expectedBuf = Buffer.from(keyHex, 'hex');
    const derivedBuf = await scryptAsync(password, salt);
    if (expectedBuf.length !== derivedBuf.length) {
      return { valid: false, needsRehash: false };
    }
    const valid = crypto.timingSafeEqual(expectedBuf, derivedBuf);
    return { valid, needsRehash: false };
  }

  // Legacy unsalted SHA-256 migration path (64-char hex)
  if (/^[a-f0-9]{64}$/i.test(storedHash)) {
    const expectedBuf = Buffer.from(storedHash, 'hex');
    const actualBuf = crypto.createHash('sha256').update(password).digest();
    const valid =
      expectedBuf.length === actualBuf.length &&
      crypto.timingSafeEqual(expectedBuf, actualBuf);
    return { valid, needsRehash: valid };
  }

  await scryptAsync(password, '00000000000000000000000000000000');
  return { valid: false, needsRehash: false };
}

export function generateToken(): string {
  return 'tanexpo_' + crypto.randomBytes(32).toString('hex');
}

export function hashSessionToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

export function getSessionExpiryIso(): string {
  return new Date(Date.now() + SESSION_TTL_MS).toISOString();
}

export async function getAuthUser(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  const tokenHash = hashSessionToken(token);
  const db = await getDb();
  const sessionRes = await db.query<any>(
    'SELECT user_id, expires_at FROM app_sessions WHERE token = $1',
    [tokenHash]
  );
  if (!sessionRes.rows.length) return null;

  const sessionRow = sessionRes.rows[0];
  const expiresAtMs = sessionRow.expires_at ? Date.parse(sessionRow.expires_at) : NaN;
  if (!sessionRow.expires_at || Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
    await db.query('DELETE FROM app_sessions WHERE token = $1', [tokenHash]);
    return null;
  }

  const userRes = await db.query<any>(
    'SELECT id, email, phone, name, role, tourist_profile, provider_profile, created_at FROM users WHERE id = $1',
    [sessionRow.user_id]
  );
  if (!userRes.rows.length) return null;

  const row = userRes.rows[0];
  return {
    id: row.id,
    email: row.email,
    phone: row.phone,
    name: row.name,
    role: row.role,
    touristProfile: row.tourist_profile,
    providerProfile: row.provider_profile,
    createdAt: row.created_at,
    token
  };
}

export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const user = await getAuthUser(req);
    if (!user) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    req.authUser = user;
    next();
  } catch (err: any) {
    console.error('Auth middleware error:', err);
    res.status(500).json({ error: 'Authentication check failed' });
  }
}

export function requireRole(...roles: Array<'tourist' | 'provider' | 'admin'>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.authUser) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    if (!roles.includes(req.authUser.role)) {
      res.status(403).json({ error: 'Forbidden: insufficient permissions' });
      return;
    }
    next();
  };
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts from this IP. Please try again in 15 minutes.' }
});

export const loginAccountRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { keyGeneratorIpFallback: false },
  keyGenerator: (req: Request): string => {
    const raw = req.body?.emailOrPhone;
    if (typeof raw === 'string' && raw.trim()) {
      const trimmed = raw.trim();
      if (trimmed.includes('@')) {
        return `acct:email:${trimmed.toLowerCase()}`;
      }
      const normPhone = normalizePhone(trimmed);
      if (normPhone) {
        return `acct:phone:${normPhone}`;
      }
      return `acct:raw:${trimmed.toLowerCase()}`;
    }
    return `ip:${ipKeyGenerator(req.ip || '127.0.0.1')}`;
  },
  message: { error: 'Too many failed login attempts for this account. Please try again in 15 minutes.' }
});

export const registerRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many registration attempts. Please try again in 15 minutes.' }
});

export const authRateLimiter = loginRateLimiter;

