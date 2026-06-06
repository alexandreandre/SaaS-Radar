# SaaS Radar

Plateforme d'intelligence SaaS pour entrepreneurs français.

> Chaque semaine, découvrez un SaaS qui fonctionne à l'étranger, évaluez s'il peut marcher en France, et obtenez le plan exact pour le construire avec l'IA.

## Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui (Radix)
- Framer Motion
- Recharts

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/world` | Carte mondiale interactive (trends, top MRR, base) |
| `/opportunities` | Flux filtrable (12 opportunités) |
| `/opportunities/[slug]` | Fiche détaillée |
| `/weekly` | Pick éditorial de la semaine |
| `/simulator` | Simulateur MRR 24 mois |
| `/compare` | Comparateur 3 idées |
| `/dashboard` | Tableau de bord (mock auth) |

## Données

Toutes les données sont mockées dans `src/data/opportunities.ts` — pas de backend en V1.
