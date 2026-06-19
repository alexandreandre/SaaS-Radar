import type { ResendConversionMode, ResendCredential } from "@/lib/connectors/resend/types";

const MIN_API_KEY_LENGTH = 16;

export function isValidWebhookSigningSecret(secret: string): boolean {
  const trimmed = secret.trim();
  return trimmed.startsWith("whsec_") && trimmed.length > 10;
}

export function parseResendApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("Clé API Resend requise.");
  }
  if (!trimmed.startsWith("re_")) {
    throw new Error("Format de clé API Resend invalide. Attendu : re_…");
  }
  if (trimmed.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de clé API Resend invalide.");
  }
  return trimmed;
}

export function parseResendCredential(input: {
  apiKey: string;
  webhookSigningSecret: string;
  conversionSegmentId?: string | null;
  conversionSegmentName?: string | null;
  conversionMode?: ResendConversionMode;
  accountDomain?: string | null;
}): ResendCredential {
  const apiKey = parseResendApiKey(input.apiKey);
  const webhookSigningSecret = input.webhookSigningSecret.trim();
  const conversionSegmentId = input.conversionSegmentId?.trim() || null;
  const conversionMode: ResendConversionMode =
    conversionSegmentId && input.conversionMode !== "email_clicked"
      ? "segment"
      : (input.conversionMode ?? "email_clicked");

  if (conversionMode === "segment" && !conversionSegmentId) {
    throw new Error("Segment de conversion requis pour le mode segment.");
  }

  if (!webhookSigningSecret) {
    throw new Error("Secret de signature webhook Resend requis (whsec_…).");
  }
  if (!isValidWebhookSigningSecret(webhookSigningSecret)) {
    throw new Error("Format de secret webhook invalide. Attendu : whsec_…");
  }

  return {
    apiKey,
    webhookSigningSecret,
    conversionMode,
    conversionSegmentId,
    conversionSegmentName: input.conversionSegmentName?.trim() || null,
    accountDomain: input.accountDomain?.trim() || undefined,
  };
}
