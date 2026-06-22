"use client";

import type { UserProject } from "@/lib/portfolio";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { getCampaignTool } from "@/lib/campaign/tools";
import { getConnector } from "@/lib/connectors/registry";
import {
  getActiveSequence,
  getSequenceStepsWithProgress,
  sequenceProgressPercent,
} from "@/lib/campaign/sequences";
import { resolvePlaybookLabel, type CampaignPlaybookId } from "@/lib/campaign/playbooks";

type CampaignSequenceBoardProps = {
  project: UserProject;
  onToggleStep: (stepId: string) => void;
  onOpenTool?: (id: string, url?: string) => void;
};

export function CampaignSequenceBoard({
  project,
  onToggleStep,
  onOpenTool,
}: CampaignSequenceBoardProps) {
  const setup = project.campaignSetup;
  const sequence = getActiveSequence(setup);
  const steps = getSequenceStepsWithProgress(setup);
  const pct = sequenceProgressPercent(setup);

  if (!sequence || steps.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-card">
        Validez vos fondations pour générer la séquence de la semaine.
      </p>
    );
  }

  return (
    <section className="rounded-xl border border-border bg-card shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4">
        <div>
          <p className="font-data text-[10px] uppercase tracking-data text-primary">Séquence</p>
          <h3 className="text-sm font-semibold">{sequence.label}</h3>
        </div>
        <span className="text-sm text-muted-foreground">{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ol className="space-y-2 p-5">
        {steps.map((step) => (
          <li
            key={step.id}
            className="flex items-start gap-3 rounded-lg border border-border p-3"
          >
            <Checkbox
              checked={step.done}
              onCheckedChange={() => onToggleStep(step.id)}
              className="mt-0.5"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-medium uppercase text-muted-foreground">J{step.day}</p>
              <p
                className={
                  step.done ? "text-sm text-muted-foreground line-through" : "text-sm font-medium"
                }
              >
                {step.label}
              </p>
              {step.detail ? (
                <p className="mt-0.5 text-xs text-muted-foreground">{step.detail}</p>
              ) : null}
              {step.playbookHint ? (
                <p className="mt-1 text-[10px] text-primary">
                  {resolvePlaybookLabel(step.playbookHint as CampaignPlaybookId)}
                </p>
              ) : null}
              <div className="mt-2 flex flex-wrap gap-2">
                {step.toolId ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      onOpenTool?.(step.toolId!, getCampaignTool(step.toolId!)?.deepLink)
                    }
                  >
                    {getCampaignTool(step.toolId!)?.name ?? step.toolId}
                  </Button>
                ) : null}
                {step.connectorId ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => onOpenTool?.(step.connectorId!, undefined)}
                  >
                    {getConnector(step.connectorId!)?.name ?? step.connectorId}
                  </Button>
                ) : null}
                {step.externalUrl ? (
                  <Button type="button" size="sm" variant="ghost" asChild>
                    <a href={step.externalUrl} target="_blank" rel="noopener noreferrer">
                      Ouvrir
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
