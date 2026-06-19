#!/usr/bin/env node
/** Génère portfolio-provider.tsx depuis portfolio-context.tsx */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src/contexts/portfolio-context.tsx");
const OUT = path.join(ROOT, "src/contexts/portfolio/portfolio-provider.tsx");

const lines = fs.readFileSync(SRC, "utf8").split("\n");

const header = `"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { type ConnectorId } from "@/lib/connectors";
import type { Opportunity, OpportunityListItem } from "@/types/opportunity";
import { useTier } from "@/contexts/tier-context";
import { enrichOpportunity } from "@/data/opportunity-enrichment";
import { createClient } from "@/lib/supabase/client";
import { gateOpportunityForTier } from "@/lib/opportunity-access";
import {
  fetchOpportunityBySlug,
  getCachedOpportunity,
  prefetchOpportunitySlugs,
  primeOpportunityCache,
} from "@/lib/opportunity-catalog-client";
import {
  getMostUrgentProject,
  getPortfolioStats,
  countOverdueCheckIns,
  type UserProject,
} from "@/lib/portfolio";
import {
  loadAccountProjects,
  mergeGuestProjectsToAccount,
} from "@/contexts/portfolio/portfolio-account";
import {
  flushPortfolioSyncQueue,
  queueProjectDelete,
  queueProjectSync,
} from "@/lib/portfolio-sync-client";
import {
  migrateLegacyPortfolioStorage,
  persistProjects,
  portfolioStorageKey,
  PORTFOLIO_GUEST_STORAGE_KEY,
  readStoredProjects,
} from "@/lib/portfolio-storage.shared";
import { PortfolioContext } from "./portfolio-context-instance";
import type { PortfolioContextValue } from "./portfolio-types";
import type { PortfolioActionDeps } from "./portfolio-action-deps";
import { createProjectActions } from "./portfolio-project-actions";
import { createBuildActions } from "./portfolio-build-actions";
import { createCampaignActions } from "./portfolio-campaign-actions";
import { createFinanceActions } from "./portfolio-finance-actions";
`;

const providerStart = lines.findIndex((l) => l.startsWith("export function PortfolioProvider"));
const providerBodyBeforeActions = lines.slice(providerStart, 467).join("\n"); // through commit block end

const tailStart = lines.findIndex((l) => l.startsWith("  const getProjectBySlug = useCallback"));
const providerTail = lines.slice(tailStart, lines.findIndex((l) => l === "export function usePortfolio(): PortfolioContextValue {")).join("\n");

