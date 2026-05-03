
export function resolveDatabaseUrl(): string | null {
  const direct =
    process.env.STOKIO_DATABASE_URL?.trim() ||
    process.env.DATABASE_URL?.trim();
  if (direct) return direct;

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

  return `postgresql://${encUser}:${encPass}@${host}:${port}/${encName}?schema=public`;
}
