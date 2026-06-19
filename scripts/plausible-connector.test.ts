import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePlausibleCredential } from "../src/lib/connectors/plausible/keys.ts";
import {
  aggregateDailyVisitorsToDau,
  buildDateRangeForMonths,
  buildSnapshotsFromQueryResults,
  getMonthKeys,
  parseMonthlySignups,
  parseMonthlyVisitors,
} from "../src/lib/connectors/plausible/snapshots.ts";

describe("plausible connector — credential parsing", () => {
  it("accepts valid api key and site id", () => {
    const cred = parsePlausibleCredential({
      apiKey: "abcdefghijklmnopqrst",
      siteId: "App.Example.com",
      signupGoalDisplayName: "Signup",
    });
    assert.equal(cred.apiKey, "abcdefghijklmnopqrst");
    assert.equal(cred.siteId, "app.example.com");
    assert.equal(cred.signupGoalDisplayName, "Signup");
  });

  it("rejects empty api key", () => {
    assert.throws(
      () => parsePlausibleCredential({ apiKey: "", siteId: "example.com" }),
      /Clé Stats API/,
    );
  });

  it("rejects short api key", () => {
    assert.throws(
      () => parsePlausibleCredential({ apiKey: "short", siteId: "example.com" }),
      /Format de clé/,
    );
  });

  it("rejects invalid site id", () => {
    assert.throws(
      () => parsePlausibleCredential({ apiKey: "abcdefghijklmnopqrst", siteId: "bad/path" }),
      /domaine/,
    );
  });
});

describe("plausible connector — date range", () => {
  it("builds ISO range aligned with month keys", () => {
    const months = getMonthKeys(12);
    const [start, end] = buildDateRangeForMonths(12);
    assert.equal(start, `${months[0]}-01`);
    assert.match(end, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(end.slice(0, 7), months.at(-1));
  });
});

describe("plausible connector — snapshot mapping", () => {
  it("maps monthly visitors, dau and signups", () => {
    const monthKeys = ["2025-01", "2025-02"];
    const monthlyVisitors = parseMonthlyVisitors([
      { dimensions: ["2025-01-01"], metrics: [1200] },
      { dimensions: ["2025-02-01"], metrics: [1500] },
    ]);
    const dauByMonth = aggregateDailyVisitorsToDau([
      { dimensions: ["2025-01-15"], metrics: [40] },
      { dimensions: ["2025-01-20"], metrics: [60] },
      { dimensions: ["2025-02-10"], metrics: [50] },
    ]);
    const signupsByMonth = parseMonthlySignups([
      { dimensions: ["2025-01-01"], metrics: [25] },
      { dimensions: ["2025-02-01"], metrics: [30] },
    ]);

    const snapshots = buildSnapshotsFromQueryResults({
      monthKeys,
      monthlyVisitors,
      dauByMonth,
      signupsByMonth,
    });

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]!.mau, 1200);
    assert.equal(snapshots[0]!.activeUsers, 1200);
    assert.equal(snapshots[0]!.dau, 50);
    assert.equal(snapshots[0]!.signups, 25);
    assert.equal(snapshots[0]!.source, "plausible");
    assert.equal(snapshots[1]!.mau, 1500);
    assert.equal(snapshots[1]!.signups, 30);
  });

  it("returns zero for missing months", () => {
    const snapshots = buildSnapshotsFromQueryResults({
      monthKeys: ["2025-03"],
      monthlyVisitors: new Map(),
      dauByMonth: new Map(),
      signupsByMonth: new Map(),
    });

    assert.equal(snapshots[0]!.mau, 0);
    assert.equal(snapshots[0]!.dau, 0);
    assert.equal(snapshots[0]!.signups, 0);
  });
});
