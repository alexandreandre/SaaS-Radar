"use client";

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
import { createConnectionActions } from "./portfolio-connection-actions";

export function PortfolioProvider({
  children,
  catalogIndex,
  userId: serverUserId = null,
}: {
  children: ReactNode;
  catalogIndex: OpportunityListItem[];
  userId?: string | null;
}) {
  const { tier } = useTier();
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [autoSyncState, setAutoSyncState] = useState<{
    projectId: string;
    connectorIds: ConnectorId[];
  } | null>(null);
  const [activeUserId, setActiveUserId] = useState<string | null>(serverUserId);
  const storageKeyRef = useRef(
    serverUserId ? portfolioStorageKey(serverUserId) : PORTFOLIO_GUEST_STORAGE_KEY,
  );
  const mergeDoneRef = useRef(Boolean(serverUserId));

  useEffect(() => {
    flushPortfolioSyncQueue();
  }, []);

  useEffect(() => {
    setActiveUserId(serverUserId);
    if (serverUserId) {
      storageKeyRef.current = portfolioStorageKey(serverUserId);
      mergeDoneRef.current = true;
    }
  }, [serverUserId]);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    const applyProjects = (next: UserProject[], userId: string | null, storageKey: string) => {
      if (!active) return;
      setActiveUserId(userId);
      storageKeyRef.current = storageKey;
      setProjects(next);
      persistProjects(next, storageKey);
      setHydrated(true);
    };

    const loadGuest = () => {
      migrateLegacyPortfolioStorage();
      applyProjects(
        readStoredProjects(PORTFOLIO_GUEST_STORAGE_KEY),
        null,
        PORTFOLIO_GUEST_STORAGE_KEY,
      );
    };

    const loadForUser = async (userId: string, mergeGuest: boolean) => {
      const storageKey = portfolioStorageKey(userId);
      if (mergeGuest) {
        try {
          const merged = await mergeGuestProjectsToAccount(userId);
          applyProjects(merged, userId, storageKey);
        } catch {
          applyProjects(readStoredProjects(storageKey), userId, storageKey);
        }
        return;
      }

      try {
        const accountProjects = await loadAccountProjects(userId);
        applyProjects(accountProjects, userId, storageKey);
      } catch {
        applyProjects(readStoredProjects(storageKey), userId, storageKey);
      }
    };

    const init = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!active) return;

      if (user) {
        mergeDoneRef.current = true;
        await loadForUser(user.id, false);
      } else {
        loadGuest();
      }
    };

    void init();

    const { data: sub } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!active) return;

      if (session?.user) {
        if (event === "SIGNED_IN" && !mergeDoneRef.current) {
          mergeDoneRef.current = true;
          await loadForUser(session.user.id, true);
        } else if (event === "SIGNED_IN" || event === "USER_UPDATED") {
          mergeDoneRef.current = true;
          await loadForUser(session.user.id, false);
        }
      } else if (event === "SIGNED_OUT") {
        mergeDoneRef.current = false;
        setActiveUserId(null);
        setProjects([]);
        loadGuest();
      }
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const getCatalogOpportunity = useCallback(
    (slug: string) => {
      const found = getCachedOpportunity(slug);
      if (!found) {
        void fetchOpportunityBySlug(slug).then((loaded) => {
          if (loaded) setCatalogVersion((v) => v + 1);
        });
        return undefined;
      }
      const enriched = enrichOpportunity(found);
      return gateOpportunityForTier(enriched, tier);
    },
    // catalogVersion invalide le cache client après fetch lazy
    // eslint-disable-next-line react-hooks/exhaustive-deps -- catalogVersion
    [tier, catalogVersion],
  );

  const ensureCatalogOpportunity = useCallback(
    async (slug: string) => {
      const cached = getCatalogOpportunity(slug);
      if (cached) return cached;
      const loaded = await fetchOpportunityBySlug(slug);
      if (!loaded) return null;
      primeOpportunityCache(loaded);
      setCatalogVersion((v) => v + 1);
      const enriched = enrichOpportunity(loaded);
      return gateOpportunityForTier(enriched, tier);
    },
    [getCatalogOpportunity, tier],
  );

  useEffect(() => {
    if (!hydrated || projects.length === 0) return;
    const slugs = projects.map((p) => p.opportunitySlug).filter(Boolean);
    void prefetchOpportunitySlugs(slugs).then(() => setCatalogVersion((v) => v + 1));
  }, [hydrated, projects]);

  const opportunityCatalog = useMemo(() => {
    void catalogVersion;
    const slugs = new Set([
      ...catalogIndex.map((o) => o.slug),
      ...projects.map((p) => p.opportunitySlug).filter(Boolean),
    ]);
    const list: Opportunity[] = [];
    for (const slug of Array.from(slugs)) {
      const cached = getCachedOpportunity(slug);
      if (cached) list.push(cached);
    }
    return list;
  }, [catalogIndex, projects, catalogVersion]);

  const commit = useCallback(
    (updater: (prev: UserProject[]) => UserProject[]) => {
      setProjects((prev) => {
        const next = updater(prev);
        persistProjects(next, storageKeyRef.current);

        if (activeUserId && next !== prev) {
          const nextIds = new Set(next.map((p) => p.id));
          const prevById = new Map(prev.map((p) => [p.id, p]));

          for (const project of next) {
            if (prevById.get(project.id) !== project) {
              queueProjectSync(project);
            }
          }
          for (const project of prev) {
            if (!nextIds.has(project.id)) {
              queueProjectDelete(project.id);
            }
          }
        }

        return next;
      });
    },
    [activeUserId],
  );

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
  const connectionActions = useMemo(() => createConnectionActions(actionDeps), [actionDeps]);
  const { setGitHubConnection, setHostConnection, patchIntegration } = connectionActions;

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
    applyCampaignFullPlan: applyCampaignFullPlanForProject,
    toggleCampaignSequenceStep: toggleCampaignSequenceStepForProject,
    setCampaignGtmMotion: setCampaignGtmMotionForProject,
    setCampaignIcpStructured: setCampaignIcpStructuredForProject,
    setCampaignAttributionQuestion: setCampaignAttributionQuestionForProject,
    toggleCampaignInfraGate: toggleCampaignInfraGateForProject,
    toggleCampaignAssetChecklist: toggleCampaignAssetChecklistForProject,
    addMessageMarketFitNote: addMessageMarketFitNoteForProject,
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

  const getProjectBySlug = useCallback(
    (slug: string) => projects.find((p) => p.opportunitySlug === slug),
    [projects],
  );

  const getProjectById = useCallback(
    (id: string) => projects.find((p) => p.id === id),
    [projects]
  );

  const activeProject = useMemo(
    () => (hydrated ? getMostUrgentProject(projects) : null),
    [projects, hydrated]
  );

  const overdueCheckIns = useMemo(
    () => (hydrated ? countOverdueCheckIns(projects) : 0),
    [projects, hydrated]
  );

  const stats = useMemo(
    () =>
      hydrated
        ? getPortfolioStats(projects, opportunityCatalog)
        : getPortfolioStats([], opportunityCatalog),
    [projects, hydrated, opportunityCatalog]
  );

  const value = useMemo<PortfolioContextValue>(
    () => ({
      projects: hydrated ? projects : [],
      hydrated,
      addProject,
      registerProject,
      removeProject,
      updateProject,
      setProjectPhase,
      recordMrr,
      toggleMilestone,
      toggleLaunchChecklistItem,
      setBuildSetupForProject,
      switchBuildTool: switchBuildToolForProject,
      setBuildDevLevel,
      setBuildPromptLanguage,
      setProductName,
      setProductLogo,
      restoreBuildVersion,
      resetBuild: resetBuildForProject,
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
    applyCampaignFullPlan: applyCampaignFullPlanForProject,
    toggleCampaignSequenceStep: toggleCampaignSequenceStepForProject,
    setCampaignGtmMotion: setCampaignGtmMotionForProject,
    setCampaignIcpStructured: setCampaignIcpStructuredForProject,
    setCampaignAttributionQuestion: setCampaignAttributionQuestionForProject,
    toggleCampaignInfraGate: toggleCampaignInfraGateForProject,
    toggleCampaignAssetChecklist: toggleCampaignAssetChecklistForProject,
    addMessageMarketFitNote: addMessageMarketFitNoteForProject,
    toggleCampaignAction: toggleCampaignActionForProject,
      setCampaignTrackingPlan: setCampaignTrackingPlanForProject,
      addCampaignWeeklyCheckIn: addCampaignWeeklyCheckInForProject,
      completeCampaignRetrospective: completeCampaignRetrospectiveForProject,
      startNewCampaignCycle: startNewCampaignCycleForProject,
      acknowledgeCampaignDistribution: acknowledgeCampaignDistributionForProject,
      acknowledgeCampaignMeasure: acknowledgeCampaignMeasureForProject,
      restoreCampaignVersion,
      resetCampaign: resetCampaignForProject,
      setGitHubConnection,
      setHostConnection,
      getProjectBySlug,
      getProjectById,
      catalogIndex,
      opportunityCatalog,
      getCatalogOpportunity,
      ensureCatalogOpportunity,
      activeProject,
      overdueCheckIns,
      stats,
      connectIntegration,
      disconnectIntegration,
      syncIntegration,
      syncProjectIntegrations,
      autoSyncingProjectId: autoSyncState?.projectId ?? null,
      autoSyncingConnectors: autoSyncState?.connectorIds ?? [],
      removeGitHubRepo,
      patchIntegration,
      addCampaign,
      updateCampaign,
      removeCampaign,
      addExpense,
      removeExpense,
      logMetricsSnapshot,
      setCashOnHand,
      completeOnboarding,
      markLaunchRoomSeen,
    }),
    [
      projects,
      hydrated,
      addProject,
      registerProject,
      removeProject,
      updateProject,
      setProjectPhase,
      recordMrr,
      toggleMilestone,
      toggleLaunchChecklistItem,
      setBuildSetupForProject,
      switchBuildToolForProject,
      setBuildDevLevel,
      setBuildPromptLanguage,
      setProductName,
      setProductLogo,
      restoreBuildVersion,
      resetBuildForProject,
      setCampaignKitForProject,
      switchCampaignToolForProject,
      addCampaignToolForProject,
      removeCampaignToolForProject,
      setMarketingProfileForProject,
      setStrategyBriefForProject,
      setCampaignChannelForProject,
      setAcquisitionStageForProject,
      setCampaignSmartGoalForProject,
      setCampaignIcpForProject,
      setCampaignPositioningForProject,
      toggleCampaignActionForProject,
      setCampaignTrackingPlanForProject,
      addCampaignWeeklyCheckInForProject,
      completeCampaignRetrospectiveForProject,
      startNewCampaignCycleForProject,
      acknowledgeCampaignDistributionForProject,
      acknowledgeCampaignMeasureForProject,
      restoreCampaignVersion,
      resetCampaignForProject,
      setGitHubConnection,
      setHostConnection,
      getProjectBySlug,
      getProjectById,
      catalogIndex,
      opportunityCatalog,
      getCatalogOpportunity,
      ensureCatalogOpportunity,
      activeProject,
      overdueCheckIns,
      stats,
      connectIntegration,
      disconnectIntegration,
      syncIntegration,
      syncProjectIntegrations,
      autoSyncState,
      removeGitHubRepo,
      patchIntegration,
      addCampaign,
      updateCampaign,
      removeCampaign,
      addExpense,
      removeExpense,
      logMetricsSnapshot,
      setCashOnHand,
      completeOnboarding,
      markLaunchRoomSeen,
    ]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

