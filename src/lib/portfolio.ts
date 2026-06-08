import type {
  AdCampaign,
  ConnectorId,
  Expense,
  Integration,
  MetricsSnapshot,
} from "@/lib/connectors/types";
import type { ConnectorStreams } from "@/lib/connectors/streams";
import type { FinancialScenario, Opportunity } from "@/types/opportunity";

export type { AdCampaign, Expense, Integration, MetricsSnapshot };

export type ProjectPhase = "build" | "launch" | "revenue" | "paused";
export type TargetScenario = FinancialScenario["name"];

export type MrrEntry = {
  date: string;
  amount: number;
  note?: string;
};

export type MilestoneSource = "launch" | "revenue" | "custom";

export type Milestone = {
  id: string;
  label: string;
  done: boolean;
  doneAt?: string;
  source: MilestoneSource;
};

export type UserProject = {
  id: string;
  opportunitySlug: string;
  startedAt: string;
  phase: ProjectPhase;
  currentMrr: number;
  mrrHistory: MrrEntry[];
  targetScenario: TargetScenario;
  milestones: Milestone[];
  lastCheckInAt?: string;
  checkInStreak: number;
  notes?: string;
  createdAt: string;
  metricsHistory?: MetricsSnapshot[];
  campaigns?: AdCampaign[];
  expenses?: Expense[];
  integrations?: Integration[];
  connectorStreams?: ConnectorStreams;
  cashOnHand?: number;
};

export type { ConnectorId, ConnectorStreams };

export type AddProjectInput = {
  startedAt: string;
  currentMrr: number;
  targetScenario: TargetScenario;
};

export const PORTFOLIO_STORAGE_KEY = "saas-radar:portfolio";
export const CHECK_IN_OVERDUE_DAYS = 25;
export const CHECK_IN_STREAK_WINDOW_DAYS = 35;

const REVENUE_MILESTONES: Pick<Milestone, "id" | "label" | "source">[] = [
  { id: "revenue-landing", label: "Landing créée", source: "revenue" },
  { id: "revenue-email", label: "Premier email envoyé", source: "revenue" },
  { id: "revenue-prospect", label: "Premier prospect", source: "revenue" },
  { id: "revenue-demo", label: "Première démo", source: "revenue" },
  { id: "revenue-client", label: "Premier client payant", source: "revenue" },
  { id: "revenue-1k", label: "1 000 € MRR atteint", source: "revenue" },
];

