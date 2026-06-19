# Baseline performance — SaaS Radar

Document de référence pour mesurer les gains du plan perf/architecture.

## Comment mesurer

```bash
npm run build 2>&1 | tee /tmp/next-build.log
npm run check:bundles -- /tmp/next-build.log
npm run analyze   # ouvre le bundle analyzer (ANALYZE=true)
```

## Architecture post-clôture (2026-06)

| Composant | État |
|-----------|------|
| `portfolio-context.tsx` | Re-export ~7 lignes |
| `portfolio-provider.tsx` | Orchestrateur ~556 lignes |
| `portfolio-connector-actions.ts` | Chunk lazy (~3 600 lignes connecteurs) |
| Recharts cockpit | 13 charts en `*-inner.tsx` + `dynamic()` |
| Admin console | 10 pages SSR + security statique documentée |

## Métriques cibles (budgets CI)

| Route | First Load JS max (kB) | Notes |
|-------|------------------------|-------|
| `/` | 280 | Hors `portfolio-connector` au chargement |
| `/pricing`, `/login` | 200 | Route group marketing |
| `/opportunities` | 320 | ISR revalidate 3600 |
| `/mes-saas` | 400 | Workspace providers uniquement |
| `/cockpit/[id]` | — | SSR `initialProject` |

Calibrer après `npm run build` : noter les valeurs réelles dans le tableau ci-dessous (+10 % marge dans `scripts/bundle-budgets.json`).

## Web Vitals prod

Le composant `WebVitalsReporter` envoie LCP, INP, CLS, TTFB, FCP vers `POST /api/metrics/web-vitals` (logs JSON structurés).

## Budgets CI

Fichier [`scripts/bundle-budgets.json`](../../scripts/bundle-budgets.json) — échec CI si dépassement de +10 % vs `maxKb`.

## Baseline mesurée

| Route | First Load JS (kB) | Date | Notes |
|-------|-------------------|------|-------|
| `/` | _à mesurer post-build_ | 2026-06-19 | Pas de chunk connecteurs marketing |
| `/pricing` | _à mesurer_ | 2026-06-19 | |
| `/login` | _à mesurer_ | 2026-06-19 | |
| `/opportunities` | _à mesurer_ | 2026-06-19 | |
| `/mes-saas` | _à mesurer_ | 2026-06-19 | |

## Chunks à surveiller

1. `portfolio-connector-actions` — objectif : chargé uniquement après action OAuth/sync cockpit
2. `recharts` — objectif : uniquement dans `*-inner.tsx` (lazy)
3. `react-simple-maps` — dynamic sur home (`HomeMapGateway`)

## Recette manuelle

Voir [`recette-parcours.md`](./recette-parcours.md) — 3 parcours marketing / catalogue / cockpit + admin users.
