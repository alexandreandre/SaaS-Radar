"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  removeConnectorStream,
  stripConnectorMetrics,
  syncConnectorAllDemo,
  type ConnectorId,
} from "@/lib/connectors";
import {
  applyConnectorSyncToProject,
  applyGitHubSyncToProject,
  patchIntegrationMeta,
  removeGitHubRepoFromProject,
  setIntegrationError,
  type ConnectorSyncApiResponse,
} from "@/lib/connectors/integration-client";
import type { AdCampaign, Expense, Integration, MetricsSnapshot } from "@/lib/connectors/types";
import type { Opportunity } from "@/types/opportunity";
import { useTier } from "@/contexts/tier-context";
import { useSession } from "@/contexts/session-context";
import { enrichOpportunity } from "@/data/opportunity-enrichment";
import { gateOpportunityForTier } from "@/lib/opportunity-access";
import { isOnboardingComplete } from "@/lib/build-launch";
import {
  PORTFOLIO_STORAGE_KEY,
  PENDING_PROJECT_STORAGE_KEY,
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

export type ConnectIntegrationOptions = {
  mode?: "demo" | "real";
  secretKey?: string;
  currency?: string;
  customerId?: string;
  adAccountId?: string;
  apiKey?: string;
  siteId?: string;
  signupGoalDisplayName?: string | null;
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
  crispWebsiteId?: string;
  vercelProjectId?: string;
  storeId?: string;
  storeName?: string;
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

function readStoredProjects(): UserProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(PORTFOLIO_STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as UserProject[]) : [];
    const base = Array.isArray(parsed) ? parsed.map(migrateProject) : [];

    const pendingRaw = sessionStorage.getItem(PENDING_PROJECT_STORAGE_KEY);
    if (!pendingRaw) return base;

    const pending = migrateProject(JSON.parse(pendingRaw) as UserProject);
    sessionStorage.removeItem(PENDING_PROJECT_STORAGE_KEY);
    if (base.some((p) => p.id === pending.id)) {
      return base.map((p) => (p.id === pending.id ? pending : p));
    }
    return [pending, ...base];
  } catch {
    return [];
  }
}

function persistProjects(projects: UserProject[]) {
  localStorage.setItem(PORTFOLIO_STORAGE_KEY, JSON.stringify(projects));
}

async function syncAccountPortfolioInBackground(
  localProjects: UserProject[]
): Promise<UserProject[]> {
  const serverProjects = (await fetchAccountProjects()).map(migrateProject);
  const serverIds = new Set(serverProjects.map((p) => p.id));
  const serverSlugs = new Set(serverProjects.map((p) => p.opportunitySlug));

  const toUpload = localProjects.filter(
    (p) => !serverIds.has(p.id) && !serverSlugs.has(p.opportunitySlug)
  );

  if (toUpload.length > 0) {
    void Promise.all(toUpload.map((p) => uploadAccountProject(migrateProject(p))));
    return [...toUpload, ...serverProjects].map(migrateProject);
  }

  return serverProjects.length > 0 ? serverProjects : localProjects;
}

export function PortfolioProvider({
  children,
  opportunityCatalog,
}: {
  children: ReactNode;
  opportunityCatalog: Opportunity[];
}) {
  const { tier } = useTier();
  const { isAuthenticated } = useSession();
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useLayoutEffect(() => {
    const local = readStoredProjects();
    setProjects(local);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;
    const local = readStoredProjects();

    void (async () => {
      try {
        const accountProjects = await syncAccountPortfolioInBackground(local);
        if (!cancelled) {
          setProjects(accountProjects);
          persistProjects(accountProjects);
        }
      } catch {
        /* conserve le cache local */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

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
        persistProjects(next);

        if (isAuthenticated && next !== prev) {
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
    [isAuthenticated]
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

      if (connectorId === "lemon-squeezy" && options?.mode === "demo") {
        throw new Error(
          "La connexion démo Lemon Squeezy n'est plus disponible. Connectez votre boutique via clé API.",
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

        if (integration?.status === "demo") {
          await connectIntegration(projectId, connectorId, { mode: "demo" });
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

        if (integration?.status === "demo") {
          await connectIntegration(projectId, connectorId, { mode: "demo" });
          return;
        }

        throw new Error("Connectez Plausible via une clé Stats API.");
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

        if (integration?.status === "demo") {
          await connectIntegration(projectId, connectorId, { mode: "demo" });
          return;
        }

        throw new Error("Connectez Brevo via une clé API.");
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

        if (integration?.status === "demo") {
          await connectIntegration(projectId, connectorId, { mode: "demo" });
          return;
        }

        throw new Error("Connectez Loops via une clé API et un webhook.");
      }

      if (connectorId === "vercel") {
        if (integration?.status === "demo") {
          await connectIntegration(projectId, connectorId, { mode: "demo" });
          return;
        }

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

      await connectIntegration(projectId, connectorId, { mode: "demo" });
    },
    [commit, connectIntegration, projects],
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
