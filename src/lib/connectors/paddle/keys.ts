import type { PaddleCredential } from "@/lib/connectors/paddle/types";

const MIN_API_KEY_LENGTH = 40;

export function isPaddleSandboxKey(apiKey: string): boolean {
  return apiKey.includes("sdbx_");
}

export function isPaddleLiveKey(apiKey: string): boolean {
  return apiKey.includes("live_");
}

export function parsePaddleApiKey(apiKeyRaw: string): string {
  const apiKey = apiKeyRaw.trim();
  if (!apiKey) {
    throw new Error("Clé API Paddle requise.");
  }
  if (apiKey.length < MIN_API_KEY_LENGTH) {
    throw new Error("Format de clé API Paddle invalide.");
  }
  if (!apiKey.startsWith("pdl_") || !apiKey.includes("apikey_")) {
    throw new Error(
      "Format de clé API Paddle invalide. Utilisez une clé Billing (pdl_live_apikey_… ou pdl_sdbx_apikey_…).",
    );
  }
  if (!isPaddleSandboxKey(apiKey) && !isPaddleLiveKey(apiKey)) {
    throw new Error("La clé Paddle doit être sandbox (sdbx_) ou live (live_).");
  }
  return apiKey;
}

export function minorUnitToMajor(amountMinor: number): number {
  return Math.round(amountMinor) / 100;
}

export function parseMinorAmount(value: string | undefined | null): number {
  if (!value) return 0;
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function parsePaddleCredential(input: {
  apiKey: string;
  currency?: string;
}): PaddleCredential {
  const apiKey = parsePaddleApiKey(input.apiKey);
  const sandbox = isPaddleSandboxKey(apiKey);

  return {
    apiKey,
    sandbox,
    currency: (input.currency?.trim() || "USD").toUpperCase(),
  };
}

export function buildAccountLabel(credential: PaddleCredential, currency?: string): string {
  const mode = credential.sandbox ? "Sandbox" : "Live";
  const code = (currency ?? credential.currency).toUpperCase();
  return `Paddle · ${mode} (${code})`;
}
