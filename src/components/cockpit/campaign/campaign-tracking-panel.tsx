"use client";

import type { UserProject } from "@/lib/portfolio";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { CampaignSmartGoal } from "@/lib/campaign/kits";
import { Button } from "@/components/ui/button";
import { isCampaignLive } from "@/lib/campaign/journey";

type CampaignTrackingPanelProps = {
  project: UserProject;
  stage: AcquisitionStage;
  smartGoal?: CampaignSmartGoal;
  weeklyCheckInCount: number;
  onModuleChange: (module: CockpitModuleId) => void;
  onConnectIntegration: (id: string) => void;
};

export function CampaignTrackingPanel({
  project,
  stage,
  smartGoal,
  weeklyCheckInCount,
  onModuleChange,
}: CampaignTrackingPanelProps) {
  const live = isCampaignLive(project);
  const hasAnalytics = (project.integrations ?? []).some(
    (i) =>
      ["plausible", "posthog", "google-analytics", "fathom"].includes(i.connectorId) &&
      (i.status === "connected" || i.status === "demo"),
  );

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-card">
      <div className="mb-4">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">Étape 5</p>
        <h3 className="mt-1 text-lg font-semibold">Suivi & progression</h3>
      </div>

      {smartGoal ? (
        <div className="mb-4 rounded-lg border border-border bg-muted/20 p-4">
          <p className="text-sm font-medium">{smartGoal.label}</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Cible : {smartGoal.targetValue} · Horizon {smartGoal.horizonDays} j
          </p>
        </div>
      ) : null}

      <ul className="space-y-2 text-sm text-muted-foreground">
        <li>
          {hasAnalytics
            ? "✓ Analytics connecté — signups suivis automatiquement."
            : "○ Connectez Plausible ou GA4 pour suivre les signups."}
        </li>
        <li>
          {weeklyCheckInCount > 0
            ? `✓ ${weeklyCheckInCount} check-in(s) enregistré(s).`
            : "○ Faites votre premier check-in hebdo ci-dessous."}
        </li>
        <li>
          {live
            ? "✓ Actions exécutées + mesure active."
            : "○ Cochez des actions et configurez le tracking."}
        </li>
      </ul>

      {stage === "scale" ? (
        <div className="mt-4 rounded-lg border border-primary/25 bg-primary/5 p-4">
          <p className="text-sm font-medium">Dashboard ROAS & funnel</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Campagne prépare le plan — Acquisition mesure les chiffres.
          </p>
          <Button type="button" size="sm" className="mt-3" onClick={() => onModuleChange("acquisition")}>
            Ouvrir Acquisition
          </Button>
        </div>
      ) : null}
    </section>
  );
}
