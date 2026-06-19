import type {
  AcquisitionTab,
  CacChannel,
  ClientType,
  FinancialScenario,
  FrenchCompetitor,
  FranceFitCriteria,
  MvpPlan,
  Scores,
  Sector,
  WhyItWorksStructured,
} from "@/types/opportunity";

export type IdeaClarityDimension = "cible" | "problème" | "monétisation" | "différenciation";

export type IdeaClarifyTurn = {
  question: string;
  answer: string;
};

export type IdeaDraft = {
  initialIdea: string;
  turns: IdeaClarifyTurn[];
  summary?: string;
};

export type ProjectIdeaBriefIdentity = {
  name: string;
  pitch: string;
  targetClient: string;
  clientType: ClientType;
  sector: Sector;
};

export type ProjectIdeaBriefProblem = {
  statement: string;
  whyNowFrance: string;
};

export type ProjectIdeaBriefBusinessModel = {
  pricing: string;
  tiers: string[];
  valueLogic: string;
};

export type ProjectIdeaBriefMarketFit = {
  regulation: string;
  cultureFit: string;
  tam: string;
  sam: string;
  som: string;
  analysis: string[];
};

export type ProjectIdeaBrief = {
  identity: ProjectIdeaBriefIdentity;
  problem: ProjectIdeaBriefProblem;
  businessModel: ProjectIdeaBriefBusinessModel;
  competition: {
    competitors: FrenchCompetitor[];
    positioningGap: string;
  };
  marketFit: ProjectIdeaBriefMarketFit;
  franceFitCriteria: FranceFitCriteria;
  whyItWorks: WhyItWorksStructured[];
  financials: FinancialScenario[];
  acquisition: AcquisitionTab[];
  cacChannels: CacChannel[];
  mvpPlan: MvpPlan;
  scores: Scores;
  generatedAt: string;
};

export const IDEA_DRAFT_STORAGE_KEY = "saas-radar:idea-draft";
export const START_HINT_SEEN_KEY = "saas-radar:start-hint-seen";
