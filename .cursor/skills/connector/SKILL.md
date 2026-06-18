---
name: connector
description: >-
  Implémente un connecteur cockpit SaaS-Radar de bout en bout (auth, API, sync,
  snapshots, UI, tests, migration, docs) en s'appuyant sur les patterns Stripe
  et Google Ads et la doc officielle la plus récente de l'API tierce. Produit
  un plan d'implémentation détaillé en mode Plan. A utiliser lorsque
  l'utilisateur tape /connector, demande d'implémenter ou connecter un outil
  tiers (Stripe, Meta Ads, Plausible, Paddle…), ou attache explicitement ce
  skill — le nom du connecteur est fourni juste après l'invocation.
disable-model-invocation: true
---

# /connector — Implémentation connecteur cockpit SaaS-Radar

Tu es un **ingénieur intégrations senior** sur SaaS-Radar. Ta mission : livrer un
connecteur **production-ready**, aligné sur les conventions du dépôt, avec la
**doc API officielle la plus récente** (versions, endpoints, scopes, quotas).

> **Règle d'or.** Aucune ligne de code avant : (1) identification du connecteur,
> (2) recherche web de l'API actuelle, (3) audit des références `stripe` et
> `google-ads` dans ce dépôt, (4) plan d'implémentation validé (explicite en
> mode Plan, implicite avant codage en mode Agent).

## Entrée utilisateur

L'utilisateur invoque `/connector` puis **donne le connecteur** (nom, slug, ou
URL produit). Déduis :

| Élément | Action |
|---------|--------|
| `ConnectorId` | kebab-case (`meta-ads`, `lemon-squeezy`) — voir `types.ts` si déjà listé |
| Famille | **metrics** (snapshots cockpit), **stream-only** (DevStream / finance), ou **build** (GitHub/Vercel) |
| Auth | OAuth plateforme, clé utilisateur, token API, ou hybride |
| Métriques | Champs `MetricsSnapshot` / `MetricKey` réellement exposés par l'API |

Si le connecteur existe déjà en **démo seule** dans `registry.ts`, l'objectif est
de le passer en **connexion réelle** sans casser le mode démo (sauf Stripe : réel
uniquement).

## Mode Plan vs mode Agent

### Mode Plan (Cursor Plan)

**Ne pas coder.** Livrer uniquement le **Plan d'implémentation** (template §
« Livrable Plan ») rempli pour CE connecteur : auth, fichiers, routes, UI, tests,
env, risques, ordre des PRs. Proposer des questions bloquantes si l'API ou le
périmètre est ambigu.

### Mode Agent (défaut)

1. Rédiger le plan (court, en tête de réponse ou fichier `docs/connectors/{id}.md`
   si volumineux).
2. **Implémenter tout** selon la checklist § « Implémentation complète ».
3. Exécuter tests + build ; corriger jusqu'à vert.
4. Synthèse finale : ce qui est fait, config manuelle restante (console OAuth, etc.).

---

## Phase 1 — Recherche API (obligatoire)

Avant toute décision technique, **recherche web** sur la doc officielle :

```
Task Progress recherche :
- [ ] Page auth officielle (OAuth / API keys / PAT / App install)
- [ ] Version API stable recommandée (éviter endpoints dépréciés)
- [ ] Scopes / permissions minimales pour les métriques cibles
- [ ] Endpoints exacts pour chaque métrique du cockpit
- [ ] Limites (rate limit, pagination, délai données, sandbox)
- [ ] Format unités (centimes, micros, timezone, agrégation mensuelle)
- [ ] Erreurs courantes et codes HTTP
- [ ] Prérequis console développeur (redirect URI, verification app, etc.)
```

**Citer** dans le plan : version API, URLs doc, date de consultation.

Références internes à lire après la recherche :

- `src/lib/connectors/stripe/` — clé restreinte, Analytics v2, `PaymentStream`
- `src/lib/connectors/google-ads/` — OAuth, refresh token, GAQL, sélection compte
- [reference.md](reference.md) — templates, arborescence, patterns routes

---

## Phase 2 — Décisions d'architecture

### Arbre auth

| Pattern | Quand | Référence dépôt |
|---------|-------|-----------------|
| **Clé utilisateur** (restreinte) | L'utilisateur génère une clé dans le dashboard tiers ; pas d'OAuth plateforme | Stripe `rk_*` |
| **OAuth plateforme** | Refresh token par projet ; scopes larges | Google Ads |
| **OAuth + sélection ressource** | Plusieurs comptes / propriétés après OAuth | Google Ads `accounts` + `connect` |
| **Stream-only** | Pas de `MetricsSnapshot` ; alimente `connectorStreams` | `makeStreamOnlyConnector` |
| **Build cockpit** | GitHub App / Vercel OAuth ; hors marketplace Intégrations | `src/app/api/connectors/github/` |

**Sécurité non négociable :**

