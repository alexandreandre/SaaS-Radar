import type { FreemiusCredential } from "@/lib/connectors/freemius/types";

const MIN_API_TOKEN_LENGTH = 8;

export function parseAmount(value: number | string | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : parseFloat(String(value));
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function billingCycleToMonthlyMrr(
  renewalAmount: number | string,
  billingCycle: number,
): number {
  if (billingCycle <= 0) return 0;
  const amount = parseAmount(renewalAmount);
  if (amount <= 0) return 0;
  return amount / billingCycle;
}

export function parseFreemiusApiToken(apiTokenRaw: string): string {
  const apiToken = apiTokenRaw.trim();
  if (!apiToken) {
    throw new Error("Bearer Token Freemius requis.");
  }
  if (apiToken.length < MIN_API_TOKEN_LENGTH) {
    throw new Error("Format de Bearer Token Freemius invalide.");
  }
  return apiToken;
}

export function parseFreemiusProductId(productIdRaw: string): string {
  const productId = productIdRaw.trim();
  if (!productId) {
    throw new Error("Identifiant produit Freemius requis.");
  }
  if (!/^\d+$/.test(productId)) {
    throw new Error("Identifiant produit Freemius invalide.");
  }
  return productId;
}

export function parseFreemiusCredential(input: {
  productId: string;
  apiToken: string;
  productTitle?: string;
  currency?: string;
  sandbox?: boolean;
}): FreemiusCredential {
  return {
    productId: parseFreemiusProductId(input.productId),
    apiToken: parseFreemiusApiToken(input.apiToken),
    productTitle: input.productTitle?.trim() || `Produit ${input.productId.trim()}`,
    currency: (input.currency?.trim() || "USD").toUpperCase(),
    sandbox: Boolean(input.sandbox),
  };
}
