"use client";

import type { UserProject } from "@/lib/portfolio";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import { getInfraGates } from "@/lib/campaign/infra-gates";
import { Checkbox } from "@/components/ui/checkbox";
import type { InfraGateId } from "@/lib/campaign/infra-gates";

type CampaignInfraGatesProps = {
  project: UserProject;
  motion: GtmMotion;
  onToggleGate: (gateId: InfraGateId) => void;
};

export function CampaignInfraGates({ project, motion, onToggleGate }: CampaignInfraGatesProps) {
  const gates = getInfraGates(project, motion);
  const manualGates: InfraGateId[] = ["crm_or_tracker", "email_auth", "creative_ready"];

  return (
    <section id="infra-gates" className="rounded-xl border border-border bg-card p-5 shadow-card">
      <h3 className="text-sm font-semibold">Prérequis infra</h3>
      <p className="mt-1 text-xs text-muted-foreground">
        À valider avant la diffusion — tracking, CRM et assets.
      </p>
      <ul className="mt-4 space-y-3">
        {gates.map((gate) => (
          <li key={gate.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
            {manualGates.includes(gate.id) && !gate.satisfied ? (
              <Checkbox
                checked={Boolean(project.campaignSetup?.infraGates?.[gate.id])}
                onCheckedChange={() => onToggleGate(gate.id)}
                className="mt-0.5"
              />
            ) : (
              <span className="mt-0.5 text-sm">{gate.satisfied ? "✓" : "○"}</span>
            )}
            <div>
              <p className="text-sm font-medium">
                {gate.label}
                {gate.required ? (
                  <span className="ml-1 text-[10px] text-amber-600">requis</span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">{gate.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