export function generateProjectId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `proj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function buildMilestonesFromOpportunity(opportunity: Opportunity): Milestone[] {
  const launch: Milestone[] = (opportunity.launchTimeline ?? []).flatMap((week) =>
    week.actions.map((action, index) => ({
      id: `launch-w${week.week}-${index}`,
      label: `S${week.week} — ${action}`,
      done: false,
      source: "launch" as const,
    }))
  );

  const revenue: Milestone[] = REVENUE_MILESTONES.map((m) => ({
    ...m,
    done: false,
  }));

  return [...launch, ...revenue];
}

export function getScenarioMrr(opportunity: Opportunity, scenario: TargetScenario): number {
  const match = opportunity.financialScenarios.find((s) => s.name === scenario);
  return match?.mrr ?? opportunity.financialScenarios[1]?.mrr ?? 0;
}

export function createProjectFromOpportunity(
  opportunity: Opportunity,
  input: AddProjectInput
): UserProject {
  const now = new Date().toISOString();
  const initialHistory: MrrEntry[] =
    input.currentMrr > 0
      ? [{ date: now.slice(0, 10), amount: input.currentMrr, note: "MRR initial" }]
      : [];

  return {
    id: generateProjectId(),
    opportunitySlug: opportunity.slug,
    startedAt: input.startedAt,
    phase: opportunity.buildableUnder30Days ? "build" : "launch",
    currentMrr: input.currentMrr,
    mrrHistory: initialHistory,
    targetScenario: input.targetScenario,
    milestones: buildMilestonesFromOpportunity(opportunity),
    lastCheckInAt: input.currentMrr > 0 ? now : undefined,
    checkInStreak: input.currentMrr > 0 ? 1 : 0,
    createdAt: now,
  };
}

export function getTargetMrr(project: UserProject, opportunity: Opportunity): number {
  return getScenarioMrr(opportunity, project.targetScenario);
}

export function getMilestoneProgress(project: UserProject): number {
  if (project.milestones.length === 0) return 0;
  const done = project.milestones.filter((m) => m.done).length;
  return Math.round((done / project.milestones.length) * 100);
}

export function daysSince(dateIso?: string): number | null {
  if (!dateIso) return null;
  const then = new Date(dateIso).getTime();
  const now = Date.now();
  return Math.floor((now - then) / (1000 * 60 * 60 * 24));
}

export function isCheckInOverdue(project: UserProject, thresholdDays = CHECK_IN_OVERDUE_DAYS): boolean {
  if (project.phase === "paused") return false;
  const days = daysSince(project.lastCheckInAt ?? project.createdAt);
  return days !== null && days >= thresholdDays;
}

export function countOverdueCheckIns(projects: UserProject[]): number {
  return projects.filter((p) => p.phase !== "paused" && isCheckInOverdue(p)).length;
}

export function buildPromiseCurve(
  opportunity: Opportunity,
  scenario: TargetScenario,
  months = 12
): { month: number; mrr: number }[] {
  const target = getScenarioMrr(opportunity, scenario);
  return Array.from({ length: months + 1 }, (_, month) => ({
    month,
    mrr: Math.round((target / months) * month),
  }));
}

export function mergeRealityCurve(
  promise: { month: number; mrr: number }[],
  history: MrrEntry[],
  startedAt: string
): { month: number; promise: number; reality: number | null }[] {
  const start = new Date(startedAt).getTime();

  return promise.map((point) => {
    const pointDate = new Date(start);
    pointDate.setMonth(pointDate.getMonth() + point.month);

    const entriesBeforePoint = history.filter(
      (entry) => new Date(entry.date).getTime() <= pointDate.getTime()
    );

    const latest = entriesBeforePoint.at(-1);
    return {
      month: point.month,
      promise: point.mrr,
      reality: latest ? latest.amount : point.month === 0 ? 0 : null,
    };
  });
}

export function getPromiseGapPercent(
  project: UserProject,
  opportunity: Opportunity
): number | null {
  const target = getTargetMrr(project, opportunity);
  if (target <= 0) return null;
  return Math.round(((project.currentMrr - target) / target) * 100);
}

export type PortfolioStats = {
  projectCount: number;
  activeCount: number;
  totalMrr: number;
  averageProgressPercent: number;
  overdueCheckIns: number;
};

export function getPortfolioStats(
  projects: UserProject[],
  catalog: Opportunity[] = []
): PortfolioStats {
  const active = projects.filter((p) => p.phase !== "paused");
  const totalMrr = active.reduce((sum, p) => sum + p.currentMrr, 0);

  const progressValues = active.map((project) => {
    const opportunity = catalog.find((o) => o.slug === project.opportunitySlug);
    if (!opportunity) return 0;
    const target = getTargetMrr(project, opportunity);
    if (target <= 0) return 0;
    return Math.min(100, Math.round((project.currentMrr / target) * 100));
  });

  const averageProgressPercent =
    progressValues.length > 0
      ? Math.round(progressValues.reduce((a, b) => a + b, 0) / progressValues.length)
      : 0;

  return {
    projectCount: projects.length,
    activeCount: active.length,
    totalMrr,
    averageProgressPercent,
    overdueCheckIns: countOverdueCheckIns(projects),
  };
}

export function getMostUrgentProject(projects: UserProject[]): UserProject | null {
  const active = projects.filter((p) => p.phase !== "paused");
  if (active.length === 0) return null;

  const overdue = active.filter((p) => isCheckInOverdue(p));
  if (overdue.length > 0) {
    return overdue.sort(
      (a, b) =>
        (daysSince(a.lastCheckInAt ?? a.createdAt) ?? 0) -
        (daysSince(b.lastCheckInAt ?? b.createdAt) ?? 0)
    )[0];
  }

  return active.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];
}

export function computeNextStreak(previousLastCheckIn: string | undefined): number {
  if (!previousLastCheckIn) return 1;
  const days = daysSince(previousLastCheckIn);
  if (days === null) return 1;
  return days <= CHECK_IN_STREAK_WINDOW_DAYS ? -1 : 1;
}

export const MRR_MILESTONES = [100, 500, 1000] as const;

export function getNewlyCrossedMrrMilestone(
  previousMrr: number,
  nextMrr: number
): number | null {
  for (const threshold of MRR_MILESTONES) {
    if (previousMrr < threshold && nextMrr >= threshold) return threshold;
  }
  return null;
}

export type TimelineEvent = {
  id: string;
  date: string;
  label: string;
  type: "created" | "check-in" | "milestone" | "phase";
};

export function buildProjectTimeline(project: UserProject): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: "created",
      date: project.createdAt,
      label: "Projet ajouté à Mes SaaS",
      type: "created",
    },
  ];

  for (const entry of project.mrrHistory) {
    events.push({
      id: `mrr-${entry.date}-${entry.amount}`,
      date: entry.date,
      label: `Check-in MRR : ${entry.amount.toLocaleString("fr-FR")} €${entry.note ? ` — ${entry.note}` : ""}`,
      type: "check-in",
    });
  }

  for (const milestone of project.milestones) {
    if (milestone.done && milestone.doneAt) {
      events.push({
        id: `ms-${milestone.id}`,
        date: milestone.doneAt,
        label: milestone.label,
        type: "milestone",
      });
    }
  }

  return events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getNextActionMessage(project: UserProject, opportunity: Opportunity): string {
  const target = getTargetMrr(project, opportunity);
  const progress = getMilestoneProgress(project);

  if (project.currentMrr === 0) {
    const week = opportunity.launchTimeline?.[0];
    if (week) {
      return `Commencez par : ${week.actions[0] ?? week.goal} — objectif semaine 1 : ${week.kpi}.`;
    }
    return "Créez votre landing et contactez 10 prospects cette semaine pour valider l'intérêt.";
  }

  if (target > 0 && project.currentMrr < target * 0.3) {
    const channel = opportunity.acquisition[0];
    if (channel) {
      return `Votre MRR est en dessous de 30 % de l'objectif. Testez le canal « ${channel.title} » avec le template fourni.`;
    }
    return "Relancez vos prospects chauds et proposez une démo cette semaine.";
  }

  if (progress >= 80 && project.phase !== "revenue") {
    return "Plus de 80 % du journal est complété — passez en phase Revenu et concentrez-vous sur la conversion.";
  }

  return "Mettez à jour votre MRR ce mois-ci pour suivre votre progression face à la promesse Radar.";
}

