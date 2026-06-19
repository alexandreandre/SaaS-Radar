import type { ConnectorId } from "@/lib/connectors/types";
import type { ConnectorStreamPayload } from "@/lib/connectors/streams";
import { CONNECTORS, getConnector } from "@/lib/connectors/registry";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import type { UserProject } from "@/lib/portfolio";
import { getDeltaPercent, getMrrBreakdown } from "@/lib/portfolio";
import type { CockpitKpi } from "@/lib/cockpit-metrics";

export const PAYMENT_CONNECTOR_IDS: ConnectorId[] = CONNECTORS.filter(
  (c) => c.category === "payments",
).map((c) => c.id);

export const ACCOUNTING_CONNECTOR_IDS: ConnectorId[] = CONNECTORS.filter(
  (c) => c.category === "accounting",
).map((c) => c.id);

export function hasPaymentConnector(project: UserProject): boolean {
  return (project.integrations ?? []).some(
    (i) =>
      PAYMENT_CONNECTOR_IDS.includes(i.connectorId) &&
      (i.status === "connected" || i.status === "demo")
  );
}

export function getPaymentStreams(project: UserProject) {
  return PAYMENT_CONNECTOR_IDS.flatMap((id) => {
    const stream = project.connectorStreams?.[id];
    if (stream?.type !== "payment") return [];
    return [{ id, name: getConnector(id)?.name ?? id, stream }];
  });
}

export function formatMonthLabel(dateStr: string): string {
  const [y, m] = dateStr.split("-").map(Number);
  if (!y || !m) return dateStr;
  return new Intl.DateTimeFormat("fr-FR", { month: "short", year: "numeric" }).format(
    new Date(y, m - 1, 1)
  );
}

export function formatSnapshotSource(source?: MetricsSnapshot["source"]): string {
  if (!source || source === "manual") return "manuel";
  return source;
}

function computeNrrFromSnapshot(snapshot: MetricsSnapshot): number {
  if (snapshot.mrr <= 0) return 100;
  const net = snapshot.newMrr + snapshot.expansionMrr - snapshot.churnedMrr;
  const startMrr = snapshot.mrr - net;
  if (startMrr <= 0) return 100;
  return Math.round((snapshot.mrr / startMrr) * 1000) / 10;
}

export function buildArpuKpi(
  arpu: number,
  history: MetricsSnapshot[],
  previous?: MetricsSnapshot
): CockpitKpi {
  const prevArpu =
    previous && previous.customers > 0 ? Math.round(previous.mrr / previous.customers) : 0;
  return {
    key: "arpu",
    label: "ARPU",
    value: new Intl.NumberFormat("fr-FR", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    }).format(arpu),
    raw: arpu,
    delta: previous && prevArpu > 0 ? getDeltaPercent(arpu, prevArpu) : null,
    sparkline: history.map((s) => (s.customers > 0 ? Math.round(s.mrr / s.customers) : 0)),
    format: "currency",
  };
}

export function buildNrrKpi(nrr: number, history: MetricsSnapshot[]): CockpitKpi {
  return {
    key: "nrr",
    label: "NRR",
    value: `${nrr} %`,
    raw: nrr,
    delta: null,
    sparkline: history.map((s) => computeNrrFromSnapshot(s)),
    format: "percent",
  };
}

export function getNetMrr(snapshot: MetricsSnapshot): number {
  return getMrrBreakdown(snapshot).netNew;
}

export function getFailedPaymentStreams(
  streams: ReturnType<typeof getPaymentStreams>
): Array<{ id: ConnectorId; name: string; stream: Extract<ConnectorStreamPayload, { type: "payment" }> }> {
  return streams.filter((s) => s.stream.failedPayments > 0);
}
