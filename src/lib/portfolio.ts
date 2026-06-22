import type {
  AdCampaign,
  ConnectorId,
  Expense,
  Integration,
  MetricsSnapshot,
} from "@/lib/connectors/types";
import type { ConnectorStreams } from "@/lib/connectors/streams";
import { removeConnectorStream } from "@/lib/connectors/streams";
import { normalizeProjectGitHub } from "@/lib/connectors/github/normalize";
import type { BuildToolId } from "@/lib/build/tools";
import { getBuildTool } from "@/lib/build/tools";
import {
  remapBuildToolId,
  replaceLegacyToolNamesInText,
} from "@/lib/build/tool-constants";
import type { BuildPromptLanguage } from "@/lib/build/prompt-language";
import { getBuildJourneyState } from "@/lib/build/journey";
import type {
  AcquisitionStage,
  CampaignActionItem,
  CampaignIcpStructured,
  CampaignKit,
  CampaignKitSnapshot,
  CampaignRetrospective,
  CampaignSetup,
  CampaignSmartGoal,
  CampaignTrackingPlan,
  CampaignWeeklyCheckIn,
} from "@/lib/campaign/kits";
import {
  getActiveCampaignKit,
  getActiveCampaignToolId,
  normalizeCampaignSetup,
} from "@/lib/campaign/kits";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import type { InfraGateId } from "@/lib/campaign/infra-gates";
import { resolveSequenceId } from "@/lib/campaign/sequences";
import { profileFromStage } from "@/lib/campaign/stages";
import type { CampaignToolId, MarketingProfile } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { buildWorkflowForStack } from "@/lib/campaign/workflows";
import { buildActionItemsForStage } from "@/lib/campaign/actions";
import {
  buildContentDeriveContext,
  deriveAllContentAssets,
  resolveContentAssets,
} from "@/lib/campaign/content-derive";
import {
  CONTENT_ASSET_SCHEMAS,
  fieldsFromValues,
  getRequiredContentAssetIds,
  isContentAssetConfirmed,
} from "@/lib/campaign/content-schemas";
import type { FinancialScenario, Opportunity } from "@/types/opportunity";
import type { ProjectIdeaBrief } from "@/types/idea-brief";

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

