import "server-only";

import type {
  ResendAccountMeta,
  ResendContact,
  ResendCredential,
  ResendDomain,
  ResendListResponse,
  ResendSegment,
} from "@/lib/connectors/resend/types";

export { parseResendCredential } from "@/lib/connectors/resend/keys";

const RESEND_API_BASE = "https://api.resend.com";
const USER_AGENT = "SaaS-Radar/1.0";
const MAX_RETRIES = 3;
const PAGE_SIZE = 100;

export class ResendConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "ResendConnectorError";
    this.status = status;
  }
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.name === "string" && record.name.trim()) {
      return record.name;
    }
  }

  if (status === 401) {
    return "Clé API Resend invalide. Générez une clé dans resend.com/api-keys.";
  }
  if (status === 403) {
    return "Permissions insuffisantes. Utilisez une clé Full access (lecture contacts et domaines).";
  }
  if (status === 429) {
    return "Limite de requêtes Resend atteinte. Réessayez dans quelques secondes.";
  }

  return `Erreur Resend (${status})`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function resendConnectorRequest<T>(
  credential: Pick<ResendCredential, "apiKey">,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    searchParams?: URLSearchParams;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const url = new URL(`${RESEND_API_BASE}${path}`);
  if (options.searchParams) {
    options.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url.toString(), {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${credential.apiKey}`,
        "User-Agent": USER_AGENT,
      },
    });

    const text = await res.text();
    let parsed: unknown = {};
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = { raw: text };
      }
    }

    if (res.status === 429 && attempt < MAX_RETRIES) {
      await sleep(250 * 2 ** attempt);
      continue;
    }

    if (!res.ok) {
      throw new ResendConnectorError(parseErrorMessage(parsed, res.status), res.status);
    }

    return parsed as T;
  }

  throw new ResendConnectorError("Limite de requêtes Resend atteinte.", 429);
}

async function fetchAllPaginated<T extends { id: string }>(
  credential: Pick<ResendCredential, "apiKey">,
  path: string,
  extraParams?: Record<string, string>,
): Promise<T[]> {
  const all: T[] = [];
  let after: string | undefined;

  while (true) {
    const params = new URLSearchParams({ limit: String(PAGE_SIZE), ...extraParams });
    if (after) params.set("after", after);

    const res = await resendConnectorRequest<ResendListResponse<T>>(credential, path, {
      searchParams: params,
    });

    const batch = res.data ?? [];
    all.push(...batch);

    if (!res.has_more || batch.length === 0) break;
    after = batch[batch.length - 1]?.id;
    if (!after) break;
  }

  return all;
}

export async function listDomains(
  credential: Pick<ResendCredential, "apiKey">,
): Promise<ResendDomain[]> {
  return fetchAllPaginated<ResendDomain>(credential, "/domains");
}

export async function listSegments(
  credential: Pick<ResendCredential, "apiKey">,
): Promise<ResendSegment[]> {
  return fetchAllPaginated<ResendSegment>(credential, "/segments");
}

export async function fetchAllContacts(
  credential: Pick<ResendCredential, "apiKey">,
  segmentId?: string | null,
): Promise<ResendContact[]> {
  const extraParams = segmentId ? { segment_id: segmentId } : undefined;
  return fetchAllPaginated<ResendContact>(credential, "/contacts", extraParams);
}

export function resolveAccountLabel(domains: ResendDomain[]): string {
  const verified = domains.find((d) => d.status === "verified");
  if (verified?.name) return verified.name;
  if (domains[0]?.name) return domains[0].name;
  return "Resend";
}

export async function validateApiKey(
  credential: Pick<ResendCredential, "apiKey">,
): Promise<{ accountLabel: string; accountDomain: string | undefined }> {
  const domains = await listDomains(credential);
  const accountLabel = resolveAccountLabel(domains);
  const accountDomain = domains.find((d) => d.status === "verified")?.name ?? domains[0]?.name;
  return { accountLabel, accountDomain };
}

export function buildAccountMeta(
  credential: ResendCredential,
  conversionSegmentName?: string | null,
): ResendAccountMeta {
  return {
    accountLabel: credential.accountDomain ?? "Resend",
    webhookConfigured: Boolean(credential.webhookSigningSecret),
    conversionSegmentName: conversionSegmentName ?? credential.conversionSegmentName ?? null,
    conversionMode: credential.conversionMode,
  };
}

export async function validateCredential(
  credential: ResendCredential,
  conversionSegmentName?: string | null,
): Promise<ResendAccountMeta> {
  const { accountLabel, accountDomain } = await validateApiKey(credential);
  credential.accountDomain = accountDomain ?? accountLabel;
  return buildAccountMeta(credential, conversionSegmentName);
}

export function getResendWebhookUrl(projectId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const path = `/api/connectors/resend/webhook?projectId=${encodeURIComponent(projectId)}`;
  return base ? `${base}${path}` : path;
}
