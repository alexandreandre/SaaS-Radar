#!/usr/bin/env node
/**
 * Extrait les useCallback du portfolio-context vers des factories sans hooks.
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SRC = path.join(ROOT, "src/contexts/portfolio-context.tsx");
const OUT = path.join(ROOT, "src/contexts/portfolio");

const allLines = fs.readFileSync(SRC, "utf8").split("\n");

/** @param {number} start @param {number} end 1-based inclusive */
function sliceLines(start, end) {
  return allLines.slice(start - 1, end);
}

/** @param {string[]} lines */
function extractUseCallbacks(lines) {
  /** @type {{ name: string; inner: string }[]} */
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const m = lines[i].match(/^  const (\w+) = useCallback\($/);
    if (!m) {
      i++;
      continue;
    }
    const name = m[1];
    i++;
    const inner = [];
    while (i < lines.length) {
      if (
        lines[i].match(/^    \},$/) &&
        lines[i + 1]?.match(/^    \[[^\]]+\],?$/) &&
        lines[i + 2] === "  );"
      ) {
        break;
      }
      inner.push(lines[i]);
      i++;
    }
    out.push({ name, inner: inner.join("\n") });
    i += 3;
  }
  return out;
}

/** @param {{ name: string; inner: string }[]} fns */
function renderFunctions(fns) {
  return fns
    .map(({ name, inner }) => {
      let body = inner
        .replace(/\bprojects\.find\(/g, "deps.getProjects().find(")
        .replace(/\bcommit\(/g, "deps.commit(")
        .replace(/\bgetCatalogOpportunity\(/g, "deps.getCatalogOpportunity(")
        .replace(/\bupdateProject\(/g, "deps.updateProject(")
        .replace(/\bsetAutoSyncState\(/g, "deps.setAutoSyncState(");
      return `  const ${name} = ${body.trim()}\n    };`;
    })
    .join("\n\n");
}

function writeFile(name, header, fns, exports) {
  const content = `${header}
export function ${name}(deps: PortfolioActionDeps) {
${renderFunctions(fns)}
  return {
${exports.map((e) => `    ${e},`).join("\n")}
  };
}
`;
  fs.writeFileSync(path.join(OUT, `portfolio-${name.replace("create", "").replace("Actions", "").toLowerCase()}-actions.ts`), content);
}

// --- Project ---
const projectFns = [
  ...extractUseCallbacks(sliceLines(468, 650)),
  ...extractUseCallbacks(sliceLines(1040, 1058)),
];
writeFile(
  "createProjectActions",
  `import {
  createProjectFromOpportunity,
  migrateProject,
  computeNextStreak,
  monthFromDate,
  isOnboardingComplete,
  toggleLaunchChecklistItem as applyLaunchChecklistToggle,
  type AddProjectInput,
  type ProjectPhase,
  type MetricsSnapshot,
  type UserProject,
} from "@/lib/portfolio";
import type { PortfolioActionDeps } from "./portfolio-action-deps";`,
  projectFns,
  [
    "addProject",
    "registerProject",
    "removeProject",
    "updateProject",
    "setProjectPhase",
    "recordMrr",
    "toggleMilestone",
    "toggleLaunchChecklistItem",
    "completeOnboarding",
    "markLaunchRoomSeen",
  ],
);

// --- Build ---
const buildFns = extractUseCallbacks(sliceLines(651, 756));
fs.writeFileSync(
  path.join(OUT, "portfolio-build-actions.ts"),
  `import {
  resetBuildSetup,
  restoreBuildSetupSnapshot,
  setBuildSetup,
  switchBuildTool,
  setBuildDevLevel as applyBuildDevLevel,
  setBuildPromptLanguage as applyBuildPromptLanguage,
  type BuildDevLevel,
  type BuildSetup,
  type ProductLogo,
  type ResetBuildOptions,
  type UserProject,
} from "@/lib/portfolio";
import type { BuildToolId } from "@/lib/build/tools";
import type { BuildPromptLanguage } from "@/lib/build/prompt-language";
import type { PortfolioActionDeps } from "./portfolio-action-deps";

export function createBuildActions(deps: PortfolioActionDeps) {
${renderFunctions(buildFns)}
  return {
    setBuildSetupForProject,
    switchBuildTool: switchBuildToolForProject,
    setBuildDevLevel,
    setBuildPromptLanguage,
    setProductName,
    setProductLogo,
    restoreBuildVersion,
    resetBuild: resetBuildForProject,
  };
}
`,
);

// --- Campaign ---
const campaignFns = extractUseCallbacks(sliceLines(787, 1038));
fs.writeFileSync(
  path.join(OUT, "portfolio-campaign-actions.ts"),
  `import type { CampaignKit, CampaignSmartGoal, CampaignWeeklyCheckIn } from "@/lib/campaign/kits";
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
} from "@/lib/portfolio";
import type { PortfolioActionDeps } from "./portfolio-action-deps";

export function createCampaignActions(deps: PortfolioActionDeps) {
${renderFunctions(campaignFns)}
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
`,
);

// --- Connectors (github/host + integration handlers) ---
const connectorFns = [
  ...extractUseCallbacks(sliceLines(758, 785)),
  ...extractUseCallbacks(sliceLines(1060, 4730)),
];
fs.writeFileSync(
  path.join(OUT, "portfolio-connector-actions.ts"),
  `import {
  removeConnectorStream,
  stripConnectorMetrics,
  syncConnectorAllDemo,
  getConnector,
  type ConnectorId,
} from "@/lib/connectors";
import { getConnectorConnectionProfile } from "@/lib/connectors/connection-profile";
import {
  applyConnectorSyncToProject,
  applyGitHubSyncToProject,
  patchIntegrationMeta,
  removeGitHubRepoFromProject,
  setIntegrationError,
  type ConnectorSyncApiResponse,
} from "@/lib/connectors/integration-client";
import { listAutoSyncableConnectorIds } from "@/lib/connectors/auto-sync";
import type { Integration } from "@/lib/connectors/types";
import {
  syncProjectPhaseFromBuild,
  type GitHubConnection,
  type HostConnection,
  type UserProject,
} from "@/lib/portfolio";
import { queueProjectSync } from "@/lib/portfolio-sync-client";
import type { ConnectIntegrationOptions } from "./portfolio-types";
import type { PortfolioActionDeps } from "./portfolio-action-deps";

export function createConnectorActions(deps: PortfolioActionDeps) {
${renderFunctions(connectorFns)}
  return {
    setGitHubConnection,
    setHostConnection,
    connectIntegration,
    disconnectIntegration,
    syncIntegration,
    syncProjectIntegrations,
    removeGitHubRepo,
    patchIntegration,
  };
}
`,
);

// --- Finance ---
const financeFns = extractUseCallbacks(sliceLines(4732, 4877));
fs.writeFileSync(
  path.join(OUT, "portfolio-finance-actions.ts"),
  `import type { AdCampaign, Expense, MetricsSnapshot } from "@/lib/connectors/types";
import type { PortfolioActionDeps } from "./portfolio-action-deps";

export function createFinanceActions(deps: PortfolioActionDeps) {
${renderFunctions(financeFns)}
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
`,
);

console.log("Split OK");
