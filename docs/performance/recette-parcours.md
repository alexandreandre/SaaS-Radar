# Recette manuelle — parcours performance

Trois parcours à rejouer après chaque phase majeure du plan perf.

## 1. Marketing (sans cockpit)

1. Ouvrir `/` en navigation privée — pas de spinner prolongé, carte hero visible < 3 s
2. Ouvrir `/pricing` — pas d'erreur console, pas de fetch `/api/portfolio`
3. Ouvrir `/login` — formulaire immédiat
4. DevTools Network : vérifier absence de gros chunk `portfolio-connector-actions` sur `/` (lazy au 1er OAuth/sync uniquement)

**Succès** : First Load JS marketing sans portfolio ; favoris home OK si connecté.

## 2. Catalogue opportunités

1. Ouvrir `/opportunities` — liste visible, filtres réactifs
2. Cliquer une fiche — CTA build / favori fonctionnels
3. Utilisateur connecté : CTA « Continuer mon build » si projet existant
4. Vérifier TTFB raisonnable (ISR, pas de full dynamic inutile)

**Succès** : liste ISR ; fiche avec `existingProject` serveur si applicable.

## 3. Cockpit + connecteur

1. Compte test connecté → `/mes-saas` — projets listés, badge sync visible (Phase 3)
2. Ouvrir un cockpit — contenu projet au first paint (SSR Phase 5)
3. Connecter un connecteur (ex. démo ou GitHub staging) — pas d'erreur 500
4. Modifier une métrique — statut « Sauvegardé » ou retry visible
5. Second onglet / autre appareil — données serveur cohérentes après refresh

**Succès** : pas de perte silencieuse ; cockpit SSR ; sync confirmée.

## 4. Admin (SSR)

1. `/admin` — overview avec KPIs sans spinner prolongé
2. `/admin/users` — tableau utilisateurs visible au first paint (loader SSR)
3. Filtres URL users — re-fetch client après changement de filtre (normal)

**Succès** : données initiales serveur ; mutations restent client.

## Régression rapide CI

```bash
npm test
npm run build 2>&1 | tee /tmp/next-build.log && npm run check:bundles -- /tmp/next-build.log
```
