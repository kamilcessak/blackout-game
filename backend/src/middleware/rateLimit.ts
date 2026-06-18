import { Request, Response, NextFunction } from 'express';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
}

interface Bucket {
  count: number;
  resetAt: number;
}

/**
 * Prosty, bezzależnościowy rate limiter z oknem stałym, trzymany w pamięci procesu.
 * Wystarczający dla MVP (jeden serwer). Klucz: zalogowany userId, w przeciwnym razie IP.
 * Dla wielu instancji należałoby przejść na store współdzielony (np. Redis).
 */
export const rateLimit = ({ windowMs, max, message }: RateLimitOptions) => {
  const buckets = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.user?.id ? `u:${req.user.id}` : `ip:${req.ip ?? 'unknown'}`;
    const now = Date.now();

    const bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (bucket.count >= max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader('Retry-After', String(retryAfter));
      res.status(429).json({
        error: message ?? 'Zbyt wiele zapytań. Spróbuj ponownie za chwilę.',
        retryAfter,
      });
      return;
    }

    bucket.count += 1;
    next();
  };
};
