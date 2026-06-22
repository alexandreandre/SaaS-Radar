import type {
  CampaignToolId,
  MarketingProfile,
} from "@/lib/campaign/tools";
import { getCampaignTool } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { CampaignWorkflowNode } from "@/lib/campaign/workflows";
import type { UserProject } from "@/lib/portfolio";
import {
  type AcquisitionStage,
  type CampaignActionItem,
  type CampaignCycleStatus,
  type CampaignRetrospective,
  type CampaignSmartGoal,
  type CampaignTrackingPlan,
  type CampaignWeeklyCheckIn,
  profileFromStage,
  stageFromLegacyProfile,
} from "@/lib/campaign/stages";
import { inferAcquisitionStage } from "@/lib/campaign/infer-stage";
import type { GtmEngine, GtmMotion } from "@/lib/campaign/gtm-engine";
import type { CampaignSequenceId } from "@/lib/campaign/sequences";
import type { InfraGateId } from "@/lib/campaign/infra-gates";
import { migrateCampaignSetupV2 } from "@/lib/campaign/migrate-v2";

export type CampaignIcpStructured = {
  segment?: string;
  size?: string;
  pain?: string;
  trigger?: string;
  champion?: string;
  economicBuyer?: string;
};

export type {
  AcquisitionStage,
  CampaignActionItem,
  CampaignCycleStatus,
  CampaignRetrospective,
  CampaignSmartGoal,
  CampaignTrackingPlan,
  CampaignWeeklyCheckIn,
} from "@/lib/campaign/stages";

export type CampaignKit = {
  toolId: CampaignToolId;
  channelKey: ExtendedChannelKey;
  profile: MarketingProfile;
  brief: string;
  primaryPrompt: string;
  secondaryPrompts?: { label: string; content: string }[];
  distributionSteps?: string[];
  generatedAt: string;
  language?: "fr" | "en";
  productName?: string;
};

export type CampaignKitSnapshot = CampaignKit & {
  savedAt: string;
  label?: string;
};

export type CampaignSetup = {
  schemaVersion?: 1 | 2;
  acquisitionStage: AcquisitionStage;
  stageOverride?: boolean;
  smartGoal?: CampaignSmartGoal;
  icpSummary?: string;
  icpStructured?: CampaignIcpStructured;
  positioning?: string;
  primaryChannel: ExtendedChannelKey;
  activeToolIds: CampaignToolId[];
  workflow: CampaignWorkflowNode[];
  strategyBrief?: string;
  kitsByTool: Partial<Record<CampaignToolId, CampaignKit>>;
  actionItems: CampaignActionItem[];
  trackingPlan?: CampaignTrackingPlan;
  weeklyCheckIns: CampaignWeeklyCheckIn[];
  retrospective?: CampaignRetrospective;
  cycleStartedAt?: string;
  cycleStatus: CampaignCycleStatus;
  generatedAt?: string;
  /** @deprecated — use marketingProfile */
  profile?: MarketingProfile;
  marketingProfile?: MarketingProfile;
  gtmMotion?: GtmMotion;
  gtmEngineFocus?: GtmEngine;
  activeSequenceId?: CampaignSequenceId | string;
  sequenceProgress?: Record<string, { done: boolean; doneAt?: string }>;
  attributionQuestionEnabled?: boolean;
  messageMarketFitNotes?: string[];
  assetChecklist?: boolean[];
  demandChecklist?: {
    g2Profile?: boolean;
    aeoArticles?: boolean;
    communityPresence?: boolean;
  };
  infraGates?: Partial<Record<InfraGateId, boolean>>;
  distributionAcknowledgedAt?: string;
  measureAcknowledgedAt?: string;
};

export type CampaignKitsByTool = Partial<Record<CampaignToolId, CampaignKit>>;

function migrateLegacySetup(setup: Partial<CampaignSetup>, project: UserProject): CampaignSetup {
  const channel = setup.primaryChannel ?? "linkedin";
  const legacyProfile = setup.profile ?? project.marketingProfile;
  const stage: AcquisitionStage =
    setup.acquisitionStage ??
    (legacyProfile
      ? stageFromLegacyProfile(legacyProfile, channel)
      : inferAcquisitionStage(project, channel));

  const base: CampaignSetup = {
    schemaVersion: setup.schemaVersion,
    acquisitionStage: stage,
    stageOverride: setup.stageOverride,
    smartGoal: setup.smartGoal,
    icpSummary: setup.icpSummary,
    icpStructured: setup.icpStructured,
    positioning: setup.positioning,
    primaryChannel: channel,
    activeToolIds: setup.activeToolIds ?? [],
    workflow: setup.workflow ?? [],
    strategyBrief: setup.strategyBrief,
    kitsByTool: setup.kitsByTool ?? {},
    actionItems: setup.actionItems ?? [],
    trackingPlan: setup.trackingPlan,
    weeklyCheckIns: setup.weeklyCheckIns ?? [],
    retrospective: setup.retrospective,
    cycleStartedAt: setup.cycleStartedAt,
    cycleStatus: setup.cycleStatus ?? (setup.strategyBrief ? "active" : "draft"),
    generatedAt: setup.generatedAt,
    profile: setup.profile ?? setup.marketingProfile ?? profileFromStage(stage),
    marketingProfile: setup.marketingProfile ?? setup.profile ?? profileFromStage(stage),
    gtmMotion: setup.gtmMotion,
    gtmEngineFocus: setup.gtmEngineFocus,
    activeSequenceId: setup.activeSequenceId,
    sequenceProgress: setup.sequenceProgress,
    attributionQuestionEnabled: setup.attributionQuestionEnabled,
    messageMarketFitNotes: setup.messageMarketFitNotes,
    assetChecklist: setup.assetChecklist,
    demandChecklist: setup.demandChecklist,
    infraGates: setup.infraGates,
    distributionAcknowledgedAt: setup.distributionAcknowledgedAt,
    measureAcknowledgedAt: setup.measureAcknowledgedAt,
  };
  return migrateCampaignSetupV2(project, base);
}

