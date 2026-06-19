# Connecteur TikTok Ads (`tiktok-ads`)

Synchronise les métriques d'acquisition TikTok dans le cockpit SaaS-Radar :
**adSpend**, **impressions**, **clics** et **conversions** sur 12 mois glissants.

## API

- Version : Marketing API **v1.3**
- Base : `https://business-api.tiktok.com/open_api/v1.3/`
- Documentation : [TikTok API for Business](https://business-api.tiktok.com/portal/docs)

## Configuration plateforme

1. Créer une application sur [TikTok for Business](https://business-api.tiktok.com/portal/docs)
2. Activer le produit **Marketing API**
3. Enregistrer la redirect URI : `https://<domaine>/api/connectors/tiktok-ads/callback`
4. Renseigner dans `.env` :
   - `TIKTOK_ADS_APP_ID`
   - `TIKTOK_ADS_APP_SECRET`
   - `TIKTOK_ADS_REDIRECT_URI`
   - `CREDENTIALS_ENCRYPTION_KEY`

## OAuth

- Autorisation : `GET https://business-api.tiktok.com/portal/auth?app_id=...&redirect_uri=...&state=...`
- Callback : paramètre `auth_code` (ou `code` en fallback)
- Échange : `POST /oauth2/access_token/`
- Refresh : `POST /oauth2/refresh_token/` (access token ~24h, refresh ~1 an)

Scope minimal : **ad.read** (reporting).

## Flux utilisateur

1. Marketplace Intégrations → TikTok Ads → OAuth
2. Sélection du compte publicitaire (advertiser)
3. Sync initiale → snapshots cockpit

## Reporting

Endpoint : `GET /report/integrated/get/`

- `report_type=BASIC`
- `data_level=AUCTION_ADVERTISER`
- `dimensions=["stat_time_month"]` (fallback `stat_time_day` agrégé par mois)
- `metrics=["spend","impressions","clicks","conversion"]`

## App review

L'accès production à la Marketing API nécessite la validation de l'application TikTok.
En développement, utilisez un compte de test et `TIKTOK_ADS_CONNECTOR_FALLBACK=1` pour
valider le flux sans quota reporting.

## Routes API

| Route | Méthode | Rôle |
|-------|---------|------|
| `/api/connectors/tiktok-ads/oauth` | GET | Démarre OAuth |
| `/api/connectors/tiktok-ads/callback` | GET | Échange auth_code |
| `/api/connectors/tiktok-ads/accounts` | GET | Liste advertisers |
| `/api/connectors/tiktok-ads/connect` | POST | Sélection advertiser + sync |
| `/api/connectors/tiktok-ads/sync` | POST | Re-sync |
| `/api/connectors/tiktok-ads/disconnect` | POST | Déconnexion |
| `/api/connectors/tiktok-ads/health` | GET | État credential |

## Tests

```bash
npm test -- scripts/tiktok-ads-connector.test.ts
```

Variables optionnelles pour tests manuels :

- `TIKTOK_ADS_CONNECTOR_TEST_ACCESS_TOKEN`
- `TIKTOK_ADS_CONNECTOR_TEST_ADVERTISER_ID`
