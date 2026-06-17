# Stripe App SaaS Radar — publication Marketplace

Application OAuth-only (pas d’UI dans le dashboard Stripe). Sert au bouton **Connecter avec Stripe** du cockpit SaaS Radar.

## Prérequis — Stripe CLI

### Option A — Homebrew (si Xcode CLT à jour)

```bash
brew install stripe/stripe-cli/stripe
stripe login
stripe plugin install apps
```

### Option B — Binaire direct (si `brew install` échoue sur CLT obsolètes)

```bash
# Depuis la racine du repo SaaS Radar
mkdir -p .bin
curl -sL -o /tmp/stripe-cli.tar.gz \
  "https://github.com/stripe/stripe-cli/releases/download/v1.42.13/stripe_1.42.13_mac-os_arm64.tar.gz"
tar -xzf /tmp/stripe-cli.tar.gz -C .bin && mv .bin/stripe_* .bin/stripe 2>/dev/null || mv stripe .bin/stripe
chmod +x .bin/stripe
export PATH="$PWD/.bin:$PATH"
stripe version
stripe login
stripe plugin install apps
```

Sur Intel Mac, remplacer `mac-os_arm64` par `mac-os_x86_64`.

## Upload

```bash
export PATH="$PWD/.bin:$PATH"   # si option B
cd stripe-app
stripe apps set distribution public
stripe apps upload
```

## External test (avant publication)

1. Dashboard Stripe → **Applications** → SaaS Radar → **External test**
2. Activer un test externe sur la version uploadée
3. Copier le lien **Test OAuth** (mode test) et le `client_id`
4. Mettre dans `.env.local` :
   ```env
   STRIPE_APP_CLIENT_ID=...
   ```

Optionnel si Stripe fournit un lien `chnlink_*` :
```env
STRIPE_APP_OAUTH_AUTHORIZE_URL=https://marketplace.stripe.com/oauth/v2/chnlink_xxx/authorize
```

## Publication Marketplace

1. Créer l’**app listing** (description, captures, politique de confidentialité)
2. **Marketplace install URL** : page SaaS Radar expliquant l’installation (ex. `https://saasradar.fr/aide/stripe`)
3. Soumettre pour **App Review** : https://docs.stripe.com/stripe-apps/review-requirements
4. Après approbation : **Apps → Settings** → copier `client_id` des liens Live/Test → `STRIPE_APP_CLIENT_ID` sur Vercel

## Variables plateforme SaaS Radar

```env
STRIPE_APP_CLIENT_ID=...
STRIPE_SECRET_KEY=sk_...
CREDENTIALS_ENCRYPTION_KEY=...
NEXT_PUBLIC_SITE_URL=https://saasradar.fr
```

## Redirect URI (obligatoire — HTTPS, pas de localhost)

Stripe **refuse** `http://localhost` dans le manifest. Avant `stripe apps upload`, édite `stripe-app.json` :

```json
"allowed_redirect_uris": [
  "https://TON-URL-HTTPS/api/connectors/stripe/callback"
]
```

### Tu n’as pas encore de domaine prod

**Option 1 — ngrok (le plus rapide pour tester OAuth en local)**

```bash
# Terminal 1
npm run dev

# Terminal 2 (installer ngrok une fois : brew install ngrok)
ngrok http 3000
```

Copie l’URL `https://xxxx.ngrok-free.app` puis :

1. Dans `stripe-app/stripe-app.json` → `allowed_redirect_uris` avec  
   `https://xxxx.ngrok-free.app/api/connectors/stripe/callback`
2. Dans `.env.local` :
   ```env
   NEXT_PUBLIC_SITE_URL=https://xxxx.ngrok-free.app
   STRIPE_APP_REDIRECT_URI=https://xxxx.ngrok-free.app/api/connectors/stripe/callback
   ```
3. `stripe apps upload` (version `0.0.3` si tu re-upload)

> L’URL ngrok gratuite change à chaque redémarrage → il faut mettre à jour le manifest et re-upload, ou prendre un domaine ngrok fixe.

**Option 2 — Preview Vercel (URL stable)**

```bash
npx vercel
```

Tu obtiens `https://saas-radar-xxx.vercel.app` → même principe dans le manifest + `.env` sur Vercel.

**Option 3 — Sans OAuth pour l’instant**

Le connecteur MRR fonctionne avec une **clé restreinte** `rk_test_…` (carte Stripe → « Utiliser une clé restreinte »). Pas besoin d’URL publique.

### Quand tu auras un vrai domaine

Remplace l’URI dans le manifest, bump la version (`0.0.3` → `0.0.4`), re-upload, puis soumets la review Marketplace.
