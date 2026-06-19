import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseCrispCredential } from "../src/lib/connectors/crisp/keys.ts";
import {
  buildSupportStream,
  extractAnalyticsPoints,
  mapRatingToCsatPercent,
  mapResponseTimeToHours,
  mapVisitorAnalyticsToSnapshots,
} from "../src/lib/connectors/crisp/snapshots.ts";

const SAMPLE_WEBSITE_ID = "33619249-efd8-44fa-9312-9a594a819eae";

describe("crisp connector — credential parsing", () => {
  it("accepts valid website id", () => {
    const cred = parseCrispCredential({
      websiteId: SAMPLE_WEBSITE_ID,
      websiteName: "Mon SaaS",
    });
    assert.equal(cred.websiteId, SAMPLE_WEBSITE_ID);
    assert.equal(cred.websiteName, "Mon SaaS");
    assert.equal(cred.timezone, "Europe/Paris");
  });

  it("rejects empty website id", () => {
    assert.throws(() => parseCrispCredential({ websiteId: "" }), /Website ID/);
  });

  it("rejects invalid website id format", () => {
    assert.throws(
      () => parseCrispCredential({ websiteId: "not-a-uuid" }),
      /Format de Website ID/,
    );
  });
});

describe("crisp connector — analytics parsing", () => {
  it("extracts nested analytics points", () => {
    const points = extractAnalyticsPoints({
      data: {
        data: [{ period: "2025-01", unique_hits: 120 }],
      },
    });
    assert.equal(points.length, 1);
    assert.equal(points[0]?.unique_hits, 120);
  });

  it("maps visitor analytics to monthly activeUsers snapshots", () => {
    const monthKeys = ["2025-01", "2025-02"];
    const snapshots = mapVisitorAnalyticsToSnapshots({
      monthKeys,
      points: [
        { period: "2025-01", unique_hits: 80 },
        { period: "2025-02-15T00:00:00.000Z", unique_hits: 95 },
      ],
    });

    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]?.activeUsers, 80);
    assert.equal(snapshots[0]?.source, "crisp");
    assert.equal(snapshots[1]?.activeUsers, 95);
    assert.equal(snapshots[1]?.mau, 95);
  });
});

describe("crisp connector — support stream mapping", () => {
  it("converts response time seconds to hours", () => {
    assert.equal(mapResponseTimeToHours(7200), 2);
    assert.equal(mapResponseTimeToHours(3_600_000), 1);
  });

  it("converts rating to csat percent", () => {
    assert.equal(mapRatingToCsatPercent(4.2), 84);
    assert.equal(mapRatingToCsatPercent(5), 100);
  });

  it("builds support stream from fixtures", () => {
    const stream = buildSupportStream({
      openTickets: 7,
      responseTimePoints: [{ value: 5400 }],
      ratingPoints: [{ value: 4 }],
    });

    assert.equal(stream.type, "support");
    assert.equal(stream.openTickets, 7);
    assert.equal(stream.avgResponseHours, 1.5);
    assert.equal(stream.csat, 80);
  });
});
