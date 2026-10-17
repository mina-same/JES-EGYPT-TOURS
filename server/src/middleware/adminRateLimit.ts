import type { Request } from 'express';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
/** Only protected inbox operations use this budget. Public submissions retain
 * both the general public limit and their dedicated submission limiter. */
export function isAdminInboxOperation(req: Request): boolean {
  if (!/^Bearer /i.test(req.headers.authorization || '')) return false;
  if (/^\/(notifications|users)(\/|$)/.test(req.path)) return true;
  return req.method !== 'POST' && /^\/(bookings|contact|tailor-made)(\/|$)/.test(req.path);
}
export function createAdminInboxLimiter(limit = 1200) {
  return rateLimit({ windowMs: 15 * 60 * 1000, limit, standardHeaders: true, legacyHeaders: false,
    keyGenerator: req => {
      try {
        const token = req.headers.authorization?.slice(7) || '';
        const payload = jwt.verify(token, process.env.JWT_SECRET as string);
        if (typeof payload !== 'string' && typeof payload.id === 'string') return `employee:${payload.id}`;
      } catch { /* Invalid credentials remain subject to authentication below. */ }
      return `unauthenticated:${req.ip}`;
    },
    message: { success: false, error: 'Too many inbox operations. Please wait before retrying.' },
  });
}
