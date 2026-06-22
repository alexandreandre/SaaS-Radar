"use client";

import type { CampaignPlaybookId } from "@/lib/campaign/playbooks";
import type { UserProject } from "@/lib/portfolio";
import { resolveDistributionGuideSteps } from "@/lib/campaign/distribution-guide-data";
import { CampaignGuidedStep } from "@/components/cockpit/campaign/campaign-guided-step";
import { Button } from "@/components/ui/button";

type CampaignDistributionGuideProps = {
  project: UserProject;
  playbookId: CampaignPlaybookId;
  kitSteps?: string[];
  channelHook?: string;
  onConfirmStep: (stepIndex: number) => void;
};

export function CampaignDistributionGuide({
  project,
  playbookId,
  kitSteps,
  channelHook,
  onConfirmStep,
}: CampaignDistributionGuideProps) {
  const steps = resolveDistributionGuideSteps(playbookId, kitSteps);
  if (steps.length === 0) return null;

  const progress = project.campaignSetup?.distributionProgress ?? {};
  const doneCount = steps.filter((_, i) => progress[`dist-${i}`]?.done).length;

  return (
    <section id="diffusion-guide" className="space-y-3">
      <div className="rounded-xl border border-border bg-card px-5 py-4 shadow-card">
        <h4 className="text-sm font-semibold">Guide diffusion canal</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          Validez chaque action une fois réalisée dans votre outil ads / CMS.
        </p>
        {channelHook ? (
          <p className="mt-2 rounded-lg border border-border/60 bg-muted/10 px-3 py-2 text-xs text-muted-foreground">
            Accroche validée : <span className="font-medium text-foreground">{channelHook}</span>
          </p>
        ) : null}
        <p className="mt-2 text-xs text-muted-foreground">
          {doneCount}/{steps.length} étapes validées
        </p>
      </div>

      {steps.map((step, index) => {
        const done = Boolean(progress[`dist-${index}`]?.done);
        return (
          <CampaignGuidedStep
            key={index}
            step={index + 1}
            title={step}
            done={done}
            defaultOpen={!done && index === steps.findIndex((_, i) => !progress[`dist-${i}`]?.done)}
          >
            <div className="flex flex-wrap gap-2">
              {!done ? (
                <Button type="button" size="sm" onClick={() => onConfirmStep(index)}>
                  C&apos;est fait
                </Button>
              ) : (
                <span className="text-xs text-emerald-700 dark:text-emerald-300">Validé</span>
              )}
            </div>
          </CampaignGuidedStep>
        );
      })}
    </section>
  );
}
