import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAccountingStreamFromInvoiceTotals,
  buildAccountingStreamFromTrialBalance,
  classifyAccount,
  getCurrentMonthPeriod,
  hasTrialBalanceScope,
  mergeTrialBalancePages,
  parseAmount,
} from "../src/lib/connectors/pennylane/accounting-stream.ts";
import {
  parsePennylaneApiToken,
  parsePennylaneCompanyTokenCredential,
} from "../src/lib/connectors/pennylane/keys.ts";

describe("pennylane connector — credential parsing", () => {
  it("accepts valid api token", () => {
    const cred = parsePennylaneCompanyTokenCredential("abcdefghijklmnopqrstuvwxyz");
    assert.equal(cred.authType, "company_token");
    assert.equal(cred.apiToken, "abcdefghijklmnopqrstuvwxyz");
  });

  it("rejects empty api token", () => {
    assert.throws(() => parsePennylaneApiToken(""), /Token API Pennylane/);
  });

  it("rejects short api token", () => {
    assert.throws(() => parsePennylaneApiToken("short"), /Format de token/);
  });
});

describe("pennylane connector — period", () => {
  it("returns current calendar month bounds", () => {
    const { periodStart, periodEnd } = getCurrentMonthPeriod(new Date("2026-03-15T12:00:00Z"));
    assert.equal(periodStart, "2026-03-01");
    assert.equal(periodEnd, "2026-03-31");
  });
});

describe("pennylane connector — trial balance mapping", () => {
  it("maps revenue, expenses and vat from PCG accounts", () => {
    const stream = buildAccountingStreamFromTrialBalance([
      {
        number: "706",
        formatted_number: "70600000",
        label: "Prestations",
        debits: "0.00",
        credits: "12000.50",
      },
      {
        number: "606",
        formatted_number: "60610000",
        label: "Achats",
        debits: "2500.00",
        credits: "100.00",
      },
      {
        number: "445",
        formatted_number: "44571000",
        label: "TVA à décaisser",
        debits: "0.00",
        credits: "800.00",
      },
    ]);

    assert.equal(stream.type, "accounting");
    assert.equal(stream.revenueBooked, 12000.5);
    assert.equal(stream.expensesBooked, 2400);
    assert.equal(stream.vatDue, 800);
  });

  it("classifies accounts by formatted number", () => {
    assert.equal(classifyAccount("706", "70600000"), "7");
    assert.equal(classifyAccount("606", "60600000"), "6");
    assert.equal(classifyAccount("445", "44571000"), "445");
    assert.equal(classifyAccount("512", "51200000"), "other");
  });

  it("merges paginated trial balance pages", () => {
    const merged = mergeTrialBalancePages([
      [
        {
          number: "706",
          formatted_number: "70600000",
          label: "A",
          debits: "0",
          credits: "100",
        },
      ],
      [
        {
          number: "607",
          formatted_number: "60700000",
          label: "B",
          debits: "0",
          credits: "50",
        },
      ],
    ]);
    assert.equal(merged.length, 2);
  });

  it("parses decimal amounts with comma", () => {
    assert.equal(parseAmount("1 234,56"), 1234.56);
  });

  it("builds fallback stream from invoice totals", () => {
    const stream = buildAccountingStreamFromInvoiceTotals({
      customerTotal: 5000,
      supplierTotal: 1200,
    });
    assert.equal(stream.revenueBooked, 5000);
    assert.equal(stream.expensesBooked, 1200);
    assert.equal(stream.vatDue, 0);
  });

  it("detects trial balance scope", () => {
    assert.equal(hasTrialBalanceScope(["customer_invoices:readonly"]), false);
    assert.equal(hasTrialBalanceScope(["trial_balance:readonly"]), true);
    assert.equal(hasTrialBalanceScope(["ledger"]), true);
  });
});
