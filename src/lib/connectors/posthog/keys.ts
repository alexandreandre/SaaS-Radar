import type { PostHogCredential } from "@/lib/connectors/posthog/types";

const MIN_API_KEY_LENGTH = 16;

const DEFAULT_APP_HOST = "https://us.posthog.com";

export function normalizeAppHost(appHost?: string): string {
  const raw = appHost?.trim() || process.env.POSTHOG_APP_HOST?.trim() || DEFAULT_APP_HOST;
  const withoutTrailing = raw.replace(/\/$/, "");
  if (!/^https?:\/\//i.test(withoutTrailing)) {
    throw new Error("URL PostHog invalide — utilisez https://us.posthog.com ou votre instance self-hosted.");
  }
  return withoutTrailing;
}

export function normalizeProjectId(projectId: string): string {
  const trimmed = projectId.trim();
  if (!trimmed) {
    throw new Error("Project ID PostHog requis.");
  }
  if (!/^\d+$/.test(trimmed)) {
    throw new Error("Project ID PostHog invalide (identifiant numérique attendu).");
  }
  return trimmed;
}

export function parsePostHogCredential(input: {
  personalApiKey: string;
  projectId: string;
  appHost?: string;
  signupEvent?: string | null;
  activationEvent?: string | null;
}): PostHogCredential {
  const personalApiKey = input.personalApiKey.trim();
  if (!personalApiKey) {
    throw new Error("Personal API Key PostHog requise.");
  }
  if (personalApiKey.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de Personal API Key PostHog invalide.");
  }

  const projectId = normalizeProjectId(input.projectId);
  const appHost = normalizeAppHost(input.appHost);
  const signupEvent = input.signupEvent?.trim() || null;
  const activationEvent = input.activationEvent?.trim() || null;

  return {
    personalApiKey,
    projectId,
    appHost,
    signupEvent,
    activationEvent,
  };
}

export function parsePostHogKeyInput(input: {
  personalApiKey: string;
  appHost?: string;
}): Pick<PostHogCredential, "personalApiKey" | "appHost"> {
  const personalApiKey = input.personalApiKey.trim();
  if (!personalApiKey) {
    throw new Error("Personal API Key PostHog requise.");
  }
  if (personalApiKey.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de Personal API Key PostHog invalide.");
  }

  return {
    personalApiKey,
    appHost: normalizeAppHost(input.appHost),
  };
}

export function escapeHogQLString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "''");
}
