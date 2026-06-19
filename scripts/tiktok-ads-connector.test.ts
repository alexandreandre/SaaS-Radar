import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReportDateRange,
  buildSnapshotsFromReportRows,
  extractReportMonth,
  normalizeAdvertiserId,
  normalizeReportMonth,
  parseSpend,
} from "../src/lib/connectors/tiktok-ads/snapshots.ts";

describe("tiktok-ads connector — parsing", () => {
  it("normalizes advertiser ids", () => {
    assert.equal(normalizeAdvertiserId("7123456789012345678"), "7123456789012345678");
    assert.equal(normalizeAdvertiserId(" 7123456789012345678 "), "7123456789012345678");
  });

  it("normalizes report month segments", () => {
    assert.equal(normalizeReportMonth("2025-06"), "2025-06");
    assert.equal(normalizeReportMonth("2025-06-01"), "2025-06");
  });

  it("parses spend values", () => {
    assert.equal(parseSpend("96.81"), 96.81);
    assert.equal(parseSpend(undefined), 0);
    assert.equal(parseSpend("invalid"), 0);
  });
});

describe("tiktok-ads connector — time range", () => {
  it("builds a 12-month report date range", () => {
    const range = buildReportDateRange(12);
    assert.match(range.startDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(range.endDate, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(range.startDate <= range.endDate);
  });
});

describe("tiktok-ads connector — report rows", () => {
  it("extracts month from stat_time_month or stat_time_day", () => {
    assert.equal(
      extractReportMonth({ dimensions: { stat_time_month: "2025-03" } }),
      "2025-03",
    );
    assert.equal(
      extractReportMonth({ dimensions: { stat_time_day: "2025-03-15" } }),
      "2025-03",
    );
    assert.equal(extractReportMonth({ dimensions: {} }), null);
  });

  it("maps report rows to monthly metrics snapshots", () => {
    const snapshots = buildSnapshotsFromReportRows(
      [
        {
          dimensions: { stat_time_month: "2025-01" },
          metrics: {
            spend: "150.50",
            impressions: "1200",
            clicks: "45",
            conversion: "3",
          },
        },
        {
          dimensions: { stat_time_month: "2025-02" },
          metrics: {
            spend: "80",
            impressions: "800",
            clicks: "20",
            conversion: "2",
          },
        },
      ],
      ["2025-01", "2025-02", "2025-03"],
    );

    assert.equal(snapshots.length, 3);
    assert.equal(snapshots[0]!.source, "tiktok-ads");
    assert.equal(snapshots[0]!.adSpend, 150.5);
    assert.equal(snapshots[0]!.impressions, 1200);
    assert.equal(snapshots[0]!.clicks, 45);
    assert.equal(snapshots[0]!.conversions, 3);
    assert.equal(snapshots[1]!.adSpend, 80);
    assert.equal(snapshots[2]!.adSpend, 0);
  });

  it("aggregates duplicate month rows from daily dimension", () => {
    const snapshots = buildSnapshotsFromReportRows(
      [
        {
          dimensions: { stat_time_day: "2025-03-01" },
          metrics: {
            spend: "10",
            impressions: "100",
            clicks: "10",
            conversion: "1",
          },
        },
        {
          dimensions: { stat_time_day: "2025-03-15" },
          metrics: {
            spend: "5",
            impressions: "50",
            clicks: "5",
            conversion: "2",
          },
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
