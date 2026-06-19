import type { AccountingStream } from "@/lib/connectors/streams";
import type {
  AbbyBillingCollectionItem,
  AbbyBillingStatistics,
  AbbyPurchaseRegisterItem,
  AbbyRevenueSource,
} from "@/lib/connectors/abby/types";

export function getCurrentMonthPeriod(now = new Date()): {
  periodStart: string;
  periodEnd: string;
} {
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthKey = String(month + 1).padStart(2, "0");
  const lastDay = new Date(year, month + 1, 0).getDate();
  return {
    periodStart: `${year}-${monthKey}-01`,
    periodEnd: `${year}-${monthKey}-${String(lastDay).padStart(2, "0")}`,
  };
}

export function normalizeBillingAmount(
  value: number | null | undefined,
  unit: "cents" | "euros" = "cents",
): number {
  if (value === null || value === undefined || !Number.isFinite(value)) return 0;
  return unit === "cents" ? Math.round(value) / 100 : value;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

function isPaidBillingState(state: string | undefined): boolean {
  if (!state) return false;
  return state.toLowerCase() === "paid";
}

function timestampInPeriod(
  timestamp: number | null | undefined,
  periodStart: string,
  periodEnd: string,
): boolean {
  if (!timestamp) return false;
  const date = new Date(timestamp * 1000);
  if (Number.isNaN(date.getTime())) return false;
  const iso = date.toISOString().slice(0, 10);
  return iso >= periodStart && iso <= periodEnd;
}

function emittedAtInPeriod(
  emittedAt: string | undefined,
  periodStart: string,
  periodEnd: string,
): boolean {
  if (!emittedAt) return false;
  const iso = emittedAt.slice(0, 10);
  return iso >= periodStart && iso <= periodEnd;
}

export function aggregatePurchaseRegister(
  items: AbbyPurchaseRegisterItem[],
  periodStart: string,
  periodEnd: string,
): { expensesBooked: number; vatDeductible: number } {
  let expensesBooked = 0;
  let vatDeductible = 0;

  for (const item of items) {
    if (!emittedAtInPeriod(item.emittedAt, periodStart, periodEnd)) continue;
    expensesBooked += normalizeBillingAmount(item.amount, "euros");
    vatDeductible += normalizeBillingAmount(item.vatAmount, "euros");
  }

  return {
    expensesBooked: roundMoney(expensesBooked),
    vatDeductible: roundMoney(vatDeductible),
  };
}

export function aggregateBillingDocuments(
  docs: AbbyBillingCollectionItem[],
  periodStart: string,
  periodEnd: string,
): { revenueBooked: number; vatCollected: number } {
  let revenueBooked = 0;
  let vatCollected = 0;

  for (const doc of docs) {
    if (doc.type && doc.type !== "invoice") continue;
    if (!isPaidBillingState(doc.state)) continue;

    const inPeriod =
      timestampInPeriod(doc.paidAt, periodStart, periodEnd) ||
      (!doc.paidAt && timestampInPeriod(doc.emittedAt, periodStart, periodEnd));
    if (!inPeriod) continue;

    const amountHt = normalizeBillingAmount(doc.totalAmountWithoutTaxAfterDiscount, "cents");
    const amountTtc = normalizeBillingAmount(doc.totalAmountWithTaxAfterDiscount, "cents");
    revenueBooked += amountHt;
    vatCollected += Math.max(0, amountTtc - amountHt);
  }

  return {
    revenueBooked: roundMoney(revenueBooked),
    vatCollected: roundMoney(vatCollected),
  };
}

export function buildAccountingStreamFromBillingStatistics(
  stats: AbbyBillingStatistics,
): { revenueBooked: number; vatCollected: number } {
  const revenueBooked = normalizeBillingAmount(stats.amountPaidWithoutTax, "cents");
  const vatCollected = normalizeBillingAmount(stats.amountPaidTotalTax, "cents");
  return {
    revenueBooked: roundMoney(revenueBooked),
    vatCollected: roundMoney(vatCollected),
  };
}

export function buildAccountingStream(input: {
  revenueBooked: number;
  expensesBooked: number;
  vatCollected: number;
  vatDeductible: number;
}): AccountingStream {
  const vatDue = roundMoney(Math.max(0, input.vatCollected - input.vatDeductible));

  return {
    type: "accounting",
    revenueBooked: roundMoney(Math.max(0, input.revenueBooked)),
    expensesBooked: roundMoney(Math.max(0, input.expensesBooked)),
    vatDue,
  };
}

export function buildAccountingStreamFromTotals(input: {
  revenueBooked: number;
  expensesBooked: number;
  vatCollected: number;
  vatDeductible: number;
  revenueSource: AbbyRevenueSource;
}): { stream: AccountingStream; revenueUnavailable: boolean } {
  const stream = buildAccountingStream(input);
  return {
    stream,
    revenueUnavailable: input.revenueSource === "unavailable",
  };
}
