# GTM Discovery — déploiement et Instagram

Phase 1 du go-to-market : site public gratuit (carte + catalogue), cockpit masqué.

## Variables Vercel

| Environnement | Branche | Variables |
|---------------|---------|-----------|
| **Production** | `main` | `NEXT_PUBLIC_PRODUCT_PHASE=discovery` |
| | | `NEXT_PUBLIC_SITE_URL=https://thebuildroad.com` |
| **Preview** | `dev-alex` (et autres) | `NEXT_PUBLIC_PRODUCT_PHASE=full` |

Supabase : mêmes clés prod et preview (catalogue partagé).

## Branches Git

- `main` → production thebuildroad.com (mode discovery)
- `dev-alex` → preview cockpit/build/campagne (`PRODUCT_PHASE=full`)

Workflow : développer sur `dev-alex`, merger vers `main` pour contenu discovery ou features prêtes.

## Checklist avant lancement Instagram

- [ ] Home : carte interactive sans clic, pas de CTA build/GitHub
- [ ] `/opportunities` : liste complète, filtres pays OK
- [ ] Fiche : éditorial Builder visible sans compte
- [ ] Fiche : prompt + guide → teaser newsletter
- [ ] `/cockpit`, `/mes-saas`, `/start` → `/bientot` ou redirect
- [ ] `/pricing` → `/newsletter`
- [ ] Navbar sans Tarifs / Mes SaaS / Connexion
- [ ] Preview `dev-alex` : cockpit OK avec `full`

## Liens Instagram

- **Bio** : `https://thebuildroad.com/?explore=map&utm_source=instagram&utm_medium=bio`
- **Posts** : `https://thebuildroad.com/opportunities/[slug]?utm_source=instagram&utm_medium=post`

## Vérification locale

```bash
# Mode discovery (comme prod)
NEXT_PUBLIC_PRODUCT_PHASE=discovery npm run dev

# Mode full (comme preview dev-alex)
NEXT_PUBLIC_PRODUCT_PHASE=full npm run dev
```
