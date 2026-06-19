import type { BetterStackCredential } from "@/lib/connectors/better-stack/types";

const MIN_API_TOKEN_LENGTH = 16;

export function parseBetterStackApiToken(apiToken: string): string {
  const trimmed = apiToken.trim();
  if (!trimmed) {
    throw new Error("Token API Better Stack requis.");
  }
  if (trimmed.length < MIN_API_TOKEN_LENGTH) {
    throw new Error("Format de token API Better Stack invalide.");
  }
  return trimmed;
}

export function normalizeMonitorId(monitorId: string): string {
  const trimmed = monitorId.trim();
  if (!trimmed || !/^\d+$/.test(trimmed)) {
    throw new Error("ID de monitor Better Stack invalide.");
  }
  return trimmed;
}

export function parseBetterStackCredential(input: {
  apiToken: string;
  monitorId: string;
  monitorName?: string | null;
  monitorUrl?: string | null;
  teamName?: string | null;
}): BetterStackCredential {
  const apiToken = parseBetterStackApiToken(input.apiToken);
  const monitorId = normalizeMonitorId(input.monitorId);
  const monitorName = input.monitorName?.trim() || `Monitor ${monitorId}`;

  return {
    apiToken,
    monitorId,
    monitorName,
    monitorUrl: input.monitorUrl?.trim() || null,
    teamName: input.teamName?.trim() || null,
  };
}
