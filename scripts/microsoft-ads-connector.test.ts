import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildReportDateRange,
  buildSnapshotsFromReportRows,
  extractConversions,
  getMonthKeys,
  normalizeAccountId,
  normalizeCustomerId,
  normalizeMonthSegment,
  parseReportCsv,
  parseSpend,
} from "../src/lib/connectors/microsoft-ads/snapshots.ts";

describe("microsoft-ads connector — parsing", () => {
  it("normalizes account and customer ids", () => {
    assert.equal(normalizeAccountId(" 176045209 "), "176045209");
    assert.equal(normalizeCustomerId("169549046"), "169549046");
  });

  it("normalizes month segments", () => {
    assert.equal(normalizeMonthSegment("2025-06-01"), "2025-06");
    assert.equal(normalizeMonthSegment("6/1/2025"), "2025-06");
  });

  it("parses spend values", () => {
    assert.equal(parseSpend("96.81"), 96.81);
    assert.equal(parseSpend("1,234.56"), 1234.56);
    assert.equal(parseSpend(undefined), 0);
  });

  it("prefers ConversionsQualified over Conversions", () => {
    assert.equal(
      extractConversions({ conversionsQualified: "3.5", conversions: "1" }),
      3.5,
    );
    assert.equal(extractConversions({ conversions: "2" }), 2);
  });
});

describe("microsoft-ads connector — csv", () => {
  it("parses report csv rows", () => {
    const csv = [
      "AccountName,TimePeriod,Spend,Impressions,Clicks,ConversionsQualified",
      '"Main","2025-05-01","120.50","1000","42","3.5"',
      '"Main","2025-06-01","80.00","800","21","1.25"',
    ].join("\n");

    const rows = parseReportCsv(csv);
    assert.equal(rows.length, 2);
    assert.equal(rows[0]?.timePeriod, "2025-05-01");
    assert.equal(rows[0]?.spend, "120.50");
    assert.equal(rows[1]?.conversionsQualified, "1.25");
  });

  it("ignores empty and total rows", () => {
    const csv = [
      "TimePeriod,Spend,Impressions,Clicks,ConversionsQualified",
      "2025-05-01,10,100,5,1",
      ",,,,",
      "Total,,,,",
    ].join("\n");

    assert.equal(parseReportCsv(csv).length, 1);
  });
});

describe("microsoft-ads connector — snapshots", () => {
  it("builds monthly snapshots from report rows", () => {
    const monthKeys = ["2025-05", "2025-06"];
    const snapshots = buildSnapshotsFromReportRows(
      [
        {
          timePeriod: "2025-05-01",
          spend: "100.5",
          impressions: "1000",
          clicks: "40",
          conversionsQualified: "2",
        },
        {
          timePeriod: "2025-06-01",
          spend: "50",
          impressions: "500",
          clicks: "20",
          conversionsQualified: "1.5",
        },
      ],
      monthKeys,
    );

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]?.adSpend, 100.5);
    assert.equal(snapshots[0]?.impressions, 1000);
    assert.equal(snapshots[0]?.clicks, 40);
    assert.equal(snapshots[0]?.conversions, 2);
    assert.equal(snapshots[0]?.source, "microsoft-ads");
    assert.equal(snapshots[1]?.adSpend, 50);
  });

  it("fills missing months with zeros", () => {
    const monthKeys = ["2025-05", "2025-06"];
    const snapshots = buildSnapshotsFromReportRows(
      [
        {
          timePeriod: "2025-05-01",
          spend: "10",
          impressions: "100",
          clicks: "5",
          conversionsQualified: "1",
        },
      ],
      monthKeys,
    );

    assert.equal(snapshots[1]?.adSpend, 0);
    assert.equal(snapshots[1]?.impressions, 0);
  });
});

describe("microsoft-ads connector — time range", () => {
  it("builds a 12-month report date range", () => {
    const range = buildReportDateRange(12);
    assert.ok(range.startYear > 0);
    assert.ok(range.endYear > 0);
    assert.ok(range.startMonth >= 1 && range.startMonth <= 12);
    assert.ok(range.endMonth >= 1 && range.endMonth <= 12);
  });

  it("returns 12 month keys", () => {
    assert.equal(getMonthKeys(12).length, 12);
  });
});
