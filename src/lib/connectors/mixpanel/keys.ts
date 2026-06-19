import type { MixpanelCredential, MixpanelRegion } from "@/lib/connectors/mixpanel/types";

const MIN_SECRET_LENGTH = 8;

const REGIONS: MixpanelRegion[] = ["us", "eu", "in"];

export function normalizeRegion(region?: string): MixpanelRegion {
  const raw = (region?.trim().toLowerCase() || "us") as MixpanelRegion;
  if (!REGIONS.includes(raw)) {
    throw new Error("Région Mixpanel invalide — choisissez US, EU ou IN.");
  }
  return raw;
}

export function normalizeProjectId(projectId: string): string {
  const trimmed = projectId.trim();
  if (!trimmed) {
    throw new Error("Project ID Mixpanel requis.");
  }
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Project ID Mixpanel invalide (identifiant numérique attendu).");
  }
  return trimmed;
}

export function normalizeWorkspaceId(workspaceId?: string | null): string | null {
  const trimmed = workspaceId?.trim() ?? "";
  if (!trimmed) return null;
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Workspace ID Mixpanel invalide (identifiant numérique attendu).");
  }
  return trimmed;
}

export function parseMixpanelCredential(input: {
  serviceAccountUsername: string;
  serviceAccountSecret: string;
  projectId: string;
  region?: string;
  workspaceId?: string | null;
  projectLabel?: string | null;
  signupEvent?: string | null;
  activationEvent?: string | null;
  activityEvent?: string | null;
}): MixpanelCredential {
  const serviceAccountUsername = input.serviceAccountUsername.trim();
  const serviceAccountSecret = input.serviceAccountSecret.trim();

  if (!serviceAccountUsername) {
    throw new Error("Username Service Account Mixpanel requis.");
  }
  if (!serviceAccountSecret) {
    throw new Error("Secret Service Account Mixpanel requis.");
  }
  if (serviceAccountSecret.length < MIN_SECRET_LENGTH) {
    throw new Error("Format de secret Service Account Mixpanel invalide.");
  }

  const projectId = normalizeProjectId(input.projectId);
  const region = normalizeRegion(input.region);
  const workspaceId = normalizeWorkspaceId(input.workspaceId);
  const projectLabel = input.projectLabel?.trim() || null;
  const signupEvent = input.signupEvent?.trim() || null;
  const activationEvent = input.activationEvent?.trim() || null;
  const activityEvent = input.activityEvent?.trim() || null;

  if (!activityEvent && !signupEvent) {
    throw new Error(
      "Indiquez au moins un événement activité (MAU/DAU) ou signup pour synchroniser Mixpanel.",
    );
  }

  return {
    serviceAccountUsername,
    serviceAccountSecret,
    projectId,
    region,
    workspaceId,
    projectLabel,
    signupEvent,
    activationEvent,
    activityEvent: activityEvent ?? signupEvent,
  };
}

export function parseMixpanelKeyInput(input: {
  serviceAccountUsername: string;
  serviceAccountSecret: string;
  region?: string;
}): Pick<MixpanelCredential, "serviceAccountUsername" | "serviceAccountSecret" | "region"> {
  const serviceAccountUsername = input.serviceAccountUsername.trim();
  const serviceAccountSecret = input.serviceAccountSecret.trim();

  if (!serviceAccountUsername) {
    throw new Error("Username Service Account Mixpanel requis.");
  }
  if (!serviceAccountSecret) {
    throw new Error("Secret Service Account Mixpanel requis.");
  }
  if (serviceAccountSecret.length < MIN_SECRET_LENGTH) {
    throw new Error("Format de secret Service Account Mixpanel invalide.");
  }

  return {
    serviceAccountUsername,
    serviceAccountSecret,
    region: normalizeRegion(input.region),
  };
}

export function getRegionHosts(region: MixpanelRegion): {
  query: string;
  export: string;
  app: string;
} {
  switch (region) {
    case "eu":
      return {
        query: "eu.mixpanel.com",
        export: "data-eu.mixpanel.com",
        app: "eu.mixpanel.com",
      };
    case "in":
      return {
        query: "in.mixpanel.com",
        export: "data-in.mixpanel.com",
        app: "in.mixpanel.com",
      };
    default:
      return {
        query: "mixpanel.com",
        export: "data.mixpanel.com",
        app: "mixpanel.com",
      };
  }
}
