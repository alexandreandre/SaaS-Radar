"use client";

import { Plug } from "lucide-react";
import type { UserProject } from "@/lib/portfolio";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { MarketingProfile } from "@/lib/campaign/tools";
import {
  getDistributionTargetsForChannel,
} from "@/lib/campaign/tools";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { ConnectorId } from "@/lib/connectors/types";
import { Button } from "@/components/ui/button";

type CampaignDistributionGuideProps = {
  project: UserProject;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  distributionSteps?: string[];
  onConnectIntegration: (
    connectorId: ConnectorId,
  ) => Promise<void>;
  onModuleChange: (module: CockpitModuleId) => void;
  onAcknowledge: () => void;
};

function isConnected(project: UserProject, connectorId: ConnectorId): boolean {
  return (project.integrations ?? []).some(
    (i) =>
      i.connectorId === connectorId &&
      (i.status === "connected" || i.status === "demo"),
  );
}

export function CampaignDistributionGuide({
  project,
  channel,
  profile,
  distributionSteps,
  onConnectIntegration,
  onModuleChange,
  onAcknowledge,
}: CampaignDistributionGuideProps) {
  const targets = getDistributionTargetsForChannel(channel, profile);
  const adTargets = targets.filter((t) => t.category === "ads");

  const defaultSteps =
    profile === "organic"
      ? [
          "Publiez votre premier contenu sur le canal choisi",
          "Envoyez votre séquence email ou vos DMs",
          "Suivez les réponses dans votre boîte mail ou CRM",
        ]
      : [
          "Importez vos créas dans la plateforme ads",
          "Définissez un budget test (20–50 €/jour)",
          "Lancez la campagne et attendez 48h avant d'itérer",
        ];

  const steps = distributionSteps?.length ? distributionSteps : defaultSteps;

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <p className="font-data text-[10px] uppercase tracking-data text-primary">
        Étape 3 — Diffusion
      </p>
      <h3 className="mt-1 text-lg font-semibold">Publier votre campagne</h3>

      {adTargets.length > 0 ? (
        <div className="mt-4 space-y-2">
          {adTargets.map((target) => {
            const connected = isConnected(project, target.connectorId);
            return (
              <div
                key={target.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/10 px-3 py-2"
              >
                <div>
                  <p className="text-sm font-medium">{target.name}</p>
                  <p className="text-xs text-muted-foreground">{target.pitch}</p>
                </div>
                {connected ? (
                  <span className="text-xs text-emerald-600">Connecté</span>
                ) : (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void onConnectIntegration(target.connectorId)}
                  >
                    <Plug className="h-3.5 w-3.5" />
                    Connecter
                  </Button>
                )}
              </div>
            );
          })}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="text-muted-foreground"
            onClick={() => onModuleChange("integrations")}
          >
            Voir tous les connecteurs
          </Button>
        </div>
      ) : null}

      <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm text-muted-foreground">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>

      <div className="mt-4">
        <Button type="button" size="sm" onClick={onAcknowledge}>
          Campagne lancée — passer à la mesure
        </Button>
      </div>
    </section>
  );
}
