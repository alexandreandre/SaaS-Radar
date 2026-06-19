import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseMixpanelCredential } from "../src/lib/connectors/mixpanel/keys.ts";
import { buildProductStreamFromQueries, parseTopEventFromExportJsonl } from "../src/lib/connectors/mixpanel/product-stream.ts";
import {
  aggregateDailySegmentationToDau,
  buildSnapshotsFromQueryResults,
  parseSegmentationMonthlyValues,
} from "../src/lib/connectors/mixpanel/snapshots.ts";

describe("mixpanel connector — credential parsing", () => {
  it("accepts valid service account and project id", () => {
    const cred = parseMixpanelCredential({
      serviceAccountUsername: "saas-radar.abc123",
      serviceAccountSecret: "secret12345678",
      projectId: "1234567",
      region: "eu",
      signupEvent: "Signed Up",
      activationEvent: "Activated",
      activityEvent: "Logged In",
    });
    assert.equal(cred.serviceAccountUsername, "saas-radar.abc123");
    assert.equal(cred.projectId, "1234567");
    assert.equal(cred.region, "eu");
    assert.equal(cred.signupEvent, "Signed Up");
    assert.equal(cred.activationEvent, "Activated");
    assert.equal(cred.activityEvent, "Logged In");
  });

  it("defaults activity event to signup event", () => {
    const cred = parseMixpanelCredential({
      serviceAccountUsername: "user",
      serviceAccountSecret: "secret12345678",
      projectId: "1",
      signupEvent: "Signed Up",
    });
    assert.equal(cred.activityEvent, "Signed Up");
  });

  it("rejects missing activity and signup events", () => {
    assert.throws(
      () =>
        parseMixpanelCredential({
          serviceAccountUsername: "user",
          serviceAccountSecret: "secret12345678",
          projectId: "1",
        }),
      /événement activité/,
    );
  });

  it("rejects invalid project id", () => {
    assert.throws(
      () =>
        parseMixpanelCredential({
          serviceAccountUsername: "user",
          serviceAccountSecret: "secret12345678",
          projectId: "abc",
          activityEvent: "Logged In",
        }),
      /Project ID/,
    );
  });
});

describe("mixpanel connector — segmentation parsing", () => {
  it("parses monthly unique users", () => {
    const byMonth = parseSegmentationMonthlyValues(
      {
        data: {
          series: ["2025-01-01", "2025-02-01"],
          values: {
            "Logged In": {
              "2025-01-01": 120,
              "2025-02-01": 150,
            },
          },
        },
      },
      "Logged In",
    );
    assert.equal(byMonth.get("2025-01"), 120);
    assert.equal(byMonth.get("2025-02"), 150);
  });

  it("aggregates daily rows to monthly dau", () => {
    const byMonth = aggregateDailySegmentationToDau(
      {
        data: {
          values: {
            "Logged In": {
              "2025-01-01": 10,
              "2025-01-02": 20,
              "2025-02-01": 30,
            },
          },
        },
      },
      "Logged In",
    );
    assert.equal(byMonth.get("2025-01"), 15);
    assert.equal(byMonth.get("2025-02"), 30);
  });

  it("builds snapshots from query results", () => {
    const snapshots = buildSnapshotsFromQueryResults({
      monthKeys: ["2025-01", "2025-02"],
      mauByMonth: new Map([
        ["2025-01", 100],
        ["2025-02", 120],
      ]),
      dauByMonth: new Map([
        ["2025-01", 10],
        ["2025-02", 12],
      ]),
      signupsByMonth: new Map([["2025-01", 5]]),
    });

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]?.mau, 100);
    assert.equal(snapshots[0]?.dau, 10);
    assert.equal(snapshots[0]?.signups, 5);
    assert.equal(snapshots[0]?.source, "mixpanel");
    assert.equal(snapshots[1]?.signups, 0);
  });
});

describe("mixpanel connector — product stream", () => {
  it("parses retention d7 and activation rate", () => {
    const retention = {
      "2025-01-01": { first: 100, counts: [0, 0, 0, 0, 0, 0, 0, 25] },
      "2025-01-08": { first: 200, counts: [0, 0, 0, 0, 0, 0, 0, 50] },
    };

    const stream = buildProductStreamFromQueries({
      retention,
      activationRetention: retention,
    });

    assert.equal(stream.retentionD7, 25);
    assert.equal(stream.activationRate, 25);
  });

  it("parses top event from export jsonl", () => {
    const jsonl = [
      '{"event":"Dashboard View","properties":{}}',
      '{"event":"Dashboard View","properties":{}}',
      '{"event":"Export PDF","properties":{}}',
      '{"event":"$identify","properties":{}}',
    ].join("\n");

    assert.equal(parseTopEventFromExportJsonl(jsonl), "Dashboard View");
  });
});
