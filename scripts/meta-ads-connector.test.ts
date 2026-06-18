import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildInsightsTimeRange,
  buildSnapshotsFromInsightRows,
  isConversionAction,
  normalizeAdAccountId,
  normalizeInsightMonth,
  parseSpend,
  sumConversionActions,
} from "../src/lib/connectors/meta-ads/snapshots.ts";

describe("meta-ads connector — parsing", () => {
  it("normalizes ad account ids", () => {
    assert.equal(normalizeAdAccountId("act_123456789"), "act_123456789");
    assert.equal(normalizeAdAccountId("123456789"), "act_123456789");
    assert.equal(normalizeAdAccountId("  act_999  "), "act_999");
  });

  it("normalizes insight month segments", () => {
    assert.equal(normalizeInsightMonth("2025-06-01"), "2025-06");
  });

  it("parses spend strings", () => {
    assert.equal(parseSpend("96.81"), 96.81);
    assert.equal(parseSpend(undefined), 0);
    assert.equal(parseSpend("invalid"), 0);
  });
});

describe("meta-ads connector — time range", () => {
  it("builds a 12-month insights time range", () => {
    const range = buildInsightsTimeRange(12);
    assert.match(range.since, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(range.until, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(range.since <= range.until);
  });
});

describe("meta-ads connector — conversions", () => {
  it("detects conversion action types", () => {
    assert.equal(isConversionAction("purchase"), true);
    assert.equal(isConversionAction("offsite_conversion.fb_pixel_purchase"), true);
    assert.equal(isConversionAction("link_click"), false);
  });

  it("sums conversion actions", () => {
    const total = sumConversionActions([
      { action_type: "link_click", value: "100" },
      { action_type: "purchase", value: "3" },
      { action_type: "lead", value: "2.5" },
      { action_type: "offsite_conversion.custom", value: "1" },
    ]);
    assert.equal(total, 6.5);
  });
});

describe("meta-ads connector — snapshot mapping", () => {
  it("maps insight rows to monthly metrics snapshots", () => {
    const snapshots = buildSnapshotsFromInsightRows(
      [
        {
          date_start: "2025-01-01",
          spend: "150.50",
          impressions: "1200",
          clicks: "45",
          actions: [{ action_type: "purchase", value: "3" }],
        },
        {
          date_start: "2025-02-01",
          spend: "80",
          impressions: "800",
          clicks: "20",
          actions: [{ action_type: "lead", value: "2" }],
        },
      ],
      ["2025-01", "2025-02", "2025-03"],
    );

    assert.equal(snapshots.length, 3);
    assert.equal(snapshots[0]!.source, "meta-ads");
    assert.equal(snapshots[0]!.adSpend, 150.5);
    assert.equal(snapshots[0]!.impressions, 1200);
    assert.equal(snapshots[0]!.clicks, 45);
    assert.equal(snapshots[0]!.conversions, 3);
    assert.equal(snapshots[1]!.adSpend, 80);
    assert.equal(snapshots[2]!.adSpend, 0);
    assert.equal(snapshots[2]!.mrr, 0);
  });

  it("aggregates duplicate month rows", () => {
    const snapshots = buildSnapshotsFromInsightRows(
      [
        {
          date_start: "2025-03-01",
          spend: "10",
          impressions: "100",
          clicks: "10",
          actions: [{ action_type: "purchase", value: "1" }],
        },
        {
          date_start: "2025-03-15",
          spend: "5",
          impressions: "50",
          clicks: "5",
          actions: [{ action_type: "lead", value: "2" }],
        },
      ],
      ["2025-03"],
    );

    assert.equal(snapshots[0]!.adSpend, 15);
    assert.equal(snapshots[0]!.impressions, 150);
    assert.equal(snapshots[0]!.clicks, 15);
    assert.equal(snapshots[0]!.conversions, 3);
  });
});
