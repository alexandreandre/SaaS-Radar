import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aggregateMonthlyFlows,
  buildQontoFinanceStream,
  centsToEuros,
  computeRunwayDays,
  currentMonthSettledRange,
  sumBalanceCents,
} from "../src/lib/connectors/qonto/snapshots.ts";
import type {
  QontoBankAccount,
  QontoTransaction,
} from "../src/lib/connectors/qonto/types.ts";
import { computeBurnRate, computeRunwayMonths } from "../src/lib/portfolio.ts";

describe("qonto connector — cents conversion", () => {
  it("converts cents to euros", () => {
    assert.equal(centsToEuros(14218843), 142188.43);
    assert.equal(centsToEuros(0), 0);
  });
});

describe("qonto connector — balance aggregation", () => {
  it("sums internal active account balances", () => {
    const accounts: QontoBankAccount[] = [
      { id: "1", balance_cents: 100000, is_external_account: false, status: "active" },
      { id: "2", balance_cents: 50000, is_external_account: true, status: "active" },
      { id: "3", balance_cents: 25000, is_external_account: false, status: "closed" },
      { id: "4", balance_cents: 75000, is_external_account: false, status: "active" },
    ];
    assert.equal(sumBalanceCents(accounts), 175000);
  });
});

describe("qonto connector — month range", () => {
  it("builds settled_at bounds for a month key", () => {
    const range = currentMonthSettledRange("2025-06");
    assert.ok(range.from.startsWith("2025-06"));
    assert.ok(range.to.startsWith("2025-06"));
    assert.ok(new Date(range.from) < new Date(range.to));
  });
});

describe("qonto connector — monthly flows", () => {
  it("aggregates credit and debit for the current month", () => {
    const transactions: QontoTransaction[] = [
      {
        id: "t1",
        side: "credit",
        amount_cents: 500000,
        status: "completed",
        settled_at: "2025-06-10T10:00:00.000Z",
      },
      {
        id: "t2",
        side: "debit",
        amount_cents: 120000,
        status: "completed",
        settled_at: "2025-06-15T10:00:00.000Z",
      },
      {
        id: "t3",
        side: "credit",
        amount_cents: 80000,
        status: "completed",
        settled_at: "2025-05-15T10:00:00.000Z",
      },
      {
        id: "t4",
        side: "debit",
        amount_cents: 50000,
        status: "pending",
        settled_at: "2025-06-20T10:00:00.000Z",
      },
    ];

    const flows = aggregateMonthlyFlows(transactions, "2025-06");
    assert.equal(flows.monthlyInflow, 5000);
    assert.equal(flows.monthlyOutflow, 1200);
  });
});

describe("qonto connector — runway", () => {
  it("computes runway days from net burn", () => {
    assert.equal(computeRunwayDays(30000, 5000, 8000), 300);
    assert.equal(computeRunwayDays(30000, 10000, 5000), 3650);
  });
});

describe("qonto connector — portfolio runway", () => {
  it("uses Qonto burn and cash when connected", () => {
    const project = {
      id: "p1",
      name: "Test",
      currentMrr: 1000,
      integrations: [{ connectorId: "qonto" as const, status: "connected" as const }],
      connectorStreams: {
        qonto: {
          type: "finance" as const,
          cashBalance: 24000,
          monthlyInflow: 3000,
          monthlyOutflow: 5000,
          runwayDays: 360,
        },
      },
      cashOnHand: 1000,
      expenses: [],
    };
    assert.equal(computeBurnRate(project), 2000);
    assert.equal(computeRunwayMonths(project), 12);
  });
});

describe("qonto connector — finance stream", () => {
  it("builds a complete finance stream payload", () => {
    const accounts: QontoBankAccount[] = [
      { id: "1", balance_cents: 3000000, is_external_account: false, status: "active" },
    ];
    const transactions: QontoTransaction[] = [
      {
        id: "t1",
        side: "credit",
        amount_cents: 400000,
        status: "completed",
        settled_at: "2025-06-05T10:00:00.000Z",
      },
      {
        id: "t2",
        side: "debit",
        amount_cents: 600000,
        status: "completed",
        settled_at: "2025-06-12T10:00:00.000Z",
      },
    ];

    const stream = buildQontoFinanceStream({
      accounts,
      transactions,
      monthKey: "2025-06",
    });

    assert.equal(stream.type, "finance");
    assert.equal(stream.cashBalance, 30000);
    assert.equal(stream.monthlyInflow, 4000);
    assert.equal(stream.monthlyOutflow, 6000);
    assert.equal(stream.runwayDays, 450);
  });
});
