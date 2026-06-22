export type Sector =
  | "healthcare"
  | "construction"
  | "hr"
  | "finance"
  | "legal"
  | "retail"
  | "education"
  | "hospitality";

export type ClientType = "b2b" | "b2c";
export type TechComplexity = "low" | "medium" | "high";
export type FranceCompetition = "none" | "low" | "medium" | "high";

export type SubScoreRationales = {
  franceFit: string;
  buildability: string;
  margin: string;
  competitionGap: string;
};

/** Métadonnées de scoring — admin / persistance, jamais affichées sur la fiche publique. */
export type ScoreMeta = {
  geminiWeighted: number;
  factsScore: number;
  opportunity: number;
  adjustments: string[];
  rawSubScores?: {
    franceFit: number;
    buildability: number;
    margin: number;
    competitionGap: number;
  };
  subScoreRationales?: SubScoreRationales;
};

export interface Scores {
  opportunity: number;
  franceFit: number;
  buildability: number;
  margin: number;
  competitionGap: number;
  /** Décomposition hybride et corrections — optionnel, absent sur fiches legacy. */
  _meta?: ScoreMeta;
}

export interface FranceFitCriteria {
  problemExists: boolean;
  regulation: string;
  competitors: string;
  cultureFit: string;
}

export type TractionSignalKind = "metric" | "narrative";

export interface TractionSignal {
  label: string;
  value: string;
  source: string;
  sourceUrl?: string;
  kind?: TractionSignalKind;
}

export interface TractionHighlight {
  label: string;
  value: string;
  source: string;
  sourceUrl?: string;
  kind?: TractionSignalKind;
}

export type WhyItWorksItem =
  | string
  | {
      fact: string;
      detail?: string;
      source?: string;
      sourceUrl?: string;
    };

export type WhyItWorksStructured = {
  fact: string;
  detail?: string;
  source?: string;
  sourceUrl?: string;
};

export function getWhyItWorksFact(item: WhyItWorksItem): string {
  return typeof item === "string" ? item : item.fact;
}

/** Convertit les items legacy (string) en objets structurés exploitables par le front. */
export function normalizeWhyItWorksItem(item: WhyItWorksItem): WhyItWorksStructured {
  if (typeof item === "string") {
    return { fact: item.trim() };
  }

  const normalized: WhyItWorksStructured = { fact: item.fact.trim() };
  if (item.detail?.trim()) normalized.detail = item.detail.trim();
  if (item.source?.trim()) normalized.source = item.source.trim();
  if (item.sourceUrl?.trim()) normalized.sourceUrl = item.sourceUrl.trim();
  return normalized;
}

export function normalizeWhyItWorks(items: WhyItWorksItem[]): WhyItWorksStructured[] {
  return items.map(normalizeWhyItWorksItem);
}

export interface FinancialScenario {
  name: "Prudent" | "Réaliste" | "Optimiste";
  clients: number;
  avgPrice: number;
  mrr: number;
  grossMargin: number;
}

export interface CacChannel {
  channel: string;
  estimate: number;
  note: string;
}

export interface RoadmapStep {
  day: string;
  tasks: string[];
  week?: 1 | 2 | 3 | 4;
  objective?: string;
  buildPrompt?: string;
  checkpoint?: string;
  estimateHours?: number;
}

export interface StackGuideEntry {
  tool: string;
  role: string;
  why: string;
  setup: string;
  freeTier?: string;
  alternative?: string;
}

export interface BuildFeaturePrompt {
  feature: string;
  prompt: string;
}

export interface BuildPrompts {
  scaffold: string;
  features: BuildFeaturePrompt[];
}

export interface MvpPlan {
  features: string[];
  notYet: string[];
  stack: string[];
  roadmap: RoadmapStep[];
  stackGuide?: StackGuideEntry[];
  pitfalls?: string[];
  launchChecklist?: string[];
}

export interface AcquisitionTab {
  id: string;
  title: string;
  tactics: string[];
}

export interface InfraCost {
  item: string;
  estimate: number;
  note: string;
  alternative?: string;
}

export interface FrenchCompetitor {
  name: string;
  positioning: string;
  pricing: string;
  strength: string;
  weakness: string;
}

export interface LaunchWeek {
  week: 1 | 2 | 3 | 4;
  goal: string;
  actions: string[];
  kpi: string;
}

export interface EmailTemplate {
  name: string;
  subject: string;
  body: string;
}

export interface PartnerLead {
  name: string;
  type: string;
  angle: string;
}

export interface RoiInput {
  id: string;
  label: string;
  defaultValue: number;
  min: number;
  max: number;
  unit: string;
}

export interface TamBreakdown {
  tam: string;
  sam: string;
  som: string;
  note: string;
}

export interface CompetitionAlert {
  date: string;
  title: string;
  impact: "low" | "medium" | "high";
}

/** Description du SaaS tel qu'il existe sur le marché d'origine */
export interface ForeignMarketProfile {
  productName: string;
  country: string;
  flag: string;
  tagline: string;
  problemSolved: string;
  targetUsers: string;
  businessModel: string;
  pricing: string;
  keyFeatures: string[];
  howItWorks: string;
  whyItWorksThere: string[];
  tractionHighlights: TractionHighlight[];
  franceAdaptation?: string[];
}

/** Projection catalogue liste — champs nécessaires aux cartes et au filtrage client. */
export type OpportunityListItem = Pick<
  Opportunity,
  | "id"
  | "slug"
  | "name"
  | "pitch"
  | "originCountry"
  | "originCountryCode"
  | "originFlag"
  | "sector"
  | "targetClient"
  | "clientType"
  | "techComplexity"
  | "franceCompetition"
  | "revenueMin"
  | "revenueMax"
  | "buildableUnder30Days"
  | "weeklyPick"
  | "publishedAt"
  | "createdAt"
  | "scores"
>;

export interface Opportunity {
  id: string;
  slug: string;
  name: string;
  pitch: string;
  originCountry: string;
  originCountryCode: string;
  originFlag: string;
  sector: Sector;
  targetClient: string;
  clientType: ClientType;
  techComplexity: TechComplexity;
  franceCompetition: FranceCompetition;
  revenueMin: number;
  revenueMax: number;
  buildableUnder30Days: boolean;
  boringBusiness: boolean;
  aiPowered: boolean;
  lowCompetition: boolean;
  scores: Scores;
  franceFitCriteria: FranceFitCriteria;
  tractionSignals: TractionSignal[];
  whyItWorks: WhyItWorksItem[];
  franceAnalysis: string[];
  financialScenarios: FinancialScenario[];
  cacChannels: CacChannel[];
  mvpPlan: MvpPlan;
  claudePrompt: string;
  buildPrompts?: BuildPrompts;
  acquisition: AcquisitionTab[];
  entrepreneursBuilding: number;
  foreignInspiration: string;
  url?: string;
  foreignMarketProfile?: ForeignMarketProfile;
  createdAt: string;
  publishedAt?: string;
  sourceVerified?: boolean;
  weeklyPick?: boolean;
  infraCosts?: InfraCost[];
  frenchCompetitors?: FrenchCompetitor[];
  launchTimeline?: LaunchWeek[];
  emailTemplates?: EmailTemplate[];
  partnersFR?: PartnerLead[];
  roiInputs?: RoiInput[];
  tamBreakdown?: TamBreakdown;
  competitionAlerts?: CompetitionAlert[];
}
