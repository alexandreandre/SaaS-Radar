import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildHubSpotCrmStream,
  classifyPipelineStages,
  computeAvgCycleDays,
  parseDealAmount,
  sumPipelineValue,
} from "../src/lib/connectors/hubspot/crm-stream.ts";
import type { HubSpotDeal, HubSpotPipeline } from "../src/lib/connectors/hubspot/types.ts";

const samplePipelines: HubSpotPipeline[] = [
  {
    id: "default",
    label: "Sales Pipeline",
    stages: [
      {
        id: "appointmentscheduled",
        label: "Appointment Scheduled",
        metadata: { isClosed: "false", probability: "0.2" },
      },
      {
        id: "closedwon",
        label: "Closed Won",
        metadata: { isClosed: "true", probability: "1.0" },
      },
      {
        id: "closedlost",
        label: "Closed Lost",
        metadata: { isClosed: "true", probability: "0" },
      },
    ],
  },
];

describe("hubspot connector — pipeline stages", () => {
  it("classifies open, won and lost stages from pipeline metadata", () => {
    const classification = classifyPipelineStages(samplePipelines);
    assert.deepEqual(classification.openStageIds, ["appointmentscheduled"]);
    assert.deepEqual(classification.wonStageIds, ["closedwon"]);
    assert.deepEqual(classification.lostStageIds, ["closedlost"]);
  });

  it("returns empty arrays when no pipelines", () => {
    const classification = classifyPipelineStages([]);
    assert.deepEqual(classification, {
      wonStageIds: [],
      lostStageIds: [],
      openStageIds: [],
    });
  });
});

describe("hubspot connector — deal amount", () => {
  it("parses numeric amounts and ignores invalid values", () => {
    assert.equal(parseDealAmount("1200"), 1200);
    assert.equal(parseDealAmount(null), 0);
    assert.equal(parseDealAmount(""), 0);
    assert.equal(parseDealAmount("invalid"), 0);
  });

  it("sums pipeline value from open deals", () => {
    const deals: HubSpotDeal[] = [
      { id: "1", properties: { amount: "1000" } },
      { id: "2", properties: { amount: "2500.5" } },
      { id: "3", properties: { amount: null } },
    ];
    assert.equal(sumPipelineValue(deals), 3501);
  });
});

describe("hubspot connector — cycle days", () => {
  it("computes average cycle length for won deals", () => {
    const created = "2025-01-01T00:00:00.000Z";
    const closed10 = "2025-01-11T00:00:00.000Z";
    const closed20 = "2025-01-21T00:00:00.000Z";
    const deals: HubSpotDeal[] = [
      { id: "1", properties: { createdate: created, closedate: closed10 } },
      { id: "2", properties: { createdate: created, closedate: closed20 } },
    ];
    assert.equal(computeAvgCycleDays(deals), 15);
  });

  it("returns zero when no valid cycle data", () => {
    assert.equal(computeAvgCycleDays([]), 0);
    assert.equal(computeAvgCycleDays([{ id: "1", properties: {} }]), 0);
  });
});

describe("hubspot connector — crm stream", () => {
  it("builds normalized crm stream payload", () => {
    const stream = buildHubSpotCrmStream({
      openDeals: [{ id: "1", properties: { amount: "5000" } }],
      wonDeals30d: [{ id: "2" }, { id: "3" }],
      lostDeals30d: [{ id: "4" }],
      wonDeals90dForCycle: [
        {
          id: "2",
          properties: {
            createdate: "2025-01-01T00:00:00.000Z",
            closedate: "2025-01-15T00:00:00.000Z",
          },
        },
      ],
    });

    assert.equal(stream.type, "crm");
    assert.equal(stream.pipelineValue, 5000);
    assert.equal(stream.dealsWon, 2);
    assert.equal(stream.dealsLost, 1);
    assert.equal(stream.avgCycleDays, 14);
  });
});
