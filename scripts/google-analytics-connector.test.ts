import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseGoogleAnalyticsConnectInput } from "../src/lib/connectors/google-analytics/keys.ts";
import {
  aggregateDailyActiveUsersToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromReports,
  dateDimensionToMonthKey,
  getMonthKeys,
  parseYearMonthMetricRows,
  yearMonthToMonthKey,
} from "../src/lib/connectors/google-analytics/snapshots.ts";

describe("google-analytics connector — credential parsing", () => {
  it("accepts valid property id and events", () => {
    const parsed = parseGoogleAnalyticsConnectInput({
      propertyId: "123456789",
      propertyDisplayName: "Mon site",
      signupEvent: "sign_up",
      trialEvent: "begin_checkout",
    });
    assert.equal(parsed.propertyId, "123456789");
    assert.equal(parsed.propertyDisplayName, "Mon site");
    assert.equal(parsed.signupEvent, "sign_up");
    assert.equal(parsed.trialEvent, "begin_checkout");
  });

  it("normalizes properties/ prefix", () => {
    const parsed = parseGoogleAnalyticsConnectInput({
      propertyId: "properties/987654321",
    });
    assert.equal(parsed.propertyId, "987654321");
    assert.equal(parsed.signupEvent, "sign_up");
    assert.equal(parsed.trialEvent, null);
  });

  it("rejects invalid property id", () => {
    assert.throws(
      () => parseGoogleAnalyticsConnectInput({ propertyId: "abc" }),
      /Property ID GA4 invalide/,
    );
  });
});

describe("google-analytics connector — yearMonth parsing", () => {
  it("converts YYYYMM to YYYY-MM", () => {
    assert.equal(yearMonthToMonthKey("202501"), "2025-01");
    assert.equal(yearMonthToMonthKey("202412"), "2024-12");
  });

  it("converts YYYYMMDD date dimension to YYYY-MM", () => {
    assert.equal(dateDimensionToMonthKey("20250115"), "2025-01");
    assert.equal(dateDimensionToMonthKey("2024-01-15"), "2024-01");
  });

  it("maps monthly metric rows", () => {
    const byMonth = parseYearMonthMetricRows([
      { dimensionValues: [{ value: "202501" }], metricValues: [{ value: "1200" }] },
      { dimensionValues: [{ value: "202502" }], metricValues: [{ value: "1500.7" }] },
    ]);
    assert.equal(byMonth.get("2025-01"), 1200);
    assert.equal(byMonth.get("2025-02"), 1501);
  });
});

describe("google-analytics connector — date range", () => {
  it("builds ISO range aligned with month keys", () => {
    const months = getMonthKeys(12);
    const [start, end] = buildDateRangeForMonths(12);
    assert.equal(start, `${months[0]}-01`);
    assert.match(end, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(end.slice(0, 7), months.at(-1));
  });
});

describe("google-analytics connector — snapshot mapping", () => {
  it("maps mau, dau, signups and trials", () => {
    const monthKeys = ["2025-01", "2025-02"];
    const mauByMonth = parseYearMonthMetricRows([
      { dimensionValues: [{ value: "202501" }], metricValues: [{ value: "800" }] },
      { dimensionValues: [{ value: "202502" }], metricValues: [{ value: "950" }] },
    ]);
    const dauByMonth = aggregateDailyActiveUsersToDau([
      { dimensionValues: [{ value: "20250115" }], metricValues: [{ value: "40" }] },
      { dimensionValues: [{ value: "20250120" }], metricValues: [{ value: "60" }] },
      { dimensionValues: [{ value: "20250210" }], metricValues: [{ value: "50" }] },
    ]);
    const signupsByMonth = parseYearMonthMetricRows([
      { dimensionValues: [{ value: "202501" }], metricValues: [{ value: "25" }] },
      { dimensionValues: [{ value: "202502" }], metricValues: [{ value: "30" }] },
    ]);
    const trialsByMonth = parseYearMonthMetricRows([
      { dimensionValues: [{ value: "202502" }], metricValues: [{ value: "10" }] },
    ]);

    const snapshots = buildSnapshotsFromReports({
      monthKeys,
      mauByMonth,
      dauByMonth,
      signupsByMonth,
      trialsByMonth,
    });

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.source, "google-analytics");
    assert.equal(snapshots[0]!.mau, 800);
    assert.equal(snapshots[0]!.activeUsers, 800);
    assert.equal(snapshots[0]!.dau, 50);
    assert.equal(snapshots[0]!.signups, 25);
    assert.equal(snapshots[0]!.trials, 0);
    assert.equal(snapshots[1]!.trials, 10);
    assert.equal(snapshots[0]!.mrr, 0);
  });

  it("defaults missing months to zero", () => {
    const snapshots = buildSnapshotsFromReports({
      monthKeys: ["2025-03"],
      mauByMonth: new Map(),
      dauByMonth: new Map(),
      signupsByMonth: new Map(),
      trialsByMonth: new Map(),
    });
    assert.deepEqual(snapshots[0], {
      date: "2025-03",
      mrr: 0,
      newMrr: 0,
      expansionMrr: 0,
      churnedMrr: 0,
      customers: 0,
      signups: 0,
      trials: 0,
      activeUsers: 0,
      mau: 0,
      dau: 0,
      adSpend: 0,
      impressions: 0,
      clicks: 0,
      conversions: 0,
      source: "google-analytics",
    });
  });
});
