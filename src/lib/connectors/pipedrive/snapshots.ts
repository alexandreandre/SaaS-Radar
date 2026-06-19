import type { CrmStream } from "@/lib/connectors/streams";
import type { PipedriveDeal, PipedriveDealsSummaryData } from "@/lib/connectors/pipedrive/types";

export function normalizeApiDomain(apiDomain: string): string {
  const trimmed = apiDomain.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function buildTokenExpiry(expiresInSeconds?: number): string | undefined {
  if (!expiresInSeconds || !Number.isFinite(expiresInSeconds)) return undefined;
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

export function parseSummaryValue(summary: PipedriveDealsSummaryData | null | undefined): number {
  if (!summary) return 0;
  const converted = summary.total_currency_converted_value;
  if (typeof converted === "number" && Number.isFinite(converted)) {
    return Math.max(0, converted);
  }

  const valuesTotal = summary.values_total;
  if (valuesTotal && typeof valuesTotal === "object") {
    let total = 0;
    for (const entry of Object.values(valuesTotal)) {
      if (typeof entry?.value === "number" && Number.isFinite(entry.value)) {
        total += entry.value;
      }
    }
    return Math.max(0, total);
  }

  return 0;
}

export function parseSummaryCount(summary: PipedriveDealsSummaryData | null | undefined): number {
  if (!summary) return 0;
  const count = summary.total_count;
  if (typeof count === "number" && Number.isFinite(count)) {
    return Math.max(0, Math.round(count));
  }
  return 0;
}

function parsePipedriveDate(value: string | null | undefined): number | null {
  if (!value || typeof value !== "string") return null;
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseDealCycleDays(deals: PipedriveDeal[], maxDeals = 200): number {
  const sample = deals.slice(0, maxDeals);
  const cycleDays: number[] = [];

  for (const deal of sample) {
    const addTime = parsePipedriveDate(deal.add_time);
    const wonTime = parsePipedriveDate(deal.won_time ?? deal.close_time);
    if (addTime === null || wonTime === null || wonTime < addTime) continue;
    const days = (wonTime - addTime) / (1000 * 60 * 60 * 24);
    if (Number.isFinite(days) && days >= 0) {
      cycleDays.push(days);
    }
  }

  if (cycleDays.length === 0) return 0;
  const average = cycleDays.reduce((sum, value) => sum + value, 0) / cycleDays.length;
  return Math.round(average * 10) / 10;
}

export function buildCrmStream(input: {
  pipelineValue: number;
  dealsWon: number;
  dealsLost: number;
  avgCycleDays: number;
}): CrmStream {
  return {
    type: "crm",
    pipelineValue: Math.max(0, Math.round(input.pipelineValue)),
    dealsWon: Math.max(0, Math.round(input.dealsWon)),
    dealsLost: Math.max(0, Math.round(input.dealsLost)),
    avgCycleDays: Math.max(0, Math.round(input.avgCycleDays * 10) / 10),
  };
}
