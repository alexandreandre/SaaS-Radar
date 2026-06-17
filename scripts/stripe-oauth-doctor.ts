/**
 * Vérifie la config OAuth Stripe Apps et affiche les actions manquantes.
 * Usage : npx tsx scripts/stripe-oauth-doctor.ts
 */
import {
  getStripeAppAuthUrl,
  getStripeOAuthRedirectUri,
  isStripeOAuthConfigured,
  parseStripeOAuthInstallLink,
  readStripeOAuthEnv,
} from "../src/lib/connectors/stripe/oauth-config.ts";

const DASHBOARD_APP_URL =
  "https://dashboard.stripe.com/apps/com.saasradar.connect";

function maskKey(key: string | undefined): string {
  if (!key) return "(absent)";
  if (key.length <= 12) return "***";
  return `${key.slice(0, 12)}…${key.slice(-4)}`;
}

function accountFromSk(sk: string | undefined): string | null {
  if (!sk?.startsWith("sk_")) return null;
  const parts = sk.split("_");
  return parts[2]?.slice(0, 8) ?? null;
}

function main(): void {
  console.log("── Diagnostic OAuth Stripe Apps (SaaS Radar) ──\n");

  const oauthEnv = readStripeOAuthEnv();
  const installLink = process.env.STRIPE_APP_OAUTH_INSTALL_LINK?.trim();
  const appSk = process.env.STRIPE_APP_SECRET_KEY?.trim() ?? process.env.STRIPE_SECRET_KEY?.trim();
  const billingSk = process.env.STRIPE_SECRET_KEY?.trim();

  console.log("OAuth configuré :", isStripeOAuthConfigured() ? "oui" : "NON");
  console.log("Redirect URI    :", getStripeOAuthRedirectUri());
  console.log("Client ID       :", oauthEnv.clientId ?? "(manquant)");
  console.log("Authorize base  :", oauthEnv.authorizeBaseUrl ?? "(défaut marketplace)");
  console.log("STRIPE_APP_SK   :", maskKey(appSk));
  console.log("STRIPE_SECRET_KEY (billing) :", maskKey(billingSk));

  if (installLink) {
    const parsed = parseStripeOAuthInstallLink(installLink);
    console.log(
      "Install link    :",
      parsed ? "valide" : "INVALIDE — recopier le lien Test OAuth complet",
    );
  } else if (!oauthEnv.clientId) {
    console.log("Install link    : (absent)");
  }

  const appAcct = accountFromSk(appSk);
  const billingAcct = accountFromSk(billingSk);
  if (appAcct && billingAcct && appAcct !== billingAcct) {
    console.log(
      "\n⚠ Comptes Stripe différents : billing vs app OAuth.",
    );
    console.log(
      "  → Définis STRIPE_APP_SECRET_KEY avec la sk_test du compte Alex Intel (propriétaire de l'app).",
    );
  }

  const issues: string[] = [];

  if (!process.env.CREDENTIALS_ENCRYPTION_KEY?.trim()) {
    issues.push("CREDENTIALS_ENCRYPTION_KEY manquant");
  }
  if (!isStripeOAuthConfigured()) {
    issues.push(
      "STRIPE_APP_OAUTH_INSTALL_LINK ou STRIPE_APP_CLIENT_ID manquant",
    );
  }
  if (installLink && !parseStripeOAuthInstallLink(installLink)) {
    issues.push("STRIPE_APP_OAUTH_INSTALL_LINK mal formé");
  }
  if (!appSk) {
    issues.push("STRIPE_APP_SECRET_KEY ou STRIPE_SECRET_KEY manquant");
  }
  const redirect = getStripeOAuthRedirectUri();
  if (!redirect.startsWith("https://")) {
    issues.push("redirect_uri doit être HTTPS (voir stripe-app.json)");
  }

  if (issues.length > 0) {
    console.log("\n── Problèmes ──");
    for (const issue of issues) console.log(`  • ${issue}`);
  } else {
    console.log("\n── URL OAuth générée (aperçu) ──");
    try {
      const url = getStripeAppAuthUrl("doctor-preview-state");
      console.log(url.slice(0, 120) + "…");
      console.log("\n✓ Config prête — teste sur", oauthEnv.siteUrl ?? redirect);
    } catch (err) {
      console.log("Erreur génération URL :", err instanceof Error ? err.message : err);
    }
  }

  console.log("\n── Étapes dashboard ──");
  console.log("1. Ouvre :", DASHBOARD_APP_URL);
  console.log("2. Onglet « External test » → lien Test OAuth");
  console.log("   (app private : essaie aussi « Settings » ou active External test sur v0.0.3)");
  console.log("3. Copie le lien **Test OAuth** COMPLET dans .env.local :");
  console.log("   STRIPE_APP_OAUTH_INSTALL_LINK=https://marketplace.stripe.com/oauth/v2/chnlink_…/authorize?client_id=ca_…");
  console.log("4. Redémarre npm run dev, teste sur l'URL HTTPS (pas localhost)");
  console.log("   redirect autorisé :", redirect);
}

main();
