"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  removeConnectorStream,
  stripConnectorMetrics,
  syncConnectorAllDemo,
  getConnector,
  type ConnectorId,
} from "@/lib/connectors";
import { getConnectorConnectionProfile } from "@/lib/connectors/connection-profile";
import {
  applyConnectorSyncToProject,
  applyGitHubSyncToProject,
  patchIntegrationMeta,
  removeGitHubRepoFromProject,
  setIntegrationError,
  type ConnectorSyncApiResponse,
} from "@/lib/connectors/integration-client";
import { listAutoSyncableConnectorIds } from "@/lib/connectors/auto-sync";
import type { AdCampaign, Expense, Integration, MetricsSnapshot } from "@/lib/connectors/types";
import type { Opportunity } from "@/types/opportunity";
import { useTier } from "@/contexts/tier-context";
import { enrichOpportunity } from "@/data/opportunity-enrichment";
import { createClient } from "@/lib/supabase/client";
import { gateOpportunityForTier } from "@/lib/opportunity-access";
import { isOnboardingComplete } from "@/lib/build-launch";
import {
  computeNextStreak,
  createProjectFromOpportunity,
  getMostUrgentProject,
  getPortfolioStats,
  countOverdueCheckIns,
  migrateProject,
  monthFromDate,
  toggleLaunchChecklistItem as applyLaunchChecklistToggle,
  resetBuildSetup,
  restoreBuildSetupSnapshot,
  setBuildSetup,
  switchBuildTool,
  setBuildDevLevel as applyBuildDevLevel,
  setBuildPromptLanguage as applyBuildPromptLanguage,
  setCampaignKit,
  switchCampaignTool as applySwitchCampaignTool,
  addCampaignTool as applyAddCampaignTool,
  removeCampaignTool as applyRemoveCampaignTool,
  setMarketingProfile as applyMarketingProfile,
  setStrategyBrief as applyStrategyBrief,
  setCampaignChannel as applyCampaignChannel,
  acknowledgeCampaignDistribution,
  acknowledgeCampaignMeasure,
  restoreCampaignKitSnapshot,
  resetCampaignSetup,
  syncProjectPhaseFromBuild,
  type AddProjectInput,
  type BuildSetup,
  type BuildDevLevel,
  type GitHubConnection,
  type HostConnection,
  type ProductLogo,
  type ResetBuildOptions,
  type ResetCampaignOptions,
  type ProjectPhase,
  type TargetScenario,
  type UserProject,
} from "@/lib/portfolio";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignToolId, MarketingProfile } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import {
  fetchAccountProjects,
  queueProjectDelete,
  queueProjectSync,
  uploadAccountProject,
} from "@/lib/portfolio-sync-client";
import type { BuildToolId } from "@/lib/build/tools";
import type { BuildPromptLanguage } from "@/lib/build/prompt-language";
import {
  clearGuestPortfolioStorage,
  migrateLegacyPortfolioStorage,
  persistProjects,
  portfolioStorageKey,
  PORTFOLIO_GUEST_STORAGE_KEY,
  readStoredProjects,
} from "@/lib/portfolio-storage.shared";

export type ConnectIntegrationOptions = {
  mode?: "demo" | "real";
  secretKey?: string;
  currency?: string;
  customerId?: string;
  accountId?: string;
  adAccountId?: string;
  apiKey?: string;
  siteId?: string;
  signupGoalDisplayName?: string | null;
  personalApiKey?: string;
  appHost?: string;
  posthogProjectId?: string;
  mixpanelServiceAccountUsername?: string;
  mixpanelServiceAccountSecret?: string;
  mixpanelProjectId?: string;
  mixpanelRegion?: string;
  mixpanelWorkspaceId?: string | null;
  activityEvent?: string | null;
  signupEvent?: string | null;
  signupEventName?: string | null;
  activationEvent?: string | null;
  gaPropertyId?: string;
  propertyDisplayName?: string;
  trialEvent?: string | null;
  loopsApiKey?: string;
  loopsWebhookSigningSecret?: string;
  loopsConversionListId?: string | null;
  loopsConversionListName?: string | null;
  loopsConversionMode?: "mailing_list" | "email_clicked";
  brevoApiKey?: string;
  brevoConversionMode?: "campaign_clicks" | "list_addition";
  brevoConversionListId?: string | null;
  brevoConversionListName?: string | null;
  brevoWebhookToken?: string;
  resendApiKey?: string;
  resendWebhookSigningSecret?: string;
  resendConversionSegmentId?: string | null;
  resendConversionSegmentName?: string | null;
  resendConversionMode?: "segment" | "email_clicked";
  crispWebsiteId?: string;
  vercelProjectId?: string;
  betterStackApiToken?: string;
  betterStackMonitorId?: string;
  betterStackMonitorName?: string | null;
  betterStackMonitorUrl?: string | null;
  betterStackTeamName?: string | null;
  sentryProjectId?: string;
  sentryProjectSlug?: string;
  sentryProjectName?: string;
  channelId?: string;
  channelName?: string;
  storeId?: string;
  storeName?: string;
  productId?: string;
  productTitle?: string;
  apiToken?: string;
  sandbox?: boolean;
  testMode?: boolean;
  repoFullName?: string;
  linkedToolId?: BuildToolId;
  setPrimary?: boolean;
};

type PortfolioContextValue = {
  projects: UserProject[];
  hydrated: boolean;
  addProject: (slug: string, input: AddProjectInput) => UserProject | null;
  registerProject: (project: UserProject) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<UserProject>) => void;
  setProjectPhase: (id: string, phase: ProjectPhase) => void;
  recordMrr: (id: string, amount: number, note?: string) => void;
  toggleMilestone: (id: string, milestoneId: string) => void;
  toggleLaunchChecklistItem: (id: string, itemIndex: number) => void;
  setBuildSetupForProject: (id: string, setup: BuildSetup) => void;
  switchBuildTool: (id: string, toolId: BuildToolId) => void;
  setBuildDevLevel: (id: string, level: BuildDevLevel) => void;
  setBuildPromptLanguage: (id: string, language: BuildPromptLanguage) => void;
  setProductName: (id: string, name: string) => void;
  setProductLogo: (id: string, logo: ProductLogo | undefined) => void;
  restoreBuildVersion: (id: string, savedAt: string) => void;
  resetBuild: (id: string, opts?: ResetBuildOptions) => void;
  setCampaignKitForProject: (id: string, kit: CampaignKit) => void;
  switchCampaignTool: (id: string, toolId: CampaignToolId) => void;
  addCampaignTool: (id: string, toolId: CampaignToolId) => void;
  removeCampaignTool: (id: string, toolId: CampaignToolId) => void;
  setMarketingProfile: (id: string, profile: MarketingProfile) => void;
  setStrategyBriefForProject: (
    id: string,
    brief: string,
    channel: ExtendedChannelKey,
    profile: MarketingProfile,
  ) => void;
  setCampaignChannel: (id: string, channel: ExtendedChannelKey) => void;
  acknowledgeCampaignDistribution: (id: string) => void;
  acknowledgeCampaignMeasure: (id: string) => void;
  restoreCampaignVersion: (id: string, savedAt: string) => void;
  resetCampaign: (id: string, opts?: ResetCampaignOptions) => void;
  setGitHubConnection: (id: string, connection: GitHubConnection | undefined) => void;
  setHostConnection: (id: string, connection: HostConnection | undefined) => void;
  getProjectBySlug: (slug: string) => UserProject | undefined;
  getProjectById: (id: string) => UserProject | undefined;
  opportunityCatalog: Opportunity[];
  getCatalogOpportunity: (slug: string) => Opportunity | undefined;
  activeProject: UserProject | null;
  overdueCheckIns: number;
  stats: ReturnType<typeof getPortfolioStats>;
  connectIntegration: (
    projectId: string,
    connectorId: ConnectorId,
    options?: ConnectIntegrationOptions,
  ) => Promise<void>;
  disconnectIntegration: (projectId: string, connectorId: ConnectorId) => Promise<void>;
  syncIntegration: (projectId: string, connectorId: ConnectorId) => Promise<void>;
  syncProjectIntegrations: (
    projectId: string,
    opts?: { force?: boolean },
  ) => Promise<void>;
  autoSyncingProjectId: string | null;
  autoSyncingConnectors: ConnectorId[];
  removeGitHubRepo: (projectId: string, repoFullName: string) => Promise<void>;
  patchIntegration: (
    projectId: string,
    connectorId: ConnectorId,
    patch: Partial<Integration>,
  ) => void;
  addCampaign: (projectId: string, campaign: Omit<AdCampaign, "id">) => void;
  updateCampaign: (projectId: string, campaignId: string, patch: Partial<AdCampaign>) => void;
  removeCampaign: (projectId: string, campaignId: string) => void;
  addExpense: (projectId: string, expense: Omit<Expense, "id">) => void;
  removeExpense: (projectId: string, expenseId: string) => void;
  logMetricsSnapshot: (projectId: string, partial: Partial<MetricsSnapshot>) => void;
  setCashOnHand: (projectId: string, amount: number) => void;
  completeOnboarding: (projectId: string) => void;
  markLaunchRoomSeen: (projectId: string) => void;
};

