export type PricingAuditPayload = {
  path: string;
  method: string;
  operation_type: 'create' | 'update' | 'delete';
  resource: 'pricing';
  status_code: number;
  duration_ms: number;
  user_id?: number | null;
  tenant_id?: number | null;
  old_value?: Record<string, unknown> | null;
  new_value?: Record<string, unknown> | null;
};

function ingestBaseUrl(): string | null {
  const u = process.env.BACKEND_INTERNAL_URL?.trim().replace(/\/$/, '');
  return u || null;
}

function ingestApiKey(): string | null {
  return (
    process.env.ERROR_INGEST_API_KEY?.trim() ||
    process.env.X_API_KEY?.trim() ||
    null
  );
}

export function reportPricingAudit(payload: PricingAuditPayload): void {
  const base = ingestBaseUrl();
  const key = ingestApiKey();
  if (!base || !key) return;

  void fetch(`${base}/api/v1/internal/pricing-audit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': key,
    },
    body: JSON.stringify(payload),
  }).catch(() => undefined);
}
