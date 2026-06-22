import type { UserProject } from "@/lib/portfolio";
import type { CampaignSetup } from "@/lib/campaign/kits";
import {
  getSequenceStepsWithProgress,
  isSequenceFullyComplete,
} from "@/lib/campaign/sequences";
import {
  isDistributionGuideFullyComplete,
} from "@/lib/campaign/distribution-guide-data";
import {
  canAccessDiffusionPhase,
  getDiffusionBlockers,
  type InfraGate,
} from "@/lib/campaign/infra-gates";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import {
  isFoundationsCompleteWithRiver,
  resolveFoundationsRiverStop,
} from "@/lib/campaign/foundations-river";
import {
  buildContentDeriveContext,
} from "@/lib/campaign/content-derive";
import {
  contentAssetLabel,
  getRequiredContentAssetIds,
  isContentAssetConfirmed,
} from "@/lib/campaign/content-schemas";
import { contentAssetAnchorId } from "@/lib/campaign/content-constants";
import type { Opportunity } from "@/types/opportunity";

export type CampaignPhaseId = "foundations" | "creation" | "diffusion" | "measure";

export const CAMPAIGN_PHASES: { id: CampaignPhaseId; label: string; step: number }[] = [
  { id: "foundations", label: "Fondations", step: 1 },
  { id: "creation", label: "Création", step: 2 },
  { id: "diffusion", label: "Diffusion", step: 3 },
  { id: "measure", label: "Mesure", step: 4 },
];

export function isFoundationsComplete(setup: CampaignSetup | undefined): boolean {
  return isFoundationsCompleteWithRiver(setup);
}

export function isCreationComplete(project: UserProject, opportunity?: Opportunity): boolean {
  const setup = project.campaignSetup;
  if (!setup || !isFoundationsComplete(setup)) return false;

  if (setup.contentStudio?.completedAt) return true;

  const primary = setup.primaryChannel ?? "linkedin";
  const support = setup.foundationsRiver?.supportChannelKeys ?? [];
  const requiredIds = getRequiredContentAssetIds(primary, support);
  const assets = setup.contentAssets;

  if (requiredIds.length === 0) return false;

  if (assets && Object.keys(assets).length > 0) {
    return requiredIds.every((id) => {
      const asset = assets[id];
      return asset ? isContentAssetConfirmed(asset) : false;
    });
  }

  return false;
}

export function isDiffusionComplete(project: UserProject): boolean {
  const setup = project.campaignSetup;
  if (!setup) return false;
  const channel = (setup.primaryChannel ?? "linkedin") as import("@/lib/campaign/playbooks").CampaignPlaybookId;
  const kitSteps = Object.values(setup.kitsByTool ?? {})[0]?.distributionSteps;
  const seqSteps = getSequenceStepsWithProgress(setup);
  const seqDone = seqSteps.length === 0 || seqSteps.every((s) => s.done);
  const guideDone = isDistributionGuideFullyComplete(setup, channel, kitSteps);
  return seqDone && guideDone;
}

export function isMeasureComplete(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  return (setup.weeklyCheckIns?.length ?? 0) > 0 || Boolean(setup.retrospective);
}

export function resolveCampaignPhase(
  project: UserProject,
  stage: AcquisitionStage,
  opportunity?: Opportunity,
): CampaignPhaseId {
  const setup = project.campaignSetup;
  if (!isFoundationsComplete(setup)) return "foundations";
  if (!isCreationComplete(project, opportunity)) return "creation";
  if (!isDiffusionComplete(project)) return "diffusion";
  if (!isMeasureComplete(setup)) return "measure";
  return "measure";
}

