#!/bin/sh
set -e
cd /app

# Monta DATABASE_URL apontando para o schema `pricing` quando só há DB_*.
if [ -z "${DATABASE_URL:-}" ] && [ -n "${DB_HOST:-}" ] && [ -n "${DB_USER:-}" ] && [ -n "${DB_NAME:-}" ]; then
  _PRICING_PG_URL="$(
    node -e "
      const u = encodeURIComponent(process.env.DB_USER || '');
      const p = encodeURIComponent(process.env.DB_PASSWORD || '');
      const h = process.env.DB_HOST || 'localhost';
      const port = process.env.DB_PORT || '5432';
      const db = process.env.DB_NAME || 'estoque';
      console.log(
        'postgresql://' + u + ':' + p + '@' + h + ':' + port + '/' + encodeURIComponent(db) + '?schema=pricing',
      );
    "
  )"
  export DATABASE_URL="$_PRICING_PG_URL"
fi

# STOKIO_DATABASE_URL (legado/compat) tem precedência se alguém setar — força schema=pricing.
if [ -n "${STOKIO_DATABASE_URL:-}" ] && [ -z "${DATABASE_URL:-}" ]; then
  export DATABASE_URL="$(echo "$STOKIO_DATABASE_URL" | sed -E 's/([?&])schema=[^&]+/\1schema=pricing/; t end; s/$/?schema=pricing/; :end' )"
fi

if [ "${SKIP_PRISMA_MIGRATE:-0}" != "1" ] && [ -n "${DATABASE_URL:-}" ]; then
  echo "[price-search/entrypoint] aplicando migrations Prisma (schema=pricing)"
  npx prisma migrate deploy
fi

exec "$@"
