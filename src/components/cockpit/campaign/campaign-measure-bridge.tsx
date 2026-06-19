"use client";

import { BarChart3, TrendingUp } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { ConnectorId } from "@/lib/connectors/types";
import { Button } from "@/components/ui/button";
import { getDistributionTargetsForChannel } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";

type CampaignMeasureBridgeProps = {
  project: UserProject;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  onModuleChange: (module: CockpitModuleId) => void;
  onConnectIntegration: (connectorId: ConnectorId) => Promise<void>;
  onAcknowledge: () => void;
};

function isConnected(project: UserProject, connectorId: ConnectorId): boolean {
  return (project.integrations ?? []).some(
    (i) =>
      i.connectorId === connectorId &&
      (i.status === "connected" || i.status === "demo"),
  );
}

export function CampaignMeasureBridge({
  project,
  channel,
  profile,
  onModuleChange,
  onConnectIntegration,
  onAcknowledge,
}: CampaignMeasureBridgeProps) {
  const analytics = getDistributionTargetsForChannel(channel, profile).filter(
    (t) => t.category === "analytics",
  );
  const plausibleConnected = isConnected(project, "plausible");
  const posthogConnected = isConnected(project, "posthog");
  const hasAnalytics = plausibleConnected || posthogConnected;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">
        Étape 4 — Mesure
      </p>
      <h3 className="mt-1 text-lg font-semibold">Suivre vos résultats</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        Branchez l&apos;analytics et consultez le ROAS dans Acquisition.
      </p>

      <div className="mt-4 space-y-2">
        {analytics.map((target) => {
          const connected = isConnected(project, target.connectorId);
          return (
            <div
              key={target.id}
              className="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
            >
              <span className="text-sm">{target.name}</span>
              {connected ? (
                <span className="text-xs text-emerald-600">Connecté</span>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => void onConnectIntegration(target.connectorId)}
                >
                  Connecter
                </Button>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" onClick={() => onModuleChange("acquisition")}>
          <TrendingUp className="h-4 w-4" />
          Ouvrir Acquisition
        </Button>
        <Button type="button" variant="outline" onClick={() => onModuleChange("produit")}>
          <BarChart3 className="h-4 w-4" />
          Voir Produit
        </Button>
      </div>

      {!hasAnalytics ? (
        <p className="mt-3 text-xs text-muted-foreground">
          Connectez Plausible ou PostHog pour suivre signups et conversions.
        </p>
      ) : (
        <div className="mt-3">
          <Button type="button" variant="ghost" size="sm" onClick={onAcknowledge}>
            Mesure en place
          </Button>
        </div>
      )}
    </section>
  );
}