export function canAdvanceToPhase(
  project: UserProject,
  target: CampaignPhaseId,
  stage: AcquisitionStage,
  opportunity?: Opportunity,
): { ok: boolean; reason?: string } {
  const setup = project.campaignSetup;
  const channel = setup?.primaryChannel ?? ("linkedin" as ExtendedChannelKey);
  const motion = recommendGtmMotion(stage, channel, setup);

  if (target === "foundations") return { ok: true };
  if (!isFoundationsComplete(setup)) {
    return { ok: false, reason: "Validez objectif, ICP et message." };
  }
  if (target === "creation") return { ok: true };
  if (!isCreationComplete(project, opportunity)) {
    return { ok: false, reason: "Validez vos contenus (landing et canaux)." };
  }
  if (target === "diffusion") {
    return { ok: true };
  }
  if (target === "measure") {
    if (!isDiffusionComplete(project)) {
      return { ok: false, reason: "Terminez la diffusion guidée (séquence et guide)." };
    }
    return { ok: true };
  }
  return { ok: true };
}

export function isPhaseUnlocked(
  project: UserProject,
  phase: CampaignPhaseId,
  stage: AcquisitionStage,
  opportunity?: Opportunity,
): boolean {
  return canAdvanceToPhase(project, phase, stage, opportunity).ok;
}

export type PhaseCompletionStatus = "complete" | "current" | "available" | "locked";

export function isPhaseComplete(
  project: UserProject,
  phase: CampaignPhaseId,
  opportunity?: Opportunity,
): boolean {
  const setup = project.campaignSetup;
  switch (phase) {
    case "foundations":
      return isFoundationsComplete(setup);
    case "creation":
      return isCreationComplete(project, opportunity);
    case "diffusion":
      return isDiffusionComplete(project);
    case "measure":
      return isMeasureComplete(setup);
    default:
      return false;
  }
}

export function getPhaseCompletionStatus(
  project: UserProject,
  phase: CampaignPhaseId,
  stage: AcquisitionStage,
  opportunity?: Opportunity,
): PhaseCompletionStatus {
  if (isPhaseComplete(project, phase, opportunity)) return "complete";
  const current = resolveCampaignPhase(project, stage, opportunity);
  if (phase === current) return "current";
  if (isPhaseUnlocked(project, phase, stage, opportunity)) return "available";
  return "locked";
}

export function getCompletedPhaseCount(project: UserProject, opportunity?: Opportunity): number {
  return CAMPAIGN_PHASES.filter((p) => isPhaseComplete(project, p.id, opportunity)).length;
}

export type CampaignPhaseGap = {
  id: string;
  label: string;
  anchorId: string;
};

export function getFoundationsGaps(project: UserProject): CampaignPhaseGap[] {
  const stop = resolveFoundationsRiverStop(project);
  switch (stop) {
    case "intro":
      return [
        {
          id: "intro",
          label: "Commencer le parcours fondations",
          anchorId: "foundations-screen",
        },
      ];
    case "audience":
      return [
        {
          id: "audience",
          label: "Confirmer pour qui c'est",
          anchorId: "foundations-audience",
        },
      ];
    case "goal":
      return [
        {
          id: "goal",
          label: "Confirmer objectif et canal",
          anchorId: "foundations-goal",
        },
      ];
    case "message":
      return [
        {
          id: "message",
          label: "Confirmer votre message",
          anchorId: "foundations-message",
        },
      ];
    case "dock":
      if (!project.campaignSetup?.foundationsRiver?.completedAt) {
        return [
          {
            id: "dock",
            label: "Valider le récapitulatif",
            anchorId: "foundations-dock",
          },
        ];
      }
      return [];
    default:
      return [];
  }
}

