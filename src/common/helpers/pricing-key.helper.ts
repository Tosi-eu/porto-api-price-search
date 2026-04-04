import crypto from 'crypto';
import type { Request } from 'express';

export function readPricingApiKeyFromRequest(req: Request): string {
  const h =
    req.header('x-pricing-api-key') ?? req.header('X-Pricing-API-Key') ?? '';
  if (h.trim()) return h.trim();
  const auth = req.header('authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7).trim();
  return '';
}

export function timingSafeEqualStrings(a: string, b: string): boolean {
  const x = Buffer.from(a, 'utf8');
  const y = Buffer.from(b, 'utf8');
  if (x.length !== y.length) return false;
  return crypto.timingSafeEqual(x, y);
}
