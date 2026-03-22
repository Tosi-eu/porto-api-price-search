import crypto from 'crypto';
import type { RequestHandler } from 'express';
import type { Request, Response, NextFunction } from 'express';

function readKey(req: Request): string {
  const h =
    req.header('x-pricing-api-key') ?? req.header('X-Pricing-API-Key') ?? '';
  if (h.trim()) return h.trim();
  const auth = req.header('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return '';
}

function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}

export function createPricingApiKeyMiddleware(expectedKey: string): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    const provided = readKey(req);
    if (!provided || !safeEqual(provided, expectedKey)) {
      return res.status(401).json({
        error:
          'API key inválida ou ausente (header X-Pricing-API-Key ou Authorization: Bearer).',
      });
    }
    next();
  };
}
