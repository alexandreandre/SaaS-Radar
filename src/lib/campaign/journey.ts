import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getBuildJourneyState } from "@/lib/build/journey";
import {
  recommendStageForProject,
} from "@/lib/campaign/recommend";
import {
  getActiveCampaignKit,
  getActiveCampaignToolId,
  getCampaignStage,
  hasCampaignKit,
  isStep1Complete,
  isStep2Complete,
  isStep3Complete,
  isStep4Complete,
  isTrackingConfigured,
} from "@/lib/campaign/kits";
import { getStageDefinition } from "@/lib/campaign/stages";

export type CampaignJourneyStep = 1 | 2 | 3 | 4 | 5;

export const CAMPAIGN_JOURNEY_STEPS: { step: CampaignJourneyStep; label: string }[] = [
  { step: 1, label: "Cible" },
  { step: 2, label: "Message" },
  { step: 3, label: "Préparer" },
  { step: 4, label: "Agir" },
  { step: 5, label: "Suivre" },
];

export type CampaignDisplayPhase =
  | "strategy"
  | "preparing"
  | "executing"
  | "tracking"
  | "iterating";

export type CampaignJourneyState = {
  currentStep: CampaignJourneyStep;
  displayPhase: CampaignDisplayPhase;
  acquisitionStage: ReturnType<typeof getCampaignStage>;
  showCoachCopy: boolean;
  actionTitle: string;
  actionDetail: string;
  secondaryDetail?: string;
  appOnline: boolean;
  appOnlineWarning?: string;
  trackingUnlocked: boolean;
  showAcquisitionHandoff: boolean;
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

function hasAnalyticsConnected(project: UserProject): boolean {
  if (project.campaignSetup?.measureAcknowledgedAt) return true;
  return (
    isIntegrationConnected(project, "plausible") ||
    isIntegrationConnected(project, "posthog") ||
    isIntegrationConnected(project, "google-analytics") ||
    isIntegrationConnected(project, "fathom")
  );
}

function resolveCurrentStep(project: UserProject): CampaignJourneyStep {
  const setup = project.campaignSetup;
  if (!isStep1Complete(setup)) return 1;
  if (!isStep2Complete(setup)) return 2;
  if (!isStep3Complete(setup)) return 3;
  if (!isStep4Complete(setup)) return 4;
  return 5;
}

function resolveDisplayPhase(
  step: CampaignJourneyStep,
  setup: UserProject["campaignSetup"],
): CampaignDisplayPhase {
  if (setup?.cycleStatus === "completed" || setup?.retrospective) return "iterating";
  if (step === 1) return "strategy";
  if (step === 2) return "strategy";
  if (step === 3) return "preparing";
  if (step === 4) return "executing";
  return "tracking";
}

function stageCoachCopy(
  stage: ReturnType<typeof getCampaignStage>,
  step: CampaignJourneyStep,
): { title: string; detail: string } {
  const def = getStageDefinition(stage);

  if (step === 1) {
    return {
      title: `Stade ${def.label} — définissez votre cible`,
      detail: `${def.description} Métrique clé : ${def.primaryMetric}.`,
    };
  }
  if (step === 2) {
    return {
      title: "Affinez votre message",
      detail: "Positionnement en une phrase + brief stratégique avant de produire.",
    };
  }
  if (step === 3) {
    return {
      title: "Préparez outils et mesure",
      detail: stage === "scale"
        ? "Créas prêtes + UTM + connecteurs ads avant de scaler."
        : "Générez vos assets IA et configurez le suivi des signups.",
    };
  }
  if (step === 4) {
    if (stage === "network") {
      return {
        title: "Agissez — réseau d'abord",
        detail: "20 DMs personnalisés cette semaine. Pas de pub.",
      };
    }
    if (stage === "outreach") {
      return {
        title: "Agissez — outreach fondateur",
        detail: "Objectif : 5 discovery calls. Personnalisez chaque message.",
      };
    }
    if (stage === "scale") {
      return {
        title: "Lancez et pilotez dans Acquisition",
        detail: "Suivez ROAS et funnel dans l'onglet Acquisition.",
      };
    }
    return {
      title: "Exécutez votre plan",
      detail: "Cochez chaque action — une semaine, un focus.",
    };
  }
  return {
    title: "Suivez et ajustez",
    detail: "Check-in hebdo : progressez-vous vers votre objectif ?",
  };
}

export function getCampaignJourneyState(
  project: UserProject,
  opportunity?: Opportunity,
): CampaignJourneyState {
  const buildState = getBuildJourneyState(project);
  const appOnline = buildState.displayPhase === "live";
  const setup = project.campaignSetup;
  const stage = opportunity
    ? recommendStageForProject(project, opportunity)
    : getCampaignStage(project);

  const currentStep = resolveCurrentStep(project);
  const displayPhase = resolveDisplayPhase(currentStep, setup);
  const hasKit = Boolean(getActiveCampaignKit(project)?.primaryPrompt) || hasCampaignKit(project);
  const coach = stageCoachCopy(stage, currentStep);

  const appOnlineWarning = !appOnline
    ? "Votre app n'est pas encore en ligne — vous pouvez préparer la campagne, mais lancez après le déploiement."
    : undefined;

  const checkInCount = setup?.weeklyCheckIns?.length ?? 0;
  let secondaryDetail: string | undefined;
  if (currentStep === 5 && checkInCount === 0) {
    secondaryDetail = "Faites votre premier check-in — 2 minutes pour noter où vous en êtes.";
  } else if (stage === "scale" && currentStep >= 4) {
    secondaryDetail = "Le dashboard ROAS est dans l'onglet Acquisition.";
  }

  const showCoachCopy =
    displayPhase === "strategy" ||
    displayPhase === "preparing" ||
    displayPhase === "executing";

  return {
    currentStep,
    displayPhase,
    acquisitionStage: stage,
    showCoachCopy,
    actionTitle: coach.title,
    actionDetail: coach.detail,
    secondaryDetail,
    appOnline,
    appOnlineWarning,
    trackingUnlocked: hasKit || isStep3Complete(setup),
    showAcquisitionHandoff: stage === "scale" && currentStep >= 4,
  };
}

export function shouldShowCampaignTracking(project: UserProject): boolean {
  return getCampaignJourneyState(project).trackingUnlocked;
}

export function isCampaignStarted(project: UserProject): boolean {
  const setup = project.campaignSetup;
  return Boolean(
    setup?.smartGoal ||
      setup?.strategyBrief ||
      setup?.actionItems?.some((a) => a.done) ||
      setup?.activeToolIds?.length ||
      getActiveCampaignToolId(project),
  );
}

export function isCampaignLive(project: UserProject): boolean {
  const setup = project.campaignSetup;
  return (
    isStep4Complete(setup) &&
    (isTrackingConfigured(setup) || hasAnalyticsConnected(project))
  );
}