const PortfolioContext = createContext<PortfolioContextValue | null>(null);

async function loadAccountProjects(userId: string): Promise<UserProject[]> {
  const storageKey = portfolioStorageKey(userId);
  const localCache = readStoredProjects(storageKey);
  try {
    const serverProjects = (await fetchAccountProjects()).map(migrateProject);
    persistProjects(serverProjects, storageKey);
    return serverProjects;
  } catch {
    return localCache;
  }
}

async function mergeGuestProjectsToAccount(userId: string): Promise<UserProject[]> {
  migrateLegacyPortfolioStorage();
  const guestProjects = readStoredProjects(PORTFOLIO_GUEST_STORAGE_KEY);
  const storageKey = portfolioStorageKey(userId);

  try {
    const serverProjects = (await fetchAccountProjects()).map(migrateProject);
    const serverIds = new Set(serverProjects.map((p) => p.id));
    const serverSlugs = new Set(serverProjects.map((p) => p.opportunitySlug));
    const toUpload = guestProjects.filter(
      (p) => !serverIds.has(p.id) && !serverSlugs.has(p.opportunitySlug),
    );

    if (toUpload.length > 0) {
      await Promise.all(toUpload.map((p) => uploadAccountProject(migrateProject(p))));
    }

    clearGuestPortfolioStorage();
    const merged = [...toUpload, ...serverProjects].map(migrateProject);
    persistProjects(merged, storageKey);
    return merged;
  } catch {
    const fallback = guestProjects.length > 0 ? guestProjects : readStoredProjects(storageKey);
    persistProjects(fallback, storageKey);
    return fallback;
  }
}

