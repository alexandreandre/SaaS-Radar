# SaaS Radar

Plateforme d'intelligence SaaS pour entrepreneurs français.

> Chaque semaine, découvrez un SaaS qui fonctionne à l'étranger, évaluez s'il peut marcher en France, et obtenez le plan exact pour le construire avec l'IA.

## Stack

- Next.js 14 (App Router)
- TypeScript (strict)
- Supabase (PostgreSQL) — catalogue d'opportunités + observabilité du sourcing
- OpenRouter (Sonar Pro + Gemini Flash) — pipeline de sourcing IA
- Zod — validation du pipeline
- Tailwind CSS + shadcn/ui (Radix)
- Framer Motion, Recharts

## Démarrage

```bash
npm install
cp .env.example .env.local   # puis renseigner les variables
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Variables d'environnement

Voir [`.env.example`](.env.example) pour la liste complète. Essentiel :

| Variable | Rôle |
|----------|------|
| `SUPABASE_URL` / `SUPABASE_ANON_KEY` | Lecture publique du catalogue + auth (session SSR, email/mot de passe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Écriture serveur (sourcing, seed) — jamais côté client |
| `OPENROUTER_API_KEY` | Pipeline de sourcing IA |
| `SOURCING_MIN_SCORE` | Score plancher (0-100) sous lequel une fiche est rejetée |
| `SOURCING_REVALIDATE_URL` + `REVALIDATE_SECRET` | Revalidation ISR prod après sourcing |
| `ADMIN_SOURCING_SECRET` | Déclenchement protégé via `/api/admin/sourcing` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | API Stripe + vérification de signature du webhook |
| `STRIPE_PRICE_BUILDER_MONTHLY/YEARLY`, `STRIPE_PRICE_PRO_MONTHLY/YEARLY` | Mapping `price_id → plan` |
| `CREDENTIALS_ENCRYPTION_KEY` | Chiffrement des clés connecteurs cockpit (Stripe, etc.) — serveur uniquement |
| `NEXT_PUBLIC_SITE_URL` | URL absolue (success/cancel/return Stripe) — optionnel en local |

## Base de données

Le schéma déployé est défini par les migrations versionnées dans `supabase/migrations/` :

- `001_opportunities.sql` — table `opportunities` (source de vérité du catalogue)
- `002_sourcing_runs.sql` — observabilité des runs de sourcing
- `003_profiles.sql` — table `profiles` (auth) : `plan`, `is_admin`, `admin_role`, quota mensuel ;
  trigger `handle_new_user()` en `SECURITY DEFINER` qui crée le profil à l'inscription ;
  RLS empêchant l'utilisateur de modifier lui-même son `plan`/`is_admin`.
- `004_billing.sql` — colonnes Stripe sur `profiles` (`stripe_customer_id`,
  `stripe_subscription_id`, `subscription_status`, `current_period_end`, verrouillées par
  RLS côté user) + table `stripe_events` (idempotence du webhook).
- `005_admin_rbac.sql` — `profiles.admin_role`, table `admin_audit_log`, rate limits.
- `006_sourcing_drafts.sql` — `opportunity_drafts`, colonnes observabilité `sourcing_runs`,
  `opportunities.status`, `sourcing_schedules`.
- `007_newsletter.sql` — `newsletter_subscribers`, campagnes, events.
- `008_billing_analytics.sql` — `billing_snapshots`, `stripe_price_id` sur profiles.
- `009_world_markets.sql` — table `world_markets`, `user_projects`, `connector_snapshots`,
  `admin_sessions`.
- `010_sourcing_publish_policy.sql` — politique de publication auto des brouillons sourcing.
- `011_sourcing_country.sql` — colonne pays sur les runs sourcing.
- `012_sourcing_foundations.sql` — file d’jobs sourcing (`sourcing_job_queue`).
- `013_sourcing_agent_v2.sql` — observabilité agent v2 (prompt version, profil pipeline).
- `014_sourcing_catalogue_direct.sql` — upsert catalogue direct depuis le sourcing.
- `015_opportunity_favorites.sql` — favoris utilisateur (`opportunity_favorites`).

Pour appliquer la migration 015 en local :

```bash
# URI depuis Supabase Dashboard → Database → Connection string
DATABASE_URL='postgresql://postgres.[ref]:[password]@...' npm run db:migrate:015
```

Ou coller le contenu de `015_opportunity_favorites.sql` dans l’éditeur SQL Supabase.

`supabase/schema.future.sql` décrit une **vision** long terme (ENUM typés, `world_markets`,
etc.) **non appliquée** : ne pas l'exécuter tel quel.

## Authentification

Auth Supabase (`@supabase/ssr`) : **magic link** (email OTP) + **Google OAuth**.

- `middleware.ts` rafraîchit la session à chaque requête (sinon la session SSR expire).
- `/login` — écran de connexion (magic link + Google). `/auth/callback` gère les deux
  flux (`?code` → `exchangeCodeForSession`, `?token_hash`+`type` → `verifyOtp`).
- `/auth/signout` (POST) détruit la session.
- `src/lib/auth.ts` — helpers serveur `getCurrentUser()`, `getProfile()`, `getTier()`
  (fallback `free` si profil absent), `isAdmin()`.
- Routes protégées (redirect `/login?next=...` si non connecté) : `/mes-saas`,
  `/cockpit/[id]`, `/account`. `/admin/*` exige `profiles.admin_role` (viewer+)
  et MFA TOTP (AAL2). Les pages catalogue/carte restent publiques.
- **Tier autoritatif serveur** : `profiles.plan` est injecté dans `TierProvider` ; pour un
  compte authentifié, la clé `localStorage` `saas-radar:preview-tier` est purgée (anti-flash)
  et le switcher d'aperçu est désactivé.
- **Paywall serveur** : `gateOpportunityForTier()` retire les champs premium hors tier
  **avant** sérialisation vers le client (le blur CSS n'est plus la seule barrière).

### Configuration Supabase (dashboard)

1. **Authentication > URL Configuration** : Site URL + Redirect URLs (`…/auth/callback`,
   en prod et en local). Voir [`.env.example`](.env.example).
2. **Authentication > Providers > Google** : activer, renseigner Client ID/Secret
   (Google Cloud Console). Redirect URI Google = `https://<ref>.supabase.co/auth/v1/callback`.
3. Appliquer la migration `003_profiles.sql`.

## Paiements (Stripe)

Abonnements **Builder** et **Pro** (mensuel + annuel) via **Stripe Checkout hébergé**. Le
**webhook est la seule source** qui écrit `profiles.plan` (service-role) ; payer débloque
automatiquement les sections premium gated côté serveur.

- `/api/stripe/checkout` (POST, auth) : crée/réutilise le Customer Stripe, persiste
  `stripe_customer_id` **avant** la redirection, puis ouvre une session Checkout. `supabase_uid`
  est mis dans `customer.metadata` ET `subscription.metadata`.
- `/api/stripe/webhook` (POST, body brut + signature) : traite `checkout.session.completed`,
  `customer.subscription.created/updated/deleted`, `invoice.payment_failed`. Résolution du
  profil par `stripe_customer_id` puis fallback `metadata.supabase_uid` (robuste à l'ordre des
  events). Idempotence via la table `stripe_events`.
- `/api/stripe/portal` (POST, auth) : ouvre le Stripe Customer Portal (gérer/annuler).
- Mapping `price_id → plan` et montants affichés : source unique [src/lib/billing/plans.ts](src/lib/billing/plans.ts).
- Annulation : accès conservé jusqu'à la fin de période ; à l'échéance `subscription.deleted`
  repasse le plan à `free`. `invoice.payment_failed` marque `past_due` sans couper l'accès.

### Configuration Stripe (dashboard)

1. Créer les 4 Prices (Products) et renseigner `STRIPE_PRICE_*` dans `.env.local`.
2. Activer le **Customer Portal** (Settings > Billing > Customer portal).
3. Webhook en local : `stripe listen --forward-to localhost:3000/api/stripe/webhook`
   (copier le `whsec_...` affiché dans `STRIPE_WEBHOOK_SECRET`). En prod : créer un endpoint
   webhook pointant sur `https://<domaine>/api/stripe/webhook`.
4. Appliquer la migration `004_billing.sql`.

> `/api/stripe/*` est exclu du middleware d'auth (Stripe n'envoie pas de cookie ; le webhook a
> besoin du body brut intact). La vente à la carte (paiement unique) est hors périmètre MVP.

### Connecteur Stripe cockpit (MRR utilisateur)

Le connecteur Stripe du cockpit (`/api/connectors/stripe/*`) est **indépendant** du billing
SaaS Radar ci-dessus. Chaque utilisateur connecte son propre compte en collant une **clé
restreinte** (`rk_test_…` / `rk_live_…`) dans le cockpit — accès lecture seule.

**Permissions RAK requises** : Account — Read, Subscriptions — Read, Invoices — Read.
(Aucune permission Analytics n'est disponible côté Stripe pour les clés restreintes ;
le MRR est calculé via l'API v1 abonnements/factures, avec bascule automatique sur
l'Analytics API si Stripe l'ouvre un jour aux RAK.)

Aucune variable `STRIPE_APP_*` ni OAuth côté serveur :
seul `CREDENTIALS_ENCRYPTION_KEY` est requis pour chiffrer la clé en base.

### Connecteur Google Ads cockpit (acquisition)

Le connecteur Google Ads (`/api/connectors/google-ads/*`) synchronise **adSpend**,
**impressions**, **clics** et **conversions** sur 12 mois via l'API Google Ads v24.

**Prérequis plateforme** (variables dans `.env`) :

1. Projet Google Cloud avec **Google Ads API** activée et écran de consentement OAuth
2. Client OAuth Web — redirect URI : `https://<domaine>/api/connectors/google-ads/callback`
3. **Developer token** depuis [API Center](https://ads.google.com/aw/apicenter) (`GOOGLE_ADS_DEVELOPER_TOKEN`)
4. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer le refresh token utilisateur

Flux utilisateur : OAuth Google (scope `adwords`) → sélection du compte Ads → sync initiale.

### Connecteur Meta Ads cockpit (acquisition)

Le connecteur Meta Ads (`/api/connectors/meta-ads/*`) synchronise **adSpend**,
**impressions**, **clics** et **conversions** sur 12 mois via la Marketing API v25.0.

**Prérequis plateforme** (variables dans `.env`) :

1. App Meta « Business » sur [developers.facebook.com](https://developers.facebook.com) avec produit **Marketing API**
2. Facebook Login configuré — redirect URI : `https://<domaine>/api/connectors/meta-ads/callback`
3. Scope OAuth : `ads_read` (lecture des insights)
4. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer le token utilisateur

Flux utilisateur : OAuth Meta → sélection du compte publicitaire → sync initiale.

**Production multi-utilisateurs** : App Review Meta requis (`ads_read` Full access + Marketing API Access Tier Full access).

**Comportement à l'expiration du token** : les snapshots déjà synchronisés restent dans le cockpit ; une alerte « Action requise » apparaît sur la carte Intégrations et dans le panel alertes. Reconnectez via OAuth pour resynchroniser (token long-lived ~60 jours).

### Connecteur TikTok Ads cockpit (acquisition)

Le connecteur TikTok Ads (`/api/connectors/tiktok-ads/*`) synchronise **adSpend**,
**impressions**, **clics** et **conversions** sur 12 mois via la TikTok Marketing API v1.3.

**Prérequis plateforme** (variables dans `.env`) :

1. App sur [TikTok API for Business](https://business-api.tiktok.com/portal/docs) avec produit **Marketing API**
2. Redirect URI : `https://<domaine>/api/connectors/tiktok-ads/callback`
3. Scope OAuth : `ad.read` (lecture reporting)
4. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer les tokens utilisateur

Flux utilisateur : OAuth TikTok → sélection du compte publicitaire → sync initiale.

**Production multi-utilisateurs** : app review TikTok requis pour accès production à volume.

**Comportement à l'expiration du token** : access token ~24h renouvelé via refresh token ; si refresh expiré (~1 an), reconnectez via OAuth. Les snapshots déjà synchronisés restent visibles.

Doc détaillée : [`docs/connectors/tiktok-ads.md`](docs/connectors/tiktok-ads.md)

### Connecteur LinkedIn Ads cockpit (acquisition B2B)

Le connecteur LinkedIn Ads (`/api/connectors/linkedin-ads/*`) synchronise **adSpend**,
**impressions**, **clics** et **conversions** (site + Lead Gen) sur 12 mois via la LinkedIn Marketing API.

**Prérequis plateforme** (variables dans `.env`) :

1. App sur [LinkedIn Developer Portal](https://www.linkedin.com/developers/apps) avec produit **Advertising API**
2. Redirect URI : `https://<domaine>/api/connectors/linkedin-ads/callback`
3. Scopes OAuth : `r_ads`, `r_ads_reporting`
4. Tier Development : whitelist du compte dans **Products → View Ad Accounts**
5. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer les tokens utilisateur

Flux utilisateur : OAuth LinkedIn → sélection du compte publicitaire → sync initiale.

**Comportement à l'expiration du token** : access token ~60j renouvelé via refresh token ; si refresh expiré (~365j), reconnectez via OAuth. Les snapshots déjà synchronisés restent visibles.

Doc détaillée : [`docs/connectors/linkedin-ads.md`](docs/connectors/linkedin-ads.md)

### Connecteur Microsoft Ads cockpit (acquisition Bing)

Le connecteur Microsoft Ads (`/api/connectors/microsoft-ads/*`) synchronise **adSpend**,
**impressions**, **clics** et **conversions** sur 12 mois via la Microsoft Advertising API v13.

**Prérequis plateforme** (variables dans `.env`) :

1. **Azure Portal** : app registration, redirect URI `https://<domaine>/api/connectors/microsoft-ads/callback`, permission déléguée `msads.manage`
2. **Google Cloud Console** (optionnel) : OAuth client web pour les comptes Google liés à Microsoft Ads — mêmes redirect URI, scopes `profile email`
3. **Developer token** Microsoft Advertising (obligatoire sur tous les appels API)
4. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer les tokens utilisateur

Flux utilisateur : choix Microsoft ou Google → OAuth → sélection du compte publicitaire → sync initiale (rapport asynchrone, peut prendre jusqu'à 2 minutes).

**Comportement à l'expiration du token** : access token renouvelé via refresh token ; si refresh révoqué, reconnectez via OAuth. Les snapshots déjà synchronisés restent visibles.

### Connecteur Vercel cockpit (build & déploiements)

Le connecteur Vercel (`/api/connectors/vercel/*`) alimente un **DevStream** : deploys 30j, état du dernier déploiement, taux de deploys OK et coûts infra optionnels (plan Pro+). Connexion possible depuis le **module Build** ou le **marketplace Intégrations** (credential unique).

**Prérequis plateforme** (setup une fois) :

1. Créer une **Integration** dans le dashboard développeur Vercel
2. Scopes OAuth : `user`, `project`, `deployment`, `team` (+ `billing` pour coûts infra Pro+)
3. Variables : `VERCEL_CLIENT_ID`, `VERCEL_CLIENT_SECRET`
4. `NEXT_PUBLIC_APP_URL` dérive le redirect (`/api/connectors/vercel/callback`) — `VERCEL_REDIRECT_URI` optionnel
5. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer le token long-lived

**Flux utilisateur** : un clic → OAuth → connecté automatiquement si un seul projet (ou match repo GitHub). Sinon choix en un tap. **Démo** ou **URL manuelle** si OAuth plateforme indisponible.

### Connecteur Sentry cockpit (monitoring erreurs)

Le connecteur Sentry (`/api/connectors/sentry/*`) alimente un **DevStream** : issues ouvertes, taux d'erreur 24h, crash-free sessions (proxy uptime) et releases 30j. Consommé par le module **Build** et les alertes `sentry-spike`.

**Prérequis plateforme** (setup une fois) :

1. Créer une **Public Integration** dans Sentry → Settings → Developer Settings
2. Permissions : `org:read`, `project:read`, `event:read`, `project:releases`
3. Redirect URI : `https://<domaine>/api/connectors/sentry/callback`
4. Webhook URL : `https://<domaine>/api/connectors/sentry/webhook`
5. Variables : `SENTRY_CLIENT_ID`, `SENTRY_CLIENT_SECRET`, `SENTRY_REDIRECT_URI`, `SENTRY_APP_SLUG`
6. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer les tokens (expiration ~8 h, refresh automatique)

**Flux utilisateur** : OAuth external-install → sélection du projet Sentry → sync initiale. Mode **démo** conservé dans Intégrations.

### Connecteur Better Stack cockpit (uptime / incidents)

Le connecteur Better Stack (`/api/connectors/better-stack/*`) alimente un **DevStream** : **uptimePct** (SLA 30 j), **openIssues** (incidents actifs), **errorRate** dérivé et URL du monitor. Consommé par le module **Build** et l'alerte `uptime-low` (fallback si Vercel absent).

**Prérequis utilisateur** :

1. Compte Better Stack avec au moins un **monitor Uptime**
2. Token **Uptime API** (team-scoped recommandé) ou Global API token — Better Stack → API tokens
3. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer le token

**Flux utilisateur** : coller le token → liste des monitors (suggestion auto si URL = production Vercel/host) → sync SLA + incidents. Mode **démo** conservé dans Intégrations.

Doc API : [Better Stack Uptime API](https://betterstack.com/docs/uptime/api/getting-started-with-uptime-api/)

### Connecteur GitHub cockpit (dev / CI)

Le connecteur GitHub (`/api/connectors/github/*`) alimente un **GitHubMultiStream** : jusqu'à **5 dépôts** suivis sous une seule installation, chacun avec commits 7j, workflow CI, PRs, issues et étoiles. Connexion via **GitHub App** depuis le **module Build** (lien auto à l'outil actif) ou le **marketplace Intégrations**.

1. Créer une GitHub App : callback `https://<domaine>/api/connectors/github/callback`
2. Permissions lecture : metadata, contents, actions, pull_requests
3. Variables : `GITHUB_APP_ID`, `GITHUB_APP_PRIVATE_KEY`, `GITHUB_APP_SLUG`
4. Doc détaillée : [`docs/connectors/github.md`](docs/connectors/github.md)

Flux : installer l'app → ajouter un ou plusieurs dépôts → sync (tous ou par repo). Mode **démo** conservé dans Intégrations.

### Connecteur Plausible cockpit (analytics web)

Le connecteur Plausible (`/api/connectors/plausible/*`) synchronise **signups** (goal optionnel),
**activeUsers**, **mau** et **dau** sur 12 mois via la Stats API v2.

**Prérequis utilisateur** (pas de secret plateforme) :

1. Compte Plausible **plan Business** (Stats API)
2. Clé **Stats API** créée dans Paramètres → API Keys
3. Domaine du site identique à celui configuré dans Plausible
4. Goal signup optionnel (sinon signups = 0)

**Prérequis plateforme** : `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer la clé utilisateur.

Variable optionnelle : `PLAUSIBLE_API_BASE` (défaut `https://plausible.io`) pour instance self-hosted.

Flux utilisateur : saisie clé + domaine → validation → sélection goal signup (optionnel) → sync initiale.

### Connecteur Fathom cockpit (analytics web)

Le connecteur Fathom (`/api/connectors/fathom/*`) synchronise **signups** (événement optionnel),
**activeUsers**, **mau** et **dau** sur 12 mois via l'API v1 (`/v1/aggregations`).

**Prérequis utilisateur** (pas de secret plateforme) :

1. Compte Fathom Analytics actif
2. Clé API créée sur [app.usefathom.com/api](https://app.usefathom.com/api) — **lecture seule** recommandée
3. Site sélectionné parmi ceux accessibles par la clé
4. Événement signup optionnel (sinon signups = 0)

**Prérequis plateforme** : `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer la clé utilisateur.

**Quota** : chaque requête API compte dans le quota mensuel de pageviews Fathom. Limite agrégations : 10 req/min.

Variable optionnelle : `FATHOM_API_BASE` (défaut `https://api.usefathom.com/v1`).

Flux utilisateur : saisie clé → liste des sites → chargement des événements (optionnel) → sync initiale.

### Connecteur PostHog cockpit (product analytics)

Le connecteur PostHog (`/api/connectors/posthog/*`) synchronise **signups** (événement optionnel),
**activeUsers**, **mau**, **dau** sur 12 mois via la Query API (HogQL), plus un stream produit
(**activationRate**, **retentionD7**, **featureUsageTop**).

**Prérequis utilisateur** (pas de secret plateforme) :

1. Compte PostHog (US Cloud, EU Cloud ou self-hosted)
2. **Personal API Key** avec scopes `query:read`, `project:read`, `event_definition:read`
3. Project ID (Settings → Project)
4. Événements signup / activation optionnels (sinon métriques associées = 0)
5. SDK avec `identify()` pour des MAU/DAU fiables (`person_id`)

**Prérequis plateforme** : `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer la clé utilisateur.

Variable optionnelle : `POSTHOG_APP_HOST` (défaut `https://us.posthog.com`) si l'instance n'est pas saisie dans le dialog.

Flux utilisateur : clé + instance → sélection projet → événements optionnels → sync initiale. **Pas de mode démo.**

### Connecteur Mixpanel cockpit (product analytics)

Le connecteur Mixpanel (`/api/connectors/mixpanel/*`) synchronise **signups**, **activeUsers**, **mau**, **dau**
sur 12 mois via la Query API (segmentation), plus un stream produit (**activationRate**, **retentionD7**,
**featureUsageTop** via export JSONL).

**Prérequis utilisateur** (pas de secret plateforme) :

1. Compte Mixpanel (US, EU ou IN)
2. **Service Account** avec rôle Analyst ou Admin sur le projet ([doc officielle](https://docs.mixpanel.com/docs/admin/organizations-and-projects/service-accounts))
3. Project ID depuis l’URL (`mixpanel.com/project/{id}/…`)
4. Plan **Growth ou Enterprise** pour la Query API (MAU, rétention)
5. Événements activité / signup / activation configurables dans le dialog

**Prérequis plateforme** : `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer username + secret.

Variable optionnelle dev : `MIXPANEL_CONNECTOR_FALLBACK=1` (sync sans appels API live).

Flux utilisateur : Service Account + région → Project ID → événements → sync initiale.

### Connecteur Google Analytics cockpit (GA4 web analytics)

Le connecteur Google Analytics (`/api/connectors/google-analytics/*`) synchronise **signups** (événement configurable, défaut `sign_up`),
**trials** (événement optionnel), **activeUsers**, **mau** et **dau** sur 12 mois via la GA4 Data API v1beta.

**Prérequis plateforme** :

1. Projet Google Cloud avec **Google Analytics Data API** et **Google Analytics Admin API** activées
2. Client OAuth 2.0 (type Web) avec redirect URI `https://<domaine>/api/connectors/google-analytics/callback`
3. Scope OAuth : `https://www.googleapis.com/auth/analytics.readonly`
4. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer les tokens utilisateur

Variables : `GOOGLE_ANALYTICS_CLIENT_ID`, `GOOGLE_ANALYTICS_CLIENT_SECRET`, `GOOGLE_ANALYTICS_REDIRECT_URI`.

**Prérequis utilisateur** :

1. Propriété **GA4** (Universal Analytics non pris en charge)
2. Accès lecture à la propriété dans Google Analytics
3. Événement `sign_up` recommandé GA4, ou événement custom pour les signups
4. Événement trial optionnel (`begin_checkout`, `start_trial`, etc.)

Flux utilisateur : OAuth Google → sélection propriété GA4 → mapping événements signup/trial → sync initiale. **Pas de mode démo.**

### Connecteur Lemon Squeezy cockpit (paiements MoR)

Le connecteur Lemon Squeezy (`/api/connectors/lemon-squeezy/*`) synchronise **MRR**, **newMrr**,
**churnedMrr** et **clients actifs** sur 12 mois via l'API v1 (abonnements + prices).

**Prérequis utilisateur** (pas de secret plateforme) :

1. Compte [Lemon Squeezy](https://app.lemonsqueezy.com) avec au moins une boutique
2. Clé **API** créée dans Settings → API (mode test ou live)
3. Abonnements actifs sur la boutique sélectionnée

**Prérequis plateforme** : `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer la clé utilisateur.

Flux utilisateur : saisie clé API → validation → sélection boutique → sync initiale. Connexion **réelle uniquement** (pas de mode démo). Les montants sont exprimés dans la devise de la boutique (souvent USD), sans conversion FX automatique.

### Connecteur Paddle cockpit (paiements MoR)

Le connecteur Paddle (`/api/connectors/paddle/*`) synchronise **MRR**, **newMrr**,
**churnedMrr**, **clients actifs** et le stream **paiements** (échecs / récupérations) sur 12 mois via l'API Billing v1 (Metrics + abonnements).

**Prérequis utilisateur** (pas de secret plateforme) :

1. Compte [Paddle Billing](https://www.paddle.com/billing) avec abonnements actifs
2. Clé **API** créée dans Developer tools → Authentication (`pdl_live_apikey_…` ou `pdl_sdbx_apikey_…`)
3. Permissions minimales : `metrics.read`, `subscription.read`, `transaction.read`

**Prérequis plateforme** : `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer la clé utilisateur.

Flux utilisateur : saisie clé API → sync initiale. Connexion **réelle uniquement** (pas de mode démo). Les montants sont dans la devise du compte Paddle (devise principale du solde).

### Connecteur Freemius cockpit (paiements plugins WordPress)

Le connecteur Freemius (`/api/connectors/freemius/*`) synchronise **MRR**, **newMrr**,
**churnedMrr**, **clients actifs** et le stream **paiements** (échecs) sur 12 mois via l'API v1 (abonnements reconstruits localement).

**Prérequis utilisateur** (pas de secret plateforme) :

1. Compte [Freemius](https://freemius.com) avec un produit monétisé
2. **ID produit** visible dans l'URL du Developer Dashboard
3. **Bearer Token** généré dans Settings du produit → onglet API Token (scopé à ce produit)
4. Abonnements récurrents actifs (`billing_cycle` > 0)

**Prérequis plateforme** : `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer le token utilisateur.

Flux utilisateur : saisie ID produit + Bearer Token → validation → sync initiale. Connexion **réelle uniquement** (pas de mode démo). Les montants sont dans la devise des abonnements (USD, EUR, GBP).

### Connecteur Loops cockpit (email marketing)

Le connecteur Loops (`/api/connectors/loops/*`) synchronise **signups** et **conversions** sur 12 mois via **webhooks** (l'API REST Loops ne fournit pas d'historique analytics).

**Prérequis utilisateur** (pas de secret plateforme) :

1. Compte Loops avec clé API (Settings → API)
2. Webhook configuré dans Loops → Settings → Webhooks pointant vers  
   `{NEXT_PUBLIC_APP_URL}/api/connectors/loops/webhook?projectId=<uuid-projet>`
3. Events activés : `contact.created`, `contact.mailingList.subscribed` (+ `email.clicked` si pas de liste conversion)
4. Signing secret (`whsec_…`) collé dans le dialog SaaS-Radar
5. Liste mailing conversion optionnelle (sinon conversions = clics email uniques)

**Limitations** : pas d'historique rétroactif avant activation du webhook ; conversions ≠ Goals Loops (proxy liste mailing ou clics).

**Prérequis plateforme** : `CREDENTIALS_ENCRYPTION_KEY` + `NEXT_PUBLIC_APP_URL` (URL webhook affichée dans le dialog).

Flux utilisateur : clé API → config webhook → liste conversion (optionnel) → sync initiale.

### Connecteur Brevo cockpit (email marketing)

Le connecteur Brevo (`/api/connectors/brevo/*`) synchronise **signups** (nouveaux contacts sur 12 mois via API) et **conversions** selon deux modes :

- **Campagnes email** (défaut) : clics uniques agrégés par mois d'envoi (`GET /emailCampaigns`)
- **Liste cible** : webhook marketing `list_addition` + agrégation locale

**Prérequis** :

1. Clé API Brevo restreinte (Contacts lecture + Campagnes email lecture) — [app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
2. Mode liste : webhook outbound Brevo pointant vers  
   `{NEXT_PUBLIC_APP_URL}/api/connectors/brevo/webhook?projectId=…&token=…`

Doc détaillée : [docs/connectors/brevo.md](docs/connectors/brevo.md).

Flux utilisateur : clé API → mode conversions → webhook (si liste) → sync initiale.

### Connecteur Resend cockpit (email transactionnel)

Le connecteur Resend (`/api/connectors/resend/*`) synchronise **signups** (contacts Resend par `created_at` sur 12 mois via API) et **conversions** selon deux modes :

- **Clics email** (défaut) : webhook `email.clicked` + agrégation locale (pas d'historique rétroactif avant activation du webhook)
- **Segment** : contacts du segment sélectionné comptés par mois via `GET /contacts?segment_id=…`

**Prérequis** :

1. Clé API Resend **Full access** (pas Sending access seul) — [resend.com/api-keys](https://resend.com/api-keys)
2. Webhook Resend pointant vers  
   `{NEXT_PUBLIC_APP_URL}/api/connectors/resend/webhook?projectId=…`  
   avec événement `email.clicked` (obligatoire pour le mode clics)
3. Signing secret `whsec_…` copié depuis le dashboard webhook Resend

**Limitations** : compte transactionnel sans Audience → signups à 0 ; pas de backfill des clics avant configuration du webhook.

Flux utilisateur : clé API → config webhook → segment conversion (optionnel) → sync initiale.

### Connecteur Crisp cockpit (support client)

Le connecteur Crisp (`/api/connectors/crisp/*`) synchronise **activeUsers** (visiteurs uniques chatbox / mois) et un stream support : **tickets ouverts**, **temps de réponse**, **CSAT**.

**Prérequis plateforme** :

1. Plugin SaaS-Radar sur [Crisp Marketplace](https://marketplace.crisp.chat/)
2. `CRISP_PLUGIN_IDENTIFIER` + `CRISP_PLUGIN_KEY` dans `.env`
3. Scopes Production : `website:analytics`, `website:conversation:sessions`
4. `NEXT_PUBLIC_CRISP_INSTALL_URL` (lien d'installation affiché dans le dialog)

**Prérequis utilisateur** :

1. Installer le plugin SaaS-Radar sur le workspace Crisp
2. Copier le **Website ID** (Settings → Workspace Settings → Setup & Integrations)
3. Analytics Crisp (Essentials+) recommandé pour CSAT et temps de réponse

Doc détaillée : [docs/connectors/crisp.md](docs/connectors/crisp.md).

### Connecteur Intercom cockpit (support client)

Le connecteur Intercom (`/api/connectors/intercom/*`) synchronise **activeUsers** (contacts actifs / mois via `last_request_at`) et un stream support : **conversations ouvertes**, **temps de réponse médian**, **CSAT** (ratings 4–5 / total).

**Prérequis plateforme** :

1. App OAuth dans [Intercom Developer Hub](https://developers.intercom.com/)
2. `INTERCOM_CLIENT_ID`, `INTERCOM_CLIENT_SECRET`, `INTERCOM_REDIRECT_URI` dans `.env`
3. Scopes OAuth : **Read conversations**, **Read and list users and companies**
4. Redirect URI HTTPS : `{APP_URL}/api/connectors/intercom/callback`

**Prérequis utilisateur** :

1. Cliquer « Continuer avec Intercom » dans le marketplace Intégrations
2. Autoriser l'app sur le workspace Intercom
3. En cas de token révoqué (401), reconnecter via OAuth

### Connecteur HubSpot cockpit (CRM B2B)

Le connecteur HubSpot (`/api/connectors/hubspot/*`) alimente le stream CRM du module Clients : **pipelineValue**, **dealsWon**, **dealsLost** (30 derniers jours), **avgCycleDays** (90 derniers jours sur deals gagnés).

**Prérequis plateforme** :

1. App OAuth sur [HubSpot Developers](https://developers.hubspot.com/)
2. `HUBSPOT_CLIENT_ID`, `HUBSPOT_CLIENT_SECRET` dans `.env` (+ `NEXT_PUBLIC_APP_URL` ou `HUBSPOT_REDIRECT_URI`)
3. Scope OAuth : **crm.objects.deals.read**
4. Redirect URI HTTPS : `{APP_URL}/api/connectors/hubspot/callback`

**Prérequis utilisateur** :

1. Cliquer « Continuer avec HubSpot » dans le marketplace Intégrations
2. Autoriser l'app sur le portail HubSpot
3. En cas de token révoqué, reconnecter via OAuth

### Connecteur Pipedrive cockpit (CRM)

Le connecteur Pipedrive (`/api/connectors/pipedrive/*`) alimente le stream CRM du module Clients : **pipelineValue** (deals ouverts), **dealsWon**, **dealsLost** (totaux non archivés) et **avgCycleDays** (moyenne sur les 200 deals gagnés les plus récents).

**Prérequis plateforme** :

1. App OAuth sur [Pipedrive Developer Hub](https://developers.pipedrive.com/)
2. `PIPEDRIVE_CLIENT_ID`, `PIPEDRIVE_CLIENT_SECRET`, `PIPEDRIVE_REDIRECT_URI` dans `.env`
3. Scope OAuth : **deals:read** (scope `base` inclus automatiquement)
4. Redirect URI HTTPS : `{APP_URL}/api/connectors/pipedrive/callback`

**Prérequis utilisateur** :

1. Cliquer « Continuer avec Pipedrive » dans le marketplace Intégrations
2. Autoriser l'app sur le compte Pipedrive
3. En cas de token expiré (> 60 j sans refresh), reconnecter via OAuth

### Connecteur Slack cockpit (alertes)

Le connecteur Slack (`/api/connectors/slack/*`) pousse les **alertes cockpit** (MRR, churn, ROAS, intégrations) vers un canal Slack et alimente le stream **comms** : `alertsSent`, `lastAlertAt`.

**Prérequis plateforme** :

1. App Slack sur [api.slack.com/apps](https://api.slack.com/apps)
2. `SLACK_CLIENT_ID`, `SLACK_CLIENT_SECRET` dans `.env` (+ `NEXT_PUBLIC_APP_URL` ou `SLACK_REDIRECT_URI`)
3. Bot scopes : **chat:write**, **channels:read**, **groups:read**, **chat:write.public**
4. Redirect URI HTTPS : `{APP_URL}/api/connectors/slack/callback`

**Prérequis utilisateur** :

1. Cliquer « Continuer avec Slack » dans le marketplace Intégrations
2. Autoriser l'app sur le workspace
3. Choisir le canal d'alertes (inviter le bot si canal privé)
4. En cas de token révoqué, reconnecter via OAuth

### Connecteur Zendesk cockpit (support client)

Le connecteur Zendesk (`/api/connectors/zendesk/*`) synchronise **activeUsers** (end-users actifs / mois) et un stream support : **tickets ouverts**, **temps de réponse médian**, **CSAT** (legacy satisfaction ratings good/bad).

**Prérequis plateforme** :

1. Global OAuth client approuvé via le [Zendesk Marketplace portal](https://developer.zendesk.com/documentation/marketplace/building-a-marketplace-app/set-up-a-global-oauth-client/) (préfixe `zdg-` sur compte `d3v-*`)
2. `ZENDESK_CLIENT_ID`, `ZENDESK_CLIENT_SECRET`, `ZENDESK_REDIRECT_URI` dans `.env`
3. Scope OAuth : **read**
4. Redirect URI HTTPS : `{APP_URL}/api/connectors/zendesk/callback`
5. Client kind : **Confidential** (secret côté serveur)

**Prérequis utilisateur** :

1. Saisir le **subdomain** Zendesk (ex. `acme` pour `acme.zendesk.com`)
2. Cliquer « Continuer avec Zendesk » et autoriser l'app
3. CSAT legacy activé sur le compte pour alimenter le score (sinon `csat: 0`)
4. En cas de token expiré, reconnecter via OAuth

### Connecteur Qonto cockpit (finance)

Le connecteur Qonto (`/api/connectors/qonto/*`) alimente un stream **finance** : **trésorerie** (somme des comptes Qonto), **flux entrants/sortants** du mois courant et **runway** calculé depuis le burn net bancaire.

**Prérequis plateforme** :

1. App OAuth sur le [Qonto Developer Portal](https://docs.qonto.com/get-started/business-api/authentication/introduction)
2. `QONTO_CLIENT_ID`, `QONTO_CLIENT_SECRET`, `QONTO_REDIRECT_URI` dans `.env`
3. Scopes OAuth : **organization.read** et **offline_access**
4. Redirect URI HTTPS : `{APP_URL}/api/connectors/qonto/callback`

**Prérequis utilisateur** :

1. Cliquer « Connecter avec Qonto » dans le marketplace Intégrations
2. Autoriser l'app sur l'organisation Qonto (owner/admin pour les soldes complets)
3. En cas de token expiré (> 90 j sans refresh), reconnecter via OAuth

### Connecteur Pennylane cockpit (compta FR)

Le connecteur Pennylane (`/api/connectors/pennylane/*`) alimente un stream **accounting** : **CA comptable**, **charges comptables** et **TVA due** du mois en cours (balance générale API v2).

**Prérequis utilisateur**

1. Compte Pennylane plan Essential+ (onglet Développeurs visible)
2. Token API V2 en **lecture seule** avec permission « Balance générale » (`trial_balance:readonly`)
3. Génération : Paramètres → Connectivité → Développeurs → Générer un token API

**OAuth plateforme (optionnel)**

1. App enregistrée auprès de [Pennylane Partenariats](https://www.pennylane.com/fr/partenaires)
2. Variables `PENNYLANE_CLIENT_ID`, `PENNYLANE_CLIENT_SECRET`, `PENNYLANE_REDIRECT_URI`
3. Redirect URI : `{APP_URL}/api/connectors/pennylane/callback`

### Connecteur Abby cockpit (compta FR indie)

Le connecteur Abby (`/api/connectors/abby/*`) alimente un stream **accounting** : **CA comptable**, **charges comptables** et **TVA due** du mois en cours depuis [Abby.fr](https://abby.fr) (facturation + livre des achats).

**Prérequis utilisateur**

1. Compte Abby actif
2. Clé API générée dans [Paramètres → Intégrations](https://app.abby.fr/settings/integrations)
3. Factures et achats saisis dans Abby pour le mois courant

**Flux cockpit**

1. Marketplace Intégrations → Abby → coller la clé API
2. Validation via `GET /v2/company/me`, puis sync initiale
3. Re-sync manuelle ou auto (cron) via `/api/connectors/abby/sync`

Le CA comptable est agrégé depuis les endpoints billing Abby (`/v2/billings` ou `/v2/billing/statistics`) ; les charges depuis `/v3/purchaseRegister/list`. Si la lecture factures n'est pas disponible sur votre clé, le cockpit affiche les charges synchronisées et `revenueBooked = 0`.

## Sync automatique des connecteurs

Les connecteurs se synchronisent **sans action manuelle** :

- **Client** : à l’ouverture du cockpit et au retour sur l’onglet (si dernière sync > 1 h).
- **Serveur** : cron GitHub Actions toutes les 6 h sur tous les `connector_credentials`.

```bash
npm run connector-sync   # même logique que le cron CI (local / debug)
```

Automatisation : `.github/workflows/connector-sync.yml` (cron + `workflow_dispatch`).

Secrets CI requis (en plus de Supabase) : `CREDENTIALS_ENCRYPTION_KEY` (identique à la prod).

## Pipeline de sourcing

Découverte (Sonar Pro) → structuration (Gemini Flash) → validation Zod → upsert Supabase →
revalidation ISR. L'orchestration vit dans `src/lib/sourcing/run.ts` (réutilisée par le CLI
et l'API admin) ; `scripts/sourcing.ts` n'est qu'un wrapper d'arguments.

```bash
npm run sourcing -- --count=3                 # 3 fiches
npm run sourcing -- --count=3 --sector=finance
npm run sourcing:premium -- --count=2         # + enrichissement premium
npm run sourcing:test-a                       # test isolé de l'étape A (Sonar)
```

Automatisation : `.github/workflows/sourcing.yml` (cron hebdomadaire + déclenchement manuel).
Pilotage admin : `/admin/sourcing` (session + MFA ; secret machine pour CI uniquement).

## Tests & CI

```bash
npm test          # tests unitaires (node:test) des fonctions pures du sourcing
npm run lint
npx tsc --noEmit
```

`.github/workflows/ci.yml` exécute typecheck + lint + build sur chaque PR.

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing + carte mondiale interactive (données catalogue en runtime) |
| `/opportunities` | Flux filtrable (force-dynamic) |
| `/opportunities/[slug]` | Fiche détaillée (dynamique, champs premium gated serveur) |
| `/weekly` | Pick éditorial de la semaine (`weekly_pick`, géré par le sourcing) |
| `/simulator` | Simulateur MRR 24 mois |
| `/compare` | Comparateur 3 idées |
| `/login` | Connexion (magic link + Google OAuth) |
| `/mes-saas` | Espace builder : briefing, portfolio, favoris (protégé) |
| `/dashboard` | Redirige vers `/mes-saas` (alias permanent) |
| `/account` | Compte : email, plan, déconnexion (protégé) |
| `/admin` | Back-office modulaire (RBAC + MFA TOTP) : overview, sourcing v2, catalogue, users, billing, newsletter, markets, audit, sécurité |

## Données

Le catalogue provient de Supabase, alimenté par le pipeline de sourcing. `src/data/opportunities.ts`
ne sert plus que de fallback statique (build de la carte hors-ligne, seed legacy).