export function getCreationGaps(project: UserProject, opportunity?: Opportunity): CampaignPhaseGap[] {
  const gaps: CampaignPhaseGap[] = [];
  const setup = project.campaignSetup;

  if (!isFoundationsComplete(setup)) {
    gaps.push({
      id: "foundations",
      label: "Terminer les Fondations (audience, objectif, message)",
      anchorId: "foundations-screen",
    });
    return gaps;
  }

  if (!opportunity) {
    gaps.push({
      id: "content-studio",
      label: "Valider vos contenus dans l'atelier",
      anchorId: "creation-content-studio",
    });
    return gaps;
  }

  const ctx = buildContentDeriveContext(project, opportunity);
  const requiredIds = getRequiredContentAssetIds(ctx.primaryChannel, ctx.supportChannels);
  const assets = setup?.contentAssets ?? {};
  for (const id of requiredIds) {
    const asset = assets[id];
    if (!asset || !isContentAssetConfirmed(asset)) {
      gaps.push({
        id: `content-${id}`,
        label: `${contentAssetLabel(id)} : valider le contenu`,
        anchorId: contentAssetAnchorId(id),
      });
    }
  }

  return gaps;
}

export function getDiffusionGaps(project: UserProject): CampaignPhaseGap[] {
  const setup = project.campaignSetup;
  const gaps: CampaignPhaseGap[] = [];
  const channel = setup?.primaryChannel ?? "linkedin";
  const motion = recommendGtmMotion(setup?.acquisitionStage ?? "network", channel, setup);
  const playbookId = channel as import("@/lib/campaign/playbooks").CampaignPlaybookId;
  const kitSteps = setup?.kitsByTool ? Object.values(setup.kitsByTool)[0]?.distributionSteps : undefined;

  for (const gate of getDiffusionBlockers(project, motion)) {
    gaps.push({
      id: `infra-${gate.id}`,
      label: `${gate.label} : à configurer`,
      anchorId: gate.blockerAnchor,
    });
  }

  if (!isSequenceFullyComplete(setup)) {
    gaps.push({
      id: "sequence",
      label: "Valider chaque étape de la séquence de lancement",
      anchorId: "diffusion-sequence",
    });
  }

  if (!isDistributionGuideFullyComplete(setup, playbookId, kitSteps)) {
    gaps.push({
      id: "distribution-guide",
      label: "Valider chaque étape du guide diffusion",
      anchorId: "diffusion-guide",
    });
  }

  return gaps;
}

export function getMeasureGaps(setup: CampaignSetup | undefined): CampaignPhaseGap[] {
  const gaps: CampaignPhaseGap[] = [];
  if ((setup?.weeklyCheckIns?.length ?? 0) === 0) {
    gaps.push({
      id: "checkin",
      label: "Premier check-in hebdomadaire",
      anchorId: "measure-checkin",
    });
  }
  return gaps;
}

export function getPhaseGaps(
  project: UserProject,
  phase: CampaignPhaseId,
): CampaignPhaseGap[] {
  switch (phase) {
    case "foundations":
      return getFoundationsGaps(project);
    case "creation":
      return getCreationGaps(project);
    case "diffusion":
      return getDiffusionGaps(project);
    case "measure":
      return getMeasureGaps(project.campaignSetup);
    default:
      return [];
  }
}

export type CampaignNextAction = {
  phase: CampaignPhaseId;
  anchorId: string;
  label: string;
  reason?: string;
  ctaLabel: string;
};

