import type { ConnectorId } from "@/lib/connectors";
import type { AdCampaign, Expense, Integration, MetricsSnapshot } from "@/lib/connectors/types";
import type { CampaignKit } from "@/lib/campaign/kits";
import type { CampaignSmartGoal, CampaignWeeklyCheckIn } from "@/lib/campaign/kits";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { CampaignToolId, MarketingProfile } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { BuildToolId } from "@/lib/build/tools";
import type { BuildPromptLanguage } from "@/lib/build/prompt-language";
import type {
  AddProjectInput,
  BuildDevLevel,
  BuildSetup,
  GitHubConnection,
  HostConnection,
  ProductLogo,
  ProjectPhase,
  ResetBuildOptions,
  ResetCampaignOptions,
  UserProject,
  getPortfolioStats,
} from "@/lib/portfolio";
import type { Opportunity, OpportunityListItem } from "@/types/opportunity";

export type ConnectIntegrationOptions = {
  mode?: "demo" | "real";
  secretKey?: string;
  currency?: string;
  customerId?: string;
  accountId?: string;
  adAccountId?: string;
  apiKey?: string;
  siteId?: string;
  signupGoalDisplayName?: string | null;
  personalApiKey?: string;
  appHost?: string;
  posthogProjectId?: string;
  mixpanelServiceAccountUsername?: string;
  mixpanelServiceAccountSecret?: string;
  mixpanelProjectId?: string;
  mixpanelRegion?: string;
  mixpanelWorkspaceId?: string | null;
  activityEvent?: string | null;
  signupEvent?: string | null;
  signupEventName?: string | null;
  activationEvent?: string | null;
  gaPropertyId?: string;
  propertyDisplayName?: string;
  trialEvent?: string | null;
  loopsApiKey?: string;
  loopsWebhookSigningSecret?: string;
  loopsConversionListId?: string | null;
  loopsConversionListName?: string | null;
  loopsConversionMode?: "mailing_list" | "email_clicked";
  brevoApiKey?: string;
  brevoConversionMode?: "campaign_clicks" | "list_addition";
  brevoConversionListId?: string | null;
  brevoConversionListName?: string | null;
  brevoWebhookToken?: string;
  resendApiKey?: string;
  resendWebhookSigningSecret?: string;
  resendConversionSegmentId?: string | null;
  resendConversionSegmentName?: string | null;
  resendConversionMode?: "segment" | "email_clicked";
  crispWebsiteId?: string;
  vercelProjectId?: string;
  betterStackApiToken?: string;
  betterStackMonitorId?: string;
  betterStackMonitorName?: string | null;
  betterStackMonitorUrl?: string | null;
  betterStackTeamName?: string | null;
  sentryProjectId?: string;
  sentryProjectSlug?: string;
  sentryProjectName?: string;
  channelId?: string;
  channelName?: string;
  storeId?: string;
  storeName?: string;
  productId?: string;
  productTitle?: string;
  apiToken?: string;
  sandbox?: boolean;
  testMode?: boolean;
  repoFullName?: string;
  linkedToolId?: BuildToolId;
  setPrimary?: boolean;
};

