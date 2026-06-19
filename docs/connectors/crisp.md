# Connecteur Crisp (`crisp`)

Synchronise le support client dans le cockpit SaaS-Radar :

- **Snapshots** : `activeUsers` (visiteurs uniques chatbox par mois, 12 mois glissants)
- **Stream support** : `openTickets`, `avgResponseHours`, `csat` (module Clients)

## API

- Version : REST **v1**
- Base : `https://api.crisp.chat/v1/`
- Documentation : [REST API Reference v1](https://docs.crisp.chat/references/rest-api/v1/) · [Plugin Token auth](https://docs.crisp.chat/guides/rest-api/authentication/plugin-token/)

## Configuration plateforme

1. Créer un plugin sur [Crisp Marketplace](https://marketplace.crisp.chat/) (Private en dev)
2. Configurer un **Trusted Workspace** (Development token)
3. Demander un **Production token** avec scopes :
   - `website:analytics` (read)
   - `website:conversation:sessions` (read)
   - `website:people:statistics` (read, optionnel)
4. Renseigner dans `.env` :
   - `CRISP_PLUGIN_IDENTIFIER`
   - `CRISP_PLUGIN_KEY`
   - `CREDENTIALS_ENCRYPTION_KEY`
   - `NEXT_PUBLIC_CRISP_INSTALL_URL` (lien install plugin affiché dans le dialog)

## Auth

- **Plugin Token** (secrets plateforme) + `X-Crisp-Tier: plugin`
- Credential **par projet** chiffrée : `websiteId` uniquement

## Flux utilisateur

1. Marketplace Intégrations → Crisp → installer le plugin SaaS-Radar sur le workspace Crisp
2. Coller le **Website ID** (Settings → Workspace Settings → Setup & Integrations)
3. Validation → sync initiale (snapshots + stream support)

## Mapping métriques

| Cockpit | Source Crisp |
|---------|--------------|
| `activeUsers` / mois | Analytics `visitor_visit` + `unique` + split `monthly` |
| `openTickets` | Conversations `filter_not_resolved=1` (pagination) |
| `avgResponseHours` | Analytics `conversation` + `response_time` + `average` (30 j) |
| `csat` | Analytics `conversation` + `rating` + `average` (30 j), note 1–5 → % |

## Limitations

- Analytics requis pour CSAT / temps de réponse (plan Essentials+, erreur `402` sinon)
- `activeUsers` = proxy visiteurs chatbox, pas MAU produit interne
- Quota journalier plugin (5 000 req/j par défaut)

En développement local, `CRISP_CONNECTOR_FALLBACK=1` permet de valider le flux sans appels API.

## Routes API

| Route | Méthode | Rôle |
|-------|---------|------|
| `/api/connectors/crisp/validate` | POST | Vérifie website_id + accès plugin |
| `/api/connectors/crisp/connect` | POST | Enregistre credential + sync |
| `/api/connectors/crisp/sync` | POST | Re-sync |
| `/api/connectors/crisp/disconnect` | POST | Déconnexion |

## Tests

```bash
npm test -- scripts/crisp-connector.test.ts
```

Variables optionnelles pour tests manuels :

- `CRISP_CONNECTOR_TEST_WEBSITE_ID`
