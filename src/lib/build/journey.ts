import type { DevStream } from "@/lib/connectors/streams";
import {
  getActiveBuildKit,
  getActiveBuildToolId,
  getSavedBuildToolIds,
  type UserProject,
} from "@/lib/portfolio";
import { getBuildTool, type BuildToolLevel } from "@/lib/build/tools";
import { getBuildTrackingProfile } from "@/lib/build/tracking-profile";
import type { BuilderStage } from "@/lib/portfolio";

export type BuildJourneyStep = 1 | 2 | 3;

export const JOURNEY_STEPS: { step: BuildJourneyStep; label: string }[] = [
  { step: 1, label: "Choix de l'outil" },
  { step: 2, label: "Build" },
  { step: 3, label: "En ligne" },
];

export type BuildJourneyDisplayPhase = "onboarding" | "building" | "deploy" | "live";

export type BuildJourneyState = {
  currentStep: BuildJourneyStep;
  displayPhase: BuildJourneyDisplayPhase;
  /** Afficher titre + détail coach dans le stepper (étapes 1–2, micro-ligne à l'étape 3). */
  showCoachCopy: boolean;
  actionTitle: string;
  actionDetail: string;
  secondaryDetail?: string;
  trackingUnlocked: boolean;
};

function resolveDisplayPhase(
  currentStep: BuildJourneyStep,
  online: boolean,
): BuildJourneyDisplayPhase {
  if (online) return "live";
  if (currentStep === 1) return "onboarding";
  if (currentStep === 2) return "building";
  return "deploy";
}

export function inferDevLevelFromBuilderStage(stage?: BuilderStage): BuildToolLevel {
  if (stage === "has_mrr") return "intermediate";
  if (stage === "building") return "intermediate";
  return "nocode";
}

export function resolveDevLevel(project: UserProject): BuildToolLevel | undefined {
  if (project.buildDevLevel) return project.buildDevLevel;
  const activeId = getActiveBuildToolId(project);
  if (activeId) {
    const tool = getBuildTool(activeId);
    if (tool) return tool.level;
  }
  return undefined;
}

function isOnline(project: UserProject): boolean {
  if (project.hostConnection?.productionUrl) return true;

  const activeToolId = getActiveBuildToolId(project);
  if (!activeToolId) return false;

  const tool = getBuildTool(activeToolId);
  if (!tool) return false;

  const profile = getBuildTrackingProfile(tool);
  if (profile.github === "required" && project.githubConnection?.repoFullName) {
    return true;
  }

  return false;
}

function getStep4ActionDetail(tool: ReturnType<typeof getBuildTool>): string {
  if (!tool) {
    return "Suivez le guide de déploiement, puis indiquez votre URL de production.";
  }

  const profile = getBuildTrackingProfile(tool);

  if (profile.github === "required" && profile.host === "vercel") {
    return `GitHub puis Vercel — depuis leurs interfaces web, avec l'aide de ${tool.name} si besoin.`;
  }

  if (profile.host === "url-only") {
    return `Publiez sur ${tool.name} (${tool.publishLabel}), puis collez votre URL de production dans le suivi.`;
  }

  if (profile.host === "vercel" && profile.github === "optional") {
    return `Déployez depuis ${tool.name}, connectez Vercel dans le suivi, ou collez l'URL de production.`;
  }

  return "Suivez le guide de déploiement, puis indiquez votre URL de production.";
}

export function getBuildJourneyState(project: UserProject): BuildJourneyState {
  const activeToolId = getActiveBuildToolId(project);
  const activeKit = getActiveBuildKit(project);
  const hasLevel = Boolean(resolveDevLevel(project));
  const hasTool = Boolean(activeToolId);
  const hasKit = Boolean(activeKit?.mvpPrompt);
  const online = isOnline(project);

  let currentStep: BuildJourneyStep = 1;
  if (!hasTool) currentStep = 1;
  else if (!hasKit) currentStep = 2;
  else currentStep = 3;

  const tool = activeToolId ? getBuildTool(activeToolId) : undefined;

  const otherKitIds = getSavedBuildToolIds(project).filter((id) => id !== activeToolId);
  const secondaryDetail =
    otherKitIds.length > 0
      ? `Vous avez aussi un kit sur ${otherKitIds
          .map((id) => getBuildTool(id)?.name ?? id)
          .join(", ")} — changez d'outil via les chips ci-dessous.`
      : undefined;

  let actionTitle = "Choisissez votre outil";
  let actionDetail = hasLevel
    ? "Sélectionnez l'outil avec lequel vous allez construire votre produit."
    : "Indiquez votre niveau, puis choisissez l'outil adapté à votre projet.";

  if (currentStep === 2) {
    actionTitle = "Générez votre kit de démarrage";
    actionDetail = tool
      ? `Un prompt et un guide prêts à coller dans ${tool.name}.`
      : "Générez un prompt et un guide adaptés à votre opportunité.";
  } else if (currentStep === 3 && !online) {
    actionTitle = "Mettez votre app en ligne";
    actionDetail = getStep4ActionDetail(tool);
  } else if (online) {
    actionTitle = "Votre app est suivie";
    actionDetail =
      "Concentrez-vous sur les retours utilisateurs et les prochaines fonctionnalités.";
  }

  const displayPhase = resolveDisplayPhase(currentStep, online);
  const showCoachCopy = displayPhase === "onboarding" || displayPhase === "building";

  return {
    currentStep,
    displayPhase,
    showCoachCopy,
    actionTitle,
    actionDetail,
    secondaryDetail,
    trackingUnlocked: Boolean(hasKit),
  };
}

export function shouldShowBuildTracking(project: UserProject): boolean {
  return getBuildJourneyState(project).trackingUnlocked;
}

export function shouldShowGitHubAlerts(
  project: UserProject,
  stream?: DevStream,
): boolean {
  if (!shouldShowBuildTracking(project)) return false;
  return Boolean(project.githubConnection || stream);
}