export type GitHubTrackedRepo = {
  repoFullName: string;
  installationId: number;
  connectedAt: string;
  linkedToolId?: BuildToolId;
  isPrimary?: boolean;
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

export type ResetCampaignOptions = {
  keepTools?: boolean;
  keepHistory?: boolean;
  keepStrategy?: boolean;
  clearAllKits?: boolean;
};

export type ProjectSource = "catalog" | "idea" | "github";

export type UserProject = {
  id: string;
  opportunitySlug: string;
  projectSource?: ProjectSource;
  ideaBrief?: ProjectIdeaBrief;
  ideaSeed?: string;
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
  /** @deprecated Migré vers githubTrackedRepos */
  githubConnection?: GitHubConnection;
  githubTrackedRepos?: GitHubTrackedRepo[];
  hostConnection?: HostConnection;
  campaignSetup?: CampaignSetup;
  campaignSetupHistory?: CampaignKitSnapshot[];
  activeCampaignToolIds?: CampaignToolId[];
  marketingProfile?: MarketingProfile;
  campaignSeenAt?: string;
};

export type { ConnectorId, ConnectorStreams };

export type AddProjectInput = {
  startedAt: string;
  currentMrr: number;
  targetScenario: TargetScenario;
  builderStage?: BuilderStage;
  productName?: string;
};

export type CreateIdeaProjectInput = {
  ideaBrief: ProjectIdeaBrief;
  ideaSeed: string;
  summary?: string;
  productName?: string;
};

export type CreateGitHubProjectInput = {
  productName?: string;
};

export function resolveProductName(project: UserProject, opportunity?: Opportunity): string {
  return (
    project.productName?.trim() ||
    project.ideaBrief?.identity.name ||
    opportunity?.name ||
    "Mon SaaS"
  );
}

export function hasCustomProductName(project: UserProject): boolean {
  return Boolean(project.productName?.trim());
}

export const PORTFOLIO_STORAGE_KEY = "saas-radar:portfolio";
export const PENDING_PROJECT_STORAGE_KEY = "saas-radar:pending-project";
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

function buildIdeaMilestones(brief: ProjectIdeaBrief): Milestone[] {
  const launch: Milestone[] = brief.mvpPlan.roadmap.map((step, index) => ({
    id: `build-step-${index}`,
    label: `${step.day} — ${step.objective ?? step.tasks[0] ?? `Étape ${index + 1}`}`,
    done: false,
    source: "launch" as const,
  }));

  const revenue: Milestone[] = REVENUE_MILESTONES.map((m) => ({
    ...m,
    done: false,
  }));

  return [...launch, ...revenue];
}

export function createProjectFromIdea(input: CreateIdeaProjectInput): UserProject {
  const now = new Date().toISOString();
  const { ideaBrief, ideaSeed, summary, productName } = input;
  const resolvedName = productName?.trim() || ideaBrief.identity.name;

  return {
    id: generateProjectId(),
    opportunitySlug: "",
    projectSource: "idea",
    ideaBrief: {
      ...ideaBrief,
      identity: {
        ...ideaBrief.identity,
        name: resolvedName,
      },
    },
    ideaSeed: summary?.trim() || ideaSeed.trim(),
    productName: resolvedName,
    startedAt: now.slice(0, 10),
    phase: "build",
    currentMrr: 0,
    mrrHistory: [],
    targetScenario: "Réaliste",
    milestones: buildIdeaMilestones(ideaBrief),
    checkInStreak: 0,
    createdAt: now,
    builderStage: "starting",
    onboardingCompleted: true,
    onboardingCompletedAt: now,
  };
}

export function createProjectFromGitHub(input: CreateGitHubProjectInput = {}): UserProject {
  const now = new Date().toISOString();
  const productName = input.productName?.trim() || "Mon SaaS";

  return {
    id: generateProjectId(),
    opportunitySlug: "",
    projectSource: "github",
    productName,
    startedAt: now.slice(0, 10),
    phase: "build",
    currentMrr: 0,
    mrrHistory: [],
    targetScenario: "Réaliste",
    milestones: REVENUE_MILESTONES.map((m) => ({ ...m, done: false })),
    checkInStreak: 0,
    createdAt: now,
    builderStage: "building",
    onboardingCompleted: true,
    onboardingCompletedAt: now,
  };
}

export function isIdeaBasedProject(project: UserProject): boolean {
  return project.projectSource === "idea" || Boolean(project.ideaBrief);
}

export function usesIdeaPlaybookModule(project: UserProject): boolean {
  return (
    project.projectSource === "idea" ||
    project.projectSource === "github" ||
    Boolean(project.ideaBrief)
  );
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
    projectSource: "catalog",
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
  if (launchAction) {
    const interviewMatch = launchAction[1].match(/^(\d+)\s+entretiens?\b/i);
    if (interviewMatch) {
      const duration = launchAction[1].match(/\((\d+\s*min)\)/i)?.[1];
      return duration
        ? `${interviewMatch[1]} entretiens terrain (${duration})`
        : `${interviewMatch[1]} entretiens terrain`;
    }
    const trimmed = launchAction[1].trim();
    if (trimmed.length <= 72) return trimmed;
    return `${trimmed.slice(0, 69).trim()}…`;
  }
  if (/MRR.*mois/i.test(raw)) return "Mettre à jour le MRR du mois";
  if (/30\s*%/.test(raw)) return "Tester un canal d'acquisition";
  if (/80\s*%/.test(raw)) return "Passer en phase Revenu";
  if (raw.length > 72) return `${raw.slice(0, 69).trim()}…`;
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
    campaignSetupHistory: project.campaignSetupHistory ?? [],
    activeCampaignToolIds: project.activeCampaignToolIds ?? [],
  };
  return clearOAuthAdsDemos(
    normalizeProjectGitHub(
      normalizeBuildKits(remapLegacyBuildTools(normalizeCampaignSetup(base))),
    ),
  );
}

function remapBuildKitContent(kit: BuildSetup): BuildSetup {
  const toolId = remapBuildToolId(kit.toolId) ?? kit.toolId;
  return {
    ...kit,
    toolId,
    mvpPrompt: replaceLegacyToolNamesInText(kit.mvpPrompt),
    setupRecipe: replaceLegacyToolNamesInText(kit.setupRecipe),
    quickStart: kit.quickStart
      ? replaceLegacyToolNamesInText(kit.quickStart)
      : undefined,
  };
}

