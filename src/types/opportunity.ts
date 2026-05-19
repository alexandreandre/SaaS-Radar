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
  whyItWorks: string[];
  franceAnalysis: string[];
  financialScenarios: FinancialScenario[];
  cacChannels: CacChannel[];
  mvpPlan: MvpPlan;
  claudePrompt: string;
  acquisition: AcquisitionTab[];
  entrepreneursBuilding: number;
  foreignInspiration: string;
  createdAt: string;
  weeklyPick?: boolean;
}
