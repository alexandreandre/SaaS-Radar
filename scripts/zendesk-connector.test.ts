import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEndUserSearchQuery,
  buildZendeskSupportStream,
  computeCsatPercent,
  extractReplyMinutes,
  mapEndUserCountsToSnapshots,
  medianReplyHours,
  monthDateRange,
  normalizeSubdomain,
  resolveZendeskApiBase,
} from "../src/lib/connectors/zendesk/snapshots.ts";
import type { ZendeskTicketMetric } from "../src/lib/connectors/zendesk/types.ts";

describe("zendesk connector — subdomain", () => {
  it("normalizes bare subdomain and full URL", () => {
    assert.equal(normalizeSubdomain("Acme"), "acme");
    assert.equal(normalizeSubdomain("https://acme.zendesk.com/agent"), "acme");
    assert.equal(normalizeSubdomain("acme.zendesk.com"), "acme");
  });

  it("rejects invalid subdomains", () => {
    assert.equal(normalizeSubdomain(""), null);
    assert.equal(normalizeSubdomain("-bad"), null);
    assert.equal(normalizeSubdomain("bad space"), null);
  });

  it("builds API base URL", () => {
    assert.equal(resolveZendeskApiBase("acme"), "https://acme.zendesk.com/api/v2");
  });
});

describe("zendesk connector — month ranges", () => {
  it("builds ISO date bounds for a month key", () => {
    const range = monthDateRange("2025-02");
    assert.equal(range.start, "2025-02-01");
    assert.equal(range.end, "2025-02-28");
  });

  it("builds end-user search query", () => {
    const query = buildEndUserSearchQuery("2025-01");
    assert.match(query, /type:user role:end-user/);
    assert.match(query, /updated>=2025-01-01/);
    assert.match(query, /updated<=2025-01-31/);
  });
});

describe("zendesk connector — csat", () => {
  it("computes good rating percentage", () => {
    assert.equal(computeCsatPercent(8, 2), 80);
    assert.equal(computeCsatPercent(0, 10), 0);
    assert.equal(computeCsatPercent(5, 0), 100);
  });
});

describe("zendesk connector — response time", () => {
  it("extracts calendar reply minutes from ticket metrics", () => {
    const metric: ZendeskTicketMetric = {
      reply_time_in_minutes: { calendar: 120, business: 60 },
    };
    assert.equal(extractReplyMinutes(metric), 120);
  });

  it("computes median reply hours", () => {
    const metrics: ZendeskTicketMetric[] = [
      { reply_time_in_minutes: { calendar: 60 } },
      { reply_time_in_minutes: { calendar: 120 } },
      { reply_time_in_minutes: { calendar: 180 } },
    ];
    assert.equal(medianReplyHours(metrics), 2);
  });

  it("returns zero when no reply times are available", () => {
    assert.equal(medianReplyHours([{}, { reply_time_in_minutes: { calendar: 0 } }]), 0);
  });
});

describe("zendesk connector — snapshots", () => {
  it("maps monthly end-user counts to activeUsers snapshots", () => {
    const monthKeys = ["2025-01", "2025-02"];
    const countsByMonth = new Map<string, number>([
      ["2025-01", 88],
      ["2025-02", 102],
    ]);

    const snapshots = mapEndUserCountsToSnapshots({ monthKeys, countsByMonth });
    assert.equal(snapshots.length, 2);
    assert.equal(snapshots[0]?.activeUsers, 88);
    assert.equal(snapshots[0]?.mau, 88);
    assert.equal(snapshots[0]?.source, "zendesk");
    assert.equal(snapshots[1]?.activeUsers, 102);
  });
});

describe("zendesk connector — support stream", () => {
  it("builds a normalized support stream payload", () => {
    const stream = buildZendeskSupportStream({
      openTickets: 9.6,
      avgResponseHours: 2.75,
      csat: 91.4,
    });
    assert.equal(stream.type, "support");
    assert.equal(stream.openTickets, 10);
    assert.equal(stream.avgResponseHours, 2.75);
    assert.equal(stream.csat, 91);
  });
});
