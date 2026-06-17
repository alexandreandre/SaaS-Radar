"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  mergeSnapshots,
  mergeProjectStreams,
  removeConnectorStream,
  syncConnectorAllDemo,
  type ConnectorId,
} from "@/lib/connectors";
import type { AdCampaign, Expense, MetricsSnapshot } from "@/lib/connectors/types";
import type { Opportunity } from "@/types/opportunity";
import { useTier } from "@/contexts/tier-context";
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
  type AddProjectInput,
  type ProjectPhase,
  type TargetScenario,
  type UserProject,
} from "@/lib/portfolio";
import { queueProjectMetricsSync } from "@/lib/portfolio-sync-client";

type PortfolioContextValue = {
  projects: UserProject[];
  hydrated: boolean;
  addProject: (slug: string, input: AddProjectInput) => UserProject | null;
  removeProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<UserProject>) => void;
  setProjectPhase: (id: string, phase: ProjectPhase) => void;
  recordMrr: (id: string, amount: number, note?: string) => void;
  toggleMilestone: (id: string, milestoneId: string) => void;
  getProjectBySlug: (slug: string) => UserProject | undefined;
  getProjectById: (id: string) => UserProject | undefined;
  opportunityCatalog: Opportunity[];
  getCatalogOpportunity: (slug: string) => Opportunity | undefined;
  activeProject: UserProject | null;
  overdueCheckIns: number;
  stats: ReturnType<typeof getPortfolioStats>;
  connectIntegration: (projectId: string, connectorId: ConnectorId) => void;
  disconnectIntegration: (projectId: string, connectorId: ConnectorId) => void;
  syncIntegration: (projectId: string, connectorId: ConnectorId) => void;
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

export function PortfolioProvider({
  children,
  opportunityCatalog,
}: {
  children: ReactNode;
  opportunityCatalog: Opportunity[];
}) {
  const { tier } = useTier();
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProjects(readStoredProjects());
    setHydrated(true);
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

  const commit = useCallback((updater: (prev: UserProject[]) => UserProject[]) => {
    setProjects((prev) => {
      const next = updater(prev);
      persistProjects(next);
      return next;
    });
  }, []);

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
          queueProjectMetricsSync(updated);
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
            return {
              ...updated,
              onboardingCompleted: true,
              onboardingCompletedAt: now,
            };
          }

          return updated;
        })
      );
    },
    [commit]
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
    (projectId: string, connectorId: ConnectorId) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          const opportunity = getCatalogOpportunity(project.opportunitySlug);
          if (!opportunity) return project;
          const now = new Date().toISOString();
          const { snapshots, stream } = syncConnectorAllDemo(
            project,
            connectorId,
            opportunity
          );
          const integrations = [...(project.integrations ?? [])];
          const idx = integrations.findIndex((i) => i.connectorId === connectorId);
          const connector = opportunity;
          const entry = {
            connectorId,
            status: "demo" as const,
            connectedAt: now,
            lastSyncAt: now,
            accountLabel: connector ? `Démo · ${connector.name}` : "Démo",
            syncSchedule: "manual" as const,
          };
          if (idx >= 0) integrations[idx] = entry;
          else integrations.push(entry);

          const latestMrr = snapshots.at(-1)?.mrr ?? project.currentMrr;
          let connectorStreams = project.connectorStreams ?? {};
          if (stream) {
            connectorStreams = mergeProjectStreams(connectorStreams, connectorId, stream);
          }

          return {
            ...project,
            integrations,
            connectorStreams,
            metricsHistory: mergeSnapshots(project.metricsHistory ?? [], snapshots),
            currentMrr: latestMrr > 0 ? latestMrr : project.currentMrr,
          };
        })
      );
    },
    [commit, getCatalogOpportunity]
  );

  const disconnectIntegration = useCallback(
    (projectId: string, connectorId: ConnectorId) => {
      commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            integrations: (project.integrations ?? []).map((i) =>
              i.connectorId === connectorId ? { ...i, status: "disconnected" as const } : i
            ),
            connectorStreams: removeConnectorStream(project.connectorStreams ?? {}, connectorId),
          };
        })
      );
    },
    [commit]
  );

  const syncIntegration = useCallback(
    (projectId: string, connectorId: ConnectorId) => {
      connectIntegration(projectId, connectorId);
    },
    [connectIntegration]
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
          queueProjectMetricsSync(updated);
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