- Credentials chiffrées AES-256-GCM via `CREDENTIALS_ENCRYPTION_KEY`
- Stockage `connector_credentials` (service role write, RLS owner read)
- Jamais de secret en clair côté client ni dans les logs
- `assertProjectOwnedByUser` sur chaque route
- OAuth `state` = `base64url(JSON.stringify({ projectId, userId }))`, vérif `userId` au callback

### Mapping métriques cockpit

Pour chaque `MetricKey` visé, documenter dans le plan :

- Endpoint / requête source
- Transformation vers `MetricsSnapshot` (voir `types.ts`)
- Champs non disponibles → `0` (ne pas inventer)
- Fenêtre temporelle (ex. 12 mois glissants, aligné Google Ads)
- `source: "{connectorId}"` sur chaque snapshot

### Streams optionnels

Si l'API expose des événements granulaires (paiements, issues, deploys) :
évaluer un `ConnectorStreamPayload` dans `streams.ts`. Stripe est la référence
(`PaymentStream`). Ne créer un stream que si le cockpit peut l'exploiter.

---

## Livrable Plan (mode Plan — template à remplir)

```markdown
# Plan connecteur : {Nom} (`{id}`)

## Résumé produit
- Catégorie / jobLabel / priority
- Métriques cockpit (`provides` / `demoFields`)
- Mode démo conservé ? (oui/non et pourquoi)

## API tierce (doc {date})
- Version API :
- Auth retenue :
- Scopes / permissions :
- Endpoints par métrique :
- Sandbox / test :
- Limites connues :

## Architecture SaaS-Radar
### Fichiers à créer/modifier
(liste exhaustive — voir checklist reference.md)

### Flux utilisateur
1. …
2. …

### Schéma credential chiffrée
```json
{ … }
```

### Routes API
| Route | Méthode | Rôle |
|-------|---------|------|

### Migration SQL
- Provider `connector_credentials` : `{id}`

### Variables `.env.example`
- `{ID}_*` plateforme …

## Mapping snapshots
| MetricKey | Source API | Transformation |

## UI
- Dialog dédié ? Étapes OAuth ?
- Branches `integration-card.tsx`

## Tests
- Fonctions pures à couvrir (`snapshots.ts`, `keys.ts`, …)
- Vars CI commentées

## Risques & mitigations
- …

## Ordre d'implémentation (PRs suggérées)
1. Lib + tests unitaires
2. Routes API
3. UI + portfolio-context
4. Registry + migration + docs

## Questions ouvertes
- …
```

---

## Implémentation complète (mode Agent)

Copier cette checklist et cocher au fur et à mesure :

```
Task Progress implémentation :
- [ ] 1. Types & catalogue
- [ ] 2. Backend lib (`src/lib/connectors/{id}/`)
- [ ] 3. Credentials & migration DB
- [ ] 4. Routes API
- [ ] 5. UI marketplace
- [ ] 6. Portfolio context
- [ ] 7. Tests & package.json
- [ ] 8. Docs & env
- [ ] 9. Validation (tests + build)
```

### 1. Types & catalogue

- [ ] `ConnectorId` dans `src/lib/connectors/types.ts` (si nouveau)
- [ ] `CONNECTOR_BRANDS` dans `brands.ts` (Simple Icons ou `local`)
- [ ] Entrée `makeConnector` ou `makeStreamOnlyConnector` dans `registry.ts`
- [ ] `provides` / `demoFields` cohérents avec l'API réelle
- [ ] Icône vérifiable (`connector-brand-icons` / `connector-local-icons`)

### 2. Backend lib

Créer `src/lib/connectors/{id}/` :

| Fichier | Rôle |
|---------|------|
| `types.ts` | Credential + types réponses API |
| `client.ts` | HTTP, `{Id}ConnectorError`, refresh token inline si OAuth |
| `oauth.ts` | Si OAuth : `is{Id}Configured`, authorize URL, exchange, refresh |
| `keys.ts` | Si clé API : parse, validation format, rejet clés trop permissives |
| `analytics.ts` | Appels API granulaires (optionnel) |
| `snapshots.ts` | **Fonctions pures** : API → `MetricsSnapshot[]` |
| `metrics.ts` | `fetch{Id}ConnectorSync()` → `ConnectorSyncResult` |
| `sync-service.ts` | `load/save/run{Id}Sync` — frontière credentials-store |
| `index.ts` | Re-exports publics |

**Contrat sync :**

```typescript
type ConnectorSyncResult = {
  snapshots?: MetricsSnapshot[];
  stream?: ConnectorStreamPayload;
  accountLabel?: string;
  syncedAt: string; // ISO
};
```

Patterns obligatoires :

- `import "server-only"` dans sync-service et client serveur
- Classe `{Id}ConnectorError extends Error { status?: number }`
- Persist credential rafraîchie après sync si tokens mutés (cf. Google Ads)
- `validateCredential` / équivalent avant premier `save`

### 3. Credentials & migration

- [ ] `ConnectorProvider` dans `credentials-store.ts`
- [ ] Migration `supabase/migrations/NNN_{id}_connector.sql` — étendre
      `connector_credentials_provider_check`
- [ ] Metadata jsonb utiles (`accountLabel`, `oauthConnected`, `livemode`, …)

