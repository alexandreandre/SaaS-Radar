import type {
  AdCampaign,
  ConnectorId,
  Expense,
  Integration,
  MetricsSnapshot,
} from "@/lib/connectors/types";
import type { ConnectorStreams } from "@/lib/connectors/streams";
import type { BuildToolId } from "@/lib/build/tools";
import { getBuildTool } from "@/lib/build/tools";
import type { BuildPromptLanguage } from "@/lib/build/prompt-language";
import type { FinancialScenario, Opportunity } from "@/types/opportunity";

export type { AdCampaign, Expense, Integration, MetricsSnapshot };

export type ProjectPhase = "build" | "launch" | "revenue" | "paused";
export type TargetScenario = FinancialScenario["name"];
export type BuilderStage = "starting" | "building" | "has_mrr";
export type BuildDevLevel = "nocode" | "intermediate" | "advanced";

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

export type BuildSetup = {
  toolId: string;
  mvpPrompt: string;
  setupRecipe: string;
  /** @deprecated Conservé pour les kits déjà sauvegardés — plus affiché ni généré */
  quickStart?: string;
  generatedAt: string;
  language?: BuildPromptLanguage;
  productName?: string;
  infraSummary?: string;
  expectedEnvVars?: Array<{ name: string; role: string; where: string }>;
  infraServices?: string[];
  infraSetupSteps?: string[];
};

export type BuildSetupSnapshot = BuildSetup & {
  savedAt: string;
  label?: string;
};

export type ProductLogo = {
  url: string;
  source: "github" | "host";
  detectedAt: string;
};

export type GitHubConnection = {
  repoFullName: string;
  installationId: number;
  connectedAt: string;
};

export type HostConnection = {
  provider: "vercel" | "netlify" | "custom";
  projectId?: string;
  projectName?: string;
  productionUrl?: string;
  connectedAt: string;
};

export type BuildKitsByTool = Partial<Record<BuildToolId, BuildSetup>>;

export type ResetBuildOptions = {
  keepRoadmap?: boolean;
  keepHistory?: boolean;
  keepTool?: boolean;
  /** Si true, efface tous les kits par outil. Sinon, seulement l'outil actif. */
  clearAllBuildKits?: boolean;
};

export type UserProject = {
  id: string;
  opportunitySlug: string;
  productName?: string;
  productLogo?: ProductLogo;
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
  builderStage?: BuilderStage;
  onboardingCompleted?: boolean;
  onboardingCompletedAt?: string;
  firstMilestoneAt?: string;
  launchRoomSeenAt?: string;
  launchChecklistDone?: number[];
  buildSetup?: BuildSetup;
  buildSetupHistory?: BuildSetupSnapshot[];
  buildKitsByTool?: BuildKitsByTool;
  activeBuildToolId?: BuildToolId;
  buildPromptLanguage?: BuildPromptLanguage;
  buildDevLevel?: BuildDevLevel;
  githubConnection?: GitHubConnection;
  hostConnection?: HostConnection;
};

export type { ConnectorId, ConnectorStreams };

export type AddProjectInput = {
  startedAt: string;
  currentMrr: number;
  targetScenario: TargetScenario;
  builderStage?: BuilderStage;
  productName?: string;
};

export function resolveProductName(project: UserProject, opportunity: Opportunity): string {
  return project.productName?.trim() || opportunity.name;
}

export function hasCustomProductName(project: UserProject): boolean {
  return Boolean(project.productName?.trim());
}

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
  const roadmap = opportunity.mvpPlan.roadmap;

  const launch: Milestone[] =
    roadmap.length > 0
      ? roadmap.map((step, index) => ({
          id: `build-step-${index}`,
          label: `${step.day} — ${step.objective ?? step.tasks[0] ?? `Étape ${index + 1}`}`,
          done: false,
          source: "launch" as const,
        }))
      : (opportunity.launchTimeline ?? []).flatMap((week) =>
          week.actions.map((action, index) => ({
            id: `launch-w${week.week}-${index}`,
            label: `S${week.week} — ${action}`,
            done: false,
            source: "launch" as const,
          })),
        );

  const revenue: Milestone[] = REVENUE_MILESTONES.map((m) => ({
    ...m,
    done: false,
  }));

  return [...launch, ...revenue];
}

