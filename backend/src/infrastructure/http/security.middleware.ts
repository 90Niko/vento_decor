import type { NextFunction, Request, Response } from 'express';

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const entries = new Map<string, RateLimitEntry>();

function requestLimit(path: string, method: string): number {
  if (method === 'POST' && path.endsWith('/guest-otp')) return 5;
  if (method === 'POST' && path.endsWith('/guest-otp/verify')) return 10;
  if (method === 'POST' && path.endsWith('/guests')) return 10;
  if (method === 'POST' && path.endsWith('/quiz/attempts')) return 10;
  if (method === 'POST' && path === '/auth/login') return 10;
  if (method === 'POST' && path === '/auth/register') return 5;
  if (method === 'POST' && path.endsWith('/images')) return 20;
  return 300;
}

export function securityMiddleware(
  request: Request,
  response: Response,
  next: NextFunction,
): void {
  response.setHeader('X-Content-Type-Options', 'nosniff');
  response.setHeader('X-Frame-Options', 'DENY');
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()',
  );
  response.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  if (process.env.NODE_ENV === 'production') {
    response.setHeader(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains',
    );
  }

  const now = Date.now();
  const key = `${request.ip}:${request.method}:${request.path}`;
  const limit = requestLimit(request.path, request.method);
  const current = entries.get(key);
  const entry =
    !current || current.resetAt <= now
      ? { count: 1, resetAt: now + WINDOW_MS }
      : { ...current, count: current.count + 1 };
  entries.set(key, entry);

  response.setHeader('RateLimit-Limit', String(limit));
  response.setHeader(
    'RateLimit-Remaining',
    String(Math.max(0, limit - entry.count)),
  );
  response.setHeader(
    'RateLimit-Reset',
    String(Math.ceil(entry.resetAt / 1000)),
  );

  if (entry.count > limit) {
    response.status(429).json({
      statusCode: 429,
      message: 'Too many requests. Try again later.',
    });
    return;
  }

  if (entries.size > 10_000) {
    for (const [entryKey, value] of entries) {
      if (value.resetAt <= now) entries.delete(entryKey);
    }
  }
  next();
}
