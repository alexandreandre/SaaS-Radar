import type { FinanceStream } from "@/lib/connectors/streams";
import type { QontoBankAccount, QontoTransaction } from "@/lib/connectors/qonto/types";

const INFINITE_RUNWAY_DAYS = 3650;

export function centsToEuros(cents: number): number {
  return Math.round(cents) / 100;
}

export function sumBalanceCents(accounts: QontoBankAccount[]): number {
  return accounts
    .filter(
      (account) =>
        account.is_external_account !== true &&
        (account.status === "active" || account.status === undefined),
    )
    .reduce((sum, account) => sum + (account.balance_cents ?? 0), 0);
}

export function currentMonthSettledRange(monthKey?: string): { from: string; to: string } {
  const key = monthKey ?? new Date().toISOString().slice(0, 7);
  const [yearStr, monthStr] = key.split("-");
  const year = Number(yearStr);
  const month = Number(monthStr);
  const from = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const to = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
  return { from: from.toISOString(), to: to.toISOString() };
}

export function aggregateMonthlyFlows(
  transactions: QontoTransaction[],
  monthKey?: string,
): { monthlyInflow: number; monthlyOutflow: number } {
  const key = monthKey ?? new Date().toISOString().slice(0, 7);
  let inflowCents = 0;
  let outflowCents = 0;

  for (const transaction of transactions) {
    const settledAt = transaction.settled_at ?? transaction.emitted_at ?? transaction.updated_at;
    if (!settledAt || !settledAt.startsWith(key)) continue;
    if (transaction.status && transaction.status !== "completed") continue;

    const amount = transaction.amount_cents ?? 0;
    if (transaction.side === "credit") {
      inflowCents += amount;
    } else if (transaction.side === "debit") {
      outflowCents += amount;
    }
  }

  return {
    monthlyInflow: centsToEuros(inflowCents),
    monthlyOutflow: centsToEuros(outflowCents),
  };
}

export function computeRunwayDays(
  cashBalance: number,
  monthlyInflow: number,
  monthlyOutflow: number,
): number {
  const netBurn = monthlyOutflow - monthlyInflow;
  if (netBurn <= 0) return INFINITE_RUNWAY_DAYS;
  return Math.round(cashBalance / (netBurn / 30));
}

export function buildQontoFinanceStream(input: {
  accounts: QontoBankAccount[];
  transactions: QontoTransaction[];
  monthKey?: string;
}): FinanceStream {
  const cashBalance = centsToEuros(sumBalanceCents(input.accounts));
  const { monthlyInflow, monthlyOutflow } = aggregateMonthlyFlows(
    input.transactions,
    input.monthKey,
  );
  const runwayDays = computeRunwayDays(cashBalance, monthlyInflow, monthlyOutflow);

  return {
    type: "finance",
    cashBalance,
    monthlyInflow,
    monthlyOutflow,
    runwayDays,
  };
}
