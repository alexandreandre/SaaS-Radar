import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSnapshotsFromAnalytics } from "../src/lib/connectors/stripe/snapshots.ts";
import {
  centsToEuros,
  isFullSecretKey,
  isRestrictedKey,
  parseRakCredential,
} from "../src/lib/connectors/stripe/keys.ts";

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
    assert.equal(cred.mode, "rak");
    assert.equal(cred.livemode, false);
    assert.equal(cred.currency, "eur");
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