function remapLegacyBuildTools(project: UserProject): UserProject {
  const kits = project.buildKitsByTool ?? {};
  const remappedKits: BuildKitsByTool = {};

  for (const [key, kit] of Object.entries(kits)) {
    if (!kit) continue;
    const newId = (remapBuildToolId(key) ?? key) as BuildToolId;
    const remappedKit = remapBuildKitContent(kit);
    const existing = remappedKits[newId];
    if (
      !existing ||
      remappedKit.generatedAt.localeCompare(existing.generatedAt) >= 0
    ) {
      remappedKits[newId] = remappedKit;
    }
  }

  let next: UserProject = { ...project, buildKitsByTool: remappedKits };

  if (next.activeBuildToolId) {
    const remapped = remapBuildToolId(next.activeBuildToolId);
    if (remapped) next = { ...next, activeBuildToolId: remapped };
  }

  if (next.buildSetup) {
    next = { ...next, buildSetup: remapBuildKitContent(next.buildSetup) };
  }

  if (next.buildSetupHistory?.length) {
    next = {
      ...next,
      buildSetupHistory: next.buildSetupHistory.map((snapshot) => ({
        ...remapBuildKitContent(snapshot),
        savedAt: snapshot.savedAt,
        label: snapshot.label
          ? (remapBuildToolId(snapshot.label) ??
            replaceLegacyToolNamesInText(snapshot.label))
          : snapshot.label,
      })),
    };
  }

  if (next.githubTrackedRepos?.length) {
    next = {
      ...next,
      githubTrackedRepos: next.githubTrackedRepos.map((repo) => ({
        ...repo,
        linkedToolId: repo.linkedToolId
          ? remapBuildToolId(repo.linkedToolId)
          : undefined,
      })),
    };
  }

  return next;
}

function clearConnectorDemo(project: UserProject, connectorId: ConnectorId): UserProject {
  const hasDemo = (project.integrations ?? []).some(
    (i) => i.connectorId === connectorId && i.status === "demo",
  );
  if (!hasDemo) return project;

  return {
    ...project,
    integrations: (project.integrations ?? []).map((i) =>
      i.connectorId === connectorId && i.status === "demo"
        ? {
            ...i,
            status: "disconnected" as const,
            connectedAt: undefined,
            lastSyncAt: undefined,
            accountLabel: undefined,
            lastError: undefined,
            tokenExpiresAt: undefined,
          }
        : i,
    ),
    connectorStreams: removeConnectorStream(project.connectorStreams ?? {}, connectorId),
    metricsHistory: (project.metricsHistory ?? []).map((snap) => {
      if (snap.source !== connectorId) return snap;
      return {
        ...snap,
        source: undefined,
        adSpend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
      };
    }),
  };
}

function clearOAuthAdsDemos(project: UserProject): UserProject {
  return clearConnectorDemo(
    clearConnectorDemo(clearConnectorDemo(project, "google-ads"), "meta-ads"),
    "tiktok-ads",
  );
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

const MAX_CAMPAIGN_HISTORY = 10;

export { getActiveCampaignKit, getActiveCampaignToolId } from "@/lib/campaign/kits";
export {
  normalizeCampaignSetup,
  getSavedCampaignToolIds,
  getCampaignToolIdsInOrder,
} from "@/lib/campaign/kits";

export function setMarketingProfile(
  project: UserProject,
  profile: MarketingProfile,
): UserProject {
  const setup = project.campaignSetup;
  return normalizeCampaignSetup({
    ...project,
    marketingProfile: profile,
    campaignSetup: setup
      ? { ...setup, profile, marketingProfile: profile }
      : undefined,
  });
}

export function setStrategyBrief(
  project: UserProject,
  brief: string,
  channel: ExtendedChannelKey,
  profile: MarketingProfile,
): UserProject {
  const existing = normalizeCampaignSetup(project).campaignSetup;
  const stage = existing?.acquisitionStage ?? "network";
  const toolIds =
    existing?.activeToolIds?.length
      ? existing.activeToolIds
      : buildWorkflowForStack(channel, []).map((n) => n.toolId);

  const setup: CampaignSetup = {
    ...(existing ?? {
      acquisitionStage: stage,
      primaryChannel: channel,
      activeToolIds: [],
      workflow: [],
      kitsByTool: {},
      actionItems: [],
      weeklyCheckIns: [],
      cycleStatus: "draft" as const,
    }),
    profile,
    primaryChannel: channel,
    activeToolIds: toolIds,
    workflow: buildWorkflowForStack(channel, toolIds),
    strategyBrief: brief,
    cycleStatus: existing?.cycleStatus === "draft" ? "active" : (existing?.cycleStatus ?? "active"),
    generatedAt: existing?.generatedAt ?? new Date().toISOString(),
  };

  return normalizeCampaignSetup({
    ...project,
    marketingProfile: profile,
    campaignSetup: setup,
    activeCampaignToolIds: toolIds,
  });
}

export function setCampaignChannel(
  project: UserProject,
  channel: ExtendedChannelKey,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const toolIds = setup.activeToolIds.length > 0 ? setup.activeToolIds : buildWorkflowForStack(channel, []).map((n) => n.toolId);
  const actionItems = buildActionItemsForStage(setup.acquisitionStage, channel);
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      primaryChannel: channel,
      workflow: buildWorkflowForStack(channel, toolIds),
      actionItems,
    },
  });
}

