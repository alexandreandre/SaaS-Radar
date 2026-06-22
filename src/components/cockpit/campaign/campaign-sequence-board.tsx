"use client";

import type { UserProject } from "@/lib/portfolio";
import { Button } from "@/components/ui/button";
import { getCampaignTool } from "@/lib/campaign/tools";
import { getConnector } from "@/lib/connectors/registry";
import {
  getActiveSequence,
  getSequenceStepsWithProgress,
  sequenceProgressPercent,
} from "@/lib/campaign/sequences";
import { resolvePlaybookLabel, type CampaignPlaybookId } from "@/lib/campaign/playbooks";
import { CampaignGuidedStep } from "@/components/cockpit/campaign/campaign-guided-step";

type CampaignSequenceBoardProps = {
  project: UserProject;
  onConfirmStep: (stepId: string) => void;
  onOpenTool?: (id: string, url?: string) => void;
};

export function CampaignSequenceBoard({
  project,
  onConfirmStep,
  onOpenTool,
}: CampaignSequenceBoardProps) {
  const setup = project.campaignSetup;
  const sequence = getActiveSequence(setup);
  const steps = getSequenceStepsWithProgress(setup);
  const pct = sequenceProgressPercent(setup);

  if (!sequence || steps.length === 0) {
    return (
      <p className="rounded-xl border border-border bg-card p-5 text-sm text-muted-foreground shadow-card">
        Validez vos fondations et contenus pour générer la séquence de lancement.
      </p>
    );
  }

  return (
    <section id="diffusion-sequence" className="space-y-3">
      <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-card">
        <p className="font-data text-[10px] uppercase tracking-data text-primary">Phase 3 · Diffusion</p>
        <h3 className="mt-1 text-lg font-semibold">Séquence de lancement</h3>
        <p className="mt-1 text-sm text-muted-foreground">{sequence.label}</p>
        <p className="mt-2 text-xs text-muted-foreground">
          {steps.filter((s) => s.done).length}/{steps.length} étapes validées · {pct}%
        </p>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {steps.map((step, index) => (
        <CampaignGuidedStep
          key={step.id}
          id={`diffusion-sequence-${step.id}`}
          step={index + 1}
          title={`J${step.day} · ${step.label}`}
          done={step.done}
          defaultOpen={!step.done && index === steps.findIndex((s) => !s.done)}
        >
          {step.detail ? (
            <p className="text-sm text-muted-foreground">{step.detail}</p>
          ) : null}
          {step.playbookHint ? (
            <p className="mt-1 text-[10px] text-primary">
              {resolvePlaybookLabel(step.playbookHint as CampaignPlaybookId)}
            </p>
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2">
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
            {!step.done ? (
              <Button type="button" size="sm" onClick={() => onConfirmStep(step.id)}>
                C&apos;est fait
              </Button>
            ) : (
              <span className="self-center text-xs text-emerald-700 dark:text-emerald-300">
                Validé
              </span>
            )}
          </div>
        </CampaignGuidedStep>
      ))}
    </section>
  );
}
