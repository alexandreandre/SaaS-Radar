import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildAnalyticsDateRange,
  buildSnapshotsFromAnalyticsRows,
  computeConversions,
  extractAnalyticsMonth,
  formatRestLiDateRange,
  normalizeAdAccountId,
  normalizeAnalyticsMonth,
  parseSpend,
  toAdAccountUrn,
} from "../src/lib/connectors/linkedin-ads/snapshots.ts";

describe("linkedin-ads connector — parsing", () => {
  it("normalizes ad account ids and urns", () => {
    assert.equal(normalizeAdAccountId("502840441"), "502840441");
    assert.equal(normalizeAdAccountId(" 502840441 "), "502840441");
    assert.equal(
      normalizeAdAccountId("urn:li:sponsoredAccount:502840441"),
      "502840441",
    );
    assert.equal(toAdAccountUrn("502840441"), "urn:li:sponsoredAccount:502840441");
  });

  it("normalizes analytics month segments", () => {
    assert.equal(normalizeAnalyticsMonth({ year: 2025, month: 6, day: 1 }), "2025-06");
    assert.equal(normalizeAnalyticsMonth({ year: 2025, month: 12, day: 31 }), "2025-12");
  });

  it("parses spend values", () => {
    assert.equal(parseSpend("96.81"), 96.81);
    assert.equal(parseSpend("19.91833"), 19.92);
    assert.equal(parseSpend(undefined), 0);
    assert.equal(parseSpend("invalid"), 0);
  });

  it("computes conversions from website and lead gen metrics", () => {
    assert.equal(
      computeConversions({ externalWebsiteConversions: 3, oneClickLeads: 2 }),
      5,
    );
    assert.equal(computeConversions({ externalWebsiteConversions: 1 }), 1);
    assert.equal(computeConversions({}), 0);
  });
});

describe("linkedin-ads connector — time range", () => {
  it("builds a 12-month analytics date range", () => {
    const range = buildAnalyticsDateRange(12);
    assert.ok(range.startYear > 0);
    assert.ok(range.endYear > 0);
    assert.ok(range.startMonth >= 1 && range.startMonth <= 12);
    assert.ok(range.endMonth >= 1 && range.endMonth <= 12);
  });

  it("formats Rest.li date range", () => {
    const formatted = formatRestLiDateRange({
      startYear: 2025,
      startMonth: 1,
      startDay: 1,
      endYear: 2025,
      endMonth: 6,
      endDay: 19,
    });
    assert.equal(
      formatted,
      "(start:(year:2025,month:1,day:1),end:(year:2025,month:6,day:19))",
    );
  });
});

describe("linkedin-ads connector — analytics rows", () => {
  it("extracts month from dateRange.start", () => {
    assert.equal(
      extractAnalyticsMonth({
        dateRange: { start: { year: 2025, month: 3, day: 1 }, end: { year: 2025, month: 3, day: 31 } },
      }),
      "2025-03",
    );
    assert.equal(extractAnalyticsMonth({}), null);
  });

  it("maps analytics rows to monthly metrics snapshots", () => {
    const snapshots = buildSnapshotsFromAnalyticsRows(
      [
        {
          dateRange: {
            start: { year: 2025, month: 1, day: 1 },
            end: { year: 2025, month: 1, day: 31 },
          },
          costInLocalCurrency: "150.50",
          impressions: 1200,
          clicks: 45,
          externalWebsiteConversions: 2,
          oneClickLeads: 1,
        },
        {
          dateRange: {
            start: { year: 2025, month: 2, day: 1 },
            end: { year: 2025, month: 2, day: 28 },
          },
          costInLocalCurrency: "80",
          impressions: 800,
          clicks: 20,
          externalWebsiteConversions: 1,
          oneClickLeads: 1,
        },
      ],
      ["2025-01", "2025-02", "2025-03"],
    );

    assert.equal(snapshots.length, 3);
    assert.equal(snapshots[0]!.source, "linkedin-ads");
    assert.equal(snapshots[0]!.adSpend, 150.5);
    assert.equal(snapshots[0]!.impressions, 1200);
    assert.equal(snapshots[0]!.clicks, 45);
    assert.equal(snapshots[0]!.conversions, 3);
    assert.equal(snapshots[1]!.adSpend, 80);
    assert.equal(snapshots[2]!.adSpend, 0);
  });

  it("aggregates duplicate month rows from daily granularity", () => {
    const snapshots = buildSnapshotsFromAnalyticsRows(
      [
        {
          dateRange: {
            start: { year: 2025, month: 3, day: 1 },
            end: { year: 2025, month: 3, day: 1 },
          },
          costInLocalCurrency: "10",
          impressions: 100,
          clicks: 10,
          externalWebsiteConversions: 1,
        },
        {
          dateRange: {
            start: { year: 2025, month: 3, day: 15 },
            end: { year: 2025, month: 3, day: 15 },
          },
          costInLocalCurrency: "5",
          impressions: 50,
          clicks: 5,
          oneClickLeads: 2,
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
