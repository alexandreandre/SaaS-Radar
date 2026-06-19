import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getBuildJourneyState } from "@/lib/build/journey";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getChannelLabel } from "@/lib/campaign/channels";
import { recommendPrimaryChannel } from "@/lib/campaign/recommend";
import {
  getActiveCampaignKit,
  getActiveCampaignToolId,
  getSavedCampaignToolIds,
  hasCampaignKit,
} from "@/lib/campaign/kits";
import {
  getCampaignTool,
  getDistributionTargetsForChannel,
  type MarketingProfile,
} from "@/lib/campaign/tools";
import { getCampaignToolName } from "@/lib/campaign/kits";

export type CampaignJourneyStep = 1 | 2 | 3 | 4;

export const CAMPAIGN_JOURNEY_STEPS: { step: CampaignJourneyStep; label: string }[] = [
  { step: 1, label: "Stratégie" },
  { step: 2, label: "Création" },
  { step: 3, label: "Diffusion" },
  { step: 4, label: "Mesure" },
];

export type CampaignDisplayPhase =
  | "strategy"
  | "creating"
  | "distributing"
  | "measuring"
  | "iterating";

export type CampaignJourneyState = {
  currentStep: CampaignJourneyStep;
  displayPhase: CampaignDisplayPhase;
  showCoachCopy: boolean;
  actionTitle: string;
  actionDetail: string;
  secondaryDetail?: string;
  appOnline: boolean;
  appOnlineWarning?: string;
  trackingUnlocked: boolean;
};

function isIntegrationConnected(
  project: UserProject,
  connectorId: string,
): boolean {
  return (project.integrations ?? []).some(
    (i) =>
      i.connectorId === connectorId &&
      (i.status === "connected" || i.status === "demo"),
  );
}

function hasDistributionReady(
  project: UserProject,
  channel: ExtendedChannelKey,
  profile: MarketingProfile,
): boolean {
  if (project.campaignSetup?.distributionAcknowledgedAt) return true;

  if (profile === "organic") {
    return hasCampaignKit(project);
  }

  const adTargets = getDistributionTargetsForChannel(channel, profile).filter(
    (t) => t.category === "ads",
  );
  if (adTargets.length === 0) return hasCampaignKit(project);
  return adTargets.some((t) => isIntegrationConnected(project, t.connectorId));
}

function hasAnalyticsConnected(project: UserProject): boolean {
  if (project.campaignSetup?.measureAcknowledgedAt) return true;
  return (
    isIntegrationConnected(project, "plausible") ||
    isIntegrationConnected(project, "posthog") ||
    isIntegrationConnected(project, "google-analytics")
  );
}

function resolveDisplayPhase(
  step: CampaignJourneyStep,
  measuring: boolean,
): CampaignDisplayPhase {
  if (measuring && step === 4) return "iterating";
  if (step === 1) return "strategy";
  if (step === 2) return "creating";
  if (step === 3) return "distributing";
  return "measuring";
}

export function getCampaignJourneyState(
  project: UserProject,
  opportunity?: Opportunity,
): CampaignJourneyState {
  const buildState = getBuildJourneyState(project);
  const appOnline = buildState.displayPhase === "live";

  const profile = project.marketingProfile ?? project.campaignSetup?.profile;
  const hasProfile = Boolean(profile);
  const strategyBrief = project.campaignSetup?.strategyBrief?.trim();
  const hasStrategy = Boolean(hasProfile && strategyBrief);

  const activeToolId = getActiveCampaignToolId(project);
  const activeKit = getActiveCampaignKit(project);
  const hasKit = Boolean(activeKit?.primaryPrompt) || hasCampaignKit(project);

  const channel: ExtendedChannelKey =
    project.campaignSetup?.primaryChannel ??
    (opportunity ? recommendPrimaryChannel(opportunity) : "linkedin");

  const resolvedProfile = profile ?? "organic";
  const distributionReady = hasDistributionReady(project, channel, resolvedProfile);
  const analyticsReady = hasAnalyticsConnected(project);

  let currentStep: CampaignJourneyStep = 1;
  if (!hasStrategy) currentStep = 1;
  else if (!hasKit) currentStep = 2;
  else if (!distributionReady) currentStep = 3;
  else currentStep = 4;

  const measuring = analyticsReady && currentStep === 4;
  const displayPhase = resolveDisplayPhase(currentStep, measuring);

  const tool = activeToolId ? getCampaignTool(activeToolId) : undefined;
  const otherKitIds = getSavedCampaignToolIds(project).filter((id) => id !== activeToolId);
  const secondaryDetail =
    otherKitIds.length > 0
      ? `Vous avez aussi un kit sur ${otherKitIds.map(getCampaignToolName).join(", ")} — changez d'outil via les chips ci-dessous.`
      : undefined;

  let actionTitle = "Définissez votre stratégie";
  let actionDetail =
    "Choisissez votre profil marketing et générez un brief adapté à votre canal.";

  if (currentStep === 2) {
    actionTitle = "Générez vos kits créatifs";
    actionDetail = tool
      ? `Un brief et des prompts prêts à coller dans ${tool.name}.`
      : "Sélectionnez vos outils et générez les prompts pour votre campagne.";
  } else if (currentStep === 3) {
    actionTitle = "Diffusez votre campagne";
    actionDetail =
      resolvedProfile === "organic"
        ? `Publiez sur ${getChannelLabel(channel)} en suivant le guide de diffusion.`
        : "Connectez votre canal ads ou suivez le guide de publication.";
  } else if (currentStep === 4) {
    actionTitle = analyticsReady ? "Suivez vos résultats" : "Branchez la mesure";
    actionDetail = analyticsReady
      ? "Consultez Acquisition pour le ROAS et itérez sur vos créas."
      : "Connectez Plausible ou PostHog pour suivre signups et conversions.";
  }

  const appOnlineWarning = !appOnline
    ? "Votre app n'est pas encore en ligne — vous pouvez préparer la campagne, mais lancez après le déploiement."
    : undefined;

  if (appOnline && buildState.displayPhase === "live" && currentStep === 1) {
    actionDetail =
      "Votre app est en ligne — c'est le moment de préparer votre lancement.";
  }

  const showCoachCopy =
    displayPhase === "strategy" ||
    displayPhase === "creating" ||
    displayPhase === "distributing";

  return {
    currentStep,
    displayPhase,
    showCoachCopy,
    actionTitle,
    actionDetail,
    secondaryDetail,
    appOnline,
    appOnlineWarning,
    trackingUnlocked: hasKit,
  };
}

export function shouldShowCampaignTracking(project: UserProject): boolean {
  return getCampaignJourneyState(project).trackingUnlocked;
}

export function isCampaignStarted(project: UserProject): boolean {
  return Boolean(
    project.marketingProfile ||
      project.campaignSetup?.strategyBrief ||
      project.campaignSetup?.activeToolIds?.length,
  );
}