export function pushCampaignKitSnapshot(project: UserProject): UserProject {
  const kit = getActiveCampaignKit(project);
  if (!kit) return project;
  const snapshot: CampaignKitSnapshot = {
    ...kit,
    savedAt: new Date().toISOString(),
    label: kit.toolId,
  };
  const history = [snapshot, ...(project.campaignSetupHistory ?? [])].slice(
    0,
    MAX_CAMPAIGN_HISTORY,
  );
  return { ...project, campaignSetupHistory: history };
}

export function setCampaignKit(project: UserProject, kit: CampaignKit): UserProject {
  const toolId = kit.toolId;
  const activeId = getActiveCampaignToolId(project);
  const activeKit = getActiveCampaignKit(project);
  const setup = project.campaignSetup;

  let next = project;
  if (activeKit?.primaryPrompt && activeId === toolId) {
    next = pushCampaignKitSnapshot(next);
  }

  const kits = { ...(setup?.kitsByTool ?? {}) };
  if (activeKit && activeId && activeId !== toolId) {
    kits[activeId] = activeKit;
  }
  kits[toolId] = kit;

  const activeToolIds = setup?.activeToolIds?.includes(toolId)
    ? setup.activeToolIds
    : [...(setup?.activeToolIds ?? []), toolId];

  const channel = setup?.primaryChannel ?? kit.channelKey;
  const profile = setup?.profile ?? kit.profile;

  const stage = setup?.acquisitionStage ?? "network";
  const campaignSetup: CampaignSetup = {
    acquisitionStage: stage,
    stageOverride: setup?.stageOverride,
    smartGoal: setup?.smartGoal,
    icpSummary: setup?.icpSummary,
    positioning: setup?.positioning,
    profile,
    primaryChannel: channel,
    activeToolIds,
    workflow: buildWorkflowForStack(channel, activeToolIds),
    strategyBrief: setup?.strategyBrief,
    kitsByTool: kits,
    actionItems: setup?.actionItems ?? [],
    trackingPlan: setup?.trackingPlan,
    weeklyCheckIns: setup?.weeklyCheckIns ?? [],
    retrospective: setup?.retrospective,
    cycleStartedAt: setup?.cycleStartedAt,
    cycleStatus: setup?.cycleStatus ?? "active",
    generatedAt: new Date().toISOString(),
    distributionAcknowledgedAt: setup?.distributionAcknowledgedAt,
    measureAcknowledgedAt: setup?.measureAcknowledgedAt,
  };

  return normalizeCampaignSetup({
    ...next,
    campaignSetup,
    activeCampaignToolIds: activeToolIds,
    marketingProfile: profile,
  });
}

export function switchCampaignTool(
  project: UserProject,
  toolId: CampaignToolId,
): UserProject {
  const setup = project.campaignSetup;
  if (!setup) {
    return normalizeCampaignSetup({
      ...project,
      activeCampaignToolIds: [toolId],
    });
  }

  const kits = { ...setup.kitsByTool };
  const activeId = getActiveCampaignToolId(project);
  const activeKit = getActiveCampaignKit(project);
  if (activeKit && activeId) {
    kits[activeId] = activeKit;
  }

  const activeToolIds = [
    ...setup.activeToolIds.filter((id) => id !== toolId),
    toolId,
  ];

  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      kitsByTool: kits,
      activeToolIds,
      workflow: buildWorkflowForStack(setup.primaryChannel, activeToolIds),
    },
    activeCampaignToolIds: activeToolIds,
  });
}

