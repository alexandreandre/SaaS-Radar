import type { ConnectorId } from "@/lib/connectors/types";

export type FinanceStream = {
  type: "finance";
  cashBalance: number;
  monthlyInflow: number;
  monthlyOutflow: number;
  runwayDays: number;
};

export type AccountingStream = {
  type: "accounting";
  revenueBooked: number;
  expensesBooked: number;
  vatDue: number;
};

export type ProductStream = {
  type: "product";
  activationRate: number;
  retentionD7: number;
  featureUsageTop: string;
};

export type SupportStream = {
  type: "support";
  openTickets: number;
  avgResponseHours: number;
  csat: number;
};

export type DevStream = {
  type: "dev";
  deploysLast30d: number;
  openIssues: number;
  errorRate: number;
  uptimePct: number;
};

export type CrmStream = {
  type: "crm";
  pipelineValue: number;
  dealsWon: number;
  dealsLost: number;
  avgCycleDays: number;
};

export type CommsStream = {
  type: "comms";
  alertsSent: number;
  lastAlertAt: string;
};

export type PaymentStream = {
  type: "payment";
  failedPayments: number;
  recoveredPayments: number;
};

export type ConnectorStreamPayload =
  | FinanceStream
  | AccountingStream
  | ProductStream
  | SupportStream
  | DevStream
  | CrmStream
  | CommsStream
  | PaymentStream;

export type ConnectorStreams = Partial<Record<ConnectorId, ConnectorStreamPayload>>;

export function getStreamType(
  payload: ConnectorStreamPayload
): ConnectorStreamPayload["type"] {
  return payload.type;
}

export function mergeConnectorStreams(
  existing: ConnectorStreams,
  connectorId: ConnectorId,
  stream: ConnectorStreamPayload
): ConnectorStreams {
  return { ...existing, [connectorId]: stream };
}

export function removeConnectorStream(
  streams: ConnectorStreams,
  connectorId: ConnectorId
): ConnectorStreams {
  const next = { ...streams };
  delete next[connectorId];
  return next;
}