### 4. Routes API

Sous `src/app/api/connectors/{id}/` :

```typescript
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
```

| Route | Obligatoire |
|-------|-------------|
| `connect/route.ts` | POST — auth + validate + sync initiale |
| `sync/route.ts` | POST — re-sync credential existante |
| `disconnect/route.ts` | POST — delete credential + ok |
| `oauth/route.ts` | GET — si OAuth (redirect) |
| `callback/route.ts` | GET — si OAuth (exchange + redirect cockpit `?{id}_oauth=1`) |
| `accounts/route.ts` | GET — si multi-comptes post-OAuth |

Garde-fous chaque route : `getCurrentUser` → 401 ; ownership → 403 ;
`isCredentialsEncryptionConfigured` → 503 sur connect ; erreurs domaine → JSON
`{ error }` avec status adapté.

### 5. UI marketplace

- [ ] `{id}-connect-dialog.tsx` si flux non trivial (OAuth, multi-étapes, clé)
- [ ] Branches dans `integration-card.tsx` : `is{Id}`, dialog, badge Connecté/Démo
- [ ] `useEffect` sur query param callback OAuth si applicable
- [ ] États loading / erreur / permissions manquantes (messages actionnables)
- [ ] Lien vers dashboard tiers pour créer clé / autoriser app

**UX :** réutiliser `ConnectorLogo`, `Badge`, patterns Stripe/Google Ads ; pas de
nouveau design system.

### 6. Portfolio context

Dans `src/contexts/portfolio-context.tsx` :

- [ ] Étendre `ConnectIntegrationOptions` (champs credential spécifiques)
- [ ] `connectIntegration` : branches `real` → `POST /api/connectors/{id}/connect`
- [ ] `syncIntegration` : `POST /sync` si `connected`
- [ ] `disconnectIntegration` : `POST /disconnect` + `removeConnectorStream`
- [ ] Résultats via `applyConnectorSyncToProject` (`integration-client.ts`)

Si connecteur **paiement** : évaluer `demoteOtherPaymentIntegrations`.

### 7. Tests

- [ ] `scripts/{id}-connector.test.ts` — **fonctions pures** (snapshots, parsing)
- [ ] Ajout au script `test` dans `package.json`
- [ ] Vars `{ID}_CONNECTOR_TEST_*` commentées dans `.env.example`
- [ ] Pas d'appels API live en CI par défaut

### 8. Docs

- [ ] Section README (config console, redirect URI, permissions)
- [ ] `.env.example` avec commentaires pas-à-pas
- [ ] Optionnel : health dans `src/app/api/admin/system/route.ts`

### 9. Validation

```bash
npm test -- scripts/{id}-connector.test.ts
npm run build
```

Vérifier manuellement si possible : connect → sync → disconnect ; erreur clé
invalide ; OAuth state invalide.

---

## Profondeur maximale — aller au bout

Pour chaque connecteur, viser le **plafond réaliste** de l'API :

| Dimension | Objectif |
|-----------|----------|
| **Couverture métriques** | Tous les `MetricKey` déclarés dans `provides`, pas seulement le minimum |
| **Historique** | 12 mois alignés cockpit (ou max API si moins) |
| **Account label** | Nom lisible compte / propriété / boutique |
| **Multi-compte** | Sélection UI si l'API le permet |
| **Token lifecycle** | Refresh proactif, persistance post-sync |
| **Erreurs** | Messages FR actionnables (permission manquante → lien doc) |
| **Sandbox** | Documenter mode test ; détecter `livemode` si pertinent |
| **Rate limits** | Pagination, backoff, parallélisme raisonnable |
| **Fallback dev** | Flag `{ID}_CONNECTOR_FALLBACK=1` seulement si sync complète impossible sans quota |
| **Streams** | Si données événementielles utiles au cockpit |
| **Exclusivité métier** | Paiements : un seul connecteur actif |
| **Démo** | Conserver démo pour exploration sauf décision produit contraire |

Ne pas s'arrêter à « ça compile » : le connecteur doit être **utilisable par un
fondateur non technique** depuis le marketplace Intégrations.

---

## Interdits

- Implémenter sans recherche doc API récente
- Stocker `sk_*` Stripe complètes ou secrets équivalents trop permissifs
- Bypass chiffrement ou RLS
- Loguer credentials ou tokens
- Routes sans vérification ownership projet
- Snapshots avec données inventées
- Oublier migration provider SQL
- Casser connecteurs existants (Stripe, Google Ads)
- Créer skill dans `~/.cursor/skills-cursor/`

---

## Références dépôt

| Ressource | Chemin |
|-----------|--------|
| Registry | `src/lib/connectors/registry.ts` |
| Stripe (clé RAK) | `src/lib/connectors/stripe/` |
| Google Ads (OAuth) | `src/lib/connectors/google-ads/` |
| Credentials | `src/lib/connectors/credentials-store.ts` |
| Apply sync UI | `src/lib/connectors/integration-client.ts` |
| Templates code | [reference.md](reference.md) |
