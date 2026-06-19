import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAccountLabel,
  minorUnitToMajor,
  parseMinorAmount,
  parsePaddleApiKey,
  parsePaddleCredential,
} from "../src/lib/connectors/paddle/keys.ts";
import {
  buildSnapshotsFromMetrics,
  buildSnapshotsFromSubscriptions,
  isSubscriptionActiveAt,
  mergeMetricAndSubscriptionSnapshots,
  normalizePriceToMonthlyMrrMinor,
} from "../src/lib/connectors/paddle/snapshots.ts";
import type {
  PaddlePrice,
  PaddleSubscriptionRecord,
} from "../src/lib/connectors/paddle/types.ts";

const SANDBOX_KEY =
  "pdl_sdbx_apikey_01234567890123456789012345678901234567890123456789012";
const LIVE_KEY =
  "pdl_live_apikey_01234567890123456789012345678901234567890123456789012";

function makePrice(overrides: Partial<PaddlePrice> = {}): PaddlePrice {
  return {
    id: "pri_test",
    billing_cycle: { interval: "month", frequency: 1 },
    unit_price: { amount: "2000", currency_code: "USD" },
    ...overrides,
  };
}

function makeSub(
  id: string,
  overrides: Partial<PaddleSubscriptionRecord["attributes"]> = {},
): PaddleSubscriptionRecord {
  return {
    id,
    attributes: {
      status: "active",
      customer_id: "ctm_01",
      currency_code: "USD",
      created_at: "2025-01-15T00:00:00Z",
      started_at: "2025-01-15T00:00:00Z",
      first_billed_at: "2025-01-15T00:00:00Z",
      canceled_at: null,
      paused_at: null,
      items: [
        {
          status: "active",
          quantity: 1,
          recurring: true,
          price: makePrice(),
        },
      ],
      ...overrides,
    },
  };
}

describe("paddle connector — credential parsing", () => {
  it("accepts sandbox and live api keys", () => {
    const sandbox = parsePaddleCredential({ apiKey: SANDBOX_KEY });
    assert.equal(sandbox.sandbox, true);
    assert.equal(sandbox.currency, "USD");

    const live = parsePaddleCredential({ apiKey: LIVE_KEY, currency: "eur" });
    assert.equal(live.sandbox, false);
    assert.equal(live.currency, "EUR");
  });

  it("rejects empty api key", () => {
    assert.throws(() => parsePaddleApiKey(""), /Clé API Paddle/);
  });

  it("rejects invalid key format", () => {
    assert.throws(() => parsePaddleApiKey("sk_test_invalid"), /Format de clé API Paddle/);
  });

  it("builds account label", () => {
    const cred = parsePaddleCredential({ apiKey: SANDBOX_KEY });
    assert.equal(buildAccountLabel(cred, "USD"), "Paddle · Sandbox (USD)");
    assert.equal(buildAccountLabel({ ...cred, sandbox: false }, "EUR"), "Paddle · Live (EUR)");
  });
});

describe("paddle connector — price normalization", () => {
  it("normalizes monthly price", () => {
    const mrr = normalizePriceToMonthlyMrrMinor(makePrice(), 2);
    assert.equal(mrr, 4000);
  });

  it("normalizes yearly price to monthly", () => {
    const mrr = normalizePriceToMonthlyMrrMinor(
      makePrice({
        billing_cycle: { interval: "year", frequency: 1 },
        unit_price: { amount: "12000", currency_code: "USD" },
      }),
      1,
    );
    assert.equal(mrr, 1000);
  });

  it("converts minor units to major", () => {
    assert.equal(minorUnitToMajor(2000), 20);
    assert.equal(parseMinorAmount("1500"), 1500);
  });
});

describe("paddle connector — subscription activity", () => {
  it("treats active subscription as active at month end", () => {
    const sub = makeSub("sub_1");
    const instant = new Date("2025-02-28T23:59:59.999Z");
    assert.equal(isSubscriptionActiveAt(sub, instant), true);
  });

  it("treats canceled subscription as inactive after canceled_at", () => {
    const sub = makeSub("sub_2", {
      status: "canceled",
      canceled_at: "2025-02-10T00:00:00Z",
    });
    const instant = new Date("2025-02-28T23:59:59.999Z");
    assert.equal(isSubscriptionActiveAt(sub, instant), false);
  });
});

describe("paddle connector — snapshot mapping", () => {
  it("builds snapshots from metrics timeseries", () => {
    const mrrSeries = [
      { timestamp: "2025-01-31T00:00:00Z", amount: "4000" },
      { timestamp: "2025-02-28T00:00:00Z", amount: "6000" },
    ];
    const subSeries = [
      { timestamp: "2025-01-31T00:00:00Z", count: 2 },
      { timestamp: "2025-02-28T00:00:00Z", count: 3 },
    ];

    const snapshots = buildSnapshotsFromMetrics(mrrSeries, subSeries, ["2025-01", "2025-02"]);
    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.source, "paddle");
    assert.equal(snapshots[0]!.mrr, 40);
    assert.equal(snapshots[0]!.customers, 2);
    assert.equal(snapshots[1]!.mrr, 60);
    assert.equal(snapshots[1]!.customers, 3);
  });

  it("builds mrr, newMrr, churnedMrr and customers from subscriptions", () => {
    const subs: PaddleSubscriptionRecord[] = [
      makeSub("sub_10", { customer_id: "ctm_1", first_billed_at: "2025-01-10T00:00:00Z" }),
      makeSub("sub_11", {
        customer_id: "ctm_2",
        first_billed_at: "2025-02-05T00:00:00Z",
      }),
      makeSub("sub_12", {
        customer_id: "ctm_3",
        first_billed_at: "2025-01-01T00:00:00Z",
        status: "canceled",
        canceled_at: "2025-02-12T00:00:00Z",
      }),
    ];

    const snapshots = buildSnapshotsFromSubscriptions(subs, ["2025-01", "2025-02"]);
    assert.equal(snapshots[0]!.mrr, 40);
    assert.equal(snapshots[0]!.newMrr, 40);
    assert.equal(snapshots[0]!.customers, 2);

    assert.equal(snapshots[1]!.mrr, 40);
    assert.equal(snapshots[1]!.newMrr, 20);
    assert.equal(snapshots[1]!.churnedMrr, 20);
    assert.equal(snapshots[1]!.customers, 2);
  });

  it("merges metrics totals with subscription growth", () => {
    const metricsSnapshots = buildSnapshotsFromMetrics(
      [{ timestamp: "2025-02-28T00:00:00Z", amount: "5000" }],
      [{ timestamp: "2025-02-28T00:00:00Z", count: 5 }],
      ["2025-02"],
    );
    const subscriptionSnapshots = buildSnapshotsFromSubscriptions(
      [makeSub("sub_1", { first_billed_at: "2025-02-01T00:00:00Z" })],
      ["2025-02"],
    );

    const merged = mergeMetricAndSubscriptionSnapshots(metricsSnapshots, subscriptionSnapshots);
    assert.equal(merged[0]!.mrr, 50);
    assert.equal(merged[0]!.customers, 5);
    assert.equal(merged[0]!.newMrr, 20);
  });
});
