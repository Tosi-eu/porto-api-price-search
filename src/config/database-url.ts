/**
 * URL Postgres do price-search.
 *
 * O serviço gerencia o schema `pricing` (cache de preços via Prisma) e ainda
 * lê `public.system_config` (gravado pelo backend) via `pg` puro. Por isso a
 * URL inclui `schema=pricing` para o Prisma e a query SQL de leitura da chave
 * referencia `public.system_config` explicitamente — assim funciona com ambos.
 */
export function resolveDatabaseUrl(): string | null {
  const direct =
    process.env.STOKIO_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (direct) return ensurePricingSchema(direct);

  const host = process.env.DB_HOST?.trim();
  const user = process.env.DB_USER?.trim();
  const name = process.env.DB_NAME?.trim();
  const pass = process.env.DB_PASSWORD ?? '';
  const rawPort = Number(process.env.DB_PORT);
  const port =
    Number.isFinite(rawPort) && rawPort > 0 ? rawPort : 5432;

  if (!host || !user || !name) return null;

  const encUser = encodeURIComponent(user);
  const encPass = encodeURIComponent(String(pass));
  const encName = encodeURIComponent(name);

  return `postgresql://${encUser}:${encPass}@${host}:${port}/${encName}?schema=pricing`;
}

function ensurePricingSchema(url: string): string {
  if (/[?&]schema=/.test(url)) {
    return url.replace(/([?&])schema=[^&]*/, '$1schema=pricing');
  }
  return url.includes('?') ? `${url}&schema=pricing` : `${url}?schema=pricing`;
}
