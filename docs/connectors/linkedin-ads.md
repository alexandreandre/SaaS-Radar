# Connecteur LinkedIn Ads (`linkedin-ads`)

Synchronise les métriques d'acquisition LinkedIn dans le cockpit SaaS-Radar :
**adSpend**, **impressions**, **clics** et **conversions** sur 12 mois glissants.

## API

- Version : Marketing API **202605** (`LinkedIn-Version: 202605`)
- Base : `https://api.linkedin.com/rest/`
- Documentation : [LinkedIn Marketing API — Reporting](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/getting-started)

## Configuration plateforme

1. Créer une application sur [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps)
2. Demander le produit **Advertising API** (onglet Products)
3. Enregistrer la redirect URI : `https://<domaine>/api/connectors/linkedin-ads/callback`
4. Tier Development : ajouter les comptes ads testés via **Products → View Ad Accounts**
5. Renseigner dans `.env` :
   - `LINKEDIN_ADS_CLIENT_ID`
   - `LINKEDIN_ADS_CLIENT_SECRET`
   - `LINKEDIN_ADS_REDIRECT_URI`
   - `CREDENTIALS_ENCRYPTION_KEY`

## OAuth

- Autorisation : `GET https://www.linkedin.com/oauth/v2/authorization`
- Échange : `POST https://www.linkedin.com/oauth/v2/accessToken`
- Refresh : `grant_type=refresh_token` (access ~60j, refresh ~365j)

Scopes minimaux : **r_ads** (lister comptes) + **r_ads_reporting** (reporting).

## Flux utilisateur

1. Marketplace Intégrations → LinkedIn Ads → OAuth
2. Sélection du compte publicitaire (sponsored account)
3. Sync initiale → snapshots cockpit

## Reporting

Endpoint : `GET /rest/adAnalytics`

- `q=analytics`
- `pivot=ACCOUNT`
- `timeGranularity=MONTHLY` (fallback `DAILY` agrégé par mois)
- `fields=costInLocalCurrency,impressions,clicks,externalWebsiteConversions,oneClickLeads,dateRange`
- **conversions** cockpit = `externalWebsiteConversions` + `oneClickLeads`

## Tier Development

En tier Development, chaque compte publicitaire doit être whitelisté dans le Developer Portal.
Sans cela, l'API renvoie 403 `USER_NOT_AUTHORIZED`.

En développement local, `LINKEDIN_ADS_CONNECTOR_FALLBACK=1` permet de valider le flux
sans appels reporting.

## Routes API

| Route | Méthode | Rôle |
|-------|---------|------|
| `/api/connectors/linkedin-ads/oauth` | GET | Démarre OAuth |
| `/api/connectors/linkedin-ads/callback` | GET | Échange code |
| `/api/connectors/linkedin-ads/accounts` | GET | Liste comptes ads |
| `/api/connectors/linkedin-ads/connect` | POST | Sélection compte + sync |
| `/api/connectors/linkedin-ads/sync` | POST | Re-sync |
| `/api/connectors/linkedin-ads/disconnect` | POST | Déconnexion |
| `/api/connectors/linkedin-ads/health` | GET | État credential |

## Tests

```bash
npm test -- scripts/linkedin-ads-connector.test.ts
```

Variables optionnelles pour tests manuels :

- `LINKEDIN_ADS_CONNECTOR_TEST_ACCESS_TOKEN`
- `LINKEDIN_ADS_CONNECTOR_TEST_AD_ACCOUNT_ID`
