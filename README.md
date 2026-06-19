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

### Connecteur Vercel cockpit (build & déploiements)

Le connecteur Vercel (`/api/connectors/vercel/*`) alimente un **DevStream** : deploys 30j, état du dernier déploiement, taux de deploys OK et coûts infra optionnels (plan Pro+). Connexion possible depuis le **module Build** ou le **marketplace Intégrations** (credential unique).

**Prérequis plateforme** (setup une fois) :

1. Créer une **Integration** dans le dashboard développeur Vercel
2. Scopes OAuth : `user`, `project`, `deployment`, `team` (+ `billing` pour coûts infra Pro+)
3. Variables : `VERCEL_CLIENT_ID`, `VERCEL_CLIENT_SECRET`
4. `NEXT_PUBLIC_APP_URL` dérive le redirect (`/api/connectors/vercel/callback`) — `VERCEL_REDIRECT_URI` optionnel
5. `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer le token long-lived

**Flux utilisateur** : un clic → OAuth → connecté automatiquement si un seul projet (ou match repo GitHub). Sinon choix en un tap. **Démo** ou **URL manuelle** si OAuth plateforme indisponible.

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

Flux utilisateur : saisie clé + domaine → validation → sélection goal signup (optionnel) → sync initiale. Le mode **démo** reste disponible.

### Connecteur Lemon Squeezy cockpit (paiements MoR)

Le connecteur Lemon Squeezy (`/api/connectors/lemon-squeezy/*`) synchronise **MRR**, **newMrr**,
**churnedMrr** et **clients actifs** sur 12 mois via l'API v1 (abonnements + prices).

**Prérequis utilisateur** (pas de secret plateforme) :

1. Compte [Lemon Squeezy](https://app.lemonsqueezy.com) avec au moins une boutique
2. Clé **API** créée dans Settings → API (mode test ou live)
3. Abonnements actifs sur la boutique sélectionnée

**Prérequis plateforme** : `CREDENTIALS_ENCRYPTION_KEY` pour chiffrer la clé utilisateur.

Flux utilisateur : saisie clé API → validation → sélection boutique → sync initiale. Connexion **réelle uniquement** (pas de mode démo). Les montants sont exprimés dans la devise de la boutique (souvent USD), sans conversion FX automatique.

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

Flux utilisateur : clé API → config webhook → liste conversion (optionnel) → sync initiale. Le mode **démo** reste disponible.

### Connecteur Brevo cockpit (email marketing)

Le connecteur Brevo (`/api/connectors/brevo/*`) synchronise **signups** (nouveaux contacts sur 12 mois via API) et **conversions** selon deux modes :

- **Campagnes email** (défaut) : clics uniques agrégés par mois d'envoi (`GET /emailCampaigns`)
- **Liste cible** : webhook marketing `list_addition` + agrégation locale

**Prérequis** :

1. Clé API Brevo restreinte (Contacts lecture + Campagnes email lecture) — [app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
2. Mode liste : webhook outbound Brevo pointant vers  
   `{NEXT_PUBLIC_APP_URL}/api/connectors/brevo/webhook?projectId=…&token=…`

Doc détaillée : [docs/connectors/brevo.md](docs/connectors/brevo.md).

Flux utilisateur : clé API → mode conversions → webhook (si liste) → sync initiale. Le mode **démo** reste disponible.

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
