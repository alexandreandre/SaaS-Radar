import type { ProductStream } from "@/lib/connectors/streams";
import type { HogQLQueryResponse } from "@/lib/connectors/posthog/types";

type RetentionValue = {
  count?: number;
  percentage?: number | null;
};

type RetentionResultRow = {
  date?: string;
  label?: string;
  values?: RetentionValue[];
};

type RetentionQueryResponse = {
  results?: RetentionResultRow[];
  result?: RetentionResultRow[];
};

export function parseFeatureUsageTop(response: HogQLQueryResponse): string {
  const eventIdx = response.columns?.findIndex((c) => c === "event") ?? 0;
  const firstRow = response.results?.[0];
  if (!firstRow?.length) return "";
  const event = firstRow[eventIdx];
  return typeof event === "string" && event.trim() ? event.trim() : "";
}

export function parseActivationRate(response: HogQLQueryResponse): number {
  const rateIdx = response.columns?.findIndex((c) => c === "rate") ?? 0;
  const firstRow = response.results?.[0];
  if (!firstRow?.length) return 0;
  const raw = Number(firstRow[rateIdx] ?? 0);
  if (!Number.isFinite(raw)) return 0;
  return Math.max(0, Math.min(100, Math.round(raw)));
}

export function parseRetentionD7(response: RetentionQueryResponse): number {
  const rows = response.results ?? response.result ?? [];
  if (!rows.length) return 0;

  const percentages: number[] = [];

  for (const row of rows) {
    const values = row.values ?? [];
    const day7 = values[7];
    if (day7 && typeof day7.percentage === "number" && Number.isFinite(day7.percentage)) {
      percentages.push(day7.percentage);
    }
  }

  if (percentages.length === 0) {
    const first = rows[0]?.values?.[7];
    if (first && typeof first.percentage === "number" && Number.isFinite(first.percentage)) {
      return Math.max(0, Math.min(100, Math.round(first.percentage)));
    }
    return 0;
  }

  const avg = percentages.reduce((sum, v) => sum + v, 0) / percentages.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

function parseRetentionRate(response: HogQLQueryResponse | RetentionQueryResponse): number {
  const hogqlRate = parseActivationRate(response as HogQLQueryResponse);
  if (hogqlRate > 0) return hogqlRate;
  return parseRetentionD7(response as RetentionQueryResponse);
}

export function buildProductStreamFromQueries(input: {
  featureTop?: HogQLQueryResponse;
  activationRate?: HogQLQueryResponse;
  retention?: HogQLQueryResponse | RetentionQueryResponse;
}): ProductStream {
  return {
    type: "product",
    featureUsageTop: parseFeatureUsageTop(input.featureTop ?? {}),
    activationRate: parseActivationRate(input.activationRate ?? {}),
    retentionD7: parseRetentionRate(input.retention ?? {}),
  };
}
