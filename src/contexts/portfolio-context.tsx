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
  patchIntegrationMeta,
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
  type AddProjectInput,
  type BuildSetup,
  type BuildDevLevel,
  type GitHubConnection,
  type HostConnection,
  type ProductLogo,
  type ResetBuildOptions,
  type ProjectPhase,
  type TargetScenario,
  type UserProject,
} from "@/lib/portfolio";
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
};

type PortfolioContextValue = {
  projects: UserProject[];
  hydrated: boolean;
  addProject: (slug: string, input: AddProjectInput) => UserProject | null;
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
    if (!raw) return [];
    const parsed = JSON.parse(raw) as UserProject[];
    return Array.isArray(parsed) ? parsed.map(migrateProject) : [];
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
          const updated = { ...project, hostConnection: connection };
          return updated;
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

      await connectIntegration(projectId, connectorId, { mode: "demo" });
    },
    [commit, connectIntegration, projects],
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