export function addCampaignTool(
  project: UserProject,
  toolId: CampaignToolId,
): UserProject {
  const setup = project.campaignSetup;
  if (!setup) return switchCampaignTool(project, toolId);
  if (setup.activeToolIds.includes(toolId)) return switchCampaignTool(project, toolId);
  const activeToolIds = [...setup.activeToolIds, toolId];
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      activeToolIds,
      workflow: buildWorkflowForStack(setup.primaryChannel, activeToolIds),
    },
    activeCampaignToolIds: activeToolIds,
  });
}

export function removeCampaignTool(
  project: UserProject,
  toolId: CampaignToolId,
): UserProject {
  const setup = project.campaignSetup;
  if (!setup) return project;

  const activeToolIds = setup.activeToolIds.filter((id) => id !== toolId);
  const kits = { ...setup.kitsByTool };
  delete kits[toolId];

  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      activeToolIds,
      kitsByTool: kits,
      workflow: buildWorkflowForStack(setup.primaryChannel, activeToolIds),
    },
    activeCampaignToolIds: activeToolIds,
  });
}

export function acknowledgeCampaignDistribution(project: UserProject): UserProject {
  const setup = project.campaignSetup;
  if (!setup) return project;
  return {
    ...project,
    campaignSetup: {
      ...setup,
      distributionAcknowledgedAt: new Date().toISOString(),
    },
  };
}

export function acknowledgeCampaignMeasure(project: UserProject): UserProject {
  const setup = project.campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      measureAcknowledgedAt: new Date().toISOString(),
      trackingPlan: {
        utmBase: setup.trackingPlan?.utmBase ?? "",
        requiredConnectors: setup.trackingPlan?.requiredConnectors ?? [],
        configuredAt: new Date().toISOString(),
      },
    },
  });
}

export function setAcquisitionStage(
  project: UserProject,
  stage: AcquisitionStage,
  override = true,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const profile = profileFromStage(stage);
  const actionItems = buildActionItemsForStage(stage, setup.primaryChannel);
  return normalizeCampaignSetup({
    ...project,
    marketingProfile: profile,
    campaignSetup: {
      ...setup,
      acquisitionStage: stage,
      stageOverride: override,
      profile,
      actionItems,
    },
  });
}

export function setCampaignSmartGoal(
  project: UserProject,
  smartGoal: CampaignSmartGoal,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, smartGoal, cycleStatus: "active" },
  });
}

export function setCampaignIcp(project: UserProject, icpSummary: string): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, icpSummary },
  });
}

export function setCampaignPositioning(
  project: UserProject,
  positioning: string,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, positioning },
  });
}

export type ConfirmFoundationsRiverStop =
  | "start"
  | "audience"
  | "goal"
  | "message"
  | "dock";

export type ConfirmFoundationsRiverPayload =
  | { stop: "start" }
  | {
      stop: "audience";
      who: string;
      pain: string;
      icpSummary: string;
    }
  | {
      stop: "goal";
      smartGoal: CampaignSmartGoal;
      channel: ExtendedChannelKey;
      goalStrategyId: import("@/lib/campaign/foundations-river").RiverGoalStrategyId;
      supportChannels: ExtendedChannelKey[];
      stage: AcquisitionStage;
      motion: import("@/lib/campaign/gtm-engine").GtmMotion;
      profile: import("@/lib/campaign/tools").MarketingProfile;
    }
  | {
      stop: "message";
      positioning: string;
      messageAdaptations: import("@/lib/campaign/foundations-river").RiverMessageAdaptation[];
    }
  | { stop: "dock" };