/** Migre les jalons launch-w* vers build-step-* quand la roadmap est disponible. */
export function syncBuildMilestones(
  project: UserProject,
  opportunity: Opportunity,
): UserProject {
  const roadmap = opportunity.mvpPlan.roadmap;
  if (roadmap.length === 0) return project;

  const hasBuildSteps = project.milestones.some((m) => m.id.startsWith("build-step-"));
  if (hasBuildSteps) return project;

  const legacyLaunch = project.milestones.filter(
    (m) => m.source === "launch" && m.id.startsWith("launch-w"),
  );
  const revenue = project.milestones.filter((m) => m.source === "revenue");
  const other = project.milestones.filter(
    (m) => m.source !== "launch" && m.source !== "revenue",
  );

  const launch = roadmap.map((step, index) => {
    const legacyForWeek = legacyLaunch.filter((m) => {
      const weekMatch = m.id.match(/^launch-w(\d+)-/);
      if (!weekMatch) return false;
      const week = parseInt(weekMatch[1], 10);
      const stepWeek = step.week ?? Math.min(4, Math.floor((index / roadmap.length) * 4) + 1);
      return week === stepWeek;
    });
    const done = legacyForWeek.length > 0 && legacyForWeek.every((m) => m.done);
    const doneAt = legacyForWeek.find((m) => m.doneAt)?.doneAt;

    return {
      id: `build-step-${index}`,
      label: `${step.day} — ${step.objective ?? step.tasks[0] ?? `Étape ${index + 1}`}`,
      done,
      doneAt,
      source: "launch" as const,
    };
  });

  return {
    ...project,
    milestones: [...launch, ...revenue, ...other],
  };
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

  const productName = input.productName?.trim();

  return {
    id: generateProjectId(),
    opportunitySlug: opportunity.slug,
    ...(productName ? { productName } : {}),
    startedAt: input.startedAt,
    phase: opportunity.buildableUnder30Days ? "build" : "launch",
    currentMrr: input.currentMrr,
    mrrHistory: initialHistory,
    targetScenario: input.targetScenario,
    milestones: buildMilestonesFromOpportunity(opportunity),
    lastCheckInAt: input.currentMrr > 0 ? now : undefined,
    checkInStreak: input.currentMrr > 0 ? 1 : 0,
    createdAt: now,
    builderStage: input.builderStage ?? "starting",
    onboardingCompleted: false,
    campaigns: [],
    expenses: [],
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

export function getMilestoneCounts(project: UserProject): { done: number; total: number } {
  const total = project.milestones.length;
  const done = project.milestones.filter((m) => m.done).length;
  return { done, total };
}

export function getNextIncompleteMilestone(project: UserProject): Milestone | null {
  return project.milestones.find((m) => !m.done) ?? null;
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

export function buildScenarioCurve(
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
  projected: { month: number; mrr: number }[],
  history: MrrEntry[],
  startedAt: string
): { month: number; projected: number; reality: number | null }[] {
  const start = new Date(startedAt).getTime();

  return projected.map((point) => {
    const pointDate = new Date(start);
    pointDate.setMonth(pointDate.getMonth() + point.month);

    const entriesBeforePoint = history.filter(
      (entry) => new Date(entry.date).getTime() <= pointDate.getTime()
    );

    const latest = entriesBeforePoint.at(-1);
    return {
      month: point.month,
      projected: point.mrr,
      reality: latest ? latest.amount : point.month === 0 ? 0 : null,
    };
  });
}

export function getTargetGapPercent(
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

  return "Mettez à jour votre MRR ce mois-ci pour suivre votre progression face au plan de la fiche.";
}

export function getProjectCardActionSummary(
  project: UserProject,
  opportunity: Opportunity
): string {
  const raw = getNextActionMessage(project, opportunity);
  const launchAction = raw.match(/^Commencez par : (.+?) — /);
  if (launchAction) return launchAction[1].trim();
  if (raw.length > 140) return `${raw.slice(0, 137).trim()}…`;
  return raw;
}

export function getCurrentStepTitle(project: UserProject): string {
  const next = getNextIncompleteMilestone(project);
  if (next) return next.label;
  if (project.phase === "revenue") return "Croissance et conversion";
  if (project.phase === "launch") return "Lancement en cours";
  if (project.phase === "paused") return "Projet en pause";
  return "Journal complété";
}

export function migrateProject(project: UserProject): UserProject {
  const hasLegacyOnboardingFlag = "onboardingCompleted" in project;
  const base: UserProject = {
    ...project,
    metricsHistory: project.metricsHistory ?? [],
    campaigns: project.campaigns ?? [],
    expenses: project.expenses ?? [],
    integrations: project.integrations ?? [],
    connectorStreams: project.connectorStreams ?? {},
    cashOnHand: project.cashOnHand ?? 5000,
    builderStage: project.builderStage ?? "starting",
    onboardingCompleted: hasLegacyOnboardingFlag
      ? (project.onboardingCompleted ?? false)
      : true,
    launchChecklistDone: project.launchChecklistDone ?? [],
    buildSetupHistory: project.buildSetupHistory ?? [],
    buildKitsByTool: project.buildKitsByTool ?? {},
  };
  return normalizeBuildKits(base);
}

export function getActiveBuildToolId(project: UserProject): BuildToolId | undefined {
  if (project.activeBuildToolId) return project.activeBuildToolId;
  const fromSetup = project.buildSetup?.toolId;
  return fromSetup ? (fromSetup as BuildToolId) : undefined;
}

export function getActiveBuildKit(project: UserProject): BuildSetup | undefined {
  const toolId = getActiveBuildToolId(project);
  if (toolId && project.buildKitsByTool?.[toolId]) {
    return project.buildKitsByTool[toolId];
  }
  return project.buildSetup;
}

function getBuildKitGeneratedAt(
  project: UserProject,
  toolId: BuildToolId,
): string {
  const kits = project.buildKitsByTool ?? {};
  const activeId = getActiveBuildToolId(project);
  const kit = kits[toolId] ?? (toolId === activeId ? getActiveBuildKit(project) : undefined);
  return kit?.generatedAt ?? "";
}

function compareBuildToolIdsByGeneration(
  project: UserProject,
  a: BuildToolId,
  b: BuildToolId,
): number {
  const timeA = getBuildKitGeneratedAt(project, a);
  const timeB = getBuildKitGeneratedAt(project, b);
  if (!timeA && !timeB) return 0;
  if (!timeA) return 1;
  if (!timeB) return -1;
  return timeA.localeCompare(timeB);
}

export function getSavedBuildToolIds(project: UserProject): BuildToolId[] {
  const kits = project.buildKitsByTool ?? {};
  const ids = (Object.keys(kits) as BuildToolId[]).filter((id) =>
    Boolean(kits[id]?.mvpPrompt),
  );
  return ids.sort((a, b) => compareBuildToolIdsByGeneration(project, a, b));
}

/** Outils affichés dans le switcher, du premier généré au dernier. */
export function getBuildToolIdsInOrder(project: UserProject): BuildToolId[] {
  const activeId = getActiveBuildToolId(project);
  const ids = new Set<BuildToolId>(getSavedBuildToolIds(project));
  if (activeId) ids.add(activeId);
  return Array.from(ids).sort((a, b) =>
    compareBuildToolIdsByGeneration(project, a, b),
  );
}

function normalizeBuildKits(project: UserProject): UserProject {
  const kits: BuildKitsByTool = { ...(project.buildKitsByTool ?? {}) };

  if (project.buildSetup?.toolId) {
    const id = project.buildSetup.toolId as BuildToolId;
    if (!kits[id]) kits[id] = project.buildSetup;
  }

  const activeId =
    project.activeBuildToolId ??
    (project.buildSetup?.toolId as BuildToolId | undefined);

  if (!activeId) {
    return { ...project, buildKitsByTool: kits };
  }

  const activeKit = kits[activeId] ?? project.buildSetup;
  return {
    ...project,
    buildKitsByTool: kits,
    activeBuildToolId: activeId,
    buildSetup: activeKit,
  };
}

const MAX_BUILD_HISTORY = 10;

export function pushBuildSetupSnapshot(project: UserProject): UserProject {
  if (!project.buildSetup) return project;
  const snapshot: BuildSetupSnapshot = {
    ...project.buildSetup,
    savedAt: new Date().toISOString(),
    label: project.buildSetup.toolId,
  };
  const history = [snapshot, ...(project.buildSetupHistory ?? [])].slice(0, MAX_BUILD_HISTORY);
  return { ...project, buildSetupHistory: history };
}

export function setBuildSetup(project: UserProject, setup: BuildSetup): UserProject {
  const toolId = setup.toolId as BuildToolId;
  const activeId = getActiveBuildToolId(project);
  const activeKit = getActiveBuildKit(project);

  let next = project;
  if (activeKit?.mvpPrompt && activeId === toolId) {
    next = pushBuildSetupSnapshot(next);
  }

  const kits: BuildKitsByTool = { ...(next.buildKitsByTool ?? {}) };
  if (activeKit && activeId && activeId !== toolId) {
    kits[activeId] = activeKit;
  }

  kits[toolId] = setup;

  return normalizeBuildKits({
    ...next,
    buildKitsByTool: kits,
    activeBuildToolId: toolId,
    buildSetup: setup,
  });
}

export function switchBuildTool(project: UserProject, toolId: BuildToolId): UserProject {
  const kits: BuildKitsByTool = { ...(project.buildKitsByTool ?? {}) };
  const activeId = getActiveBuildToolId(project);
  const activeKit = getActiveBuildKit(project);

  if (activeKit && activeId) {
    kits[activeId] = activeKit;
  }

  const kit = kits[toolId];
  const tool = getBuildTool(toolId);
  return normalizeBuildKits({
    ...project,
    buildKitsByTool: kits,
    activeBuildToolId: toolId,
    buildSetup: kit,
    buildDevLevel: tool?.level ?? project.buildDevLevel,
  });
}

export function setBuildDevLevel(
  project: UserProject,
  level: BuildDevLevel,
): UserProject {
  return { ...project, buildDevLevel: level };
}

export function setBuildPromptLanguage(
  project: UserProject,
  language: BuildPromptLanguage,
): UserProject {
  return { ...project, buildPromptLanguage: language };
}

export function restoreBuildSetupSnapshot(
  project: UserProject,
  savedAt: string,
): UserProject | null {
  const snapshot = (project.buildSetupHistory ?? []).find((s) => s.savedAt === savedAt);
  if (!snapshot) return null;
  const current = project.buildSetup ? pushBuildSetupSnapshot(project) : project;
  const setup = (() => {
    const { savedAt, label, ...rest } = snapshot;
    void savedAt;
    void label;
    return rest;
  })();
  const toolId = setup.toolId as BuildToolId;
  const kits: BuildKitsByTool = { ...(current.buildKitsByTool ?? {}), [toolId]: setup };
  return normalizeBuildKits({
    ...current,
    buildSetup: setup,
    buildKitsByTool: kits,
    activeBuildToolId: toolId,
    buildSetupHistory: (current.buildSetupHistory ?? []).filter((h) => h.savedAt !== savedAt),
  });
}

export function resetBuildSetup(
  project: UserProject,
  opts: ResetBuildOptions = {},
): UserProject {
  const next: UserProject = { ...project };
  const clearAll = opts.clearAllBuildKits ?? false;

  if (!opts.keepTool) {
    if (clearAll) {
      next.buildSetup = undefined;
      next.buildKitsByTool = {};
      next.activeBuildToolId = undefined;
      next.buildDevLevel = undefined;
    } else {
      const activeId = getActiveBuildToolId(project);
      const kits: BuildKitsByTool = { ...(project.buildKitsByTool ?? {}) };

      if (activeId) {
        delete kits[activeId];
      }

      const remaining = (Object.keys(kits) as BuildToolId[]).filter((id) =>
        Boolean(kits[id]?.mvpPrompt),
      );

      if (remaining.length > 0) {
        const nextActive = remaining[0];
        next.activeBuildToolId = nextActive;
        next.buildSetup = kits[nextActive];
        next.buildKitsByTool = kits;
      } else {
        next.buildSetup = undefined;
        next.activeBuildToolId = undefined;
        next.buildDevLevel = undefined;
        next.buildKitsByTool = {};
      }
    }
  }

  if (!opts.keepHistory) {
    const activeId = getActiveBuildToolId(next);
    if (clearAll || !activeId) {
      next.buildSetupHistory = [];
    } else {
      next.buildSetupHistory = (next.buildSetupHistory ?? []).filter(
        (h) => h.toolId !== activeId,
      );
    }
  }
  if (!opts.keepRoadmap) {
    next.milestones = project.milestones.map((m) =>
      m.source === "launch" && m.id.startsWith("build-step-")
        ? { ...m, done: false, doneAt: undefined }
        : m,
    );
  }
  return next;
}

export function toggleLaunchChecklistItem(
  project: UserProject,
  itemIndex: number,
): UserProject {
  const current = project.launchChecklistDone ?? [];
  const has = current.includes(itemIndex);
  const launchChecklistDone = has
    ? current.filter((i) => i !== itemIndex)
    : [...current, itemIndex].sort((a, b) => a - b);
  return { ...project, launchChecklistDone };
}

export function isLaunchChecklistItemDone(project: UserProject, itemIndex: number): boolean {
  return (project.launchChecklistDone ?? []).includes(itemIndex);
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

export function computeStickiness(dau: number, mau: number): number | null {
  if (mau <= 0) return null;
  return Math.round((dau / mau) * 100);
}

export function getEngagementSeries(history: MetricsSnapshot[]) {
  return history.map((snap) => ({
    date: snap.date,
    signups: snap.signups,
    mau: snap.mau,
    dau: snap.dau,
    stickiness: computeStickiness(snap.dau, snap.mau) ?? 0,
  }));
}

export function getProductFunnel(
  snapshot: MetricsSnapshot,
  activationRate?: number
) {
  const stages: { stage: string; value: number }[] = [
    { stage: "Signups", value: snapshot.signups },
    { stage: "Trials", value: snapshot.trials },
  ];
  if (activationRate !== undefined && snapshot.signups > 0) {
    stages.push({
      stage: "Activés",
      value: Math.round((snapshot.signups * activationRate) / 100),
    });
  }
  stages.push({ stage: "Clients", value: snapshot.customers });
  return stages.filter((d) => d.value > 0);
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
