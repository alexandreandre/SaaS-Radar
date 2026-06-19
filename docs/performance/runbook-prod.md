# Runbook production — performance et fiabilité

## Checklist secrets (bloquant)

| Variable | Usage |
|----------|--------|
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Auth, données, workers |
| `CREDENTIALS_ENCRYPTION_KEY` | Connecteurs OAuth |
| `STRIPE_*` + webhook | Paiements |
| `NEXT_PUBLIC_SITE_URL` | Callbacks OAuth / Stripe |
| `REVALIDATE_SECRET`, `SOURCING_REVALIDATE_URL` | Catalogue post-sourcing |

## Alertes recommandées

- Taux 5xx > 1 % sur `/api/portfolio/*` (5 min)
- Taux 5xx sur `/api/connectors/*/callback` (5 min)
- Logs `type: "web_vital"` avec LCP > 4 s ou INP > 500 ms (agrégation)

## Web Vitals

`POST /api/metrics/web-vitals` — logs JSON en prod. Brancher sur Datadog/Sentry si besoin.

## Bundle CI

`npm run check:bundles` après build — budgets dans `scripts/bundle-budgets.json`.

## Sync portfolio

- File client : `src/lib/portfolio-sync-queue.ts`
- Statut UI : `PortfolioSyncStatus`
- En cas de `error` persistant : vérifier auth + `PUT /api/portfolio/metrics`

## Jobs connecteurs (Phase 8)

Table `connector_sync_jobs` — migration **`042_connector_sync_jobs.sql`**.

### Application en production

1. Vérifier que la migration est absente : `SELECT to_regclass('public.connector_sync_jobs');` doit retourner `NULL`.
2. Appliquer via Supabase CLI ou SQL Editor :
   ```bash
   supabase db push
   # ou exécuter manuellement supabase/migrations/042_connector_sync_jobs.sql
   ```
3. Vérifier les index : `connector_sync_jobs_status_idx`, `connector_sync_jobs_project_idx`.
4. Le cron `scripts/connector-sync-cron.ts` traite la file **avant** le scan complet des intégrations.
5. Endpoint client : `POST /api/connectors/sync/enqueue` (auth requise, body `{ projectId, provider }`).

Worker : étendre `scripts/connector-sync-cron.ts` pour traiter la file avant le scan complet.

## Revue trimestrielle

1. Taille `portfolio-context.tsx` / modules `src/contexts/portfolio/`
2. Nouveaux `"use client"` sur pages catalogue
3. Mettre à jour `docs/performance/baseline.md`
