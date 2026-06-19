import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PortfolioActionDeps } from "../src/contexts/portfolio/portfolio-action-deps.ts";
import { createProjectActions } from "../src/contexts/portfolio/portfolio-project-actions.ts";
import { createBuildActions } from "../src/contexts/portfolio/portfolio-build-actions.ts";
import { createCampaignActions } from "../src/contexts/portfolio/portfolio-campaign-actions.ts";
import { createFinanceActions } from "../src/contexts/portfolio/portfolio-finance-actions.ts";
import { createConnectionActions } from "../src/contexts/portfolio/portfolio-connection-actions.ts";
import { createConnectorActions } from "../src/contexts/portfolio/portfolio-connector-actions.ts";

const noopDeps = {
  commit: () => {},
  getProjects: () => [],
  getProjectById: () => undefined,
  getCatalogOpportunity: () => undefined,
  updateProject: () => {},
  setAutoSyncState: () => {},
  catalogIndex: [],
} satisfies PortfolioActionDeps;

describe("portfolio action factories", () => {
  it("createProjectActions expose les clés CRUD attendues", () => {
    const actions = createProjectActions(noopDeps);
    for (const key of [
      "addProject",
      "registerProject",
      "removeProject",
      "updateProject",
      "setProjectPhase",
      "recordMrr",
      "toggleMilestone",
      "toggleLaunchChecklistItem",
      "completeOnboarding",
      "markLaunchRoomSeen",
    ]) {
      assert.equal(typeof actions[key as keyof typeof actions], "function");
    }
  });

  it("createBuildActions expose les handlers build", () => {
    const actions = createBuildActions(noopDeps);
    assert.equal(typeof actions.setBuildSetupForProject, "function");
    assert.equal(typeof actions.switchBuildTool, "function");
    assert.equal(typeof actions.resetBuild, "function");
  });

  it("createCampaignActions expose les handlers campagne", () => {
    const actions = createCampaignActions(noopDeps);
    assert.equal(typeof actions.setCampaignKitForProject, "function");
    assert.equal(typeof actions.resetCampaign, "function");
  });

  it("createFinanceActions expose les handlers finance", () => {
    const actions = createFinanceActions(noopDeps);
    assert.equal(typeof actions.addCampaign, "function");
    assert.equal(typeof actions.setCashOnHand, "function");
  });

  it("createConnectionActions expose patch et connexions hôte", () => {
    const actions = createConnectionActions(noopDeps);
    assert.equal(typeof actions.setGitHubConnection, "function");
    assert.equal(typeof actions.setHostConnection, "function");
    assert.equal(typeof actions.patchIntegration, "function");
  });

  it("createConnectorActions expose OAuth/sync", () => {
    const actions = createConnectorActions(noopDeps);
    for (const key of [
      "connectIntegration",
      "disconnectIntegration",
      "syncIntegration",
      "syncProjectIntegrations",
      "removeGitHubRepo",
      "patchIntegration",
    ]) {
      assert.equal(typeof actions[key as keyof typeof actions], "function");
    }
  });
});
