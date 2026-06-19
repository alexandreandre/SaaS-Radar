import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseLemonSqueezyApiKey,
  parseLemonSqueezyCredential,
} from "../src/lib/connectors/lemon-squeezy/keys.ts";
import {
  buildSnapshotsFromSubscriptions,
  isSubscriptionActiveAt,
  normalizePriceToMonthlyMrrCents,
} from "../src/lib/connectors/lemon-squeezy/snapshots.ts";
import type {
  LemonSqueezyPriceAttributes,
  LemonSqueezySubscriptionRecord,
} from "../src/lib/connectors/lemon-squeezy/types.ts";

function makePrice(overrides: Partial<LemonSqueezyPriceAttributes> = {}): LemonSqueezyPriceAttributes {
  return {
    variant_id: 1,
    category: "subscription",
    scheme: "standard",
    usage_aggregation: null,
    unit_price: 1000,
    unit_price_decimal: null,
    renewal_interval_unit: "month",
    renewal_interval_quantity: 1,
    ...overrides,
  };
}

function makeSub(
  id: string,
  overrides: Partial<LemonSqueezySubscriptionRecord["attributes"]> = {},
): LemonSqueezySubscriptionRecord {
  return {
    id,
    attributes: {
      store_id: 1,
      customer_id: 1,
      status: "active",
      cancelled: false,
      trial_ends_at: null,
      renews_at: "2025-06-01T00:00:00.000000Z",
      ends_at: null,
      created_at: "2025-01-15T00:00:00.000000Z",
      updated_at: "2025-01-15T00:00:00.000000Z",
      test_mode: false,
      first_subscription_item: {
        id: 1,
        subscription_id: Number(id),
        price_id: 1,
        quantity: 1,
        created_at: "2025-01-15T00:00:00.000000Z",
        updated_at: "2025-01-15T00:00:00.000000Z",
      },
      ...overrides,
    },
  };
}

describe("lemon-squeezy connector — credential parsing", () => {
  it("accepts valid api key and store id", () => {
    const cred = parseLemonSqueezyCredential({
      apiKey: "abcdefghijklmnopqrst",
      storeId: "42",
      storeName: "My Store",
      currency: "usd",
    });
    assert.equal(cred.apiKey, "abcdefghijklmnopqrst");
    assert.equal(cred.storeId, "42");
    assert.equal(cred.storeName, "My Store");
    assert.equal(cred.currency, "USD");
  });

  it("rejects empty api key", () => {
    assert.throws(
      () => parseLemonSqueezyApiKey(""),
      /Clé API Lemon Squeezy/,
    );
  });

  it("rejects invalid store id", () => {
    assert.throws(
      () => parseLemonSqueezyCredential({ apiKey: "abcdefghijklmnopqrst", storeId: "abc" }),
      /Identifiant de boutique invalide/,
    );
  });
});

describe("lemon-squeezy connector — price normalization", () => {
  it("normalizes monthly price", () => {
    const mrr = normalizePriceToMonthlyMrrCents(makePrice(), 2);
    assert.equal(mrr, 2000);
  });

  it("normalizes yearly price to monthly", () => {
    const mrr = normalizePriceToMonthlyMrrCents(
      makePrice({ unit_price: 12000, renewal_interval_unit: "year" }),
      1,
    );
    assert.equal(mrr, 1000);
  });

  it("returns zero for usage-based pricing", () => {
    const mrr = normalizePriceToMonthlyMrrCents(
      makePrice({ usage_aggregation: "sum", unit_price: null, unit_price_decimal: "10.5" }),
      1,
    );
    assert.equal(mrr, 0);
  });
});

describe("lemon-squeezy connector — subscription activity", () => {
  it("treats active subscription as active at month end", () => {
    const sub = makeSub("1");
    const instant = new Date("2025-02-28T23:59:59.999Z");
    assert.equal(isSubscriptionActiveAt(sub, instant), true);
  });

  it("treats expired subscription as inactive after ends_at", () => {
    const sub = makeSub("2", {
      status: "expired",
      ends_at: "2025-02-10T00:00:00.000000Z",
    });
    const instant = new Date("2025-02-28T23:59:59.999Z");
    assert.equal(isSubscriptionActiveAt(sub, instant), false);
  });

  it("keeps cancelled subscription active during grace period", () => {
    const sub = makeSub("3", {
      status: "cancelled",
      cancelled: true,
      ends_at: "2025-03-15T00:00:00.000000Z",
    });
    const instant = new Date("2025-02-28T23:59:59.999Z");
    assert.equal(isSubscriptionActiveAt(sub, instant), true);
  });
});

describe("lemon-squeezy connector — snapshot mapping", () => {
  it("builds mrr, newMrr, churnedMrr and customers", () => {
    const priceMap = new Map<string, LemonSqueezyPriceAttributes>([["1", makePrice({ unit_price: 2000 })]]);

    const subs: LemonSqueezySubscriptionRecord[] = [
      makeSub("10", { customer_id: 1, created_at: "2025-01-10T00:00:00.000000Z" }),
      makeSub("11", {
        customer_id: 2,
        created_at: "2025-02-05T00:00:00.000000Z",
      }),
      makeSub("12", {
        customer_id: 3,
        created_at: "2025-01-01T00:00:00.000000Z",
        status: "expired",
        ends_at: "2025-02-12T00:00:00.000000Z",
      }),
    ];

    const snapshots = buildSnapshotsFromSubscriptions(subs, priceMap, ["2025-01", "2025-02"]);

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.source, "lemon-squeezy");
    assert.equal(snapshots[0]!.mrr, 40);
    assert.equal(snapshots[0]!.newMrr, 40);
    assert.equal(snapshots[0]!.customers, 2);

    assert.equal(snapshots[1]!.mrr, 40);
    assert.equal(snapshots[1]!.newMrr, 20);
    assert.equal(snapshots[1]!.churnedMrr, 20);
    assert.equal(snapshots[1]!.customers, 2);
  });
});
