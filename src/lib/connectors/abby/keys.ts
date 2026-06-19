import type { AbbyCredential } from "@/lib/connectors/abby/types";

const MIN_API_KEY_LENGTH = 16;

export function parseAbbyApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("Clé API Abby requise.");
  }
  if (trimmed.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de clé API Abby invalide.");
  }
  return trimmed;
}

export function parseAbbyCredential(input: {
  apiKey: string;
  companyId?: string | null;
  commercialName?: string | null;
}): AbbyCredential {
  const apiKey = parseAbbyApiKey(input.apiKey);

  return {
    apiKey,
    companyId: input.companyId?.trim() || undefined,
    commercialName: input.commercialName?.trim() || undefined,
  };
}
