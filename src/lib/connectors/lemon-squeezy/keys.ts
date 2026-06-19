import type { LemonSqueezyCredential } from "@/lib/connectors/lemon-squeezy/types";

const MIN_API_KEY_LENGTH = 16;

export function parseLemonSqueezyApiKey(apiKeyRaw: string): string {
  const apiKey = apiKeyRaw.trim();
  if (!apiKey) {
    throw new Error("Clé API Lemon Squeezy requise.");
  }
  if (apiKey.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de clé API Lemon Squeezy invalide.");
  }
  return apiKey;
}

export function centsToMajorUnit(cents: number): number {
  return Math.round(cents) / 100;
}

export function parseLemonSqueezyCredential(input: {
  apiKey: string;
  storeId: string;
  storeName?: string;
  currency?: string;
  testMode?: boolean;
}): LemonSqueezyCredential {
  const apiKey = parseLemonSqueezyApiKey(input.apiKey);
  const storeId = input.storeId.trim();

  if (!storeId) {
    throw new Error("Identifiant de boutique Lemon Squeezy requis.");
  }
  if (!/^\d+$/.test(storeId)) {
    throw new Error("Identifiant de boutique invalide.");
  }

  return {
    apiKey,
    storeId,
    storeName: input.storeName?.trim() || `Store ${storeId}`,
    currency: (input.currency?.trim() || "USD").toUpperCase(),
    testMode: Boolean(input.testMode),
  };
}
