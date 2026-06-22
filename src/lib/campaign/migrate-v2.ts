import type { UserProject } from "@/lib/portfolio";
import type { CampaignSetup, CampaignIcpStructured } from "@/lib/campaign/kits";
import {
  CAMPAIGN_SEQUENCES,
  resolveSequenceId,
  type CampaignSequenceId,
} from "@/lib/campaign/sequences";
import { recommendGtmMotion, getDominantGtmEngine } from "@/lib/campaign/gtm-engine";
import type { MarketingProfile } from "@/lib/campaign/tools";
import { profileFromStage } from "@/lib/campaign/stages";

const ASSET_CHECKLIST_SIZE = 8;

function migrateLaunchChecklistToAssets(project: UserProject): boolean[] {
  const done = project.launchChecklistDone ?? [];
  const assets: boolean[] = Array.from({ length: ASSET_CHECKLIST_SIZE }, () => false);
  for (let i = 0; i < ASSET_CHECKLIST_SIZE; i++) {
    assets[i] = done.includes(100 + i);
  }
  return assets;
}

function mapActionProgressToSequence(
  setup: CampaignSetup,
  sequenceId: CampaignSequenceId,
): CampaignSetup["sequenceProgress"] {
  const seq = CAMPAIGN_SEQUENCES[sequenceId];
  if (!seq) return setup.sequenceProgress ?? {};

  const progress: NonNullable<CampaignSetup["sequenceProgress"]> = {
    ...(setup.sequenceProgress ?? {}),
  };
  const doneActions = setup.actionItems.filter((a) => a.done);
  for (const step of seq.steps) {
    if (progress[step.id]?.done) continue;
    const match = doneActions.some(
      (a) =>
        a.label.toLowerCase().includes(step.label.slice(0, 12).toLowerCase()) ||
        (step.toolId && a.toolId === step.toolId),
    );
    if (match) {
      progress[step.id] = { done: true, doneAt: new Date().toISOString() };
    }
  }
  return progress;
}

export function migrateCampaignSetupV2(
  project: UserProject,
  setup: CampaignSetup,
): CampaignSetup {
  if (setup.schemaVersion === 2) return setup;

  const stage = setup.acquisitionStage;
  const channel = setup.primaryChannel;
  const motion = recommendGtmMotion(stage, channel, setup);
  const sequenceId = (setup.activeSequenceId ?? resolveSequenceId(stage, channel, motion)) as CampaignSequenceId;
  const profile: MarketingProfile =
    setup.marketingProfile ?? setup.profile ?? profileFromStage(stage);

  const icpStructured: CampaignIcpStructured | undefined = setup.icpStructured ?? (
    setup.icpSummary
      ? { segment: setup.icpSummary.slice(0, 200), pain: setup.positioning }
      : undefined
  );

  return {
    ...setup,
    schemaVersion: 2,
    gtmMotion: setup.gtmMotion ?? motion,
    gtmEngineFocus: setup.gtmEngineFocus ?? getDominantGtmEngine(stage),
    marketingProfile: profile,
    profile,
    activeSequenceId: sequenceId,
    sequenceProgress: mapActionProgressToSequence(
      { ...setup, activeSequenceId: sequenceId },
      sequenceId,
    ),
    icpStructured,
    assetChecklist:
      setup.assetChecklist?.length === ASSET_CHECKLIST_SIZE
        ? setup.assetChecklist
        : migrateLaunchChecklistToAssets(project),
    attributionQuestionEnabled: setup.attributionQuestionEnabled ?? false,
    messageMarketFitNotes: setup.messageMarketFitNotes ?? [],
    infraGates: setup.infraGates ?? {},
    demandChecklist: setup.demandChecklist ?? {},
  };
}

export function migrateProjectCampaignV2(project: UserProject): UserProject {
  if (!project.campaignSetup) return project;
  return {
    ...project,
    campaignSetup: migrateCampaignSetupV2(project, project.campaignSetup),
    marketingProfile:
      project.campaignSetup.marketingProfile ??
      project.marketingProfile ??
      profileFromStage(project.campaignSetup.acquisitionStage),
  };
}
