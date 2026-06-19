import type { CrmStream } from "@/lib/connectors/streams";
import type { HubSpotDeal, HubSpotPipeline } from "@/lib/connectors/hubspot/types";

export type PipelineStageClassification = {
  wonStageIds: string[];
  lostStageIds: string[];
  openStageIds: string[];
};

export const WON_LOST_WINDOW_DAYS = 30;
export const CYCLE_WINDOW_DAYS = 90;

export function parseDealAmount(amount: string | null | undefined): number {
  if (amount === null || amount === undefined || amount.trim() === "") return 0;
  const parsed = Number(amount);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseProbability(value: string | number | undefined): number {
  if (value === undefined || value === null) return 0;
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function classifyPipelineStages(pipelines: HubSpotPipeline[]): PipelineStageClassification {
  const wonStageIds: string[] = [];
  const lostStageIds: string[] = [];
  const openStageIds: string[] = [];

  for (const pipeline of pipelines) {
    for (const stage of pipeline.stages ?? []) {
      if (!stage.id) continue;
      const isClosed =
        stage.metadata?.isClosed === true || stage.metadata?.isClosed === "true";
      const probability = parseProbability(stage.metadata?.probability);

      if (!isClosed) {
        openStageIds.push(stage.id);
      } else if (probability > 0) {
        wonStageIds.push(stage.id);
      } else {
        lostStageIds.push(stage.id);
      }
    }
  }

  return { wonStageIds, lostStageIds, openStageIds };
}

export function parseHubSpotDate(value: string | null | undefined): number | null {
  if (!value || !value.trim()) return null;
  const asNumber = Number(value);
  if (Number.isFinite(asNumber) && asNumber > 0) {
    return asNumber < 1e12 ? asNumber * 1000 : asNumber;
  }
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
}

export function daysBetween(startMs: number, endMs: number): number {
  const diff = endMs - startMs;
  if (diff <= 0) return 0;
  return diff / (24 * 60 * 60 * 1000);
}

export function computeAvgCycleDays(deals: HubSpotDeal[]): number {
  const cycles: number[] = [];

  for (const deal of deals) {
    const created = parseHubSpotDate(deal.properties?.createdate ?? deal.createdAt);
    const closed = parseHubSpotDate(deal.properties?.closedate);
    if (created === null || closed === null) continue;
    cycles.push(daysBetween(created, closed));
  }

  if (cycles.length === 0) return 0;
  const total = cycles.reduce((sum, days) => sum + days, 0);
  return Math.round(total / cycles.length);
}

export function sumPipelineValue(openDeals: HubSpotDeal[]): number {
  let total = 0;
  for (const deal of openDeals) {
    total += parseDealAmount(deal.properties?.amount);
  }
  return Math.round(total);
}

export function buildHubSpotCrmStream(input: {
  openDeals: HubSpotDeal[];
  wonDeals30d: HubSpotDeal[];
  lostDeals30d: HubSpotDeal[];
  wonDeals90dForCycle: HubSpotDeal[];
}): CrmStream {
  return {
    type: "crm",
    pipelineValue: sumPipelineValue(input.openDeals),
    dealsWon: input.wonDeals30d.length,
    dealsLost: input.lostDeals30d.length,
    avgCycleDays: computeAvgCycleDays(input.wonDeals90dForCycle),
  };
}

export function windowStartMs(days: number, now = Date.now()): number {
  return now - days * 24 * 60 * 60 * 1000;
}

export function hubSpotFilterTimestamp(ms: number): string {
  return String(ms);
}
