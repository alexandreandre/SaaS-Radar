import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseFathomCredential } from "../src/lib/connectors/fathom/keys.ts";
import {
  aggregateDailyVisitsToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromAggregationResults,
  getMonthKeys,
  parseMonthlySignups,
  parseMonthlyVisits,
  splitDateRangeForDailyQueries,
} from "../src/lib/connectors/fathom/snapshots.ts";

describe("fathom connector — credential parsing", () => {
  it("accepts valid api key and site id", () => {
    const cred = parseFathomCredential({
      apiKey: "abcdefghijklmnopqrst",
      siteId: "cdbugs",
      signupEventId: "signed-up",
      signupEventName: "Signed up",
    });
    assert.equal(cred.apiKey, "abcdefghijklmnopqrst");
    assert.equal(cred.siteId, "CDBUGS");
    assert.equal(cred.signupEventId, "signed-up");
    assert.equal(cred.signupEventName, "Signed up");
  });

  it("rejects empty api key", () => {
    assert.throws(
      () => parseFathomCredential({ apiKey: "", siteId: "CDBUGS" }),
      /Clé API Fathom/,
    );
  });

  it("rejects short api key", () => {
    assert.throws(
      () => parseFathomCredential({ apiKey: "short", siteId: "CDBUGS" }),
      /Format de clé/,
    );
  });

  it("rejects invalid site id", () => {
    assert.throws(
      () => parseFathomCredential({ apiKey: "abcdefghijklmnopqrst", siteId: "bad/id" }),
      /ID du site/,
    );
  });
});

describe("fathom connector — date range", () => {
  it("builds ISO range aligned with month keys", () => {
    const months = getMonthKeys(12);
    const [start, end] = buildDateRangeForMonths(12);
    assert.equal(start, `${months[0]}-01`);
    assert.match(end, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(end.slice(0, 7), months.at(-1));
  });

  it("splits daily range into windows of at most six months", () => {
    const [from, to] = buildDateRangeForMonths(12);
    const windows = splitDateRangeForDailyQueries(from, to);
    assert.ok(windows.length >= 1);
    assert.equal(windows[0]![0], from);
    assert.equal(windows.at(-1)![1], to);
  });
});

describe("fathom connector — snapshot mapping", () => {
  it("maps monthly visits, dau and signups from string metrics", () => {
    const monthKeys = ["2025-01", "2025-02"];
    const monthlyVisits = parseMonthlyVisits([
      { date: "2025-01", visits: "1200" },
      { date: "2025-02", visits: "900" },
    ]);
    const dauByMonth = aggregateDailyVisitsToDau([
      { date: "2025-01-01", visits: "100" },
      { date: "2025-01-02", visits: "200" },
      { date: "2025-02-10", visits: "50" },
    ]);
    const signupsByMonth = parseMonthlySignups([
      { date: "2025-01", unique_conversions: "42" },
      { date: "2025-02", unique_conversions: "18" },
    ]);

    const snapshots = buildSnapshotsFromAggregationResults({
      monthKeys,
      monthlyVisits,
      dauByMonth,
      signupsByMonth,
    });

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.mau, 1200);
    assert.equal(snapshots[0]!.activeUsers, 1200);
    assert.equal(snapshots[0]!.dau, 150);
    assert.equal(snapshots[0]!.signups, 42);
    assert.equal(snapshots[0]!.source, "fathom");
    assert.equal(snapshots[1]!.signups, 18);
  });

  it("defaults missing months to zero", () => {
    const snapshots = buildSnapshotsFromAggregationResults({
      monthKeys: ["2025-03"],
      monthlyVisits: new Map(),
      dauByMonth: new Map(),
      signupsByMonth: new Map(),
    });
    assert.equal(snapshots[0]!.mau, 0);
    assert.equal(snapshots[0]!.dau, 0);
    assert.equal(snapshots[0]!.signups, 0);
  });
});
