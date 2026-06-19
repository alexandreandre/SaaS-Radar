import type { AdCampaign, Expense, MetricsSnapshot } from "@/lib/connectors/types";
import type { PortfolioActionDeps } from "./portfolio-action-deps";

export function createFinanceActions(deps: PortfolioActionDeps) {
  const addCampaign = (projectId: string, campaign: Omit<AdCampaign, "id">) => {
      deps.commit((prev) =>
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
    };

  const updateCampaign = (projectId: string, campaignId: string, patch: Partial<AdCampaign>) => {
      deps.commit((prev) =>
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
    };

  const removeCampaign = (projectId: string, campaignId: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            campaigns: (project.campaigns ?? []).filter((c) => c.id !== campaignId),
          };
        })
      );
    };

  const addExpense = (projectId: string, expense: Omit<Expense, "id">) => {
      deps.commit((prev) =>
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
    };

  const removeExpense = (projectId: string, expenseId: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== projectId) return project;
          return {
            ...project,
            expenses: (project.expenses ?? []).filter((e) => e.id !== expenseId),
          };
        })
      );
    };

  const logMetricsSnapshot = (projectId: string, partial: Partial<MetricsSnapshot>) => {
      deps.commit((prev) =>
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
    };

  const setCashOnHand = (projectId: string, amount: number) => {
      deps.updateProject(projectId, { cashOnHand: amount });
    };
  return {
    addCampaign,
    updateCampaign,
    removeCampaign,
    addExpense,
    removeExpense,
    logMetricsSnapshot,
    setCashOnHand,
  };
}
