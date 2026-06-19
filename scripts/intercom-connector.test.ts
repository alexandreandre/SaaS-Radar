import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildIntercomSupportStream,
  computeCsatPercent,
  mapContactsCountsToSnapshots,
  medianResponseHours,
  monthUnixRange,
  resolveIntercomApiBase,
} from "../src/lib/connectors/intercom/snapshots.ts";
import type { IntercomConversation } from "../src/lib/connectors/intercom/types.ts";

describe("intercom connector — api base", () => {
  it("routes EU and AU regions", () => {
    assert.equal(resolveIntercomApiBase("EU"), "https://api.eu.intercom.io");
    assert.equal(resolveIntercomApiBase("AU"), "https://api.au.intercom.io");
    assert.equal(resolveIntercomApiBase("US"), "https://api.intercom.io");
    assert.equal(resolveIntercomApiBase(undefined), "https://api.intercom.io");
  });
});

describe("intercom connector — month ranges", () => {
  it("builds unix bounds for a month key", () => {
    const range = monthUnixRange("2025-01");
    assert.ok(range.start > 0);
    assert.ok(range.end > range.start);
  });
});

describe("intercom connector — csat", () => {
  it("computes positive rating percentage", () => {
    assert.equal(computeCsatPercent(8, 10), 80);
    assert.equal(computeCsatPercent(0, 10), 0);
    assert.equal(computeCsatPercent(5, 0), 0);
  });
});

describe("intercom connector — response time", () => {
  it("computes median response hours from conversation statistics", () => {
    const conversations: IntercomConversation[] = [
      { statistics: { median_time_to_reply: 3600 } },
      { statistics: { median_time_to_reply: 7200 } },
      { statistics: { time_to_admin_reply: 1800 } },
    ];
    assert.equal(medianResponseHours(conversations), 1);
  });

  it("returns zero when no statistics are available", () => {
    assert.equal(medianResponseHours([{}, { statistics: null }]), 0);
  });
});

describe("intercom connector — snapshots", () => {
  it("maps monthly contact counts to activeUsers snapshots", () => {
    const monthKeys = ["2025-01", "2025-02"];
    const countsByMonth = new Map<string, number>([
      ["2025-01", 120],
      ["2025-02", 145],
    ]);

    const snapshots = mapContactsCountsToSnapshots({ monthKeys, countsByMonth });
    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]?.activeUsers, 120);
    assert.equal(snapshots[0]?.mau, 120);
    assert.equal(snapshots[0]?.source, "intercom");
    assert.equal(snapshots[1]?.activeUsers, 145);
  });
});

describe("intercom connector — support stream", () => {
  it("builds a normalized support stream payload", () => {
    const stream = buildIntercomSupportStream({
      openTickets: 7.4,
      avgResponseHours: 3.25,
      csat: 88.6,
    });
    assert.equal(stream.type, "support");
    assert.equal(stream.openTickets, 7);
    assert.equal(stream.avgResponseHours, 3.25);
    assert.equal(stream.csat, 89);
  });
});
