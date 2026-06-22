import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import { getBuildJourneyState } from "@/lib/build/journey";
import {
  getActiveCampaignKit,
  hasCampaignKit,
  isStep1Complete,
  isStep2Complete,
  isTrackingConfigured,
} from "@/lib/campaign/kits";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import { canAccessDiffusionPhase } from "@/lib/campaign/infra-gates";
import { isContentCreativeReady } from "@/lib/campaign/content-derive";
import { isDiffusionComplete } from "@/lib/campaign/phases";

export type CampaignReadiness = {
  appLive: boolean;
  trackingConfigured: boolean;
  strategyComplete: boolean;
  kitReady: boolean;
  sequenceStarted: boolean;
  distributionAcknowledged: boolean;
  measureAcknowledged: boolean;
  score: number;
  blockers: string[];
  readyLabels: string[];
};

function isAnalyticsConnected(project: UserProject): boolean {
  return (project.integrations ?? []).some(
    (i) =>
      ["plausible", "posthog", "google-analytics", "fathom"].includes(i.connectorId) &&
      (i.status === "connected" || i.status === "demo"),
  );
}

export function getCampaignReadiness(
  project: UserProject,
  opportunity?: Opportunity,
): CampaignReadiness {
  const setup = project.campaignSetup;
  const buildState = getBuildJourneyState(project);
  const appLive = buildState.displayPhase === "live";

  const strategyComplete = isStep1Complete(setup) && isStep2Complete(setup);
  const contentReady = isContentCreativeReady(project);
  const kitReady =
    hasCampaignKit(project) ||
    Boolean(getActiveCampaignKit(project)?.primaryPrompt) ||
    contentReady;
  const trackingConfigured =
    isTrackingConfigured(setup) ||
    isAnalyticsConnected(project) ||
    Boolean(setup?.attributionQuestionEnabled);
  const sequenceStarted = isDiffusionComplete(project);
  const distributionAcknowledged = Boolean(setup?.distributionAcknowledgedAt);
  const measureAcknowledged =
    Boolean(setup?.measureAcknowledgedAt) || isAnalyticsConnected(project);

  const stage = setup?.acquisitionStage ?? "network";
  const channel = setup?.primaryChannel ?? "linkedin";
  const motion = recommendGtmMotion(stage, channel, setup);
  const infraReady = canAccessDiffusionPhase(project, motion);

  const checks = [
    { ok: strategyComplete, label: "Stratégie", blocker: "Validez objectif et message" },
    { ok: kitReady, label: "Contenus créatifs", blocker: "Validez vos contenus (landing et canaux)" },
    { ok: trackingConfigured, label: "Tracking", blocker: "UTM, analytics ou question attribution" },
    { ok: appLive, label: "App en ligne", blocker: "Déployez votre app (Build)" },
    { ok: infraReady, label: "Infra diffusion", blocker: "Complétez les prérequis infra" },
    { ok: sequenceStarted, label: "Exécution", blocker: "Terminez la diffusion guidée" },
  ];

  if (opportunity?.partnersFR?.length) {
    checks.push({
      ok: Boolean(setup?.demandChecklist?.communityPresence),
      label: "Partenaires",
      blocker: "Explorez les partenaires FR de la fiche",
    });
  }

  const blockers = checks.filter((c) => !c.ok).map((c) => c.blocker);
  const readyLabels = checks.filter((c) => c.ok).map((c) => c.label);
  const score = Math.round((checks.filter((c) => c.ok).length / checks.length) * 100);

  return {
    appLive,
    trackingConfigured,
    strategyComplete,
    kitReady,
    sequenceStarted,
    distributionAcknowledged,
    measureAcknowledged,
    score,
    blockers,
    readyLabels,
  };
}