export function getActiveCampaignToolId(project: UserProject): CampaignToolId | undefined {
  const ids = project.activeCampaignToolIds ?? [];
  if (ids.length > 0) return ids[ids.length - 1];
  const setupIds = project.campaignSetup?.activeToolIds ?? [];
  if (setupIds.length > 0) return setupIds[setupIds.length - 1];
  return undefined;
}

export function getActiveCampaignKit(project: UserProject): CampaignKit | undefined {
  const toolId = getActiveCampaignToolId(project);
  if (!toolId) return undefined;
  return project.campaignSetup?.kitsByTool?.[toolId];
}

function getKitGeneratedAt(project: UserProject, toolId: CampaignToolId): string {
  const kit = project.campaignSetup?.kitsByTool?.[toolId];
  return kit?.generatedAt ?? "";
}

function compareToolIdsByGeneration(
  project: UserProject,
  a: CampaignToolId,
  b: CampaignToolId,
): number {
  const timeA = getKitGeneratedAt(project, a);
  const timeB = getKitGeneratedAt(project, b);
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1;
  if (!timeB) return -1;
  return timeA.localeCompare(timeB);
}

export function getSavedCampaignToolIds(project: UserProject): CampaignToolId[] {
  const kits = project.campaignSetup?.kitsByTool ?? {};
  const ids = (Object.keys(kits) as CampaignToolId[]).filter((id) =>
    Boolean(kits[id]?.primaryPrompt),
  );
  return ids.sort((a, b) => compareToolIdsByGeneration(project, a, b));
}

export function getCampaignToolIdsInOrder(project: UserProject): CampaignToolId[] {
  const activeId = getActiveCampaignToolId(project);
  const ids = new Set<CampaignToolId>([
    ...(project.campaignSetup?.activeToolIds ?? []),
    ...getSavedCampaignToolIds(project),
  ]);
  if (activeId) ids.add(activeId);
  return Array.from(ids).sort((a, b) => compareToolIdsByGeneration(project, a, b));
}

export function normalizeCampaignSetup(project: UserProject): UserProject {
  const raw = project.campaignSetup;
  if (!raw) return project;

  const setup = migrateLegacySetup(raw, project);
  const activeIds = setup.activeToolIds.length > 0 ? setup.activeToolIds : [];
  const profile = setup.profile ?? profileFromStage(setup.acquisitionStage);

  return {
    ...project,
    campaignSetup: {
      ...setup,
      profile,
      activeToolIds: activeIds,
      actionItems: setup.actionItems,
      weeklyCheckIns: setup.weeklyCheckIns,
      cycleStatus: setup.cycleStatus,
    },
    activeCampaignToolIds: activeIds,
    marketingProfile: profile,
  };
}

export function hasCampaignKit(project: UserProject): boolean {
  const kits = project.campaignSetup?.kitsByTool ?? {};
  return Object.values(kits).some((k) => Boolean(k?.primaryPrompt));
}

export function getCampaignToolName(toolId: CampaignToolId): string {
  return getCampaignTool(toolId)?.name ?? toolId;
}

export function getCampaignStage(project: UserProject): AcquisitionStage {
  return (
    project.campaignSetup?.acquisitionStage ??
    inferAcquisitionStage(project, project.campaignSetup?.primaryChannel)
  );
}

export function isStep1Complete(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  return Boolean(setup.smartGoal && setup.primaryChannel && setup.icpSummary?.trim());
}

export function isStep2Complete(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  return Boolean(setup.strategyBrief?.trim() || setup.positioning?.trim());
}

export function isStep3Complete(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  const hasKit = Object.values(setup.kitsByTool).some((k) => k?.primaryPrompt);
  const prepareItems = setup.actionItems.filter((a) => a.phase === "prepare");
  const prepareDone =
    prepareItems.length === 0 ||
    prepareItems.filter((a) => a.done).length / prepareItems.length >= 0.8;
  return hasKit || prepareDone;
}

export function isStep4Complete(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  return setup.actionItems.some((a) => a.phase === "execute" && a.done);
}

export function isStep5Unlocked(setup: CampaignSetup | undefined): boolean {
  return isStep4Complete(setup);
}

export function isTrackingConfigured(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  return Boolean(setup.trackingPlan?.configuredAt || setup.measureAcknowledgedAt);
}
