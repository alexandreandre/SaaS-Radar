import type { LoopsConversionMode, LoopsCredential } from "@/lib/connectors/loops/types";

const MIN_API_KEY_LENGTH = 16;

export function parseLoopsApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("Clé API Loops requise.");
  }
  if (trimmed.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de clé API Loops invalide.");
  }
  return trimmed;
}

export function isValidWebhookSigningSecret(secret: string): boolean {
  const trimmed = secret.trim();
  return trimmed.startsWith("whsec_") && trimmed.length > 10;
}

export function parseLoopsCredential(input: {
  apiKey: string;
  webhookSigningSecret: string;
  conversionListId?: string | null;
  conversionMode?: LoopsConversionMode;
  teamName?: string | null;
}): LoopsCredential {
  const webhookSigningSecret = input.webhookSigningSecret.trim();
  const conversionListId = input.conversionListId?.trim() || null;
  const conversionMode: LoopsConversionMode =
    conversionListId && input.conversionMode !== "email_clicked"
      ? "mailing_list"
      : "email_clicked";

  const apiKey = parseLoopsApiKey(input.apiKey);
  if (!webhookSigningSecret) {
    throw new Error("Secret de signature webhook Loops requis (whsec_…).");
  }
  if (!isValidWebhookSigningSecret(webhookSigningSecret)) {
    throw new Error("Format de secret webhook invalide. Attendu : whsec_…");
  }

  return {
    apiKey,
    webhookSigningSecret,
    conversionListId,
    conversionMode,
    teamName: input.teamName?.trim() || undefined,
  };
}
