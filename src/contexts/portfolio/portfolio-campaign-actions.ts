import type { CampaignKit, CampaignSmartGoal, CampaignWeeklyCheckIn } from "@/lib/campaign/kits";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { CampaignToolId, MarketingProfile } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import {
  setCampaignKit,
  switchCampaignTool as applySwitchCampaignTool,
  addCampaignTool as applyAddCampaignTool,
  removeCampaignTool as applyRemoveCampaignTool,
  setMarketingProfile as applyMarketingProfile,
  setStrategyBrief as applyStrategyBrief,
  setCampaignChannel as applyCampaignChannel,
  setAcquisitionStage as applyAcquisitionStage,
  setCampaignSmartGoal as applyCampaignSmartGoal,
  setCampaignIcp as applyCampaignIcp,
  setCampaignPositioning as applyCampaignPositioning,
  toggleCampaignAction as applyToggleCampaignAction,
  setCampaignTrackingPlan as applyCampaignTrackingPlan,
  addCampaignWeeklyCheckIn as applyAddCampaignWeeklyCheckIn,
  completeCampaignRetrospective as applyCompleteCampaignRetrospective,
  startNewCampaignCycle as applyStartNewCampaignCycle,
  acknowledgeCampaignDistribution,
  acknowledgeCampaignMeasure,
  restoreCampaignKitSnapshot,
  resetCampaignSetup,
  type ResetCampaignOptions,
  type UserProject,
} from "@/lib/portfolio";
import type { PortfolioActionDeps } from "./portfolio-action-deps";

export function createCampaignActions(deps: PortfolioActionDeps) {
  const setCampaignKitForProject = (id: string, kit: CampaignKit) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return setCampaignKit(project, kit);
        }),
      );
    };

  const switchCampaignToolForProject = (id: string, toolId: CampaignToolId) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applySwitchCampaignTool(project, toolId);
        }),
      );
    };

  const addCampaignToolForProject = (id: string, toolId: CampaignToolId) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyAddCampaignTool(project, toolId);
        }),
      );
    };

  const removeCampaignToolForProject = (id: string, toolId: CampaignToolId) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyRemoveCampaignTool(project, toolId);
        }),
      );
    };

  const setMarketingProfileForProject = (id: string, profile: MarketingProfile) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyMarketingProfile(project, profile);
        }),
      );
    };

  const setStrategyBriefForProject = (
      id: string,
      brief: string,
      channel: ExtendedChannelKey,
      profile: MarketingProfile,
    ) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyStrategyBrief(project, brief, channel, profile);
        }),
      );
    };

  const setCampaignChannelForProject = (id: string, channel: ExtendedChannelKey) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyCampaignChannel(project, channel);
        }),
      );
    };

  const acknowledgeCampaignDistributionForProject = (id: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return acknowledgeCampaignDistribution(project);
        }),
      );
    };

  const acknowledgeCampaignMeasureForProject = (id: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return acknowledgeCampaignMeasure(project);
        }),
      );
    };

  const restoreCampaignVersion = (id: string, savedAt: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          const restored = restoreCampaignKitSnapshot(project, savedAt);
          return restored ?? project;
        }),
      );
    };

  const resetCampaignForProject = (id: string, opts?: ResetCampaignOptions) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return resetCampaignSetup(project, opts);
        }),
      );
    };

  const setAcquisitionStageForProject = (id: string, stage: AcquisitionStage, override = true) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyAcquisitionStage(project, stage, override);
        }),
      );
    };

  const setCampaignSmartGoalForProject = (id: string, goal: CampaignSmartGoal) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyCampaignSmartGoal(project, goal);
        }),
      );
    };

  const setCampaignIcpForProject = (id: string, icpSummary: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyCampaignIcp(project, icpSummary);
        }),
      );
    };

  const setCampaignPositioningForProject = (id: string, positioning: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyCampaignPositioning(project, positioning);
        }),
      );
    };

  const toggleCampaignActionForProject = (id: string, actionId: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyToggleCampaignAction(project, actionId);
        }),
      );
    };

  const setCampaignTrackingPlanForProject = (
      id: string,
      plan: NonNullable<UserProject["campaignSetup"]>["trackingPlan"],
    ) => {
      if (!plan) return;
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyCampaignTrackingPlan(project, plan);
        }),
      );
    };

  const addCampaignWeeklyCheckInForProject = (id: string, checkIn: CampaignWeeklyCheckIn) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyAddCampaignWeeklyCheckIn(project, checkIn);
        }),
      );
    };

  const completeCampaignRetrospectiveForProject = (
      id: string,
      data: { worked: string; blocked: string; nextChange: string },
    ) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyCompleteCampaignRetrospective(project, data);
        }),
      );
    };

  const startNewCampaignCycleForProject = (id: string) => {
      deps.commit((prev) =>
        prev.map((project) => {
          if (project.id !== id) return project;
          return applyStartNewCampaignCycle(project);
        }),
      );
    };
  return {
    setCampaignKitForProject,
    switchCampaignTool: switchCampaignToolForProject,
    addCampaignTool: addCampaignToolForProject,
    removeCampaignTool: removeCampaignToolForProject,
    setMarketingProfile: setMarketingProfileForProject,
    setStrategyBriefForProject,
    setCampaignChannel: setCampaignChannelForProject,
    setAcquisitionStage: setAcquisitionStageForProject,
    setCampaignSmartGoal: setCampaignSmartGoalForProject,
    setCampaignIcp: setCampaignIcpForProject,
    setCampaignPositioning: setCampaignPositioningForProject,
    toggleCampaignAction: toggleCampaignActionForProject,
    setCampaignTrackingPlan: setCampaignTrackingPlanForProject,
    addCampaignWeeklyCheckIn: addCampaignWeeklyCheckInForProject,
    completeCampaignRetrospective: completeCampaignRetrospectiveForProject,
    startNewCampaignCycle: startNewCampaignCycleForProject,
    acknowledgeCampaignDistribution: acknowledgeCampaignDistributionForProject,
    acknowledgeCampaignMeasure: acknowledgeCampaignMeasureForProject,
    restoreCampaignVersion,
    resetCampaign: resetCampaignForProject,
  };
}
