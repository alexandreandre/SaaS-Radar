# Revue trimestrielle — dette perf

Checklist à rejouer chaque trimestre :

1. `wc -l src/contexts/portfolio-context.tsx` — objectif orchestrateur < 800 lignes
2. `npm run analyze` — comparer First Load JS `/`, `/opportunities`, `/mes-saas`
3. Nouveaux `"use client"` sur pages catalogue (`rg 'use client' src/app/(workspace)/opportunities`)
4. Budgets CI : `npm run check:bundles` après build
5. Mettre à jour les `maxKb` dans `scripts/bundle-budgets.json` si gains confirmés

Voir aussi [baseline.md](./baseline.md) et [runbook-prod.md](./runbook-prod.md).
