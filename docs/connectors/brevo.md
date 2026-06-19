# Connecteur Brevo (`brevo`)

Synchronise les métriques email du cockpit SaaS-Radar : **signups** (nouveaux contacts)
et **conversions** sur 12 mois glissants.

## API

- Version : REST **v3**
- Base : `https://api.brevo.com/v3`
- Documentation : [Brevo API Overview](https://developers.brevo.com/)

## Configuration utilisateur

1. Créer une clé API restreinte dans [Brevo → Paramètres → Clés API](https://app.brevo.com/settings/keys/api)
2. Permissions minimales : **Contacts (lecture)** + **Campagnes email (lecture)**
3. `CREDENTIALS_ENCRYPTION_KEY` configurée côté serveur
4. `NEXT_PUBLIC_APP_URL` pour l'URL webhook (mode liste uniquement)

## Modes conversions

| Mode | Source | Prérequis |
|------|--------|-----------|
| `campaign_clicks` (défaut) | `GET /emailCampaigns` — somme `uniqueClicks` par mois d'envoi | Clé API uniquement |
| `list_addition` | Webhook marketing `list_addition` → agrégation locale | Webhook outbound Brevo |

### Webhook (mode liste)

URL à configurer dans Brevo → Intégrations → Webhooks (outbound) :

```
{NEXT_PUBLIC_APP_URL}/api/connectors/brevo/webhook?projectId={projectId}&token={token}
```

Événement : **Contact added to list** (`list_addition`).

Brevo ne signe pas les webhooks nativement — le token dans l'URL sert de secret partagé.

## Flux utilisateur

1. Marketplace Intégrations → Brevo → coller clé API
2. Choisir le mode conversions (campagnes ou liste)
3. Si liste : configurer le webhook outbound
4. Sync initiale → snapshots cockpit

## Mapping métriques

| MetricKey | Source |
|-----------|--------|
| `signups` | Contacts créés (`GET /contacts`, bucket `createdAt`) |
| `conversions` | Clics campagnes OU ajouts liste (webhook) |

## Limites connues

- Pagination contacts : max 1000/page, rate limit 10 RPS
- Mode liste sans webhook : données incomplètes (pas d'historique rétroactif fiable)
- Première sync sur gros comptes peut prendre ~1 minute

## Routes API

| Route | Méthode | Rôle |
|-------|---------|------|
| `/api/connectors/brevo/validate` | POST | Valide clé + liste listes |
| `/api/connectors/brevo/connect` | POST | Connexion + sync initiale |
| `/api/connectors/brevo/sync` | POST | Re-sync |
| `/api/connectors/brevo/disconnect` | POST | Déconnexion |
| `/api/connectors/brevo/webhook` | POST | Ingère événements marketing |

## Tests

```bash
npm test -- scripts/brevo-connector.test.ts
```

Variables optionnelles pour tests manuels :

- `BREVO_CONNECTOR_TEST_API_KEY`
- `BREVO_CONNECTOR_TEST_LIST_ID`
