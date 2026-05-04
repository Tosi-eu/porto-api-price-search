import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  HttpException,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';
import { reportPricingAudit } from '../clients/pricing-audit.client';

function truncate(str: string, max: number): string {
  const s = String(str).trim();
  return s.length <= max ? s : `${s.slice(0, max)}…`;
}

function auditPathFromUrl(rawPath: string): {
  path: string;
  operation_type: 'create' | 'delete';
} {
  const p = rawPath.split('?')[0] ?? '';
  if (p.includes('cache/invalidate')) {
    return {
      path: '/pricing-api/v1/cache/invalidate',
      operation_type: 'delete',
    };
  }
  return { path: '/pricing-api/v1/search', operation_type: 'create' };
}

function searchAuditNewValue(
  reqBody: Record<string, unknown> | undefined,
  resBody: unknown,
  opts: { failed: boolean },
): Record<string, unknown> {
  const rb = reqBody ?? {};
  const itemName =
    typeof rb.itemName === 'string' ? truncate(rb.itemName, 120) : '';
  const out: Record<string, unknown> = {
    kind: 'price_search',
    itemType: rb.itemType,
    itemName,
    failed: opts.failed,
  };
  if (rb.dosage != null) out.dosage = rb.dosage;
  if (rb.measurementUnit != null) out.measurementUnit = rb.measurementUnit;
  if (
    !opts.failed &&
    resBody &&
    typeof resBody === 'object' &&
    !Array.isArray(resBody)
  ) {
    const r = resBody as Record<string, unknown>;
    if ('averagePrice' in r) out.averagePrice = r.averagePrice;
    if ('source' in r) out.source = r.source;
    if ('lastUpdated' in r) out.lastUpdated = r.lastUpdated;
  }
  return out;
}

function invalidateAuditNewValue(
  reqBody: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const rb = reqBody ?? {};
  const itemName =
    typeof rb.itemName === 'string' ? truncate(rb.itemName, 120) : '';
  return {
    kind: 'price_cache_invalidate',
    itemType: rb.itemType,
    itemName,
    dosage: rb.dosage ?? null,
    measurementUnit: rb.measurementUnit ?? null,
  };
}

@Injectable()
export class PricingAuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<{
      originalUrl?: string;
      url?: string;
      body?: Record<string, unknown>;
    }>();
    const rawPath = req.originalUrl ?? req.url ?? '';
    const { path: auditPath, operation_type } = auditPathFromUrl(rawPath);
    const started = Date.now();

    return next.handle().pipe(
      tap({
        next: (body: unknown) => {
          const res = ctx.getResponse<{ statusCode?: number }>();
          const duration_ms = Date.now() - started;
          const status_code = res.statusCode ?? 200;
          const bodyObj =
            req.body && typeof req.body === 'object' && !Array.isArray(req.body)
              ? (req.body as Record<string, unknown>)
              : undefined;
          const new_value =
            operation_type === 'delete'
              ? invalidateAuditNewValue(bodyObj)
              : searchAuditNewValue(bodyObj, body, { failed: false });
          reportPricingAudit({
            path: auditPath,
            method: 'POST',
            operation_type,
            resource: 'pricing',
            status_code,
            duration_ms,
            user_id: null,
            new_value,
          });
        },
      }),
      catchError(err => {
        const duration_ms = Date.now() - started;
        const status_code =
          err instanceof HttpException ? err.getStatus() : 500;
        const bodyObj =
          req.body && typeof req.body === 'object' && !Array.isArray(req.body)
            ? (req.body as Record<string, unknown>)
            : undefined;
        const new_value =
          operation_type === 'delete'
            ? invalidateAuditNewValue(bodyObj)
            : searchAuditNewValue(bodyObj, null, { failed: true });
        reportPricingAudit({
          path: auditPath,
          method: 'POST',
          operation_type,
          resource: 'pricing',
          status_code,
          duration_ms,
          user_id: null,
          new_value,
        });
        return throwError(() => err);
      }),
    );
  }
}
