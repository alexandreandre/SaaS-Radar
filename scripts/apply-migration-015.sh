#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SQL_FILE="$ROOT/supabase/migrations/015_opportunity_favorites.sql"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL requis."
  echo "Supabase Dashboard → Project Settings → Database → Connection string (URI)"
  echo "Exemple : DATABASE_URL='postgresql://postgres.[ref]:[password]@...' npm run db:migrate:015"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql introuvable — installez PostgreSQL client."
  exit 1
fi

echo "Application de 015_opportunity_favorites.sql…"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$SQL_FILE"
echo "Migration 015 appliquée."