export function confirmFoundationsRiverStop(
  project: UserProject,
  payload: ConfirmFoundationsRiverPayload,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const now = new Date().toISOString();
  const river = { ...(setup.foundationsRiver ?? {}) };

  if (payload.stop === "start") {
    return normalizeCampaignSetup({
      ...project,
      campaignSetup: {
        ...setup,
        foundationsRiver: { ...river, startedAt: now },
      },
    });
  }

  if (payload.stop === "audience") {
    let next = setCampaignIcp(project, payload.icpSummary.trim());
    next = setCampaignIcpStructured(
      next,
      { segment: payload.who.trim(), pain: payload.pain.trim() },
      payload.icpSummary.trim(),
    );
    const nextSetup = normalizeCampaignSetup(next).campaignSetup!;
    return normalizeCampaignSetup({
      ...next,
      campaignSetup: {
        ...nextSetup,
        foundationsRiver: { ...river, ...nextSetup.foundationsRiver, audienceConfirmedAt: now },
      },
    });
  }

  if (payload.stop === "goal") {
    let next = setCampaignSmartGoal(project, payload.smartGoal);
    next = setCampaignChannel(next, payload.channel);
    next = setAcquisitionStage(next, payload.stage, false);
    next = setCampaignGtmMotion(next, payload.motion);
    next = setMarketingProfile(next, payload.profile);
    const nextSetup = normalizeCampaignSetup(next).campaignSetup!;
    return normalizeCampaignSetup({
      ...next,
      campaignSetup: {
        ...nextSetup,
        foundationsRiver: {
          ...river,
          ...nextSetup.foundationsRiver,
          goalConfirmedAt: now,
          goalStrategyId: payload.goalStrategyId,
          supportChannelKeys: payload.supportChannels,
        },
      },
    });
  }

  if (payload.stop === "message") {
    let next = setCampaignPositioning(project, payload.positioning.trim());
    const nextSetup = normalizeCampaignSetup(next).campaignSetup!;
    return normalizeCampaignSetup({
      ...next,
      campaignSetup: {
        ...nextSetup,
        foundationsRiver: {
          ...river,
          ...nextSetup.foundationsRiver,
          messageConfirmedAt: now,
          messageAdaptations: payload.messageAdaptations,
        },
      },
    });
  }

  if (payload.stop === "dock") {
    return normalizeCampaignSetup({
      ...project,
      campaignSetup: {
        ...setup,
        foundationsRiver: { ...river, completedAt: now },
        cycleStatus: setup.cycleStatus === "draft" ? "active" : setup.cycleStatus,
      },
    });
  }

  return project;
}

export type SetCampaignContentAssetPayload = {
  assetId: string;
  fields: Record<string, string>;
  confirmed?: boolean;
};

export function startCampaignContentStudio(
  project: UserProject,
  opportunity: Opportunity,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const now = new Date().toISOString();
  const ctx = buildContentDeriveContext(project, opportunity);
  const hasAssets = setup.contentAssets && Object.keys(setup.contentAssets).length > 0;
  const contentAssets = hasAssets ? setup.contentAssets : deriveAllContentAssets(ctx);
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      contentAssets,
      contentStudio: {
        ...setup.contentStudio,
        startedAt: setup.contentStudio?.startedAt ?? now,
      },
    },
  });
}

export function setCampaignContentAsset(
  project: UserProject,
  opportunity: Opportunity,
  payload: SetCampaignContentAssetPayload,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;

  const now = new Date().toISOString();
  const ctx = buildContentDeriveContext(project, opportunity);
  const resolved = resolveContentAssets(setup, ctx);
  const existing = resolved[payload.assetId];
  if (!existing) return project;

  const schema = CONTENT_ASSET_SCHEMAS[payload.assetId];
  const fields = schema
    ? fieldsFromValues(schema, payload.fields)
    : existing.fields.map((f) => ({
        ...f,
        value: payload.fields[f.key]?.trim() ?? f.value,
      }));

  const updated = {
    ...existing,
    fields,
    source: "edited" as const,
    updatedAt: now,
    confirmedAt: payload.confirmed ? now : existing.confirmedAt,
  };

  const contentAssets = {
    ...(setup.contentAssets ?? deriveAllContentAssets(ctx)),
    [payload.assetId]: updated,
  };

  const requiredIds = getRequiredContentAssetIds(ctx.primaryChannel, ctx.supportChannels);
  const allConfirmed = requiredIds.every((id) => {
    const asset = id === payload.assetId ? updated : contentAssets[id];
    return asset ? isContentAssetConfirmed(asset) : false;
  });

  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      contentAssets,
      contentStudio: {
        ...setup.contentStudio,
        startedAt: setup.contentStudio?.startedAt ?? now,
        lastEditedAssetId: payload.assetId,
        completedAt: allConfirmed ? now : setup.contentStudio?.completedAt,
      },
    },
  });
}

