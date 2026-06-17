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
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Lecture publique du catalogue + auth (session SSR, magic link, OAuth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Écriture serveur (sourcing, seed) — jamais côté client |
| `OPENROUTER_API_KEY` | Pipeline de sourcing IA |
| `SOURCING_MIN_SCORE` | Score plancher (0-100) sous lequel une fiche est rejetée |
| `SOURCING_REVALIDATE_URL` + `REVALIDATE_SECRET` | Revalidation ISR prod après sourcing |
| `ADMIN_SOURCING_SECRET` | Déclenchement protégé via `/api/admin/sourcing` |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | API Stripe + vérification de signature du webhook |
| `STRIPE_PRICE_BUILDER_MONTHLY/YEARLY`, `STRIPE_PRICE_PRO_MONTHLY/YEARLY` | Mapping `price_id → plan` |
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
