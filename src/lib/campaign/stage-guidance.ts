import type { UserProject } from "@/lib/portfolio";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import {
  type AcquisitionStage,
  getStageDefinition,
} from "@/lib/campaign/stages";
import { inferAcquisitionStage } from "@/lib/campaign/infer-stage";

export type StageGuidance = {
  stage: AcquisitionStage;
  recommendedStage: AcquisitionStage;
  isManualOverride: boolean;
  badge: "recommended" | "manual";
  headline: string;
  reason: string;
  focusLine: string;
  typicalClients: string;
  primaryMetric: string;
};

function hasAdsSpend(project: UserProject): boolean {
  return (project.campaigns ?? []).some((c) => c.totalSpend > 0);
}

function formatMrr(mrr: number): string {
  if (mrr >= 1000) return `${Math.round(mrr / 100) / 10} k€ MRR`;
  return `${Math.round(mrr)} € MRR`;
}

function explainInferredStage(
  project: UserProject,
  stage: AcquisitionStage,
): { reason: string; focusLine: string } {
  if (project.currentMrr > 500 || (hasAdsSpend(project) && project.currentMrr > 0)) {
    return {
      reason: `Vous avez ${formatMrr(project.currentMrr)}${hasAdsSpend(project) ? " et des dépenses pub" : ""} — le pilotage ROAS se fait dans Acquisition.`,
      focusLine: "Consolidez un canal rentable avant d’élargir le spend.",
    };
  }

  if (project.builderStage === "has_mrr" && project.currentMrr > 0) {
    return {
      reason: `Vous avez déjà des clients (${formatMrr(project.currentMrr)}) — on accélère la demande organique plutôt que le cold outreach pur.`,
      focusLine: "Contenu fondateur, referrals et présence régulière sur 1–2 canaux.",
    };
  }

  if (project.builderStage === "building") {
    return {
      reason: "Votre produit est en construction — concentrez-vous sur les premières conversations avant de scaler.",
      focusLine: "Réseau proche, communautés où vous êtes déjà présent, premiers payants.",
    };
  }

  switch (stage) {
    case "outreach":
      return {
        reason: "Votre stack ou canal pointe vers une prospection directe sur un ICP serré.",
        focusLine: "Séquence email / LinkedIn, discovery calls, itérations message-market fit.",
      };
    case "content":
      return {
        reason: "Vous avez une base de traction — le contenu et le bouche-à-oreille prennent le relais.",
        focusLine: "Articles AEO, posts fondateur, referrals et communautés niche.",
      };
    case "amplification":
      return {
        reason: "Vous êtes prêt à amplifier : lancement public et tests pub légers.",
        focusLine: "Product Hunt, communautés, premières créas pub à petit budget.",
      };
    case "scale":
      return {
        reason: "Traction confirmée — structurez la pub multi-canal.",
        focusLine: "ROAS, CAC et funnel dans le module Acquisition.",
      };
    default:
      return {
        reason: "Vous démarrez sans clients payants — le réseau et les conversations qualifiées d’abord.",
        focusLine: "10 premières conversations avant d’élargir les canaux.",
      };
  }
}

export function getRecommendedStage(
  project: UserProject,
  channel?: ExtendedChannelKey,
): AcquisitionStage {
  return inferAcquisitionStage(project, channel, { ignoreOverride: true });
}

export function getStageGuidance(
  project: UserProject,
  channel?: ExtendedChannelKey,
): StageGuidance {
  const setup = project.campaignSetup;
  const recommendedStage = getRecommendedStage(project, channel);
  const stage =
    setup?.stageOverride && setup.acquisitionStage
      ? setup.acquisitionStage
      : recommendedStage;
  const isManualOverride = Boolean(setup?.stageOverride && setup.acquisitionStage);
  const def = getStageDefinition(stage);
  const { reason, focusLine } = isManualOverride
    ? {
        reason: "Vous avez ajusté le stade manuellement — le parcours s’adapte à votre choix.",
        focusLine: def.description,
      }
    : explainInferredStage(project, stage);

  return {
    stage,
    recommendedStage,
    isManualOverride,
    badge: isManualOverride ? "manual" : "recommended",
    headline: def.label,
    reason,
    focusLine,
    typicalClients: def.customerRange,
    primaryMetric: def.primaryMetric,
  };
}