export function setCampaignActionItems(
  project: UserProject,
  actionItems: CampaignActionItem[],
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, actionItems },
  });
}

export function applyCampaignFullPlan(
  project: UserProject,
  data: {
    smartGoal: CampaignSmartGoal;
    icpSummary: string;
    positioning: string;
    strategyBrief: string;
    actionItems?: CampaignActionItem[];
    activeSequenceId?: string;
  },
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      smartGoal: data.smartGoal,
      icpSummary: data.icpSummary,
      positioning: data.positioning,
      strategyBrief: data.strategyBrief,
      actionItems: data.actionItems ?? setup.actionItems,
      activeSequenceId: data.activeSequenceId ?? setup.activeSequenceId,
      cycleStatus: "active",
      generatedAt: new Date().toISOString(),
    },
  });
}

export function confirmCampaignSequenceStep(
  project: UserProject,
  stepId: string,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const progress = { ...(setup.sequenceProgress ?? {}) };
  progress[stepId] = { done: true, doneAt: new Date().toISOString() };
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, sequenceProgress: progress },
  });
}

export function confirmDistributionGuideStep(
  project: UserProject,
  stepIndex: number,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const progress = { ...(setup.distributionProgress ?? {}) };
  progress[`dist-${stepIndex}`] = { done: true, doneAt: new Date().toISOString() };
  const allDone = Object.values(progress).every((p) => p.done);
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      distributionProgress: progress,
      distributionAcknowledgedAt: allDone ? new Date().toISOString() : setup.distributionAcknowledgedAt,
    },
  });
}

export function toggleCampaignSequenceStep(
  project: UserProject,
  stepId: string,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const progress = { ...(setup.sequenceProgress ?? {}) };
  const current = progress[stepId];
  progress[stepId] = {
    done: !current?.done,
    doneAt: !current?.done ? new Date().toISOString() : undefined,
  };
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, sequenceProgress: progress },
  });
}

export function setCampaignGtmMotion(
  project: UserProject,
  motion: GtmMotion,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const sequenceId = resolveSequenceId(setup.acquisitionStage, setup.primaryChannel, motion);
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, gtmMotion: motion, activeSequenceId: sequenceId },
  });
}

export function setCampaignIcpStructured(
  project: UserProject,
  icp: CampaignIcpStructured,
  icpSummary?: string,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      icpStructured: icp,
      icpSummary: icpSummary ?? setup.icpSummary,
    },
  });
}

export function setCampaignAttributionQuestion(
  project: UserProject,
  enabled: boolean,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const infraGates = { ...(setup.infraGates ?? {}), tracking_or_attribution: enabled };
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      attributionQuestionEnabled: enabled,
      infraGates,
    },
  });
}

export function toggleCampaignInfraGate(
  project: UserProject,
  gateId: InfraGateId,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const infraGates = { ...(setup.infraGates ?? {}) };
  infraGates[gateId] = !infraGates[gateId];
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, infraGates },
  });
}

export function toggleCampaignAssetChecklist(
  project: UserProject,
  index: number,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const list = [...(setup.assetChecklist ?? Array.from({ length: 8 }, () => false))];
  if (index >= 0 && index < list.length) {
    list[index] = !list[index];
  }
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, assetChecklist: list },
  });
}

export function addMessageMarketFitNote(project: UserProject, note: string): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup || !note.trim()) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      messageMarketFitNotes: [...(setup.messageMarketFitNotes ?? []), note.trim()],
    },
  });
}

export function toggleCampaignAction(
  project: UserProject,
  actionId: string,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  const now = new Date().toISOString();
  const actionItems = setup.actionItems.map((item) =>
    item.id === actionId
      ? {
          ...item,
          done: !item.done,
          doneAt: !item.done ? now : undefined,
        }
      : item,
  );
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, actionItems },
  });
}

export function setCampaignTrackingPlan(
  project: UserProject,
  trackingPlan: CampaignTrackingPlan,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: { ...setup, trackingPlan },
  });
}

export function addCampaignWeeklyCheckIn(
  project: UserProject,
  checkIn: CampaignWeeklyCheckIn,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      weeklyCheckIns: [...setup.weeklyCheckIns, checkIn],
    },
  });
}

