import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { portfolioMetricsBodySchema } from "../src/lib/portfolio-sync-schema.ts";

describe("portfolioMetricsBodySchema", () => {
  it("accepte un projet opportunité valide", () => {
    const result = portfolioMetricsBodySchema.safeParse({
      id: "proj-1",
      opportunitySlug: "test-saas",
      phase: "build",
      currentMrr: 0,
      targetScenario: "Réaliste",
    });
    assert.equal(result.success, true);
  });

  it("accepte un projet idée sans slug", () => {
    const result = portfolioMetricsBodySchema.safeParse({
      id: "proj-2",
      phase: "build",
      currentMrr: 0,
      projectSource: "idea",
      ideaBrief: { identity: { name: "Test" } },
    });
    assert.equal(result.success, true);
  });

  it("accepte un projet opportunité legacy catalog", () => {
    const result = portfolioMetricsBodySchema.safeParse({
      id: "proj-4",
      opportunitySlug: "test-saas",
      phase: "build",
      currentMrr: 0,
      projectSource: "catalog",
    });
    assert.equal(result.success, true);
  });

  it("rejette un projet sans slug ni idée", () => {
    const result = portfolioMetricsBodySchema.safeParse({
      id: "proj-3",
      phase: "build",
      currentMrr: 0,
    });
    assert.equal(result.success, false);
  });
});

describe("portfolio sync queue contracts", () => {
  it("exporte enqueueProjectSync et subscribeProjectSync", async () => {
    const mod = await import("../src/lib/portfolio-sync-queue.ts");
    assert.equal(typeof mod.enqueueProjectSync, "function");
    assert.equal(typeof mod.subscribeProjectSync, "function");
  });
});

describe("portfolio account loaders", () => {
  it("exporte loadAccountProjects et mergeGuestProjectsToAccount", async () => {
    const mod = await import("../src/contexts/portfolio/portfolio-account.ts");
    assert.equal(typeof mod.loadAccountProjects, "function");
    assert.equal(typeof mod.mergeGuestProjectsToAccount, "function");
  });
});

describe("opportunity catalog client", () => {
  it("exporte fetchOpportunityBySlug et prefetchOpportunitySlugs", async () => {
    const mod = await import("../src/lib/opportunity-catalog-client.ts");
    assert.equal(typeof mod.fetchOpportunityBySlug, "function");
    assert.equal(typeof mod.prefetchOpportunitySlugs, "function");
  });
});

describe("connector sync enqueue API", () => {
  it("exporte POST sur /api/connectors/sync/enqueue", async () => {
    const mod = await import("../src/app/api/connectors/sync/enqueue/route.ts");
    assert.equal(typeof mod.POST, "function");
  });
});