export function migrateProject(project: UserProject): UserProject {
  return {
    ...project,
    metricsHistory: project.metricsHistory ?? [],
    campaigns: project.campaigns ?? [],
    expenses: project.expenses ?? [],
    integrations: project.integrations ?? [],
    connectorStreams: project.connectorStreams ?? {},
    cashOnHand: project.cashOnHand ?? 5000,
  };
}

export function getMetricsHistory(project: UserProject): MetricsSnapshot[] {
  return project.metricsHistory ?? [];
}

export function monthFromDate(date: string): string {
  return date.slice(0, 7);
}

export function computeCac(snapshot: MetricsSnapshot): number {
  if (snapshot.conversions <= 0) return 0;
  return Math.round(snapshot.adSpend / snapshot.conversions);
}

export function computeLtv(snapshot: MetricsSnapshot, churnRate = 0.05): number {
  if (snapshot.customers <= 0) return 0;
  const arpu = snapshot.mrr / snapshot.customers;
  return Math.round(arpu / Math.max(churnRate, 0.01));
}

export function computeRoas(campaigns: AdCampaign[]): number {
  const active = campaigns.filter((c) => c.status === "active" || c.status === "paused");
  const spend = active.reduce((s, c) => s + c.totalSpend, 0);
  const conv = active.reduce((s, c) => s + c.conversions, 0);
  if (spend <= 0) return 0;
  return Math.round((conv * 79) / spend * 100) / 100;
}

export function aggregateCampaigns(campaigns: AdCampaign[]) {
  return campaigns.reduce(
    (acc, c) => ({
      totalSpend: acc.totalSpend + c.totalSpend,
      impressions: acc.impressions + c.impressions,
      clicks: acc.clicks + c.clicks,
      conversions: acc.conversions + c.conversions,
      dailyBudget: acc.dailyBudget + c.dailyBudget,
    }),
    { totalSpend: 0, impressions: 0, clicks: 0, conversions: 0, dailyBudget: 0 }
  );
}

