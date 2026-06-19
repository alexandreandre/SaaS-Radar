import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCrmStream,
  normalizeApiDomain,
  parseDealCycleDays,
  parseSummaryCount,
  parseSummaryValue,
} from "../src/lib/connectors/pipedrive/snapshots.ts";
import type { PipedriveDeal } from "../src/lib/connectors/pipedrive/types.ts";

describe("pipedrive connector — api domain", () => {
  it("normalizes company domain", () => {
    assert.equal(normalizeApiDomain("acme.pipedrive.com"), "https://acme.pipedrive.com");
    assert.equal(normalizeApiDomain("https://acme.pipedrive.com/"), "https://acme.pipedrive.com");
  });
});

describe("pipedrive connector — summary parsing", () => {
  it("reads converted pipeline value", () => {
    assert.equal(
      parseSummaryValue({ total_currency_converted_value: 12500.5 }),
      12500.5,
    );
  });

  it("falls back to values_total aggregation", () => {
    assert.equal(
      parseSummaryValue({
        values_total: {
          EUR: { value: 1000, count: 2 },
          USD: { value: 500, count: 1 },
        },
      }),
      1500,
    );
  });

  it("reads deal counts from summary", () => {
    assert.equal(parseSummaryCount({ total_count: 12.8 }), 13);
    assert.equal(parseSummaryCount(null), 0);
  });
});

describe("pipedrive connector — cycle days", () => {
  it("computes average cycle from won deals", () => {
    const deals: PipedriveDeal[] = [
      { add_time: "2026-01-01T00:00:00.000Z", won_time: "2026-01-11T00:00:00.000Z" },
      { add_time: "2026-01-01T00:00:00.000Z", won_time: "2026-01-21T00:00:00.000Z" },
    ];
    assert.equal(parseDealCycleDays(deals), 15);
  });

  it("ignores deals without won_time", () => {
    const deals: PipedriveDeal[] = [
      { add_time: "2026-01-01T00:00:00.000Z", won_time: null },
      { add_time: "2026-01-01T00:00:00.000Z" },
    ];
    assert.equal(parseDealCycleDays(deals), 0);
  });

  it("returns zero for empty list", () => {
    assert.equal(parseDealCycleDays([]), 0);
  });
});

describe("pipedrive connector — crm stream", () => {
  it("builds normalized crm stream payload", () => {
    const stream = buildCrmStream({
      pipelineValue: 42000.7,
      dealsWon: 5.2,
      dealsLost: 2.1,
      avgCycleDays: 28.46,
    });
    assert.equal(stream.type, "crm");
    assert.equal(stream.pipelineValue, 42001);
    assert.equal(stream.dealsWon, 5);
    assert.equal(stream.dealsLost, 2);
    assert.equal(stream.avgCycleDays, 28.5);
  });
});
