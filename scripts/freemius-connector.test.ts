import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseFreemiusApiToken,
  parseFreemiusCredential,
  billingCycleToMonthlyMrr,
} from "../src/lib/connectors/freemius/keys.ts";
import {
  buildSnapshotsFromSubscriptions,
  isSubscriptionActiveAt,
} from "../src/lib/connectors/freemius/snapshots.ts";
import type { FreemiusSubscriptionRecord } from "../src/lib/connectors/freemius/types.ts";

function makeSub(
  id: string,
  overrides: Partial<FreemiusSubscriptionRecord> = {},
): FreemiusSubscriptionRecord {
  return {
    id,
    user_id: "100",
    created: "2025-01-15 00:00:00",
    canceled_at: null,
    next_payment: "2025-03-01 00:00:00",
    trial_ends: null,
    renewal_amount: "29.00",
    amount_per_cycle: "29.00",
    billing_cycle: 1,
    currency: "usd",
    failed_payments: 0,
    outstanding_balance: 0,
    ...overrides,
  };
}

describe("freemius connector — credential parsing", () => {
  it("accepts valid product id and api token", () => {
    const cred = parseFreemiusCredential({
      productId: "12345",
      apiToken: "abcdefgh",
      productTitle: "My Plugin",
      currency: "eur",
    });
    assert.equal(cred.productId, "12345");
    assert.equal(cred.apiToken, "abcdefgh");
    assert.equal(cred.productTitle, "My Plugin");
    assert.equal(cred.currency, "EUR");
  });

  it("rejects empty api token", () => {
    assert.throws(() => parseFreemiusApiToken(""), /Bearer Token Freemius/);
  });

  it("rejects invalid product id", () => {
    assert.throws(
      () => parseFreemiusCredential({ productId: "abc", apiToken: "abcdefgh" }),
      /Identifiant produit Freemius invalide/,
    );
  });
});

describe("freemius connector — mrr normalization", () => {
  it("normalizes monthly billing", () => {
    assert.equal(billingCycleToMonthlyMrr("29.00", 1), 29);
  });

  it("normalizes annual billing to monthly", () => {
    assert.equal(billingCycleToMonthlyMrr("120.00", 12), 10);
  });

  it("returns zero for lifetime", () => {
    assert.equal(billingCycleToMonthlyMrr("99.00", 0), 0);
  });
});

describe("freemius connector — subscription activity", () => {
  it("treats active subscription as active at month end", () => {
    const sub = makeSub("1");
    const instant = new Date("2025-02-28T23:59:59.999Z");
    assert.equal(isSubscriptionActiveAt(sub, instant), true);
  });

  it("treats cancelled subscription as inactive after canceled_at", () => {
    const sub = makeSub("2", {
      canceled_at: "2025-02-10 00:00:00",
      next_payment: null,
    });
    const instant = new Date("2025-02-28T23:59:59.999Z");
    assert.equal(isSubscriptionActiveAt(sub, instant), false);
  });

  it("excludes trial subscriptions from active mrr", () => {
    const sub = makeSub("3", {
      trial_ends: "2025-03-15 00:00:00",
    });
    const instant = new Date("2025-02-28T23:59:59.999Z");
    assert.equal(isSubscriptionActiveAt(sub, instant), false);
  });

  it("excludes lifetime subscriptions", () => {
    const sub = makeSub("4", { billing_cycle: 0 });
    const instant = new Date("2025-02-28T23:59:59.999Z");
    assert.equal(isSubscriptionActiveAt(sub, instant), false);
  });
});

describe("freemius connector — snapshot mapping", () => {
  it("builds mrr, newMrr, churnedMrr and customers", () => {
    const subs: FreemiusSubscriptionRecord[] = [
      makeSub("10", { user_id: "1", created: "2025-01-10 00:00:00", renewal_amount: "20.00" }),
      makeSub("11", {
        user_id: "2",
        created: "2025-02-05 00:00:00",
        renewal_amount: "20.00",
      }),
      makeSub("12", {
        user_id: "3",
        created: "2025-01-01 00:00:00",
        renewal_amount: "20.00",
        canceled_at: "2025-02-12 00:00:00",
        next_payment: null,
      }),
    ];

    const snapshots = buildSnapshotsFromSubscriptions(subs, ["2025-01", "2025-02"]);

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.source, "freemius");
    assert.equal(snapshots[0]!.mrr, 40);
    assert.equal(snapshots[0]!.newMrr, 40);
    assert.equal(snapshots[0]!.customers, 2);

    assert.equal(snapshots[1]!.mrr, 40);
    assert.equal(snapshots[1]!.newMrr, 20);
    assert.equal(snapshots[1]!.churnedMrr, 20);
    assert.equal(snapshots[1]!.customers, 2);
  });
});
