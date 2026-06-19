import type {
  CampaignToolId,
  MarketingProfile,
} from "@/lib/campaign/tools";
import { getCampaignTool } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { CampaignWorkflowNode } from "@/lib/campaign/workflows";
import type { UserProject } from "@/lib/portfolio";

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
  profile: MarketingProfile;
  primaryChannel: ExtendedChannelKey;
  activeToolIds: CampaignToolId[];
  workflow: CampaignWorkflowNode[];
  strategyBrief?: string;
  kitsByTool: Partial<Record<CampaignToolId, CampaignKit>>;
  generatedAt?: string;
  distributionAcknowledgedAt?: string;
  measureAcknowledgedAt?: string;
};

export type CampaignKitsByTool = Partial<Record<CampaignToolId, CampaignKit>>;

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
  const setup = project.campaignSetup;
  if (!setup) return project;

  const kits: CampaignKitsByTool = { ...setup.kitsByTool };
  const activeIds = setup.activeToolIds.length > 0 ? setup.activeToolIds : [];

  return {
    ...project,
    campaignSetup: {
      ...setup,
      kitsByTool: kits,
      activeToolIds: activeIds,
    },
    activeCampaignToolIds: activeIds,
    marketingProfile: setup.profile ?? project.marketingProfile,
  };
}

export function hasCampaignKit(project: UserProject): boolean {
  const kits = project.campaignSetup?.kitsByTool ?? {};
  return Object.values(kits).some((k) => Boolean(k?.primaryPrompt));
}

export function getCampaignToolName(toolId: CampaignToolId): string {
  return getCampaignTool(toolId)?.name ?? toolId;
}
