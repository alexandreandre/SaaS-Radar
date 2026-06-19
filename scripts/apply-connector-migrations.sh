#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL requis."
  echo "Supabase Dashboard → Project Settings → Database → Connection string (URI)"
  echo "Exemple : DATABASE_URL='postgresql://postgres.[ref]:[password]@...' bash scripts/apply-connector-migrations.sh"
  exit 1
fi

if ! command -v psql >/dev/null 2>&1; then
  echo "psql introuvable — installez le client PostgreSQL."
  exit 1
fi

MIGRATIONS=(
  "034_qonto_connector.sql"
  "035_pennylane_connector.sql"
  "036_abby_connector.sql"
)

for file in "${MIGRATIONS[@]}"; do
  path="$ROOT/supabase/migrations/$file"
  if [[ ! -f "$path" ]]; then
    echo "Fichier absent : $file"
    exit 1
  fi
  echo "Application de $file…"
  psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$path"
done

echo "Migrations connecteurs 034–036 appliquées."
