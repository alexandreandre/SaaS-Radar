import type { StripeCredential } from "@/lib/connectors/stripe/types";

export function isRestrictedKey(key: string): boolean {
  return /^rk_(test|live)_/.test(key.trim());
}

export function isFullSecretKey(key: string): boolean {
  return /^sk_(test|live)_/.test(key.trim());
}

export function parseRakCredential(secretKey: string, currency = "eur"): StripeCredential {
  const trimmed = secretKey.trim();
  if (isFullSecretKey(trimmed)) {
    throw new Error("Utilisez une clé restreinte (rk_…), pas une clé secrète complète (sk_…).");
  }
  if (!isRestrictedKey(trimmed)) {
    throw new Error("Format de clé invalide. Attendu : rk_test_… ou rk_live_…");
  }
  const livemode = trimmed.startsWith("rk_live_");
  return { mode: "rak", secretKey: trimmed, livemode, currency };
}

export function centsToEuros(cents: number): number {
  return Math.round(cents) / 100;
}
