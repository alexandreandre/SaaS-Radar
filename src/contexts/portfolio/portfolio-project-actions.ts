import {
  createProjectFromOpportunity,
  migrateProject,
  computeNextStreak,
  monthFromDate,
  toggleLaunchChecklistItem as applyLaunchChecklistToggle,
  type AddProjectInput,
  type ProjectPhase,
  type MetricsSnapshot,
  type UserProject,
} from "@/lib/portfolio";
import { isOnboardingComplete } from "@/lib/build-launch";
import type { Opportunity } from "@/types/opportunity";
import type { PortfolioActionDeps } from "./portfolio-action-deps";
export function createProjectActions(deps: PortfolioActionDeps) {
  const addProject = (
    slug: string,
    input: AddProjectInput,
    opportunityOverride?: Opportunity,
  ): UserProject | null => {
      const opportunity = opportunityOverride ?? deps.getCatalogOpportunity(slug);
      if (!opportunity) return null;

      let created: UserProject | null = null;
      deps.commit((prev) => {
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
    };

  const registerProject = (project: UserProject) => {
      const migrated = migrateProject(project);
      deps.commit((prev) => {
        if (prev.some((p) => p.id === migrated.id)) {
          return prev.map((p) => (p.id === migrated.id ? migrated : p));
        }
        return [migrated, ...prev];
      });
    };

  const removeProject = (id: string) => {
      deps.commit((prev) => prev.filter((p) => p.id !== id));
    };

  const updateProject = (id: string, patch: Partial<UserProject>) => {
      deps.commit((prev) =>
        prev.map((p) => (p.id === id ? { ...p, ...patch } : p))
      );
    };

  const setProjectPhase = (id: string, phase: ProjectPhase) => {
      deps.updateProject(id, { phase });
    };

  const recordMrr = (id: string, amount: number, note?: string) => {
      const now = new Date();
      const date = now.toISOString().slice(0, 10);
      const month = monthFromDate(date);
      const isoNow = now.toISOString();

      deps.commit((prev) =>
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
    };

  const toggleMilestone = (id: string, milestoneId: string) => {
      deps.commit((prev) =>
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
    };

  const toggleLaunchChecklistItem = (id: string, itemIndex: number) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const updated = applyLaunchChecklistToggle(project, itemIndex);
          return updated;
        }),
      );
    };

  const completeOnboarding = (projectId: string) => {
      const now = new Date().toISOString();
      deps.updateProject(projectId, {
        onboardingCompleted: true,
        onboardingCompletedAt: now,
      });
    };

  const markLaunchRoomSeen = (projectId: string) => {
      deps.updateProject(projectId, {
        launchRoomSeenAt: new Date().toISOString(),
      });
    };
  return {
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
  };
}
