"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IntegrationsMarketplace } from "@/components/cockpit/integrations/integrations-marketplace";
import { StackHealthBar } from "@/components/cockpit/stack-health-bar";
import type { CockpitModuleProps } from "@/components/cockpit/modules/module-props";

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
  const [oauthNotConfiguredBanner, setOauthNotConfiguredBanner] = useState(false);

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
    } else if (stripeError === "oauth_not_configured") {
      oauthHandled.current = true;
      setOauthNotConfiguredBanner(true);
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
      {oauthNotConfiguredBanner ? (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          La connexion Stripe en 1 clic n&apos;est pas encore activée sur cette instance. Contactez
          l&apos;administrateur ou utilisez une{" "}
          <strong>clé restreinte</strong> sur la carte Stripe.
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
