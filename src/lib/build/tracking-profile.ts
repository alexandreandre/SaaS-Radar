import { getActiveBuildToolId, type UserProject } from "@/lib/portfolio";
import {
  getBuildTool,
  type BuildTool,
  type BuildToolId,
} from "@/lib/build/tools";

export type BuildTrackingGithubMode = "required" | "optional" | "hidden";
export type BuildTrackingHostMode = "vercel" | "url-only";

export type BuildTrackingProfile = {
  github: BuildTrackingGithubMode;
  host: BuildTrackingHostMode;
  urlPlaceholder: string;
  hostTitle: string;
  hostHint: string;
};

const TRACKING_PROFILES: Record<BuildToolId, BuildTrackingProfile> = {
  base44: {
    github: "hidden",
    host: "url-only",
    urlPlaceholder: "https://votre-app.base44.app",
    hostTitle: "URL de production Base44",
    hostHint:
      "Collez l'URL affichée après Publish dans Base44 (sous-domaine ou domaine personnalisé).",
  },
  lovable: {
    github: "optional",
    host: "url-only",
    urlPlaceholder: "https://votre-app.lovable.app",
    hostTitle: "URL de production Lovable",
    hostHint:
      "Collez l'URL affichée après Publish dans Lovable — pas besoin de GitHub ni Vercel.",
  },
  bolt: {
    github: "required",
    host: "vercel",
    urlPlaceholder: "https://votre-app.vercel.app",
    hostTitle: "Hébergement & déploiement",
    hostHint: "Connectez Vercel ou collez l'URL de production une fois en ligne.",
  },
  v0: {
    github: "optional",
    host: "vercel",
    urlPlaceholder: "https://votre-app.vercel.app",
    hostTitle: "Hébergement & déploiement",
    hostHint:
      "Après Deploy dans v0, connectez Vercel ou collez l'URL de production.",
  },
  replit: {
    github: "optional",
    host: "url-only",
    urlPlaceholder: "https://votre-app.replit.app",
    hostTitle: "URL de production Replit",
    hostHint:
      "Collez l'URL affichée après Deploy dans Replit (onglet Deployments).",
  },
  cursor: {
    github: "required",
    host: "vercel",
    urlPlaceholder: "https://votre-app.vercel.app",
    hostTitle: "Hébergement & déploiement",
    hostHint: "Connectez Vercel ou collez l'URL de production une fois en ligne.",
  },
  "claude-code": {
    github: "required",
    host: "vercel",
    urlPlaceholder: "https://votre-app.vercel.app",
    hostTitle: "Hébergement & déploiement",
    hostHint: "Connectez Vercel ou collez l'URL de production une fois en ligne.",
  },
  windsurf: {
    github: "required",
    host: "vercel",
    urlPlaceholder: "https://votre-app.vercel.app",
    hostTitle: "Hébergement & déploiement",
    hostHint: "Connectez Vercel ou collez l'URL de production une fois en ligne.",
  },
};

export function getBuildTrackingProfile(tool: BuildTool): BuildTrackingProfile {
  return TRACKING_PROFILES[tool.id];
}

export function getBuildTrackingProfileForProject(
  project: UserProject,
): BuildTrackingProfile | undefined {
  const toolId = getActiveBuildToolId(project);
  if (!toolId) return undefined;
  const tool = getBuildTool(toolId);
  if (!tool) return undefined;
  return getBuildTrackingProfile(tool);
}

export function getBuildTrackingTeaserMessage(profile: BuildTrackingProfile): string {
  if (profile.github === "required" && profile.host === "vercel") {
    return "Disponible après avoir généré votre kit. Vous pourrez connecter GitHub et Vercel pour suivre votre app.";
  }
  if (profile.host === "url-only" && profile.github === "hidden") {
    return "Disponible après avoir généré votre kit. Vous pourrez indiquer l'URL de production de votre app.";
  }
  if (profile.host === "url-only" && profile.github === "optional") {
    return "Disponible après avoir généré votre kit. Indiquez l'URL de production — GitHub reste optionnel pour suivre le code.";
  }
  if (profile.host === "vercel" && profile.github === "optional") {
    return "Disponible après avoir généré votre kit. Connectez Vercel pour suivre le déploiement — GitHub reste optionnel.";
  }
  return "Disponible après avoir généré votre kit de démarrage.";
}
