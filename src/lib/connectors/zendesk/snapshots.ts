import { mapResponseTimeToHours } from "@/lib/connectors/crisp/snapshots";
import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { ZendeskTicketMetric } from "@/lib/connectors/zendesk/types";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { SupportStream } from "@/lib/connectors/streams";

const SUBDOMAIN_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeSubdomain(input: string): string | null {
  let value = input.trim().toLowerCase();
  if (!value) return null;

  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/\.zendesk\.com(?:\/.*)?$/, "");
  value = value.split("/")[0] ?? value;

  if (!SUBDOMAIN_PATTERN.test(value)) return null;
  return value;
}

export function resolveZendeskApiBase(subdomain: string): string {
  const normalized = normalizeSubdomain(subdomain);
  if (!normalized) {
    throw new Error("Subdomain Zendesk invalide");
  }
  return `https://${normalized}.zendesk.com/api/v2`;
}

export function buildTokenExpiry(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString();
}

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function monthDateRange(monthKey: string): { start: string; end: string } {
  const [yearRaw, monthRaw] = monthKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const start = `${monthKey}-01`;
  const lastDay = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const end = `${monthKey}-${String(lastDay).padStart(2, "0")}`;
  return { start, end };
}

export function last30DaysUnixRange(): { start: number; end: number } {
  const end = Math.floor(Date.now() / 1000);
  const start = end - 30 * 24 * 60 * 60;
  return { start, end };
}

export function computeCsatPercent(good: number, bad: number): number {
  const total = good + bad;
  if (!Number.isFinite(total) || total <= 0) return 0;
  if (!Number.isFinite(good) || good <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((good / total) * 100)));
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

export function extractReplyMinutes(metric: ZendeskTicketMetric): number | null {
  const calendar = metric.reply_time_in_minutes?.calendar;
  if (typeof calendar === "number" && calendar > 0) {
    return calendar;
  }
  return null;
}

export function medianReplyHours(metrics: ZendeskTicketMetric[]): number {
  const minutes = metrics
    .map(extractReplyMinutes)
    .filter((value): value is number => value !== null && Number.isFinite(value) && value > 0);

  if (minutes.length === 0) return 0;
  return mapResponseTimeToHours(median(minutes) * 60);
}

export function buildEndUserSearchQuery(monthKey: string): string {
  const { start, end } = monthDateRange(monthKey);
  return `type:user role:end-user updated>=${start} updated<=${end}`;
}

export function mapEndUserCountsToSnapshots(input: {
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
      source: "zendesk" as const,
    };
  });
}

export function buildZendeskSupportStream(input: {
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
