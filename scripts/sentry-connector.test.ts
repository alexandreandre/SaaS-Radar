import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { buildSentryRefreshJwtClaims, signJwtHs256 } from "../src/lib/connectors/sentry/jwt.ts";
import { isSentryTokenExpired } from "../src/lib/connectors/sentry/token.ts";
import {
  buildAccountLabel,
  buildDevStreamFromMetrics,
  computeErrorRateFromCounts,
  countReleasesLast30d,
  crashFreeRateToUptimePct,
  parseCountUniqueIssueFromEvents,
  parseCrashFreeRateFromSessions,
  parseCrashRateFromSessions,
  sumEventStatsSeries,
} from "../src/lib/connectors/sentry/streams.ts";

const NOW = new Date("2026-06-18T12:00:00.000Z").getTime();

describe("sentry connector — stream mapping", () => {
  it("maps sync metrics to DevStream", () => {
    const stream = buildDevStreamFromMetrics({
      openIssues: 12,
      errorRate: 4.2,
      uptimePct: 98.7,
      deploysLast30d: 5,
      releasesAvailable: true,
    });
    assert.equal(stream.type, "dev");
    assert.equal(stream.openIssues, 12);
    assert.equal(stream.errorRate, 4.2);
    assert.equal(stream.uptimePct, 98.7);
    assert.equal(stream.deploysLast30d, 5);
  });

  it("computes error rate from counts", () => {
    assert.equal(computeErrorRateFromCounts(25, 1000), 2.5);
    assert.equal(computeErrorRateFromCounts(0, 0), 0);
  });

  it("maps crash-free rate to uptime percentage", () => {
    assert.equal(crashFreeRateToUptimePct(0.987), 98.7);
    assert.equal(crashFreeRateToUptimePct(99.1), 99.1);
  });

  it("counts releases in last 30 days", () => {
    const releases = [
      { dateCreated: new Date(NOW - 5 * 86400000).toISOString() },
      { dateCreated: new Date(NOW - 40 * 86400000).toISOString() },
    ];
    assert.equal(countReleasesLast30d(releases, NOW), 1);
  });

  it("builds account label", () => {
    assert.equal(buildAccountLabel("acme", "Frontend", "frontend"), "Sentry · Frontend");
    assert.equal(buildAccountLabel("acme"), "Sentry · acme");
  });
});

describe("sentry connector — API response parsing", () => {
  it("parses count_unique(issue) from events query", () => {
    const count = parseCountUniqueIssueFromEvents({
      data: [{ "count_unique(issue)": 42 }],
    });
    assert.equal(count, 42);
  });

  it("parses crash-free rate from sessions response", () => {
    const rate = parseCrashFreeRateFromSessions({
      groups: [{ totals: { "crash_free_rate(session)": 0.991 } }],
    });
    assert.equal(rate, 0.991);
  });

  it("parses crash rate from sessions response", () => {
    const rate = parseCrashRateFromSessions({
      groups: [{ totals: { "crash_rate(session)": 0.03 } }],
    });
    assert.equal(rate, 0.03);
  });

  it("sums event stats series", () => {
    const total = sumEventStatsSeries([
      [1, [{ count: 10 }]],
      [2, [{ count: 5 }]],
    ]);
    assert.equal(total, 15);
  });
});

describe("sentry connector — oauth helpers", () => {
  it("detects expired tokens with skew", () => {
    const expired = new Date(Date.now() - 1000).toISOString();
    const fresh = new Date(Date.now() + 60 * 60 * 1000).toISOString();
    assert.equal(isSentryTokenExpired(expired), true);
    assert.equal(isSentryTokenExpired(fresh), false);
  });

  it("builds JWT refresh claims and signature", () => {
    const claims = buildSentryRefreshJwtClaims("client-123");
    assert.equal(claims.iss, "client-123");
    assert.equal(claims.sub, "client-123");
    assert.ok(typeof claims.jti === "string");

    const token = signJwtHs256(claims, "secret-key");
    assert.match(token, /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/);
  });
});
