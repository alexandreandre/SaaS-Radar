"use client";

import Link from "next/link";
import type { UserProject } from "@/lib/portfolio";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import { getInfraGates, type InfraGateId } from "@/lib/campaign/infra-gates";
import { Button } from "@/components/ui/button";
import { getCockpitHref } from "@/lib/cockpit-modules";
import type { ConnectorId } from "@/lib/connectors/types";

type CampaignInfraGatesProps = {
  project: UserProject;
  motion: GtmMotion;
  onConnectIntegration: (id: ConnectorId) => void;
  onConfirmGate: (gateId: InfraGateId) => void;
  onConfigureTracking: () => void;
  onEnableAttribution: () => void;
  onNavigate?: (anchorId: string) => void;
};

export function CampaignInfraGates({
  project,
  motion,
  onConnectIntegration,
  onConfirmGate,
  onConfigureTracking,
  onEnableAttribution,
  onNavigate,
}: CampaignInfraGatesProps) {
  const gates = getInfraGates(project, motion);

  return (
    <section id="infra-gates" className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold">Prérequis avant le lancement</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          On configure le minimum technique — pas de case à cocher, suivez les actions.
        </p>
      </div>
      <ul className="space-y-3">
        {gates.map((gate) => (
          <li
            key={gate.id}
            className="rounded-xl border border-border bg-card p-4 shadow-card"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span
                    className={
                      gate.satisfied
                        ? "text-emerald-600"
                        : "font-data text-[10px] uppercase text-muted-foreground"
                    }
                  >
                    {gate.satisfied ? "✓" : "À faire"}
                  </span>
                  {gate.label}
                  {gate.required ? (
                    <span className="text-[10px] font-normal text-amber-600">requis</span>
                  ) : null}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{gate.detail}</p>
              </div>
              {!gate.satisfied ? (
                <div className="flex flex-wrap gap-2">
                  {gate.id === "app_live" ? (
                    <Button type="button" size="sm" variant="outline" asChild>
                      <Link href={getCockpitHref(project.id, "build")}>Aller à Build</Link>
                    </Button>
                  ) : null}
                  {gate.id === "tracking_or_attribution" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onConnectIntegration("plausible")}
                      >
                        Connecter Plausible
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={onConfigureTracking}>
                        UTM enregistré
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={onEnableAttribution}>
                        Question attribution activée
                      </Button>
                    </>
                  ) : null}
                  {gate.id === "crm_or_tracker" ? (
                    <>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onConnectIntegration("hubspot")}
                      >
                        Connecter HubSpot
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onConfirmGate("crm_or_tracker")}
                      >
                        C&apos;est configuré
                      </Button>
                    </>
                  ) : null}
                  {gate.id === "email_auth" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onConfirmGate("email_auth")}
                    >
                      SPF/DKIM configurés
                    </Button>
                  ) : null}
                  {gate.id === "creative_ready" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => onNavigate?.("creation-content-studio")}
                    >
                      Valider les contenus
                    </Button>
                  ) : null}
                </div>
              ) : (
                <span className="text-xs text-emerald-700 dark:text-emerald-300">Prêt</span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
