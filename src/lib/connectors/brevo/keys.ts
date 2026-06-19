import { randomBytes } from "node:crypto";
import type { BrevoConversionMode, BrevoCredential } from "@/lib/connectors/brevo/types";

const MIN_API_KEY_LENGTH = 16;

export function generateWebhookToken(): string {
  return randomBytes(32).toString("base64url");
}

export function parseBrevoApiKey(apiKey: string): string {
  const trimmed = apiKey.trim();
  if (!trimmed) {
    throw new Error("Clé API Brevo requise.");
  }
  if (trimmed.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de clé API Brevo invalide.");
  }
  return trimmed;
}

export function parseBrevoCredential(input: {
  apiKey: string;
  conversionMode?: BrevoConversionMode;
  conversionListId?: string | null;
  conversionListName?: string | null;
  webhookToken?: string | null;
  companyName?: string | null;
  accountEmail?: string | null;
}): BrevoCredential {
  const apiKey = parseBrevoApiKey(input.apiKey);
  const conversionListId = input.conversionListId?.trim() || null;
  const conversionMode: BrevoConversionMode =
    conversionListId && input.conversionMode !== "campaign_clicks"
      ? "list_addition"
      : (input.conversionMode ?? "campaign_clicks");

  if (conversionMode === "list_addition" && !conversionListId) {
    throw new Error("Liste de conversion requise pour le mode list_addition.");
  }

  const webhookToken = input.webhookToken?.trim() || generateWebhookToken();

  return {
    apiKey,
    conversionMode,
    conversionListId,
    conversionListName: input.conversionListName?.trim() || null,
    webhookToken,
    companyName: input.companyName?.trim() || undefined,
    accountEmail: input.accountEmail?.trim() || undefined,
  };
}
