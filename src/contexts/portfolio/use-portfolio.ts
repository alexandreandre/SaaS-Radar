"use client";

import { useMemo } from "react";
import { usePortfolio } from "@/contexts/portfolio/use-portfolio-core";
import type { PortfolioContextValue } from "@/contexts/portfolio/portfolio-types";
import type { UserProject } from "@/lib/portfolio";
import type { ConnectorId, Integration } from "@/lib/connectors/types";

/** Projets, stats, CRUD — mes-saas, navbar. */
export function usePortfolioProjects(): Pick<
  PortfolioContextValue,
  | "projects"
  | "hydrated"
  | "stats"
  | "overdueCheckIns"
  | "activeProject"
  | "addProject"
  | "registerProject"
  | "removeProject"
  | "updateProject"
  | "getProjectBySlug"
  | "getProjectById"
  | "catalogIndex"
> {
  const ctx = usePortfolio();
  return useMemo(
    () => ({
      projects: ctx.projects,
      hydrated: ctx.hydrated,
      stats: ctx.stats,
      overdueCheckIns: ctx.overdueCheckIns,
      activeProject: ctx.activeProject,
      addProject: ctx.addProject,
      registerProject: ctx.registerProject,
      removeProject: ctx.removeProject,
      updateProject: ctx.updateProject,
      getProjectBySlug: ctx.getProjectBySlug,
      getProjectById: ctx.getProjectById,
      catalogIndex: ctx.catalogIndex,
    }),
    [ctx],
  );
}

/** Build setup, milestones, journal. */
export function usePortfolioBuild(projectId: string) {
  const ctx = usePortfolio();
  return useMemo(
    () => ({
      project: ctx.getProjectById(projectId) as UserProject | undefined,
      hydrated: ctx.hydrated,
      toggleMilestone: (milestoneId: string) => ctx.toggleMilestone(projectId, milestoneId),
      setBuildSetupForProject: ctx.setBuildSetupForProject,
      switchBuildTool: ctx.switchBuildTool,
      setBuildDevLevel: ctx.setBuildDevLevel,
      setBuildPromptLanguage: ctx.setBuildPromptLanguage,
      setProductName: ctx.setProductName,
      resetBuild: ctx.resetBuild,
      restoreBuildVersion: ctx.restoreBuildVersion,
    }),
    [ctx, projectId],
  );
}

/** Connecteurs — à importer depuis les modules cockpit uniquement. */
export function usePortfolioConnectors(projectId: string) {
  const ctx = usePortfolio();
  return useMemo(
    () => ({
      project: ctx.getProjectById(projectId),
      hydrated: ctx.hydrated,
      connectIntegration: (
        connectorId: ConnectorId,
        options?: Parameters<PortfolioContextValue["connectIntegration"]>[2],
      ) => ctx.connectIntegration(projectId, connectorId, options),
      disconnectIntegration: (connectorId: ConnectorId) =>
        ctx.disconnectIntegration(projectId, connectorId),
      syncIntegration: (connectorId: ConnectorId) =>
        ctx.syncIntegration(projectId, connectorId),
      syncProjectIntegrations: (opts?: { force?: boolean }) =>
        ctx.syncProjectIntegrations(projectId, opts),
      patchIntegration: (
        connectorId: ConnectorId,
        patch: Partial<Integration>,
      ) => ctx.patchIntegration(projectId, connectorId, patch),
      autoSyncingProjectId: ctx.autoSyncingProjectId,
      autoSyncingConnectors: ctx.autoSyncingConnectors,
    }),
    [ctx, projectId],
  );
}
