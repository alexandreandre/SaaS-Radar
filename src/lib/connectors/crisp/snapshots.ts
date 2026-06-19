import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { CrispAnalyticsGeneratePoint } from "@/lib/connectors/crisp/types";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { SupportStream } from "@/lib/connectors/streams";

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function buildDateRangeForMonths(months = 12): { from: string; to: string } {
  const monthKeys = getMonthKeys(months);
  const first = monthKeys[0];
  const last = monthKeys.at(-1);
  if (!first || !last) {
    const now = new Date();
    const iso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    return { from: iso, to: iso };
  }

  const [lastYear, lastMonth] = last.split("-").map(Number);
  const endDate = new Date(lastYear!, lastMonth!, 0);
  const to = `${lastYear}-${String(lastMonth).padStart(2, "0")}-${String(endDate.getDate()).padStart(2, "0")}`;

  return { from: `${first}-01`, to };
}

export function buildLast30DaysRange(): { from: string; to: string } {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - 30);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

export function normalizeMonthSegment(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}$/.test(trimmed)) return trimmed;
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 7);
  const parsed = Date.parse(trimmed);
  if (!Number.isNaN(parsed)) {
    const d = new Date(parsed);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }
  return trimmed.slice(0, 7);
}

export function extractAnalyticsPoints(payload: unknown): CrispAnalyticsGeneratePoint[] {
  if (!payload || typeof payload !== "object") return [];

  const record = payload as Record<string, unknown>;
  if (Array.isArray(record.data)) {
    return record.data as CrispAnalyticsGeneratePoint[];
  }

  const nested = record.data;
  if (nested && typeof nested === "object") {
    const inner = (nested as Record<string, unknown>).data;
    if (Array.isArray(inner)) {
      return inner as CrispAnalyticsGeneratePoint[];
    }
  }

  if (Array.isArray(payload)) {
    return payload as CrispAnalyticsGeneratePoint[];
  }

  return [];
}

export function pointMetricValue(point: CrispAnalyticsGeneratePoint): number {
  if (typeof point.unique_hits === "number") return point.unique_hits;
  if (typeof point.value === "number") return point.value;
  if (typeof point.sum_value === "number" && typeof point.sum_hits === "number" && point.sum_hits > 0) {
    return point.sum_value / point.sum_hits;
  }
  if (typeof point.hits === "number") return point.hits;
  return 0;
}

export function mapVisitorAnalyticsToSnapshots(input: {
  monthKeys: string[];
  points: CrispAnalyticsGeneratePoint[];
}): MetricsSnapshot[] {
  const byMonth = new Map<string, number>();

  for (const point of input.points) {
    const period = point.period;
    if (!period) continue;
    const month = normalizeMonthSegment(period);
    byMonth.set(month, Math.max(0, Math.round(pointMetricValue(point))));
  }

  return input.monthKeys.map((date) => emptySnapshot(date, byMonth.get(date) ?? 0));
}

export function mapResponseTimeToHours(rawValue: number): number {
  if (!Number.isFinite(rawValue) || rawValue <= 0) return 0;
  let seconds = rawValue;
  if (rawValue > 86_400) {
    seconds = rawValue / 1000;
  }
  return Math.max(0, Math.round((seconds / 3600) * 10) / 10);
}

export function mapRatingToCsatPercent(rawRating: number): number {
  if (!Number.isFinite(rawRating) || rawRating <= 0) return 0;
  const normalized = rawRating <= 5 ? rawRating : rawRating / 5;
  return Math.max(0, Math.min(100, Math.round((normalized / 5) * 100)));
}

export function averagePointValue(points: CrispAnalyticsGeneratePoint[]): number {
  if (points.length === 0) return 0;
  const total = points.reduce((sum, point) => sum + pointMetricValue(point), 0);
  return total / points.length;
}

export function buildSupportStream(input: {
  openTickets: number;
  responseTimePoints: CrispAnalyticsGeneratePoint[];
  ratingPoints: CrispAnalyticsGeneratePoint[];
}): SupportStream {
  const avgRaw =
    input.responseTimePoints.length === 1
      ? pointMetricValue(input.responseTimePoints[0]!)
      : averagePointValue(input.responseTimePoints);

  const ratingRaw =
    input.ratingPoints.length === 1
      ? pointMetricValue(input.ratingPoints[0]!)
      : averagePointValue(input.ratingPoints);

  return {
    type: "support",
    openTickets: Math.max(0, Math.round(input.openTickets)),
    avgResponseHours: mapResponseTimeToHours(avgRaw),
    csat: mapRatingToCsatPercent(ratingRaw),
  };
}

function emptySnapshot(date: string, activeUsers: number): MetricsSnapshot {
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
    source: "crisp",
  };
}
