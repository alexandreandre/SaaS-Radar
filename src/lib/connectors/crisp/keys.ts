import type { CrispCredential } from "@/lib/connectors/crisp/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeWebsiteId(websiteId: string): string {
  return websiteId.trim().toLowerCase();
}

export function isValidWebsiteId(websiteId: string): boolean {
  return UUID_RE.test(normalizeWebsiteId(websiteId));
}

export function parseCrispCredential(input: {
  websiteId: string;
  websiteName?: string | null;
  timezone?: string | null;
}): CrispCredential {
  const websiteId = normalizeWebsiteId(input.websiteId);

  if (!websiteId) {
    throw new Error("Website ID Crisp requis.");
  }
  if (!isValidWebsiteId(websiteId)) {
    throw new Error("Format de Website ID invalide (UUID attendu).");
  }

  const websiteName = input.websiteName?.trim() || null;
  const timezone = input.timezone?.trim() || "Europe/Paris";

  return {
    websiteId,
    websiteName,
    timezone,
  };
}