export function PortfolioProvider({
  children,
  opportunityCatalog,
  userId: serverUserId = null,
}: {
  children: ReactNode;
  opportunityCatalog: Opportunity[];
  userId?: string | null;
}) {
  const { tier } = useTier();
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [hydrated, setHydrated] = useState(false);
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
      const found = opportunityCatalog.find((o) => o.slug === slug);
      if (!found) return undefined;
      // Enrichissement premium à la demande, puis retrait des champs hors tier.
      const enriched = enrichOpportunity(found);
      return gateOpportunityForTier(enriched, tier);
    },
    [opportunityCatalog, tier]
  );

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

  const addProject = useCallback(
    (slug: string, input: AddProjectInput): UserProject | null => {
      const opportunity = getCatalogOpportunity(slug);
      if (!opportunity) return null;

      let created: UserProject | null = null;
      commit((prev) => {
        if (prev.some((p) => p.opportunitySlug === slug)) {
          created = prev.find((p) => p.opportunitySlug === slug) ?? null;
          return prev;
        }
        const base = createProjectFromOpportunity(opportunity, input);
        const project = migrateProject(base);
        created = project;
        return [project, ...prev];
      });
      return created;
    },
    [commit, getCatalogOpportunity]
  );

  const registerProject = useCallback(
    (project: UserProject) => {
      const migrated = migrateProject(project);
      commit((prev) => {
        if (prev.some((p) => p.id === migrated.id)) {
          return prev.map((p) => (p.id === migrated.id ? migrated : p));
        }
        return [migrated, ...prev];
      });
    },
    [commit],
  );

  const removeProject = useCallback(
    (id: string) => {
      commit((prev) => prev.filter((p) => p.id !== id));
    },
    [commit]
  );

  const updateProject = useCallback(
    (id: string, patch: Partial<UserProject>) => {
      commit((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    },
    [commit]
  );

  const setProjectPhase = useCallback(
    (id: string, phase: ProjectPhase) => {
      updateProject(id, { phase });
    },
    [updateProject]
  );

  const recordMrr = useCallback(
    (id: string, amount: number, note?: string) => {
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const month = monthFromDate(date);
      const isoNow = now.toISOString();

      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;

          const streakDelta = computeNextStreak(project.lastCheckInAt);
          const nextStreak =
            streakDelta === -1 ? project.checkInStreak + 1 : Math.max(1, streakDelta);

          const existingIndex = project.mrrHistory.findIndex((e) => e.date === date);
          const nextHistory =
            existingIndex >= 0
              ? project.mrrHistory.map((entry, index) =>
                  index === existingIndex
                    ? { ...entry, amount, note: note ?? entry.note }
                    : entry
                )
              : [...project.mrrHistory, { date, amount, note }];

          const history = project.metricsHistory ?? [];
          const snapIndex = history.findIndex((s) => s.date === month);
          const prevSnap = history[snapIndex] ?? history[history.length - 1];
          const newSnap: MetricsSnapshot = {
            date: month,
            mrr: amount,
            newMrr: prevSnap ? Math.max(0, amount - prevSnap.mrr) : amount,
            expansionMrr: prevSnap?.expansionMrr ?? 0,
            churnedMrr: prevSnap && amount < prevSnap.mrr ? prevSnap.mrr - amount : 0,
            customers: prevSnap?.customers ?? Math.max(1, Math.round(amount / 79)),
            signups: prevSnap?.signups ?? 0,
            trials: prevSnap?.trials ?? 0,
            activeUsers: prevSnap?.activeUsers ?? 0,
            mau: prevSnap?.mau ?? 0,
            dau: prevSnap?.dau ?? 0,
            adSpend: prevSnap?.adSpend ?? 0,
            impressions: prevSnap?.impressions ?? 0,
            clicks: prevSnap?.clicks ?? 0,
            conversions: prevSnap?.conversions ?? 0,
            source: "manual",
          };
          const nextMetrics =
            snapIndex >= 0
              ? history.map((s, i) => (i === snapIndex ? { ...s, ...newSnap } : s))
              : [...history, newSnap];

          const updated = {
            ...project,
            currentMrr: amount,
            mrrHistory: nextHistory,
            metricsHistory: nextMetrics,
            lastCheckInAt: isoNow,
            checkInStreak: nextStreak,
          };
          return updated;
        })
      );
    },
    [commit]
  );

  const toggleMilestone = useCallback(
    (id: string, milestoneId: string) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;

          const now = new Date().toISOString();
          let firstMilestoneAt = project.firstMilestoneAt;
          const target = project.milestones.find((m) => m.id === milestoneId);
          const markingDone = target && !target.done;

          const milestones = project.milestones.map((m) =>
            m.id === milestoneId
              ? {
                  ...m,
                  done: !m.done,
                  doneAt: !m.done ? now : undefined,
                }
              : m
          );

          if (markingDone && !firstMilestoneAt) {
            firstMilestoneAt = now;
          }

          const updated: UserProject = {
            ...project,
            milestones,
            firstMilestoneAt,
          };

          if (isOnboardingComplete(updated) && !updated.onboardingCompleted) {
            const completed = {
              ...updated,
              onboardingCompleted: true,
              onboardingCompletedAt: now,
            };
            return completed;
          }

          return updated;
        })
      );
    },
    [commit]
  );

  const toggleLaunchChecklistItem = useCallback(
    (id: string, itemIndex: number) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = applyLaunchChecklistToggle(project, itemIndex);
          return updated;
        }),
      );
    },
    [commit],
  );

  const setBuildSetupForProject = useCallback(
    (id: string, setup: BuildSetup) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = setBuildSetup(project, setup);
          return updated;
        }),
      );
    },
    [commit],
  );

  const switchBuildToolForProject = useCallback(
    (id: string, toolId: BuildToolId) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = switchBuildTool(project, toolId);
          return updated;
        }),
      );
    },
    [commit],
  );

  const setBuildDevLevel = useCallback(
    (id: string, level: BuildDevLevel) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = applyBuildDevLevel(project, level);
          return updated;
        }),
      );
    },
    [commit],
  );

  const setBuildPromptLanguage = useCallback(
    (id: string, language: BuildPromptLanguage) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = applyBuildPromptLanguage(project, language);
          return updated;
        }),
      );
    },
    [commit],
  );

  const setProductName = useCallback(
    (id: string, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = { ...project, productName: trimmed };
          return updated;
        }),
      );
    },
    [commit],
  );

  const setProductLogo = useCallback(
    (id: string, logo: ProductLogo | undefined) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = { ...project, productLogo: logo };
          return updated;
        }),
      );
    },
    [commit],
  );

  const restoreBuildVersion = useCallback(
    (id: string, savedAt: string) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const restored = restoreBuildSetupSnapshot(project, savedAt);
          if (!restored) return project;
          return restored;
        }),
      );
    },
    [commit],
  );

  const resetBuild = useCallback(
    (id: string, opts?: ResetBuildOptions) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = resetBuildSetup(project, opts);
          return updated;
        }),
      );
    },
    [commit],
  );

  const setGitHubConnection = useCallback(
    (id: string, connection: GitHubConnection | undefined) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = { ...project, githubConnection: connection };
          return updated;
        }),
      );
    },
    [commit],
  );

  const setHostConnection = useCallback(
    (id: string, connection: HostConnection | undefined) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = syncProjectPhaseFromBuild({
            ...project,
            hostConnection: connection,
          });
          return updated;
        }),
      );
    },
    [commit],
  );

  const setCampaignKitForProject = useCallback(
    (id: string, kit: CampaignKit) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return setCampaignKit(project, kit);
        }),
      );
    },
    [commit],
  );

  const switchCampaignToolForProject = useCallback(
    (id: string, toolId: CampaignToolId) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applySwitchCampaignTool(project, toolId);
        }),
      );
    },
    [commit],
  );

  const addCampaignToolForProject = useCallback(
    (id: string, toolId: CampaignToolId) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyAddCampaignTool(project, toolId);
        }),
      );
    },
    [commit],
  );

  const removeCampaignToolForProject = useCallback(
    (id: string, toolId: CampaignToolId) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyRemoveCampaignTool(project, toolId);
        }),
      );
    },
    [commit],
  );

  const setMarketingProfileForProject = useCallback(
    (id: string, profile: MarketingProfile) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyMarketingProfile(project, profile);
        }),
      );
    },
    [commit],
  );

  const setStrategyBriefForProject = useCallback(
    (
      id: string,
      brief: string,
      channel: ExtendedChannelKey,
      profile: MarketingProfile,
    ) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyStrategyBrief(project, brief, channel, profile);
        }),
      );
    },
    [commit],
  );

  const setCampaignChannelForProject = useCallback(
    (id: string, channel: ExtendedChannelKey) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyCampaignChannel(project, channel);
        }),
      );
    },
    [commit],
  );

  const acknowledgeCampaignDistributionForProject = useCallback(
    (id: string) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return acknowledgeCampaignDistribution(project);
        }),
      );
    },
    [commit],
  );

  const acknowledgeCampaignMeasureForProject = useCallback(
    (id: string) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return acknowledgeCampaignMeasure(project);
        }),
      );
    },
    [commit],
  );

  const restoreCampaignVersion = useCallback(
    (id: string, savedAt: string) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const restored = restoreCampaignKitSnapshot(project, savedAt);
          return restored ?? project;
        }),
      );
    },
    [commit],
  );

  const resetCampaignForProject = useCallback(
    (id: string, opts?: ResetCampaignOptions) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return resetCampaignSetup(project, opts);
        }),
      );
    },
    [commit],
  );

  const completeOnboarding = useCallback(
    (projectId: string) => {
      const now = new Date().toISOString();
      updateProject(projectId, {
        onboardingCompleted: true,
        onboardingCompletedAt: now,
      });
    },
    [updateProject]
  );

  const markLaunchRoomSeen = useCallback(
    (projectId: string) => {
      updateProject(projectId, {
        launchRoomSeenAt: new Date().toISOString(),
      });
    },
    [updateProject]
  );

  const connectIntegration = useCallback(
    async (
      projectId: string,
      connectorId: ConnectorId,
      options?: ConnectIntegrationOptions,
    ) => {
      const profile = getConnectorConnectionProfile(connectorId);
      const connectorName = getConnector(connectorId)?.name ?? connectorId;

      if (options?.mode === "demo" && !profile.supportsDemo) {
        throw new Error(`La connexion démo ${connectorName} n'est plus disponible.`);
      }

      if (connectorId === "stripe" && options?.mode === "demo") {
        throw new Error("La connexion démo Stripe n'est plus disponible. Utilisez OAuth ou une clé restreinte.");
      }

      if (connectorId === "google-ads" && options?.mode === "demo") {
        throw new Error("La connexion démo Google Ads n'est plus disponible. Connectez votre compte via OAuth.");
      }

      if (connectorId === "meta-ads" && options?.mode === "demo") {
        throw new Error("La connexion démo Meta Ads n'est plus disponible. Connectez votre compte via OAuth.");
      }

      if (connectorId === "tiktok-ads" && options?.mode === "demo") {
        throw new Error("La connexion démo TikTok Ads n'est plus disponible. Connectez votre compte via OAuth.");
      }

      if (connectorId === "linkedin-ads" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo LinkedIn Ads n'est plus disponible. Connectez votre compte via OAuth.",
        );
      }
      if (connectorId === "microsoft-ads" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Microsoft Ads n'est plus disponible. Connectez votre compte via OAuth.",
        );
      }

      if (connectorId === "lemon-squeezy" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Lemon Squeezy n'est plus disponible. Connectez votre boutique via clé API.",
        );
      }

      if (connectorId === "paddle" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Paddle n'est plus disponible. Connectez votre compte via clé API.",
        );
      }

      if (connectorId === "freemius" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Freemius n'est plus disponible. Connectez votre produit via Bearer Token.",
        );
      }

      if (connectorId === "posthog" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo PostHog n'est plus disponible. Connectez votre projet via Personal API Key.",
        );
      }

      if (connectorId === "google-analytics" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Google Analytics n'est plus disponible. Connectez votre propriété GA4 via OAuth.",
        );
      }

      if (connectorId === "stripe" && options?.mode !== "real" && !options?.secretKey?.trim()) {
        throw new Error("Connectez Stripe via OAuth ou une clé restreinte.");
      }

      const isStripeReal =
        connectorId === "stripe" &&
        options?.mode === "real" &&
        (Boolean(options.secretKey?.trim()) || !options.secretKey);

      if (isStripeReal && options?.secretKey?.trim()) {
        try {
          const res = await fetch("/api/connectors/stripe/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              secretKey: options!.secretKey!.trim(),
              currency: options?.currency ?? "eur",
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Stripe échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Stripe",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Stripe échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (isStripeReal) {
        try {
          const res = await fetch("/api/connectors/stripe/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Stripe échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Stripe",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Stripe échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isGoogleAdsReal =
        connectorId === "google-ads" &&
        options?.mode === "real" &&
        Boolean(options.customerId?.trim());

      if (isGoogleAdsReal) {
        try {
          const res = await fetch("/api/connectors/google-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              customerId: options!.customerId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Google Ads échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Google Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Google Ads échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "google-ads") {
        throw new Error("Connectez Google Ads via OAuth.");
      }

      const isMetaAdsReal =
        connectorId === "meta-ads" &&
        options?.mode === "real" &&
        Boolean(options.adAccountId?.trim());

      if (isMetaAdsReal) {
        try {
          const res = await fetch("/api/connectors/meta-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              adAccountId: options!.adAccountId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Meta Ads échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Meta Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Meta Ads échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "meta-ads") {
        throw new Error("Connectez Meta Ads via OAuth.");
      }

      const isTikTokAdsReal =
        connectorId === "tiktok-ads" &&
        options?.mode === "real" &&
        Boolean(options.adAccountId?.trim());

      if (isTikTokAdsReal) {
        try {
          const res = await fetch("/api/connectors/tiktok-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              advertiserId: options!.adAccountId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion TikTok Ads échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "TikTok Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion TikTok Ads échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "tiktok-ads") {
        throw new Error("Connectez TikTok Ads via OAuth.");
      }

      const isLinkedInAdsReal =
        connectorId === "linkedin-ads" &&
        options?.mode === "real" &&
        Boolean(options.adAccountId?.trim());

      if (isLinkedInAdsReal) {
        try {
          const res = await fetch("/api/connectors/linkedin-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              adAccountId: options!.adAccountId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion LinkedIn Ads échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "LinkedIn Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion LinkedIn Ads échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "linkedin-ads") {
        throw new Error("Connectez LinkedIn Ads via OAuth.");
      }

      const isMicrosoftAdsReal =
        connectorId === "microsoft-ads" &&
        options?.mode === "real" &&
        Boolean(options.accountId?.trim()) &&
        Boolean(options.customerId?.trim());

      if (isMicrosoftAdsReal) {
        try {
          const res = await fetch("/api/connectors/microsoft-ads/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              accountId: options!.accountId!.trim(),
              customerId: options!.customerId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Microsoft Ads échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Microsoft Ads",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Microsoft Ads échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "microsoft-ads") {
        throw new Error("Connectez Microsoft Ads via OAuth.");
      }

      const isGitHubReal =
        connectorId === "github" &&
        options?.mode === "real" &&
        Boolean(options.repoFullName?.trim());

      if (isGitHubReal) {
        try {
          const res = await fetch("/api/connectors/github/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              repoFullName: options!.repoFullName!.trim(),
              linkedToolId: options?.linkedToolId,
              setPrimary: options?.setPrimary,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion GitHub échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyGitHubSyncToProject(project, data, "connected");
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion GitHub échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "github" && options?.mode !== "demo") {
        throw new Error("Connectez GitHub via l'app GitHub.");
      }

      const isPlausibleReal =
        connectorId === "plausible" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim()) &&
        Boolean(options.siteId?.trim());

      if (isPlausibleReal) {
        try {
          const res = await fetch("/api/connectors/plausible/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
              siteId: options!.siteId!.trim(),
              signupGoalDisplayName: options?.signupGoalDisplayName ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Plausible échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.siteId!.trim(),
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Plausible échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isFathomReal =
        connectorId === "fathom" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim()) &&
        Boolean(options.siteId?.trim());

      if (isFathomReal) {
        try {
          const res = await fetch("/api/connectors/fathom/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
              siteId: options!.siteId!.trim(),
              signupEventId: options?.signupEvent ?? null,
              signupEventName: options?.signupEventName ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Fathom échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.siteId!.trim(),
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Fathom échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isGoogleAnalyticsReal =
        connectorId === "google-analytics" &&
        options?.mode === "real" &&
        Boolean(options.gaPropertyId?.trim());

      if (isGoogleAnalyticsReal) {
        try {
          const res = await fetch("/api/connectors/google-analytics/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              propertyId: options!.gaPropertyId!.trim(),
              propertyDisplayName: options?.propertyDisplayName?.trim() || undefined,
              signupEvent: options?.signupEvent ?? "sign_up",
              trialEvent: options?.trialEvent ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Google Analytics échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options?.propertyDisplayName ?? "Google Analytics",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Connexion Google Analytics échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isSentryReal =
        connectorId === "sentry" &&
        options?.mode === "real" &&
        Boolean(options.sentryProjectId?.trim());

      if (isSentryReal) {
        try {
          const res = await fetch("/api/connectors/sentry/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              sentryProjectId: options!.sentryProjectId!.trim(),
              sentryProjectSlug: options?.sentryProjectSlug?.trim() || undefined,
              projectName: options?.sentryProjectName?.trim() || undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & {
            error?: string;
            tokenExpiresAt?: string;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Sentry échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options?.sentryProjectName ?? "Sentry",
              );
              if (updated && data.tokenExpiresAt) {
                updated = {
                  ...updated,
                  integrations: updated.integrations?.map((integration) =>
                    integration.connectorId === connectorId
                      ? { ...integration, tokenExpiresAt: data.tokenExpiresAt }
                      : integration,
                  ),
                };
              }
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Sentry échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isPostHogReal =
        connectorId === "posthog" &&
        options?.mode === "real" &&
        Boolean(options.personalApiKey?.trim()) &&
        Boolean(options.posthogProjectId?.trim());

      if (isPostHogReal) {
        try {
          const res = await fetch("/api/connectors/posthog/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              personalApiKey: options!.personalApiKey!.trim(),
              posthogProjectId: options!.posthogProjectId!.trim(),
              appHost: options?.appHost?.trim() || undefined,
              signupEvent: options?.signupEvent ?? null,
              activationEvent: options?.activationEvent ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion PostHog échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? `PostHog ${options!.posthogProjectId!.trim()}`,
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion PostHog échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isMixpanelReal =
        connectorId === "mixpanel" &&
        options?.mode === "real" &&
        Boolean(options.mixpanelServiceAccountUsername?.trim()) &&
        Boolean(options.mixpanelServiceAccountSecret?.trim()) &&
        Boolean(options.mixpanelProjectId?.trim()) &&
        Boolean(options.activityEvent?.trim() || options.signupEvent?.trim());

      if (isMixpanelReal) {
        try {
          const res = await fetch("/api/connectors/mixpanel/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              serviceAccountUsername: options!.mixpanelServiceAccountUsername!.trim(),
              serviceAccountSecret: options!.mixpanelServiceAccountSecret!.trim(),
              mixpanelProjectId: options!.mixpanelProjectId!.trim(),
              region: options?.mixpanelRegion?.trim() || undefined,
              workspaceId: options?.mixpanelWorkspaceId ?? null,
              signupEvent: options?.signupEvent ?? null,
              activationEvent: options?.activationEvent ?? null,
              activityEvent: options?.activityEvent ?? options?.signupEvent ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Mixpanel échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? `Mixpanel ${options!.mixpanelProjectId!.trim()}`,
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Mixpanel échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isLemonSqueezyReal =
        connectorId === "lemon-squeezy" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim()) &&
        Boolean(options.storeId?.trim());

      if (isLemonSqueezyReal) {
        try {
          const res = await fetch("/api/connectors/lemon-squeezy/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
              storeId: options!.storeId!.trim(),
              storeName: options?.storeName ?? undefined,
              currency: options?.currency ?? undefined,
              testMode: options?.testMode ?? undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Lemon Squeezy échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.storeName ?? "Lemon Squeezy",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Lemon Squeezy échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isPaddleReal =
        connectorId === "paddle" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim());

      if (isPaddleReal) {
        try {
          const res = await fetch("/api/connectors/paddle/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
              currency: options?.currency ?? undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Paddle échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Paddle",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Paddle échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isFreemiusReal =
        connectorId === "freemius" &&
        options?.mode === "real" &&
        Boolean(options.productId?.trim()) &&
        Boolean(options.apiToken?.trim());

      if (isFreemiusReal) {
        try {
          const res = await fetch("/api/connectors/freemius/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              productId: options!.productId!.trim(),
              apiToken: options!.apiToken!.trim(),
              productTitle: options?.productTitle ?? undefined,
              currency: options?.currency ?? undefined,
              sandbox: options?.sandbox ?? undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Freemius échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.productTitle ?? "Freemius",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Freemius échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isLoopsReal =
        connectorId === "loops" &&
        options?.mode === "real" &&
        Boolean(options.loopsApiKey?.trim() || options.apiKey?.trim()) &&
        Boolean(options.loopsWebhookSigningSecret?.trim());

      if (isLoopsReal) {
        try {
          const res = await fetch("/api/connectors/loops/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: (options!.loopsApiKey ?? options!.apiKey)!.trim(),
              webhookSigningSecret: options!.loopsWebhookSigningSecret!.trim(),
              conversionListId: options?.loopsConversionListId ?? null,
              conversionListName: options?.loopsConversionListName ?? null,
              conversionMode: options?.loopsConversionMode ?? "email_clicked",
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Loops échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Loops",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Loops échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isBrevoReal =
        connectorId === "brevo" &&
        options?.mode === "real" &&
        Boolean(options.brevoApiKey?.trim() || options.apiKey?.trim());

      if (isBrevoReal) {
        try {
          const res = await fetch("/api/connectors/brevo/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: (options!.brevoApiKey ?? options!.apiKey)!.trim(),
              conversionMode: options?.brevoConversionMode ?? "campaign_clicks",
              conversionListId: options?.brevoConversionListId ?? null,
              conversionListName: options?.brevoConversionListName ?? null,
              webhookToken: options?.brevoWebhookToken ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Brevo échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Brevo",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Brevo échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isResendReal =
        connectorId === "resend" &&
        options?.mode === "real" &&
        Boolean(options.resendApiKey?.trim() || options.apiKey?.trim()) &&
        Boolean(options.resendWebhookSigningSecret?.trim());

      if (isResendReal) {
        try {
          const res = await fetch("/api/connectors/resend/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: (options!.resendApiKey ?? options!.apiKey)!.trim(),
              webhookSigningSecret: options!.resendWebhookSigningSecret!.trim(),
              conversionSegmentId: options?.resendConversionSegmentId ?? null,
              conversionSegmentName: options?.resendConversionSegmentName ?? null,
              conversionMode: options?.resendConversionMode ?? "email_clicked",
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Resend échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Resend",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Resend échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isCrispReal =
        connectorId === "crisp" &&
        options?.mode === "real" &&
        Boolean(options.crispWebsiteId?.trim());

      if (isCrispReal) {
        try {
          const res = await fetch("/api/connectors/crisp/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              websiteId: options!.crispWebsiteId!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Crisp échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.crispWebsiteId!.trim(),
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Crisp échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      const isIntercomReal = connectorId === "intercom" && options?.mode === "real";

      if (isIntercomReal) {
        try {
          const res = await fetch("/api/connectors/intercom/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Intercom échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Intercom",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Intercom échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "intercom" && options?.mode !== "demo") {
        throw new Error("Connectez Intercom via OAuth.");
      }

      const isHubSpotReal = connectorId === "hubspot" && options?.mode === "real";

      if (isHubSpotReal) {
        try {
          const res = await fetch("/api/connectors/hubspot/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion HubSpot échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "HubSpot",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion HubSpot échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "hubspot" && options?.mode !== "demo") {
        throw new Error("Connectez HubSpot via OAuth.");
      }

      const isPipedriveReal = connectorId === "pipedrive" && options?.mode === "real";

      if (isPipedriveReal) {
        try {
          const res = await fetch("/api/connectors/pipedrive/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Pipedrive échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Pipedrive",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Pipedrive échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "pipedrive" && options?.mode !== "demo") {
        throw new Error("Connectez Pipedrive via OAuth.");
      }

      const isQontoReal = connectorId === "qonto" && options?.mode === "real";

      if (isQontoReal) {
        try {
          const res = await fetch("/api/connectors/qonto/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Qonto échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Qonto",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Qonto échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "qonto" && options?.mode !== "demo") {
        throw new Error("Connectez Qonto via OAuth.");
      }

      const isPennylaneReal = connectorId === "pennylane" && options?.mode === "real";

      if (isPennylaneReal) {
        try {
          const body: Record<string, string> = { projectId };
          if (options?.apiToken?.trim()) {
            body.apiToken = options.apiToken.trim();
          }

          const res = await fetch("/api/connectors/pennylane/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Pennylane échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Pennylane",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Pennylane échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "pennylane" && options?.mode !== "demo") {
        throw new Error("Connectez Pennylane via token API ou OAuth.");
      }

      const isAbbyReal =
        connectorId === "abby" &&
        options?.mode === "real" &&
        Boolean(options.apiKey?.trim());

      if (isAbbyReal) {
        try {
          const res = await fetch("/api/connectors/abby/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiKey: options!.apiKey!.trim(),
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & {
            error?: string;
            revenueUnavailable?: boolean;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Abby échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Abby",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Abby échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "abby" && options?.mode !== "demo") {
        throw new Error("Connectez Abby via clé API.");
      }

      const isBetterStackReal =
        connectorId === "better-stack" &&
        options?.mode === "real" &&
        Boolean(options.betterStackApiToken?.trim()) &&
        Boolean(options.betterStackMonitorId?.trim());

      if (isBetterStackReal) {
        try {
          const res = await fetch("/api/connectors/better-stack/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              apiToken: options!.betterStackApiToken!.trim(),
              monitorId: options!.betterStackMonitorId!.trim(),
              monitorName: options?.betterStackMonitorName ?? null,
              monitorUrl: options?.betterStackMonitorUrl ?? null,
              teamName: options?.betterStackTeamName ?? null,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Better Stack échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options?.betterStackMonitorName ?? "Better Stack",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Better Stack échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId ? setIntegrationError(project, connectorId, message) : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "better-stack" && options?.mode !== "demo") {
        throw new Error("Connectez Better Stack via token API Uptime.");
      }

      const isSlackReal =
        connectorId === "slack" &&
        options?.mode === "real" &&
        Boolean(options.channelId?.trim());

      if (isSlackReal) {
        try {
          const res = await fetch("/api/connectors/slack/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              channelId: options!.channelId!.trim(),
              channelName: options?.channelName?.trim() || undefined,
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Slack échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Slack",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Slack échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "slack" && options?.mode !== "demo") {
        throw new Error("Connectez Slack via OAuth et sélectionnez un canal.");
      }

      const isZendeskReal = connectorId === "zendesk" && options?.mode === "real";

      if (isZendeskReal) {
        try {
          const res = await fetch("/api/connectors/zendesk/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Zendesk échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              updated = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? "Zendesk",
              );
              return updated;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Zendesk échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "zendesk" && options?.mode !== "demo") {
        throw new Error("Connectez Zendesk via OAuth.");
      }

      const isVercelReal =
        connectorId === "vercel" &&
        options?.mode === "real" &&
        Boolean(options.vercelProjectId?.trim());

      if (isVercelReal) {
        try {
          const res = await fetch("/api/connectors/vercel/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId,
              vercelProjectId: options!.vercelProjectId!.trim(),
              action: "sync",
            }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & {
            error?: string;
            connection?: HostConnection;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Connexion Vercel échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((project) => {
              if (project.id !== projectId) return project;
              let next = applyConnectorSyncToProject(
                project,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? options!.vercelProjectId!.trim(),
              );
              if (data.connection) {
                next = { ...next, hostConnection: data.connection };
              }
              updated = next;
              return next;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Connexion Vercel échouée";
          commit((prev) =>
            prev.map((project) =>
              project.id === projectId
                ? setIntegrationError(project, connectorId, message)
                : project,
            ),
          );
          throw err;
        }
        return;
      }

      if (connectorId === "vercel" && options?.mode !== "demo") {
        throw new Error("Connectez Vercel via OAuth.");
      }

      if (connectorId === "paddle") {
        throw new Error("Connectez Paddle via une clé API.");
      }

      if (connectorId === "freemius") {
        throw new Error("Connectez Freemius via Bearer Token produit.");
      }

      if (connectorId === "posthog") {
        throw new Error("Connectez PostHog via Personal API Key.");
      }

      if (connectorId === "google-analytics") {
        throw new Error("Connectez Google Analytics via OAuth.");
      }

      if (connectorId === "sentry" && options?.mode === "real") {
        throw new Error("Connectez Sentry via OAuth.");
      }

      if (!profile.supportsDemo) {
        throw new Error(`Connectez ${connectorName} via une connexion réelle.`);
      }

      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const opportunity = getCatalogOpportunity(project.opportunitySlug);
          if (!opportunity) return project;
          const now = new Date().toISOString();
          const { snapshots, stream } = syncConnectorAllDemo(project, connectorId, opportunity);
          const demoResult: ConnectorSyncApiResponse = {
            snapshots,
            stream,
            syncedAt: now,
          };
          const oppName = opportunity.name;
          return applyConnectorSyncToProject(
            project,
            connectorId,
            demoResult,
            "demo",
            `Démo · ${oppName}`,
          );
        }),
      );
    },
    [commit, getCatalogOpportunity],
  );

  const disconnectIntegration = useCallback(
    async (projectId: string, connectorId: ConnectorId) => {
      if (connectorId === "stripe") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "stripe");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/stripe/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "google-ads") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "google-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/google-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "meta-ads") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "meta-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/meta-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "tiktok-ads") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "tiktok-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/tiktok-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "linkedin-ads") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "linkedin-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/linkedin-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "microsoft-ads") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "microsoft-ads");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/microsoft-ads/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "plausible") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "plausible");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/plausible/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "fathom") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "fathom");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/fathom/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "lemon-squeezy") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "lemon-squeezy");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/lemon-squeezy/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "paddle") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "paddle");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/paddle/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "freemius") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "freemius");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/freemius/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "posthog") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "posthog");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/posthog/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "mixpanel") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "mixpanel");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/mixpanel/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "google-analytics") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find(
          (i) => i.connectorId === "google-analytics",
        );
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/google-analytics/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "sentry") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "sentry");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/sentry/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "loops") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "loops");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/loops/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "brevo") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "brevo");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/brevo/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "resend") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "resend");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/resend/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "crisp") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "crisp");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/crisp/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "intercom") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "intercom");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/intercom/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "hubspot") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "hubspot");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/hubspot/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "pipedrive") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "pipedrive");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/pipedrive/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "qonto") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "qonto");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/qonto/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "pennylane") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "pennylane");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/pennylane/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "abby") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "abby");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/abby/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "better-stack") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "better-stack");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/better-stack/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "slack") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "slack");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/slack/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "zendesk") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "zendesk");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/zendesk/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "vercel") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "vercel");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/vercel/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      if (connectorId === "github") {
        const project = projects.find((p) => p.id === projectId);
        const integration = project?.integrations?.find((i) => i.connectorId === "github");
        if (integration?.status === "connected") {
          try {
            await fetch("/api/connectors/github/disconnect", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
          } catch {
            // Continue local disconnect even if API fails
          }
        }
      }

      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            integrations: (project.integrations ?? []).map((i) =>
              i.connectorId === connectorId ? { ...i, status: "disconnected" as const } : i,
            ),
            connectorStreams: removeConnectorStream(project.connectorStreams ?? {}, connectorId),
            metricsHistory: stripConnectorMetrics(project.metricsHistory ?? [], connectorId),
            ...(connectorId === "vercel" && project.hostConnection?.provider === "vercel"
              ? { hostConnection: undefined }
              : {}),
            ...(connectorId === "github"
              ? { githubConnection: undefined, githubTrackedRepos: undefined }
              : {}),
          };
        }),
      );
    },
    [commit, projects],
  );

  const syncIntegration = useCallback(
    async (projectId: string, connectorId: ConnectorId) => {
      const project = projects.find((p) => p.id === projectId);
      const integration = project?.integrations?.find((i) => i.connectorId === connectorId);

      if (connectorId === "stripe") {
        if (integration?.status === "connected" || integration?.status === "demo") {
          try {
            const res = await fetch("/api/connectors/stripe/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Stripe échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Stripe",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Stripe échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Stripe via OAuth ou une clé restreinte.");
      }

      if (connectorId === "google-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/google-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Google Ads échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Google Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Google Ads échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Google Ads via OAuth.");
      }

      if (connectorId === "meta-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/meta-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Meta Ads échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Meta Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Meta Ads échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Meta Ads via OAuth.");
      }

      if (connectorId === "tiktok-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/tiktok-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation TikTok Ads échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "TikTok Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation TikTok Ads échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez TikTok Ads via OAuth.");
      }

      if (connectorId === "linkedin-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/linkedin-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation LinkedIn Ads échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "LinkedIn Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation LinkedIn Ads échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez LinkedIn Ads via OAuth.");
      }

      if (connectorId === "microsoft-ads") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/microsoft-ads/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Microsoft Ads échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Microsoft Ads",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Microsoft Ads échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Microsoft Ads via OAuth.");
      }

      if (connectorId === "github") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/github/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation GitHub échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyGitHubSyncToProject(p, data, "connected");
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation GitHub échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez GitHub via l'app GitHub.");
      }

      if (connectorId === "plausible") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/plausible/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Plausible échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Plausible",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Plausible échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Plausible via une clé Stats API.");
      }

      if (connectorId === "fathom") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/fathom/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Fathom échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Fathom",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Fathom échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Fathom via une clé API.");
      }

      if (connectorId === "lemon-squeezy") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/lemon-squeezy/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Lemon Squeezy échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Lemon Squeezy",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Lemon Squeezy échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Lemon Squeezy via une clé API.");
      }

      if (connectorId === "paddle") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/paddle/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Paddle échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Paddle",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Paddle échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Paddle via une clé API.");
      }

      if (connectorId === "freemius") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/freemius/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Freemius échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Freemius",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Freemius échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Freemius via Bearer Token produit.");
      }

      if (connectorId === "posthog") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/posthog/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation PostHog échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "PostHog",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation PostHog échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez PostHog via Personal API Key.");
      }

      if (connectorId === "mixpanel") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/mixpanel/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Mixpanel échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Mixpanel",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Mixpanel échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Mixpanel via Service Account.");
      }

      if (connectorId === "google-analytics") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/google-analytics/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Google Analytics échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Google Analytics",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Google Analytics échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Google Analytics via OAuth.");
      }

      if (connectorId === "sentry") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/sentry/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & {
              error?: string;
              tokenExpiresAt?: string;
            };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Sentry échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Sentry",
                );
                if (updated && data.tokenExpiresAt) {
                  updated = {
                    ...updated,
                    integrations: updated.integrations?.map((item) =>
                      item.connectorId === connectorId
                        ? { ...item, tokenExpiresAt: data.tokenExpiresAt }
                        : item,
                    ),
                  };
                }
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Sentry échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Sentry via OAuth.");
      }

      if (connectorId === "crisp") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/crisp/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Crisp échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Crisp",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Crisp échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Crisp via le plugin Marketplace et le Website ID.");
      }

      if (connectorId === "intercom") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/intercom/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Intercom échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Intercom",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Intercom échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Intercom via OAuth.");
      }

      if (connectorId === "hubspot") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/hubspot/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation HubSpot échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "HubSpot",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation HubSpot échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez HubSpot via OAuth.");
      }

      if (connectorId === "pipedrive") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/pipedrive/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Pipedrive échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Pipedrive",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Pipedrive échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Pipedrive via OAuth.");
      }

      if (connectorId === "qonto") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/qonto/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Qonto échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Qonto",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Qonto échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Qonto via OAuth.");
      }

      if (connectorId === "pennylane") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/pennylane/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Pennylane échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Pennylane",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Pennylane échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Pennylane via token API ou OAuth.");
      }

      if (connectorId === "abby") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/abby/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Abby échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Abby",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Abby échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Abby via clé API.");
      }

      if (connectorId === "better-stack") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/better-stack/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Better Stack échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Better Stack",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Better Stack échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }
      }

      if (connectorId === "slack") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/slack/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Slack échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Slack",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Slack échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Slack via OAuth et sélectionnez un canal.");
      }

      if (connectorId === "zendesk") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/zendesk/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Zendesk échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Zendesk",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message =
              err instanceof Error ? err.message : "Synchronisation Zendesk échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Zendesk via OAuth.");
      }

      if (connectorId === "brevo") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/brevo/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Brevo échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Brevo",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Brevo échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Brevo via une clé API.");
      }

      if (connectorId === "resend") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/resend/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Resend échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Resend",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Resend échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Resend via une clé API Full access.");
      }

      if (connectorId === "loops") {
        if (integration?.status === "connected") {
          try {
            const res = await fetch("/api/connectors/loops/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ projectId }),
            });
            const data = (await res.json()) as ConnectorSyncApiResponse & { error?: string };
            if (!res.ok) {
              throw new Error(data.error ?? "Synchronisation Loops échouée");
            }

            let updated: UserProject | undefined;
            commit((prev) =>
              prev.map((p) => {
                if (p.id !== projectId) return p;
                updated = applyConnectorSyncToProject(
                  p,
                  connectorId,
                  data,
                  "connected",
                  data.accountLabel ?? integration.accountLabel ?? "Loops",
                );
                return updated;
              }),
            );
            if (updated) queueProjectSync(updated);
          } catch (err) {
            const message = err instanceof Error ? err.message : "Synchronisation Loops échouée";
            commit((prev) =>
              prev.map((p) =>
                p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
              ),
            );
            throw err;
          }
          return;
        }

        throw new Error("Connectez Loops via une clé API et un webhook.");
      }

      if (connectorId === "vercel") {
        try {
          const res = await fetch("/api/connectors/vercel/sync", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ projectId, action: "sync" }),
          });
          const data = (await res.json()) as ConnectorSyncApiResponse & {
            error?: string;
            connection?: HostConnection;
          };
          if (!res.ok) {
            throw new Error(data.error ?? "Synchronisation Vercel échouée");
          }

          let updated: UserProject | undefined;
          commit((prev) =>
            prev.map((p) => {
              if (p.id !== projectId) return p;
              let next = applyConnectorSyncToProject(
                p,
                connectorId,
                data,
                "connected",
                data.accountLabel ?? integration?.accountLabel ?? "Vercel",
              );
              if (data.connection) {
                next = { ...next, hostConnection: data.connection };
              }
              updated = next;
              return next;
            }),
          );
          if (updated) queueProjectSync(updated);
        } catch (err) {
          const message = err instanceof Error ? err.message : "Synchronisation Vercel échouée";
          commit((prev) =>
            prev.map((p) =>
              p.id === projectId ? setIntegrationError(p, connectorId, message) : p,
            ),
          );
          throw err;
        }
        return;
      }

      const profile = getConnectorConnectionProfile(connectorId);
      const connectorName = getConnector(connectorId)?.name ?? connectorId;
      if (profile.supportsDemo) {
        await connectIntegration(projectId, connectorId, { mode: "demo" });
        return;
      }

      throw new Error(`Connectez ${connectorName} via une connexion réelle.`);
    },
    [commit, connectIntegration, projects],
  );

  const syncProjectIntegrations = useCallback(
    async (projectId: string, opts?: { force?: boolean }) => {
      const project = projects.find((p) => p.id === projectId);
      if (!project) return;

      const connectorIds = listAutoSyncableConnectorIds(project.integrations ?? [], opts);
      if (connectorIds.length === 0) return;

      setAutoSyncState({ projectId, connectorIds });

      try {
        for (const connectorId of connectorIds) {
          try {
            await syncIntegration(projectId, connectorId);
          } catch {
            // Erreur déjà enregistrée sur l'intégration via syncIntegration.
          }
        }
      } finally {
        setAutoSyncState(null);
      }
    },
    [projects, syncIntegration],
  );

  const removeGitHubRepo = useCallback(
    async (projectId: string, repoFullName: string) => {
      try {
        const res = await fetch("/api/connectors/github/repos/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ projectId, repoFullName }),
        });
        const data = (await res.json()) as { disconnected?: boolean; error?: string };
        if (!res.ok) {
          throw new Error(data.error ?? "Retrait du dépôt échoué");
        }

        let updated: UserProject | undefined;
        commit((prev) =>
          prev.map((project) => {
            if (project.id !== projectId) return project;
            updated = removeGitHubRepoFromProject(
              project,
              repoFullName,
              Boolean(data.disconnected),
            );
            return updated;
          }),
        );
        if (updated) queueProjectSync(updated);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Retrait du dépôt échoué";
        commit((prev) =>
          prev.map((project) =>
            project.id === projectId ? setIntegrationError(project, "github", message) : project,
          ),
        );
        throw err;
      }
    },
    [commit],
  );

  const patchIntegration = useCallback(
    (projectId: string, connectorId: ConnectorId, patch: Partial<Integration>) => {
      let updated: UserProject | undefined;
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          updated = patchIntegrationMeta(project, connectorId, patch);
          return updated;
        }),
      );
      if (updated) queueProjectSync(updated);
    },
    [commit],
  );

  const addCampaign = useCallback(
    (projectId: string, campaign: Omit<AdCampaign, "id">) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const newCampaign: AdCampaign = {
            ...campaign,
            id: `camp-${Date.now()}`,
          };
          return {
            ...project,
            campaigns: [...(project.campaigns ?? []), newCampaign],
          };
        })
      );
    },
    [commit]
  );

  const updateCampaign = useCallback(
    (projectId: string, campaignId: string, patch: Partial<AdCampaign>) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            campaigns: (project.campaigns ?? []).map((c) =>
              c.id === campaignId ? { ...c, ...patch } : c
            ),
          };
        })
      );
    },
    [commit]
  );

  const removeCampaign = useCallback(
    (projectId: string, campaignId: string) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            campaigns: (project.campaigns ?? []).filter((c) => c.id !== campaignId),
          };
        })
      );
    },
    [commit]
  );

  const addExpense = useCallback(
    (projectId: string, expense: Omit<Expense, "id">) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            expenses: [
              ...(project.expenses ?? []),
              { ...expense, id: `exp-${Date.now()}` },
            ],
          };
        })
      );
    },
    [commit]
  );

  const removeExpense = useCallback(
    (projectId: string, expenseId: string) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            expenses: (project.expenses ?? []).filter((e) => e.id !== expenseId),
          };
        })
      );
    },
    [commit]
  );

  const logMetricsSnapshot = useCallback(
    (projectId: string, partial: Partial<MetricsSnapshot>) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const month = partial.date ?? new Date().toISOString().slice(0, 7);
          const date = new Date().toISOString().slice(0, 10);
          const history = project.metricsHistory ?? [];
          const idx = history.findIndex((s) => s.date === month);
          const base: MetricsSnapshot =
            idx >= 0
              ? history[idx]
              : {
                  date: month,
                  mrr: project.currentMrr,
                  newMrr: 0,
                  expansionMrr: 0,
                  churnedMrr: 0,
                  customers: 0,
                  signups: 0,
                  trials: 0,
                  activeUsers: 0,
                  mau: 0,
                  dau: 0,
                  adSpend: 0,
                  impressions: 0,
                  clicks: 0,
                  conversions: 0,
                };
          const merged = { ...base, ...partial, date: month, source: "manual" as const };
          const nextMetrics =
            idx >= 0 ? history.map((s, i) => (i === idx ? merged : s)) : [...history, merged];

          let nextMrrHistory = project.mrrHistory;
          if (partial.mrr !== undefined) {
            const existingIndex = project.mrrHistory.findIndex((e) => e.date === date);
            const entry = { date, amount: merged.mrr, note: "Saisie manuelle" };
            nextMrrHistory =
              existingIndex >= 0
                ? project.mrrHistory.map((e, i) => (i === existingIndex ? entry : e))
                : [...project.mrrHistory, entry];
          }

          const updated = {
            ...project,
            metricsHistory: nextMetrics,
            currentMrr: merged.mrr,
            mrrHistory: nextMrrHistory,
          };
          return updated;
        })
      );
    },
    [commit]
  );

  const setCashOnHand = useCallback(
    (projectId: string, amount: number) => {
      updateProject(projectId, { cashOnHand: amount });
    },
    [updateProject]
  );

  const getProjectBySlug = useCallback(
    (slug: string) => projects.find((p) => p.opportunitySlug === slug),
    [projects]
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
      resetBuild,
      setCampaignKitForProject,
      switchCampaignTool: switchCampaignToolForProject,
      addCampaignTool: addCampaignToolForProject,
      removeCampaignTool: removeCampaignToolForProject,
      setMarketingProfile: setMarketingProfileForProject,
      setStrategyBriefForProject,
      setCampaignChannel: setCampaignChannelForProject,
      acknowledgeCampaignDistribution: acknowledgeCampaignDistributionForProject,
      acknowledgeCampaignMeasure: acknowledgeCampaignMeasureForProject,
      restoreCampaignVersion,
      resetCampaign: resetCampaignForProject,
      setGitHubConnection,
      setHostConnection,
      getProjectBySlug,
      getProjectById,
      opportunityCatalog,
      getCatalogOpportunity,
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
      resetBuild,
      setCampaignKitForProject,
      switchCampaignToolForProject,
      addCampaignToolForProject,
      removeCampaignToolForProject,
      setMarketingProfileForProject,
      setStrategyBriefForProject,
      setCampaignChannelForProject,
      acknowledgeCampaignDistributionForProject,
      acknowledgeCampaignMeasureForProject,
      restoreCampaignVersion,
      resetCampaignForProject,
      setGitHubConnection,
      setHostConnection,
      getProjectBySlug,
      getProjectById,
      opportunityCatalog,
      getCatalogOpportunity,
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

export function usePortfolio(): PortfolioContextValue {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be used within PortfolioProvider");
  return ctx;
}

export type { TargetScenario, ProjectPhase, UserProject };