export function completeCampaignRetrospective(
  project: UserProject,
  retrospective: Omit<CampaignRetrospective, "completedAt">,
): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;
  return normalizeCampaignSetup({
    ...project,
    campaignSetup: {
      ...setup,
      retrospective: {
        ...retrospective,
        completedAt: new Date().toISOString(),
      },
      cycleStatus: "completed",
    },
  });
}

export function startNewCampaignCycle(project: UserProject): UserProject {
  const setup = normalizeCampaignSetup(project).campaignSetup;
  if (!setup) return project;

  const snapshotKit = getActiveCampaignKit(project);
  let next = project;
  if (snapshotKit) {
    next = pushCampaignKitSnapshot(next);
  }

  return normalizeCampaignSetup({
    ...next,
    campaignSetup: {
      ...setup,
      strategyBrief: undefined,
      positioning: undefined,
      kitsByTool: {},
      activeToolIds: [],
      workflow: buildWorkflowForStack(setup.primaryChannel, []),
      actionItems: [],
      weeklyCheckIns: [],
      retrospective: undefined,
      cycleStartedAt: new Date().toISOString(),
      cycleStatus: "draft",
      distributionAcknowledgedAt: undefined,
      measureAcknowledgedAt: undefined,
      trackingPlan: setup.trackingPlan
        ? { ...setup.trackingPlan, configuredAt: undefined }
        : undefined,
    },
    activeCampaignToolIds: [],
  });
}

export function restoreCampaignKitSnapshot(
  project: UserProject,
  savedAt: string,
): UserProject | null {
  const snapshot = (project.campaignSetupHistory ?? []).find((s) => s.savedAt === savedAt);
  if (!snapshot) return null;
  const current = getActiveCampaignKit(project) ? pushCampaignKitSnapshot(project) : project;
  const kit = (() => {
    const { savedAt: _s, label, ...rest } = snapshot;
    void _s;
    void label;
    return rest;
  })();
  return setCampaignKit(
    {
      ...current,
      campaignSetupHistory: (current.campaignSetupHistory ?? []).filter(
        (h) => h.savedAt !== savedAt,
      ),
    },
    kit,
  );
}

export function resetCampaignSetup(
  project: UserProject,
  opts: ResetCampaignOptions = {},
): UserProject {
  const next: UserProject = { ...project };
  const clearAll = opts.clearAllKits ?? opts.keepTools === false;

  if (!opts.keepStrategy) {
    next.marketingProfile = undefined;
  }

  if (clearAll) {
    next.activeCampaignToolIds = [];
    if (!opts.keepStrategy) {
      next.campaignSetup = undefined;
    } else if (next.campaignSetup) {
      next.campaignSetup = {
        ...next.campaignSetup,
        activeToolIds: [],
        kitsByTool: {},
        workflow: buildWorkflowForStack(next.campaignSetup.primaryChannel, []),
      };
    }
  } else if (next.campaignSetup) {
    const activeId = getActiveCampaignToolId(project);
    const kits = { ...next.campaignSetup.kitsByTool };
    if (activeId) delete kits[activeId];
    next.campaignSetup = {
      ...next.campaignSetup,
      kitsByTool: kits,
      workflow: buildWorkflowForStack(
        next.campaignSetup.primaryChannel,
        next.campaignSetup.activeToolIds,
      ),
    };
  }

  if (!opts.keepHistory) {
    next.campaignSetupHistory = [];
  }
  return normalizeCampaignSetup(next);
}

export function syncProjectPhaseFromBuild(project: UserProject): UserProject {
  const buildState = getBuildJourneyState(project);
  if (buildState.displayPhase === "live" && project.phase === "build") {
    return { ...project, phase: "launch" };
  }
  return project;
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
  const qontoIntegration = project.integrations?.find(
    (i) => i.connectorId === "qonto" && i.status === "connected",
  );
  const qontoStream = project.connectorStreams?.qonto;
  if (qontoIntegration && qontoStream?.type === "finance") {
    return Math.max(0, qontoStream.monthlyOutflow - qontoStream.monthlyInflow);
  }

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
  const qontoIntegration = project.integrations?.find(
    (i) => i.connectorId === "qonto" && i.status === "connected",
  );
  const qontoStream = project.connectorStreams?.qonto;
  const cash =
    qontoIntegration && qontoStream?.type === "finance"
      ? qontoStream.cashBalance
      : (project.cashOnHand ?? 0);
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
