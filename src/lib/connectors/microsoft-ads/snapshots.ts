import type { MetricsSnapshot } from "@/lib/connectors/types";
import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type {
  MicrosoftAdsDatePart,
  MicrosoftAdsReportDateRange,
  MicrosoftAdsReportRow,
} from "@/lib/connectors/microsoft-ads/types";

export const MICROSOFT_ADS_API_VERSION = "v13";

export function normalizeAccountId(id: string): string {
  return id.replace(/\s/g, "").trim();
}

export function normalizeCustomerId(id: string): string {
  return id.replace(/\s/g, "").trim();
}

export function normalizeMonthSegment(value: string): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}/.test(trimmed)) {
    return trimmed.slice(0, 7);
  }

  const slashMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slashMatch) {
    const month = slashMatch[1]!.padStart(2, "0");
    return `${slashMatch[3]}-${month}`;
  }

  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${parsed.getFullYear()}-${month}`;
  }

  return trimmed.slice(0, 7);
}

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

function formatDatePart(date: Date): MicrosoftAdsDatePart {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  };
}

export function buildReportDateRange(months = 12): MicrosoftAdsReportDateRange {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  const startPart = formatDatePart(start);
  const endPart = formatDatePart(now);
  return {
    startYear: startPart.year,
    startMonth: startPart.month,
    startDay: startPart.day,
    endYear: endPart.year,
    endMonth: endPart.month,
    endDay: endPart.day,
  };
}

export function parseSpend(value: string | number | undefined | null): number {
  const parsed = typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export function parseMetricNumber(value: string | number | undefined | null): number {
  const parsed =
    typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed * 100) / 100;
}

export function parseMetricInt(value: string | number | undefined | null): number {
  const parsed =
    typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : Number(value ?? 0);
  if (!Number.isFinite(parsed)) return 0;
  return Math.round(parsed);
}

export function parseReportCsv(csv: string): MicrosoftAdsReportRow[] {
  const text = csv.replace(/^\uFEFF/, "").trim();
  if (!text) return [];

  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) return [];

  const headers = parseCsvLine(lines[0]!).map((header) => header.trim());
  const headerIndex = new Map(headers.map((header, index) => [header.toLowerCase(), index]));

  const timeIdx = pickColumnIndex(headerIndex, ["timeperiod", "time period"]);
  const spendIdx = pickColumnIndex(headerIndex, ["spend"]);
  const impressionsIdx = pickColumnIndex(headerIndex, ["impressions"]);
  const clicksIdx = pickColumnIndex(headerIndex, ["clicks"]);
  const conversionsQualifiedIdx = pickColumnIndex(headerIndex, [
    "conversionsqualified",
    "conversions qualified",
  ]);
  const conversionsIdx = pickColumnIndex(headerIndex, ["conversions"]);

  const rows: MicrosoftAdsReportRow[] = [];
  for (const line of lines.slice(1)) {
    const cells = parseCsvLine(line);
    if (cells.every((cell) => !cell.trim())) continue;

    const timePeriod = timeIdx >= 0 ? cells[timeIdx]?.trim() : undefined;
    if (!timePeriod || /^total/i.test(timePeriod)) continue;

    rows.push({
      timePeriod,
      spend: spendIdx >= 0 ? cells[spendIdx] : undefined,
      impressions: impressionsIdx >= 0 ? cells[impressionsIdx] : undefined,
      clicks: clicksIdx >= 0 ? cells[clicksIdx] : undefined,
      conversionsQualified:
        conversionsQualifiedIdx >= 0 ? cells[conversionsQualifiedIdx] : undefined,
      conversions: conversionsIdx >= 0 ? cells[conversionsIdx] : undefined,
    });
  }

  return rows;
}

function pickColumnIndex(headerIndex: Map<string, number>, candidates: string[]): number {
  for (const candidate of candidates) {
    const index = headerIndex.get(candidate);
    if (index !== undefined) return index;
  }
  return -1;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i]!;
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function emptySnapshot(date: string): MetricsSnapshot {
  return {
    date,
    mrr: 0,
    newMrr: 0,
    expansionMrr: 0,
    churnedMrr: 0,
    customers: 0,
    signups: 0,
    trials: 0,
    activeUsers: 0,
    mau: 0,
    dau: 0,
    adSpend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    source: "microsoft-ads",
  };
}

export function extractConversions(row: MicrosoftAdsReportRow): number {
  const qualified = row.conversionsQualified;
  if (qualified !== undefined && qualified !== "") {
    return parseMetricNumber(qualified);
  }
  return parseMetricNumber(row.conversions);
}

export function buildSnapshotsFromReportRows(
  rows: MicrosoftAdsReportRow[],
  monthKeys: string[],
): MetricsSnapshot[] {
  const byMonth = new Map<
    string,
    { adSpend: number; impressions: number; clicks: number; conversions: number }
  >();

  for (const row of rows) {
    if (!row.timePeriod) continue;
    const month = normalizeMonthSegment(row.timePeriod);
    const bucket = byMonth.get(month) ?? {
      adSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
    };

    bucket.adSpend += parseSpend(row.spend);
    bucket.impressions += parseMetricInt(row.impressions);
    bucket.clicks += parseMetricInt(row.clicks);
    bucket.conversions += extractConversions(row);
    byMonth.set(month, bucket);
  }

  return monthKeys.map((date) => {
    const bucket = byMonth.get(date);
    if (!bucket) return emptySnapshot(date);

    return {
      ...emptySnapshot(date),
      adSpend: Math.round(bucket.adSpend * 100) / 100,
      impressions: bucket.impressions,
      clicks: bucket.clicks,
      conversions: Math.round(bucket.conversions * 100) / 100,
    };
  });
}