export function computeBurnRate(project: UserProject, month?: string): number {
  const key = month ?? new Date().toISOString().slice(0, 7);
  const expenses = (project.expenses ?? []).filter((e) => e.date.startsWith(key));
  const recurring = (project.expenses ?? []).filter((e) => e.recurring);
  const monthExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const recurringTotal = recurring.reduce((s, e) => s + e.amount, 0);
  const latest = getMetricsHistory(project).find((m) => m.date === key);
  const adSpend = latest?.adSpend ?? 0;
  return monthExpenses + recurringTotal + adSpend;
}

export function computeRunwayMonths(project: UserProject): number | null {
  const cash = project.cashOnHand ?? 0;
  const burn = computeBurnRate(project);
  if (burn <= 0) return null;
  return Math.round((cash / burn) * 10) / 10;
}

export function getMrrBreakdown(snapshot: MetricsSnapshot) {
  return {
    newMrr: snapshot.newMrr,
    expansionMrr: snapshot.expansionMrr,
    churnedMrr: snapshot.churnedMrr,
    netNew: snapshot.newMrr + snapshot.expansionMrr - snapshot.churnedMrr,
  };
}

export function getFunnel(snapshot: MetricsSnapshot) {
  return [
    { stage: "Impressions", value: snapshot.impressions },
    { stage: "Clics", value: snapshot.clicks },
    { stage: "Signups", value: snapshot.signups },
    { stage: "Trials", value: snapshot.trials },
    { stage: "Clients", value: snapshot.customers },
  ];
}

export function getRetentionSeries(history: MetricsSnapshot[]) {
  if (history.length < 2) return [];
  return history.map((snap, i) => {
    const prev = history[i - 1];
    const churnRate =
      prev && prev.mrr > 0 ? Math.round((snap.churnedMrr / prev.mrr) * 1000) / 10 : 0;
    const retention = Math.max(0, 100 - churnRate);
    return { date: snap.date, retention, churnRate };
  });
}

export function getChurnRate(snapshot: MetricsSnapshot, previous?: MetricsSnapshot): number {
  if (!previous || previous.mrr <= 0) return 0;
  return Math.round((snapshot.churnedMrr / previous.mrr) * 1000) / 10;
}

export function getSparklineValues(history: MetricsSnapshot[], key: keyof MetricsSnapshot): number[] {
  return history.map((s) => Number(s[key] ?? 0));
}

export function getDeltaPercent(current: number, previous: number): number | null {
  if (previous === 0) return current > 0 ? 100 : null;
  return Math.round(((current - previous) / previous) * 100);
}

export function generateDefaultCampaigns(projectId: string): AdCampaign[] {
  const rng = projectId.slice(0, 8);
  return [
    {
      id: `${projectId}-google`,
      channel: "google",
      name: "Search — mots-clés niche",
      status: "active",
      dailyBudget: 25,
      totalSpend: 420 + rng.charCodeAt(0),
      impressions: 12400,
      clicks: 186,
      conversions: 8,
      startedAt: new Date().toISOString().slice(0, 10),
    },
    {
      id: `${projectId}-meta`,
      channel: "meta",
      name: "Meta — lookalike prospects",
      status: "active",
      dailyBudget: 15,
      totalSpend: 280,
      impressions: 8900,
      clicks: 142,
      conversions: 5,
      startedAt: new Date().toISOString().slice(0, 10),
    },
  ];
}

export function generateDefaultExpenses(opportunity: Opportunity): Expense[] {
  const now = new Date().toISOString().slice(0, 10);
  const infra = (opportunity.infraCosts ?? []).map((c, i) => ({
    id: `exp-infra-${i}`,
    category: "infra" as const,
    label: c.item,
    amount: c.estimate,
    recurring: true,
    date: now,
  }));
  return [
    ...infra,
    {
      id: "exp-tools",
      category: "tools" as const,
      label: "Outils SaaS (Notion, Figma…)",
      amount: 49,
      recurring: true,
      date: now,
    },
  ];
}
