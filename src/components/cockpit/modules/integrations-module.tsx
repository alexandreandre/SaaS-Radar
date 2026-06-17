"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IntegrationsMarketplace } from "@/components/cockpit/integrations/integrations-marketplace";
import { StackHealthBar } from "@/components/cockpit/stack-health-bar";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

function stripeErrorMessage(code: string | null): string | null {
  switch (code) {
    case "oauth_not_configured":
      return "L'app Stripe SaaS Radar n'est pas configurée sur cette instance (STRIPE_APP_CLIENT_ID manquant). Utilisez une clé restreinte en attendant.";
    case "encryption":
      return "Le chiffrement des credentials n'est pas configuré côté serveur (CREDENTIALS_ENCRYPTION_KEY).";
    case "permissions":
      return "L'app Stripe n'a pas les permissions Analytics suffisantes. Vérifiez le manifest et réinstallez l'app.";
    case "token":
      return "Échec de l'échange OAuth Stripe. Vérifiez que STRIPE_SECRET_KEY correspond au compte qui possède l'app Stripe.";
    case "denied":
      return "Connexion Stripe refusée.";
    case "unauthorized":
    case "invalid_state":
      return "Session OAuth invalide — réessayez depuis le cockpit.";
    default:
      return code ? `Erreur Stripe (${code}).` : null;
  }
}

function cleanStripeSearchParams(params: URLSearchParams): string {
  const next = new URLSearchParams(params.toString());
  next.delete("stripe_connected");
  next.delete("stripe_error");
  const qs = next.toString();
  return qs ? `?${qs}` : "";
}

export function IntegrationsModule({
  project,
  data,
  onConnectIntegration,
  onSyncIntegration,
  onDisconnectIntegration,
  onModuleChange,
}: CockpitModuleProps) {
  const integrations = project.integrations ?? [];
  const searchParams = useSearchParams();
  const router = useRouter();
  const oauthHandled = useRef(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  useEffect(() => {
    if (oauthHandled.current) return;
    const stripeConnected = searchParams.get("stripe_connected");
    const stripeError = searchParams.get("stripe_error");

    if (stripeConnected === "1") {
      oauthHandled.current = true;
      void onConnectIntegration("stripe", { mode: "real" })
        .then(() => {
          setSuccessMessage("Stripe connecté — MRR synchronisé.");
        })
        .catch(() => {})
        .finally(() => {
          router.replace(cleanStripeSearchParams(searchParams), { scroll: false });
        });
    } else if (stripeError) {
      oauthHandled.current = true;
      setBannerMessage(stripeErrorMessage(stripeError));
      router.replace(cleanStripeSearchParams(searchParams), { scroll: false });
    }
  }, [searchParams, onConnectIntegration, router]);

  useEffect(() => {
    if (!successMessage) return;
    const timer = window.setTimeout(() => setSuccessMessage(null), 8000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  return (
    <div className="space-y-6">
      {successMessage ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-900 dark:text-emerald-100">
          {successMessage}
        </p>
      ) : null}
      {bannerMessage ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          {bannerMessage}
        </p>
      ) : null}
      <StackHealthBar stackHealth={data.stackHealth} onModuleChange={onModuleChange} compact />
      <IntegrationsMarketplace
        projectId={project.id}
        integrations={integrations}
        onConnect={onConnectIntegration}
        onSync={onSyncIntegration}
        onDisconnect={onDisconnectIntegration}
      />
    </div>
  );
}
