import type { FathomCredential } from "@/lib/connectors/fathom/types";

const MIN_API_KEY_LENGTH = 16;

export function parseFathomApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("Clé API Fathom requise.");
  }
  if (trimmed.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de clé API Fathom invalide.");
  }
  return trimmed;
}

export function normalizeSiteId(siteId: string): string {
  return siteId.trim().toUpperCase();
}

export function parseFathomCredential(input: {
  apiKey: string;
  siteId: string;
  signupEventId?: string | null;
  signupEventName?: string | null;
}): FathomCredential {
  const apiKey = input.apiKey.trim();
  const siteId = normalizeSiteId(input.siteId);

  if (!apiKey) {
    throw new Error("Clé API Fathom requise.");
  }
  if (apiKey.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de clé API Fathom invalide.");
  }
  if (!siteId) {
    throw new Error("ID du site Fathom requis (ex. CDBUGS).");
  }
  if (siteId.includes(" ") || siteId.includes("/")) {
    throw new Error("L'ID du site ne doit pas contenir d'espaces ni de slash.");
  }

  const signupEventId = input.signupEventId?.trim() || null;
  const signupEventName = input.signupEventName?.trim() || null;

  return {
    apiKey,
    siteId,
    signupEventId,
    signupEventName,
  };
}
