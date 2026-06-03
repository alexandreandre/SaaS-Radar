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

export interface Scores {
  opportunity: number;
  franceFit: number;
  buildability: number;
  margin: number;
  competitionGap: number;
}

export interface FranceFitCriteria {
  problemExists: boolean;
  regulation: string;
  competitors: string;
  cultureFit: string;
}

export interface TractionSignal {
  label: string;
  value: string;
  source: string;
  sourceUrl?: string;
}

export interface TractionHighlight {
  label: string;
  value: string;
  source: string;
  sourceUrl?: string;
}

export type WhyItWorksItem =
  | string
  | {
      fact: string;
      detail?: string;
      source?: string;
      sourceUrl?: string;
    };

export function getWhyItWorksFact(item: WhyItWorksItem): string {
  return typeof item === "string" ? item : item.fact;
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

export interface MvpPlan {
  features: string[];
  notYet: string[];
  stack: string[];
  roadmap: { day: string; tasks: string[] }[];
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
  acquisition: AcquisitionTab[];
  entrepreneursBuilding: number;
  foreignInspiration: string;
  url?: string;
  foreignMarketProfile?: ForeignMarketProfile;
  createdAt: string;
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
