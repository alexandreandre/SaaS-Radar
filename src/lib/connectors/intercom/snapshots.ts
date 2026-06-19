import { mapResponseTimeToHours } from "@/lib/connectors/crisp/snapshots";
import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { IntercomConversation } from "@/lib/connectors/intercom/types";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { SupportStream } from "@/lib/connectors/streams";

export const INTERCOM_API_VERSION = "2.15";

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function resolveIntercomApiBase(region?: string | null): string {
  const normalized = region?.trim().toUpperCase();
  if (normalized === "EU") return "https://api.eu.intercom.io";
  if (normalized === "AU") return "https://api.au.intercom.io";
  return "https://api.intercom.io";
}

export function monthUnixRange(monthKey: string): { start: number; end: number } {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const start = Math.floor(Date.UTC(year, month - 1, 1) / 1000);
  const end = Math.floor(Date.UTC(year, month, 0, 23, 59, 59) / 1000);
  return { start, end };
}

export function last30DaysUnixRange(): { start: number; end: number } {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 30 * 24 * 60 * 60;
  return { start, end };
}

export function computeCsatPercent(rated4Plus: number, totalRated: number): number {
  if (!Number.isFinite(totalRated) || totalRated <= 0) return 0;
  if (!Number.isFinite(rated4Plus) || rated4Plus <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((rated4Plus / totalRated) * 100)));
}

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1]! + sorted[mid]!) / 2;
  }
  return sorted[mid]!;
}

export function extractMedianReplySeconds(conversation: IntercomConversation): number | null {
  const stats = conversation.statistics;
  if (!stats) return null;

  const raw =
    typeof stats.median_time_to_reply === "number" && stats.median_time_to_reply > 0
      ? stats.median_time_to_reply
      : typeof stats.time_to_admin_reply === "number" && stats.time_to_admin_reply > 0
        ? stats.time_to_admin_reply
        : null;

  return raw;
}

export function medianResponseHours(conversations: IntercomConversation[]): number {
  const seconds = conversations
    .map(extractMedianReplySeconds)
    .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);

  if (seconds.length === 0) return 0;
  return mapResponseTimeToHours(median(seconds));
}

export function mapContactsCountsToSnapshots(input: {
  monthKeys: string[];
  countsByMonth: Map<string, number>;
}): MetricsSnapshot[] {
  return input.monthKeys.map((date) => {
    const activeUsers = Math.max(0, Math.round(input.countsByMonth.get(date) ?? 0));
    return {
      date,
      mrr: 0,
      newMrr: 0,
      expansionMrr: 0,
      churnedMrr: 0,
      customers: 0,
      signups: 0,
      trials: 0,
      activeUsers,
      mau: activeUsers,
      dau: 0,
      adSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      source: "intercom" as const,
    };
  });
}

export function buildIntercomSupportStream(input: {
  openTickets: number;
  avgResponseHours: number;
  csat: number;
}): SupportStream {
  return {
    type: "support",
    openTickets: Math.max(0, Math.round(input.openTickets)),
    avgResponseHours: Math.max(0, input.avgResponseHours),
    csat: Math.max(0, Math.min(100, Math.round(input.csat))),
  };
}