export function getNextCampaignAction(
  project: UserProject,
  stage: AcquisitionStage,
  opportunity?: Opportunity,
): CampaignNextAction {
  const setup = project.campaignSetup;
  const channel = setup?.primaryChannel ?? ("linkedin" as ExtendedChannelKey);
  const motion = recommendGtmMotion(stage, channel, setup);

  const foundationsGaps = getFoundationsGaps(project);
  if (foundationsGaps.length > 0) {
    const first = foundationsGaps[0];
    const stop = resolveFoundationsRiverStop(project);
    const riverLabels: Record<string, { label: string; cta: string }> = {
      intro: { label: "Commencez vos fondations", cta: "Commencer" },
      audience: { label: "Confirmez votre cible", cta: "C'est pour eux" },
      goal: { label: "Confirmez objectif et canal", cta: "On vise ça" },
      message: { label: "Confirmez votre accroche", cta: "On leur dit quoi" },
      dock: { label: "Validez vos fondations", cta: "Voir le récap" },
    };
    const copy = riverLabels[stop] ?? { label: first.label, cta: "Continuer" };
    return {
      phase: "foundations",
      anchorId: first.anchorId,
      label: copy.label,
      ctaLabel: copy.cta,
    };
  }

  if (!isCreationComplete(project, opportunity)) {
    const firstGap = getCreationGaps(project, opportunity)[0];
    if (firstGap) {
      return {
        phase: "creation",
        anchorId: firstGap.anchorId,
        label: firstGap.label,
        ctaLabel: "Continuer l'atelier",
      };
    }
    return {
      phase: "creation",
      anchorId: "creation-content-studio",
      label: "Valider vos contenus dans l'atelier",
      ctaLabel: "Ouvrir l'atelier",
    };
  }

  const infraBlockers = getDiffusionBlockers(project, motion);
  if (infraBlockers.length > 0) {
    const gate = infraBlockers[0];
    return {
      phase: "diffusion",
      anchorId: gate.blockerAnchor,
      label: `Prérequis : ${gate.label}`,
      reason: gate.detail,
      ctaLabel: "Configurer",
    };
  }

  if (!isDiffusionComplete(project)) {
    const firstGap = getDiffusionGaps(project)[0];
    return {
      phase: "diffusion",
      anchorId: firstGap?.anchorId ?? "diffusion-sequence",
      label: firstGap?.label ?? "Terminer la diffusion guidée",
      ctaLabel: "Continuer",
    };
  }

  if (!isMeasureComplete(setup)) {
    return {
      phase: "measure",
      anchorId: "measure-checkin",
      label: "Faites votre check-in hebdomadaire",
      ctaLabel: "Check-in",
    };
  }

  return {
    phase: "measure",
    anchorId: "measure-retro",
    label: "Clôturez le cycle avec une rétrospective",
    ctaLabel: "Rétrospective",
  };
}

const BLOCKER_ANCHOR_MAP: Record<string, string> = {
  "Validez objectif et message": "foundations-goal",
  "Validez objectif, ICP et message.": "foundations-audience",
  "Validez objectif, ICP et message": "foundations-audience",
  "Validez vos contenus (landing et canaux)": "creation-content-studio",
  "Validez vos contenus (landing et canaux).": "creation-content-studio",
  "UTM, analytics ou question attribution": "infra-gates",
  "Complétez les prérequis infra (tracking, CRM).": "infra-gates",
  "Complétez les prérequis infra": "infra-gates",
  "Déployez votre app (Build)": "build-module",
  "Validez une étape de la séquence": "diffusion-sequence",
  "Cochez une étape de la séquence": "diffusion-sequence",
  "Exécutez au moins une étape de la séquence.": "diffusion-sequence",
  "Terminez la diffusion guidée": "diffusion-guide",
};

export function mapReadinessBlockerToAnchor(blocker: string): string {
  return BLOCKER_ANCHOR_MAP[blocker] ?? "foundations-screen";
}

export function mapInfraGateToAction(gate: InfraGate): {
  anchorId: string;
  ctaLabel: string;
} {
  if (gate.id === "tracking_or_attribution") {
    return { anchorId: "infra-gates", ctaLabel: "Configurer le tracking" };
  }
  if (gate.id === "crm_or_tracker") {
    return { anchorId: "infra-gates", ctaLabel: "Connecter un CRM" };
  }
  if (gate.id === "creative_ready") {
    return { anchorId: "creation-content-studio", ctaLabel: "Valider les contenus" };
  }
  if (gate.id === "app_live") {
    return { anchorId: "build-module", ctaLabel: "Aller à Build" };
  }
  return { anchorId: gate.blockerAnchor, ctaLabel: "Compléter" };
}
