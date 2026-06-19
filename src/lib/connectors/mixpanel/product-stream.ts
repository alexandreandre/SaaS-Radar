import type { ProductStream } from "@/lib/connectors/streams";
import type { RetentionQueryResponse } from "@/lib/connectors/mixpanel/types";

function parseRetentionIntervalRate(
  response: RetentionQueryResponse,
  intervalIndex: number,
): number {
  const percentages: number[] = [];

  for (const row of Object.values(response)) {
    const first = row.first ?? 0;
    const count = row.counts?.[intervalIndex];
    if (first > 0 && typeof count === "number" && Number.isFinite(count)) {
      percentages.push((count / first) * 100);
    }
  }

  if (percentages.length === 0) return 0;
  const avg = percentages.reduce((sum, value) => sum + value, 0) / percentages.length;
  return Math.max(0, Math.min(100, Math.round(avg)));
}

export function parseRetentionD7(response: RetentionQueryResponse): number {
  return parseRetentionIntervalRate(response, 7);
}

export function parseActivationRate(response: RetentionQueryResponse): number {
  return parseRetentionIntervalRate(response, 7);
}

export function parseTopEventFromExportJsonl(text: string): string {
  const counts = new Map<string, number>();

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const row = JSON.parse(trimmed) as { event?: string };
      const event = row.event?.trim();
      if (!event || event.startsWith("$")) continue;
      counts.set(event, (counts.get(event) ?? 0) + 1);
    } catch {
      continue;
    }
  }

  let top = "";
  let max = 0;
  for (const [event, count] of Array.from(counts.entries())) {
    if (count > max) {
      max = count;
      top = event;
    }
  }

  return top;
}

export function buildProductStreamFromQueries(input: {
  activationRetention?: RetentionQueryResponse;
  retention?: RetentionQueryResponse;
  exportJsonl?: string;
}): ProductStream {
  return {
    type: "product",
    featureUsageTop: parseTopEventFromExportJsonl(input.exportJsonl ?? ""),
    activationRate: parseActivationRate(input.activationRetention ?? {}),
    retentionD7: parseRetentionD7(input.retention ?? {}),
  };
}
