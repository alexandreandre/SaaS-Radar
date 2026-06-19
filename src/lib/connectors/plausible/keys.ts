import type { PlausibleCredential } from "@/lib/connectors/plausible/types";

const MIN_API_KEY_LENGTH = 16;

export function normalizeSiteId(siteId: string): string {
  return siteId.trim().toLowerCase();
}

export function parsePlausibleCredential(input: {
  apiKey: string;
  siteId: string;
  signupGoalDisplayName?: string | null;
  apiBaseUrl?: string;
}): PlausibleCredential {
  const apiKey = input.apiKey.trim();
  const siteId = normalizeSiteId(input.siteId);

  if (!apiKey) {
    throw new Error("Clé Stats API Plausible requise.");
  }
  if (apiKey.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de clé Stats API invalide.");
  }
  if (!siteId) {
    throw new Error("Domaine du site Plausible requis (ex. app.example.com).");
  }
  if (siteId.includes(" ") || siteId.includes("/")) {
    throw new Error("Le domaine ne doit pas contenir d'espaces ni de slash.");
  }

  const signupGoalDisplayName = input.signupGoalDisplayName?.trim() || null;
  const apiBaseUrl = input.apiBaseUrl?.trim().replace(/\/$/, "") || undefined;

  return {
    apiKey,
    siteId,
    signupGoalDisplayName,
    apiBaseUrl,
  };
}