const middle = `
  const getProjectByIdEarly = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects],
  );

  const actionDeps = useMemo(
    (): PortfolioActionDeps => ({
      commit,
      getProjects: () => projects,
      getProjectById: getProjectByIdEarly,
      getCatalogOpportunity,
      updateProject: (id, patch) => {
        commit((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      },
      setAutoSyncState,
      catalogIndex,
    }),
    [commit, projects, getProjectByIdEarly, getCatalogOpportunity, catalogIndex],
  );

  const depsRef = useRef(actionDeps);
  depsRef.current = actionDeps;

  const projectActions = useMemo(() => createProjectActions(actionDeps), [actionDeps]);
  const buildActions = useMemo(() => createBuildActions(actionDeps), [actionDeps]);
  const campaignActions = useMemo(() => createCampaignActions(actionDeps), [actionDeps]);
  const financeActions = useMemo(() => createFinanceActions(actionDeps), [actionDeps]);

  const {
    addProject,
    registerProject,
    removeProject,
    updateProject,
    setProjectPhase,
    recordMrr,
    toggleMilestone,
    toggleLaunchChecklistItem,
    completeOnboarding,
    markLaunchRoomSeen,
  } = projectActions;

  const {
    setBuildSetupForProject,
    switchBuildTool: switchBuildToolForProject,
    setBuildDevLevel,
    setBuildPromptLanguage,
    setProductName,
    setProductLogo,
    restoreBuildVersion,
    resetBuild: resetBuildForProject,
  } = buildActions;

  const {
    setCampaignKitForProject,
    switchCampaignTool: switchCampaignToolForProject,
    addCampaignTool: addCampaignToolForProject,
    removeCampaignTool: removeCampaignToolForProject,
    setMarketingProfile: setMarketingProfileForProject,
    setStrategyBriefForProject,
    setCampaignChannel: setCampaignChannelForProject,
    setAcquisitionStage: setAcquisitionStageForProject,
    setCampaignSmartGoal: setCampaignSmartGoalForProject,
    setCampaignIcp: setCampaignIcpForProject,
    setCampaignPositioning: setCampaignPositioningForProject,
    toggleCampaignAction: toggleCampaignActionForProject,
    setCampaignTrackingPlan: setCampaignTrackingPlanForProject,
    addCampaignWeeklyCheckIn: addCampaignWeeklyCheckInForProject,
    completeCampaignRetrospective: completeCampaignRetrospectiveForProject,
    startNewCampaignCycle: startNewCampaignCycleForProject,
    acknowledgeCampaignDistribution: acknowledgeCampaignDistributionForProject,
    acknowledgeCampaignMeasure: acknowledgeCampaignMeasureForProject,
    restoreCampaignVersion,
    resetCampaign: resetCampaignForProject,
  } = campaignActions;

  const {
    addCampaign,
    updateCampaign,
    removeCampaign,
    addExpense,
    removeExpense,
    logMetricsSnapshot,
    setCashOnHand,
  } = financeActions;

  const loadConnectorActions = useCallback(async () => {
    const mod = await import("./portfolio-connector-actions");
    return mod.createConnectorActions(depsRef.current);
  }, []);

  const connectIntegration = useCallback(
    async (
      projectId: string,
      connectorId: ConnectorId,
      options?: Parameters<PortfolioContextValue["connectIntegration"]>[2],
    ) => {
      const actions = await loadConnectorActions();
      return actions.connectIntegration(projectId, connectorId, options);
    },
    [loadConnectorActions],
  );

  const disconnectIntegration = useCallback(
    async (projectId: string, connectorId: ConnectorId) => {
      const actions = await loadConnectorActions();
      return actions.disconnectIntegration(projectId, connectorId);
    },
    [loadConnectorActions],
  );

  const syncIntegration = useCallback(
    async (projectId: string, connectorId: ConnectorId) => {
      const actions = await loadConnectorActions();
      return actions.syncIntegration(projectId, connectorId);
    },
    [loadConnectorActions],
  );

  const syncProjectIntegrations = useCallback(
    async (projectId: string, opts?: { force?: boolean }) => {
      const actions = await loadConnectorActions();
      return actions.syncProjectIntegrations(projectId, opts);
    },
    [loadConnectorActions],
  );

  const removeGitHubRepo = useCallback(
    async (projectId: string, repoFullName: string) => {
      const actions = await loadConnectorActions();
      return actions.removeGitHubRepo(projectId, repoFullName);
    },
    [loadConnectorActions],
  );

  const patchIntegration = useCallback(
    (
      projectId: string,
      connectorId: ConnectorId,
      patch: Parameters<PortfolioContextValue["patchIntegration"]>[2],
    ) => {
      void loadConnectorActions().then((actions) =>
        actions.patchIntegration(projectId, connectorId, patch),
      );
    },
    [loadConnectorActions],
  );

  const setGitHubConnection = useCallback(
    (id: string, connection: Parameters<PortfolioContextValue["setGitHubConnection"]>[1]) => {
      void loadConnectorActions().then((actions) => actions.setGitHubConnection(id, connection));
    },
    [loadConnectorActions],
  );

  const setHostConnection = useCallback(
    (id: string, connection: Parameters<PortfolioContextValue["setHostConnection"]>[1]) => {
      void loadConnectorActions().then((actions) => actions.setHostConnection(id, connection));
    },
    [loadConnectorActions],
  );
`;

// Fix provider body - remove PortfolioContext createContext and use PortfolioContext from import
let body = providerBodyBeforeActions.replace(
  /export function PortfolioProvider/,
  "export function PortfolioProvider",
);

const content = header + "\n" + body + middle + "\n" + providerTail + "\n";
fs.writeFileSync(OUT, content);
console.log("Wrote", OUT, "lines:", content.split("\n").length);
