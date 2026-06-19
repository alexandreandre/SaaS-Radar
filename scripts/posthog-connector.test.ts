import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parsePostHogCredential } from "../src/lib/connectors/posthog/keys.ts";
import { buildProductStreamFromQueries } from "../src/lib/connectors/posthog/product-stream.ts";
import {
  aggregateDailyRowsToDau,
  buildSnapshotsFromQueryResults,
  hogQLRowsFromResults,
  parseHogQLMonthlyRows,
} from "../src/lib/connectors/posthog/snapshots.ts";

describe("posthog connector — credential parsing", () => {
  it("accepts valid personal api key and project id", () => {
    const cred = parsePostHogCredential({
      personalApiKey: "phx_abcdefghijklmnopqrst",
      projectId: "12345",
      appHost: "https://eu.posthog.com",
      signupEvent: "user signed up",
      activationEvent: "activated",
    });
    assert.equal(cred.personalApiKey, "phx_abcdefghijklmnopqrst");
    assert.equal(cred.projectId, "12345");
    assert.equal(cred.appHost, "https://eu.posthog.com");
    assert.equal(cred.signupEvent, "user signed up");
    assert.equal(cred.activationEvent, "activated");
  });

  it("rejects empty api key", () => {
    assert.throws(
      () => parsePostHogCredential({ personalApiKey: "", projectId: "1" }),
      /Personal API Key/,
    );
  });

  it("rejects invalid project id", () => {
    assert.throws(
      () =>
        parsePostHogCredential({
          personalApiKey: "phx_abcdefghijklmnopqrst",
          projectId: "abc",
        }),
      /Project ID/,
    );
  });

  it("rejects invalid app host", () => {
    assert.throws(
      () =>
        parsePostHogCredential({
          personalApiKey: "phx_abcdefghijklmnopqrst",
          projectId: "1",
          appHost: "not-a-url",
        }),
      /URL PostHog/,
    );
  });
});

describe("posthog connector — hogql row parsing", () => {
  it("parses monthly mau rows", () => {
    const rows = hogQLRowsFromResults(
      [
        ["2025-01", 120],
        ["2025-02", 150],
      ],
      ["month", "mau"],
    );
    const byMonth = parseHogQLMonthlyRows(rows);
    assert.equal(byMonth.get("2025-01"), 120);
    assert.equal(byMonth.get("2025-02"), 150);
  });

  it("aggregates daily rows to monthly dau", () => {
    const rows = hogQLRowsFromResults(
      [
        ["2025-01", 10],
        ["2025-01", 20],
        ["2025-02", 30],
      ],
      ["month", "dau"],
    );
    const byMonth = aggregateDailyRowsToDau(rows);
    assert.equal(byMonth.get("2025-01"), 15);
    assert.equal(byMonth.get("2025-02"), 30);
  });
});

describe("posthog connector — snapshot mapping", () => {
  it("maps mau, dau and signups with zero defaults", () => {
    const monthKeys = ["2025-01", "2025-02"];
    const snapshots = buildSnapshotsFromQueryResults({
      monthKeys,
      mauByMonth: new Map([["2025-01", 100]]),
      dauByMonth: new Map([["2025-01", 12]]),
      signupsByMonth: new Map([["2025-02", 8]]),
    });

    assert.equal(snapshots[0]?.mau, 100);
    assert.equal(snapshots[0]?.activeUsers, 100);
    assert.equal(snapshots[0]?.dau, 12);
    assert.equal(snapshots[0]?.signups, 0);
    assert.equal(snapshots[0]?.source, "posthog");

    assert.equal(snapshots[1]?.mau, 0);
    assert.equal(snapshots[1]?.signups, 8);
  });
});

describe("posthog connector — product stream", () => {
  it("builds product stream from query fixtures", () => {
    const stream = buildProductStreamFromQueries({
      featureTop: {
        columns: ["event", "c"],
        results: [["export_pdf", 42]],
      },
      activationRate: {
        columns: ["rate"],
        results: [[67.4]],
      },
      retention: {
        results: [
          {
            values: [
              { percentage: 100 },
              { percentage: 80 },
              { percentage: 60 },
              { percentage: 50 },
              { percentage: 45 },
              { percentage: 40 },
              { percentage: 35 },
              { percentage: 28 },
            ],
          },
        ],
      },
    });

    assert.equal(stream.type, "product");
    assert.equal(stream.featureUsageTop, "export_pdf");
    assert.equal(stream.activationRate, 67);
    assert.equal(stream.retentionD7, 28);
  });

  it("returns safe defaults for empty responses", () => {
    const stream = buildProductStreamFromQueries({});
    assert.equal(stream.featureUsageTop, "");
    assert.equal(stream.activationRate, 0);
    assert.equal(stream.retentionD7, 0);
  });
});
