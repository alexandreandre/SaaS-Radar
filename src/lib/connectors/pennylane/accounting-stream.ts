import type { AccountingStream } from "@/lib/connectors/streams";
import type { PennylaneTrialBalanceItem } from "@/lib/connectors/pennylane/types";

export function parseAmount(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }
  const normalized = value.trim().replace(/\s/g, "").replace(",", ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

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

function accountKey(number: string, formattedNumber: string): string {
  const digits = formattedNumber.replace(/\D/g, "") || number.replace(/\D/g, "");
  return digits;
}

export function classifyAccount(number: string, formattedNumber: string): "6" | "7" | "445" | "other" {
  const key = accountKey(number, formattedNumber);
  if (key.startsWith("445")) return "445";
  if (key.startsWith("7")) return "7";
  if (key.startsWith("6")) return "6";
  return "other";
}

export function mergeTrialBalancePages(
  pages: PennylaneTrialBalanceItem[][],
): PennylaneTrialBalanceItem[] {
  return pages.flat();
}

export function buildAccountingStreamFromTrialBalance(
  items: PennylaneTrialBalanceItem[],
): AccountingStream {
  let revenueBooked = 0;
  let expensesBooked = 0;
  let vatDue = 0;

  for (const item of items) {
    const debits = parseAmount(item.debits);
    const credits = parseAmount(item.credits);
    const accountClass = classifyAccount(item.number, item.formatted_number);

    if (accountClass === "7") {
      revenueBooked += Math.max(0, credits - debits);
    } else if (accountClass === "6") {
      expensesBooked += Math.max(0, debits - credits);
    } else if (accountClass === "445") {
      vatDue += Math.max(0, credits - debits);
    }
  }

  return {
    type: "accounting",
    revenueBooked: Math.round(revenueBooked * 100) / 100,
    expensesBooked: Math.round(expensesBooked * 100) / 100,
    vatDue: Math.round(vatDue * 100) / 100,
  };
}

export function buildAccountingStreamFromInvoiceTotals(input: {
  customerTotal: number;
  supplierTotal: number;
}): AccountingStream {
  return {
    type: "accounting",
    revenueBooked: Math.round(Math.max(0, input.customerTotal) * 100) / 100,
    expensesBooked: Math.round(Math.max(0, input.supplierTotal) * 100) / 100,
    vatDue: 0,
  };
}

export function isSandboxCompany(regNo: string | undefined): boolean {
  if (!regNo) return false;
  return regNo.toLowerCase().includes("sandbox");
}

export const REQUIRED_TRIAL_BALANCE_SCOPE = "trial_balance:readonly";

export function hasTrialBalanceScope(scopes: string[] = []): boolean {
  return scopes.some(
    (scope) =>
      scope === REQUIRED_TRIAL_BALANCE_SCOPE ||
      scope === "trial_balance:all" ||
      scope === "ledger",
  );
}
