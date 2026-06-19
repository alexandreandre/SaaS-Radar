import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  parseBetterStackApiToken,
  parseBetterStackCredential,
} from "../src/lib/connectors/better-stack/keys.ts";
import {
  buildDateRangeLast30Days,
  buildDevStreamFromUptimeMetrics,
  computeHealthScore,
  normalizeHostname,
  suggestMonitorByUrl,
} from "../src/lib/connectors/better-stack/streams.ts";
import type { BetterStackMonitorSummary } from "../src/lib/connectors/better-stack/types.ts";

const NOW = new Date("2026-06-18T12:00:00.000Z");

describe("better-stack connector — credential parsing", () => {
  it("accepts valid token and monitor id", () => {
    const cred = parseBetterStackCredential({
      apiToken: "abcdefghijklmnopqrst",
      monitorId: "258338",
      monitorName: "Production API",
      monitorUrl: "https://app.example.com",
      teamName: "Mon équipe",
    });
    assert.equal(cred.apiToken, "abcdefghijklmnopqrst");
    assert.equal(cred.monitorId, "258338");
    assert.equal(cred.monitorName, "Production API");
    assert.equal(cred.monitorUrl, "https://app.example.com");
    assert.equal(cred.teamName, "Mon équipe");
  });

  it("rejects empty api token", () => {
    assert.throws(
      () => parseBetterStackApiToken(""),
      /Token API Better Stack/,
    );
  });

  it("rejects short api token", () => {
    assert.throws(
      () => parseBetterStackApiToken("short"),
      /Format de token/,
    );
  });

  it("rejects invalid monitor id", () => {
    assert.throws(
      () => parseBetterStackCredential({ apiToken: "abcdefghijklmnopqrst", monitorId: "abc" }),
      /ID de monitor/,
    );
  });
});

describe("better-stack connector — date range", () => {
  it("builds a 30-day inclusive range", () => {
    const [from, to] = buildDateRangeLast30Days(NOW);
    assert.equal(from, "2026-05-20");
    assert.equal(to, "2026-06-18");
  });
});

describe("better-stack connector — monitor suggestion", () => {
  const monitors: BetterStackMonitorSummary[] = [
    {
      id: "1",
      name: "Marketing site",
      url: "https://www.example.com",
      status: "up",
      teamName: null,
      lastCheckedAt: null,
    },
    {
      id: "2",
      name: "App production",
      url: "https://app.example.com/health",
      status: "up",
      teamName: null,
      lastCheckedAt: null,
    },
  ];

  it("normalizes hostnames", () => {
    assert.equal(normalizeHostname("https://www.example.com/path"), "example.com");
    assert.equal(normalizeHostname("app.example.com"), "app.example.com");
  });

  it("suggests monitor matching production hostname", () => {
    assert.equal(
      suggestMonitorByUrl(monitors, "https://app.example.com"),
      "2",
    );
  });

  it("returns null when no match", () => {
    assert.equal(suggestMonitorByUrl(monitors, "https://other.test"), null);
  });
});

describe("better-stack connector — dev stream mapping", () => {
  it("maps uptime metrics to DevStream", () => {
    const stream = buildDevStreamFromUptimeMetrics({
      monitorId: "258338",
      monitorName: "Production API",
      monitorUrl: "https://app.example.com",
      monitorStatus: "up",
      lastCheckedAt: "2026-06-18T10:00:00.000Z",
      sla: {
        availability: 99.94,
        totalDowntime: 120,
        numberOfIncidents: 2,
        longestIncident: 90,
        averageIncident: 60,
      },
      openIncidents: 1,
      avgResponseTimeMs: 420,
    });

    assert.equal(stream.type, "dev");
    assert.equal(stream.deploysLast30d, 0);
    assert.equal(stream.openIssues, 1);
    assert.equal(stream.uptimePct, 99.9);
    assert.equal(stream.errorRate, 0.1);
    assert.equal(stream.deploymentUrl, "https://app.example.com");
    assert.equal(stream.lastDeploymentAt, "2026-06-18T10:00:00.000Z");
    assert.ok(typeof stream.healthScore === "number");
  });

  it("penalizes down monitors in health score", () => {
    const healthy = computeHealthScore({
      sla: { availability: 99.9, totalDowntime: 0, numberOfIncidents: 0, longestIncident: 0, averageIncident: 0 },
      monitorStatus: "up",
      avgResponseTimeMs: 200,
      openIncidents: 0,
    });
    const down = computeHealthScore({
      sla: { availability: 99.9, totalDowntime: 0, numberOfIncidents: 0, longestIncident: 0, averageIncident: 0 },
      monitorStatus: "down",
      avgResponseTimeMs: 200,
      openIncidents: 2,
    });

    assert.ok(down < healthy);
  });
});