/** Contrat public du contexte portfolio (découplé du monolithe provider). */
export type PortfolioContextValue = {
  projects: UserProject[];
  hydrated: boolean;
  addProject: (slug: string, input: AddProjectInput) => UserProject | null;
  registerProject: (project: UserProject) => void;
  removeProject: (id: string) => void;
  updateProject: (id: string, patch: Partial<UserProject>) => void;
  setProjectPhase: (id: string, phase: ProjectPhase) => void;
  recordMrr: (id: string, amount: number, note?: string) => void;
  toggleMilestone: (id: string, milestoneId: string) => void;
  toggleLaunchChecklistItem: (id: string, itemIndex: number) => void;
  setBuildSetupForProject: (id: string, setup: BuildSetup) => void;
  switchBuildTool: (id: string, toolId: BuildToolId) => void;
  setBuildDevLevel: (id: string, level: BuildDevLevel) => void;
  setBuildPromptLanguage: (id: string, language: BuildPromptLanguage) => void;
  setProductName: (id: string, name: string) => void;
  setProductLogo: (id: string, logo: ProductLogo | undefined) => void;
  restoreBuildVersion: (id: string, savedAt: string) => void;
  resetBuild: (id: string, opts?: ResetBuildOptions) => void;
  setCampaignKitForProject: (id: string, kit: CampaignKit) => void;
  switchCampaignTool: (id: string, toolId: CampaignToolId) => void;
  addCampaignTool: (id: string, toolId: CampaignToolId) => void;
  removeCampaignTool: (id: string, toolId: CampaignToolId) => void;
  setMarketingProfile: (id: string, profile: MarketingProfile) => void;
  setStrategyBriefForProject: (
    id: string,
    brief: string,
    channel: ExtendedChannelKey,
    profile: MarketingProfile,
  ) => void;
  setCampaignChannel: (id: string, channel: ExtendedChannelKey) => void;
  setAcquisitionStage: (id: string, stage: AcquisitionStage, override?: boolean) => void;
  setCampaignSmartGoal: (id: string, goal: CampaignSmartGoal) => void;
  setCampaignIcp: (id: string, icpSummary: string) => void;
  setCampaignPositioning: (id: string, positioning: string) => void;
  applyCampaignFullPlan: (
    id: string,
    data: {
      smartGoal: CampaignSmartGoal;
      icpSummary: string;
      positioning: string;
      strategyBrief: string;
      actionItems?: import("@/lib/campaign/stages").CampaignActionItem[];
      activeSequenceId?: string;
    },
  ) => void;
  toggleCampaignSequenceStep: (id: string, stepId: string) => void;
  setCampaignGtmMotion: (id: string, motion: import("@/lib/campaign/gtm-engine").GtmMotion) => void;
  setCampaignIcpStructured: (
    id: string,
    icp: import("@/lib/campaign/kits").CampaignIcpStructured,
    icpSummary?: string,
  ) => void;
  setCampaignAttributionQuestion: (id: string, enabled: boolean) => void;
  toggleCampaignInfraGate: (id: string, gateId: import("@/lib/campaign/infra-gates").InfraGateId) => void;
  toggleCampaignAssetChecklist: (id: string, index: number) => void;
  addMessageMarketFitNote: (id: string, note: string) => void;
  toggleCampaignAction: (id: string, actionId: string) => void;
  setCampaignTrackingPlan: (
    id: string,
    plan: NonNullable<UserProject["campaignSetup"]>["trackingPlan"],
  ) => void;
  addCampaignWeeklyCheckIn: (id: string, checkIn: CampaignWeeklyCheckIn) => void;
  completeCampaignRetrospective: (
    id: string,
    data: { worked: string; blocked: string; nextChange: string },
  ) => void;
  startNewCampaignCycle: (id: string) => void;
  acknowledgeCampaignDistribution: (id: string) => void;
  acknowledgeCampaignMeasure: (id: string) => void;
  restoreCampaignVersion: (id: string, savedAt: string) => void;
  resetCampaign: (id: string, opts?: ResetCampaignOptions) => void;
  setGitHubConnection: (id: string, connection: GitHubConnection | undefined) => void;
  setHostConnection: (id: string, connection: HostConnection | undefined) => void;
  getProjectBySlug: (slug: string) => UserProject | undefined;
  getProjectById: (id: string) => UserProject | undefined;
  catalogIndex: OpportunityListItem[];
  opportunityCatalog: Opportunity[];
  getCatalogOpportunity: (slug: string) => Opportunity | undefined;
  ensureCatalogOpportunity: (slug: string) => Promise<Opportunity | null>;
  activeProject: UserProject | null;
  overdueCheckIns: number;
  stats: ReturnType<typeof getPortfolioStats>;
  connectIntegration: (
    projectId: string,
    connectorId: ConnectorId,
    options?: ConnectIntegrationOptions,
  ) => Promise<void>;
  disconnectIntegration: (projectId: string, connectorId: ConnectorId) => Promise<void>;
  syncIntegration: (projectId: string, connectorId: ConnectorId) => Promise<void>;
  syncProjectIntegrations: (
    projectId: string,
    opts?: { force?: boolean },
  ) => Promise<void>;
  autoSyncingProjectId: string | null;
  autoSyncingConnectors: ConnectorId[];
  removeGitHubRepo: (projectId: string, repoFullName: string) => Promise<void>;
  patchIntegration: (
    projectId: string,
    connectorId: ConnectorId,
    patch: Partial<Integration>,
  ) => void;
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
