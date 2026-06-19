/** Helpers purs (testables sans server-only). */

export class StripeConnectorError extends Error {
  constructor(
    message: string,
    readonly code?: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "StripeConnectorError";
  }
}

export type StripeLikeError = {
  status?: number;
  code?: string;
  message?: string;
};

export function isAnalyticsNotFoundError(err: unknown): boolean {
  if (!(err instanceof Error)) return false;
  const stripeErr = err as StripeLikeError;

  if (stripeErr.status === 404) return true;
  if (stripeErr.code === "not_found") return true;

  const msg = stripeErr.message?.toLowerCase() ?? "";
  if (msg.includes("method cannot be found") || msg.includes("cannot be found")) {
    return true;
  }

  return false;
}

export type LastSnapshotMeta = {
  date: string;
  mrr: number;
  customers: number;
};

export type MonthlyGrowth = {
  newMrr: number;
  expansionMrr: number;
  churnedMrr: number;
};

export function parseLastSnapshot(value: unknown): LastSnapshotMeta | undefined {
  if (!value || typeof value !== "object") return undefined;
  const o = value as Record<string, unknown>;
  if (typeof o.date !== "string" || typeof o.mrr !== "number" || typeof o.customers !== "number") {
    return undefined;
  }
  return { date: o.date, mrr: o.mrr, customers: o.customers };
}

export function computeDeltasFromLastSnapshot(
  current: { mrr: number; customers: number },
  last?: LastSnapshotMeta,
): { newMrr: number; expansionMrr: number; churnedMrr: number } {
  if (!last) {
    return { newMrr: 0, expansionMrr: 0, churnedMrr: 0 };
  }

  const delta = Math.round((current.mrr - last.mrr) * 100) / 100;
  if (delta >= 0) {
    return { newMrr: delta, expansionMrr: 0, churnedMrr: 0 };
  }
  return { newMrr: 0, expansionMrr: 0, churnedMrr: Math.abs(delta) };
}
