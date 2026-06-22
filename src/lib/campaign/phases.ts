import type { UserProject } from "@/lib/portfolio";
import type { CampaignSetup } from "@/lib/campaign/kits";
import { hasCampaignKit } from "@/lib/campaign/kits";
import { sequenceProgressPercent } from "@/lib/campaign/sequences";
import { canAccessDiffusionPhase } from "@/lib/campaign/infra-gates";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";

export type CampaignPhaseId = "foundations" | "creation" | "diffusion" | "measure";

export const CAMPAIGN_PHASES: { id: CampaignPhaseId; label: string; step: number }[] = [
  { id: "foundations", label: "Fondations", step: 1 },
  { id: "creation", label: "Création", step: 2 },
  { id: "diffusion", label: "Diffusion", step: 3 },
  { id: "measure", label: "Mesure", step: 4 },
];

export function isFoundationsComplete(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  return Boolean(
    setup.smartGoal &&
      setup.primaryChannel &&
      setup.icpSummary?.trim() &&
      (setup.strategyBrief?.trim() || setup.positioning?.trim()),
  );
}

export function isCreationComplete(project: UserProject): boolean {
  const setup = project.campaignSetup;
  if (!setup) return false;
  return hasCampaignKit(project) || (setup.assetChecklist?.filter(Boolean).length ?? 0) >= 2;
}

export function isDiffusionComplete(project: UserProject): boolean {
  const setup = project.campaignSetup;
  if (!setup) return false;
  const seqDone = sequenceProgressPercent(setup) >= 30;
  const distributionOk = Boolean(setup.distributionAcknowledgedAt);
  return seqDone || distributionOk || setup.actionItems.some((a) => a.phase === "execute" && a.done);
}

export function isMeasureComplete(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  return (setup.weeklyCheckIns?.length ?? 0) > 0 || Boolean(setup.retrospective);
}

export function resolveCampaignPhase(
  project: UserProject,
  stage: AcquisitionStage,
): CampaignPhaseId {
  const setup = project.campaignSetup;
  if (!isFoundationsComplete(setup)) return "foundations";
  if (!isCreationComplete(project)) return "creation";
  const channel = setup?.primaryChannel ?? "linkedin";
  const motion = recommendGtmMotion(stage, channel, setup);
  if (!canAccessDiffusionPhase(project, motion)) return "creation";
  if (!isDiffusionComplete(project)) return "diffusion";
  if (!isMeasureComplete(setup)) return "measure";
  return "measure";
}

export function canAdvanceToPhase(
  project: UserProject,
  target: CampaignPhaseId,
  stage: AcquisitionStage,
): { ok: boolean; reason?: string } {
  const setup = project.campaignSetup;
  const channel = setup?.primaryChannel ?? ("linkedin" as ExtendedChannelKey);
  const motion = recommendGtmMotion(stage, channel, setup);

  if (target === "foundations") return { ok: true };
  if (!isFoundationsComplete(setup)) {
    return { ok: false, reason: "Validez objectif, ICP et message." };
  }
  if (target === "creation") return { ok: true };
  if (!isCreationComplete(project)) {
    return { ok: false, reason: "Générez un kit ou validez la checklist assets." };
  }
  if (target === "diffusion") {
    if (!canAccessDiffusionPhase(project, motion)) {
      return { ok: false, reason: "Complétez les prérequis infra (tracking, CRM)." };
    }
    return { ok: true };
  }
  if (target === "measure") {
    if (!isDiffusionComplete(project)) {
      return { ok: false, reason: "Exécutez au moins une étape de la séquence." };
    }
    return { ok: true };
  }
  return { ok: true };
}

export function isPhaseUnlocked(
  project: UserProject,
  phase: CampaignPhaseId,
  stage: AcquisitionStage,
): boolean {
  return canAdvanceToPhase(project, phase, stage).ok;
}
