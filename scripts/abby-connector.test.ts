import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseAbbyApiKey, parseAbbyCredential } from "../src/lib/connectors/abby/keys.ts";
import {
  aggregateBillingDocuments,
  aggregatePurchaseRegister,
  buildAccountingStream,
  buildAccountingStreamFromBillingStatistics,
  buildAccountingStreamFromTotals,
  getCurrentMonthPeriod,
  normalizeBillingAmount,
} from "../src/lib/connectors/abby/stream.ts";

describe("abby connector — credential parsing", () => {
  it("accepts valid api key", () => {
    const cred = parseAbbyCredential({
      apiKey: "abcdefghijklmnopqrst",
      commercialName: "Studio Indie",
    });
    assert.equal(cred.apiKey, "abcdefghijklmnopqrst");
    assert.equal(cred.commercialName, "Studio Indie");
  });

  it("rejects empty api key", () => {
    assert.throws(() => parseAbbyApiKey(""), /Clé API Abby/);
  });

  it("rejects short api key", () => {
    assert.throws(() => parseAbbyApiKey("short"), /Format de clé/);
  });
});

describe("abby connector — amount normalization", () => {
  it("converts billing cents to euros", () => {
    assert.equal(normalizeBillingAmount(150000, "cents"), 1500);
    assert.equal(normalizeBillingAmount(99, "cents"), 0.99);
  });

  it("keeps purchase register euros as-is", () => {
    assert.equal(normalizeBillingAmount(420.5, "euros"), 420.5);
  });
});

describe("abby connector — purchase register aggregation", () => {
  it("sums expenses and deductible vat for current month", () => {
    const { periodStart, periodEnd } = getCurrentMonthPeriod(new Date("2026-06-15T12:00:00Z"));
    const totals = aggregatePurchaseRegister(
      [
        { id: "1", amount: 100, vatAmount: 20, emittedAt: `${periodStart}T10:00:00.000Z` },
        { id: "2", amount: 50, vatAmount: 10, emittedAt: `${periodEnd}T10:00:00.000Z` },
        { id: "3", amount: 999, vatAmount: 999, emittedAt: "2025-01-01T10:00:00.000Z" },
      ],
      periodStart,
      periodEnd,
    );

    assert.equal(totals.expensesBooked, 150);
    assert.equal(totals.vatDeductible, 30);
  });
});

describe("abby connector — billing aggregation", () => {
  it("sums paid invoice HT and VAT for the month", () => {
    const paidAt = Math.floor(new Date("2026-06-10T12:00:00Z").getTime() / 1000);
    const totals = aggregateBillingDocuments(
      [
        {
          id: "inv-1",
          type: "invoice",
          state: "paid",
          paidAt,
          totalAmountWithoutTaxAfterDiscount: 100000,
          totalAmountWithTaxAfterDiscount: 120000,
        },
        {
          id: "inv-2",
          type: "invoice",
          state: "draft",
          paidAt,
          totalAmountWithoutTaxAfterDiscount: 50000,
          totalAmountWithTaxAfterDiscount: 60000,
        },
      ],
      "2026-06-01",
      "2026-06-30",
    );

    assert.equal(totals.revenueBooked, 1000);
    assert.equal(totals.vatCollected, 200);
  });

  it("maps billing statistics paid amounts", () => {
    const totals = buildAccountingStreamFromBillingStatistics({
      amountPaidWithoutTax: 250000,
      amountPaidTotalTax: 50000,
    });

    assert.equal(totals.revenueBooked, 2500);
    assert.equal(totals.vatCollected, 500);
  });
});

describe("abby connector — accounting stream", () => {
  it("computes vat due as collected minus deductible with floor at zero", () => {
    const stream = buildAccountingStream({
      revenueBooked: 3000,
      expensesBooked: 800,
      vatCollected: 600,
      vatDeductible: 160,
    });

    assert.equal(stream.type, "accounting");
    assert.equal(stream.revenueBooked, 3000);
    assert.equal(stream.expensesBooked, 800);
    assert.equal(stream.vatDue, 440);
  });

  it("returns zero vat due when deductible exceeds collected", () => {
    const { stream } = buildAccountingStreamFromTotals({
      revenueBooked: 1000,
      expensesBooked: 500,
      vatCollected: 50,
      vatDeductible: 120,
      revenueSource: "billing_statistics",
    });

    assert.equal(stream.vatDue, 0);
  });

  it("flags revenue unavailable when source is unavailable", () => {
    const { revenueUnavailable, stream } = buildAccountingStreamFromTotals({
      revenueBooked: 0,
      expensesBooked: 100,
      vatCollected: 0,
      vatDeductible: 20,
      revenueSource: "unavailable",
    });

    assert.equal(revenueUnavailable, true);
    assert.equal(stream.revenueBooked, 0);
    assert.equal(stream.expensesBooked, 100);
  });
});
