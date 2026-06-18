import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildMonthlyMetricsQuery,
  buildSnapshotsFromGaqlRows,
  microsToCurrency,
  normalizeCustomerId,
  normalizeMonthSegment,
} from "../src/lib/connectors/google-ads/snapshots.ts";

describe("google-ads connector — parsing", () => {
  it("normalizes customer ids", () => {
    assert.equal(normalizeCustomerId("customers/1234567890"), "1234567890");
    assert.equal(normalizeCustomerId("123-456-7890"), "1234567890");
  });

  it("normalizes month segments", () => {
    assert.equal(normalizeMonthSegment("2025-06-01"), "2025-06");
  });

  it("converts cost micros to currency units", () => {
    assert.equal(microsToCurrency("96810000"), 96.81);
    assert.equal(microsToCurrency(1_500_000), 1.5);
  });
});

describe("google-ads connector — GAQL", () => {
  it("builds a 12-month metrics query", () => {
    const query = buildMonthlyMetricsQuery(12);
    assert.match(query, /segments\.month/);
    assert.match(query, /metrics\.cost_micros/);
    assert.match(query, /LAST_12_MONTHS/);
  });
});

describe("google-ads connector — snapshot mapping", () => {
  it("maps GAQL rows to monthly metrics snapshots", () => {
    const snapshots = buildSnapshotsFromGaqlRows(
      [
        {
          segments: { month: "2025-01-01" },
          metrics: {
            costMicros: "5000000",
            impressions: "1200",
            clicks: "45",
            conversions: "3.5",
          },
        },
        {
          segments: { month: "2025-02-01" },
          metrics: {
            costMicros: "2500000",
            impressions: "800",
            clicks: "20",
            conversions: "1",
          },
        },
      ],
      ["2025-01", "2025-02", "2025-03"],
    );

    assert.equal(snapshots.length, 3);
    assert.equal(snapshots[0]!.source, "google-ads");
    assert.equal(snapshots[0]!.adSpend, 5);
    assert.equal(snapshots[0]!.impressions, 1200);
    assert.equal(snapshots[0]!.clicks, 45);
    assert.equal(snapshots[0]!.conversions, 3.5);
    assert.equal(snapshots[1]!.adSpend, 2.5);
    assert.equal(snapshots[2]!.adSpend, 0);
    assert.equal(snapshots[2]!.mrr, 0);
  });

  it("aggregates duplicate month rows", () => {
    const snapshots = buildSnapshotsFromGaqlRows(
      [
        {
          segments: { month: "2025-03-01" },
          metrics: { costMicros: "1000000", impressions: "100", clicks: "10", conversions: "1" },
        },
        {
          segments: { month: "2025-03-01" },
          metrics: { costMicros: "2000000", impressions: "50", clicks: "5", conversions: "2" },
        },
      ],
      ["2025-03"],
    );

    assert.equal(snapshots[0]!.adSpend, 3);
    assert.equal(snapshots[0]!.impressions, 150);
    assert.equal(snapshots[0]!.clicks, 15);
    assert.equal(snapshots[0]!.conversions, 3);
  });
});
