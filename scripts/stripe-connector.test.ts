import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { StripeConnectorError } from "../src/lib/connectors/stripe/errors.ts";
import {
  computeDeltasFromLastSnapshot,
  isAnalyticsNotFoundError,
  parseLastSnapshot,
} from "../src/lib/connectors/stripe/errors.ts";
import {
  centsToEuros,
  isFullSecretKey,
  isRestrictedKey,
  parseRakCredential,
} from "../src/lib/connectors/stripe/keys.ts";
import { normalizePriceToMonthlyMrrCents } from "../src/lib/connectors/stripe/mrr-math.ts";
import {
  buildSnapshotsFromAnalytics,
  buildSnapshotsFromV1,
} from "../src/lib/connectors/stripe/snapshots.ts";

describe("stripe connector — key validation", () => {
  it("accepts restricted keys", () => {
    assert.equal(isRestrictedKey("rk_test_abc"), true);
    assert.equal(isRestrictedKey("rk_live_xyz"), true);
    assert.equal(isRestrictedKey("sk_test_abc"), false);
  });

  it("rejects full secret keys", () => {
    assert.equal(isFullSecretKey("sk_live_abc"), true);
    assert.throws(
      () => parseRakCredential("sk_test_abc123"),
      /clé restreinte/,
    );
  });

  it("parses rak credential with livemode", () => {
    const cred = parseRakCredential("rk_test_abc", "eur");
    assert.equal(cred.secretKey, "rk_test_abc");
    assert.equal(cred.livemode, false);
    assert.equal(cred.currency, "eur");
  });
});

describe("stripe connector — analytics not found detection", () => {
  it("detects 404 status", () => {
    const err = new StripeConnectorError("x", "other", 404);
    assert.equal(isAnalyticsNotFoundError(err), true);
  });

  it("detects not_found code", () => {
    const err = new StripeConnectorError("x", "not_found", 400);
    assert.equal(isAnalyticsNotFoundError(err), true);
  });

  it("uses message heuristic only as fallback", () => {
    const err = new Error("The API method cannot be found.");
    assert.equal(isAnalyticsNotFoundError(err), true);
  });

  it("ignores unrelated errors", () => {
    const err = new StripeConnectorError("Permission denied", "permission_denied", 403);
    assert.equal(isAnalyticsNotFoundError(err), false);
  });
});

describe("stripe connector — mrr math", () => {
  it("normalizes monthly price", () => {
    const cents = normalizePriceToMonthlyMrrCents(
      { unit_amount: 2900, currency: "eur", recurring: { interval: "month" } },
      1,
    );
    assert.equal(cents, 2900);
  });

  it("normalizes yearly price to monthly", () => {
    const cents = normalizePriceToMonthlyMrrCents(
      { unit_amount: 12000, currency: "eur", recurring: { interval: "year" } },
      1,
    );
    assert.equal(cents, 1000);
  });

  it("returns 0 without recurring", () => {
    assert.equal(
      normalizePriceToMonthlyMrrCents({ unit_amount: 1000, currency: "eur" }, 1),
      0,
    );
  });
});

describe("stripe connector — analytics mapping", () => {
  it("maps mrr series and growth buckets to snapshots", () => {
    const mrrSeries = new Map<string, number>([
      ["2025-01", 10000],
      ["2025-02", 15000],
    ]);
    const growth = new Map<string, Map<string, number>>([
      ["2025-02", new Map([
        ["new", 8000],
        ["expansion", 2000],
        ["churn", 5000],
      ])],
    ]);
    const months = ["2025-01", "2025-02"];

    const snapshots = buildSnapshotsFromAnalytics(mrrSeries, growth, months, 3);

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.mrr, 100);
    assert.equal(snapshots[0]!.customers, 2);
    assert.equal(snapshots[1]!.mrr, 150);
    assert.equal(snapshots[1]!.customers, 3);
    assert.equal(snapshots[1]!.newMrr, 80);
    assert.equal(snapshots[1]!.expansionMrr, 20);
    assert.equal(snapshots[1]!.churnedMrr, 50);
    assert.equal(snapshots[1]!.source, "stripe");
    assert.equal(snapshots[1]!.arr, 1800);
  });

  it("converts cents to euros", () => {
    assert.equal(centsToEuros(12345), 123.45);
  });
});

describe("stripe connector — v1 snapshots", () => {
  it("builds current month from subscriptions", () => {
    const months = ["2025-01", "2025-02"];
    const snapshots = buildSnapshotsFromV1({
      currentMrr: 150,
      activeCustomers: 4,
      monthKeys: months,
      invoiceMrrByMonth: new Map([["2025-01", 100]]),
    });

    assert.equal(snapshots[0]!.mrr, 100);
    assert.equal(snapshots[0]!.customers, 0);
    assert.equal(snapshots[1]!.mrr, 150);
    assert.equal(snapshots[1]!.customers, 4);
    assert.equal(snapshots[1]!.arr, 1800);
  });

  it("applies deltas from last snapshot on latest month", () => {
    const snapshots = buildSnapshotsFromV1({
      currentMrr: 200,
      activeCustomers: 5,
      monthKeys: ["2025-02"],
      lastSnapshot: { date: "2025-01", mrr: 150, customers: 4 },
    });

    assert.equal(snapshots[0]!.newMrr, 50);
    assert.equal(snapshots[0]!.churnedMrr, 0);
  });
});

describe("stripe connector — last snapshot metadata", () => {
  it("parses valid lastSnapshot", () => {
    const parsed = parseLastSnapshot({ date: "2025-01", mrr: 100, customers: 2 });
    assert.deepEqual(parsed, { date: "2025-01", mrr: 100, customers: 2 });
  });

  it("computes churn delta", () => {
    const deltas = computeDeltasFromLastSnapshot(
      { mrr: 80, customers: 3 },
      { date: "2025-01", mrr: 100, customers: 4 },
    );
    assert.equal(deltas.newMrr, 0);
    assert.equal(deltas.churnedMrr, 20);
  });
});
