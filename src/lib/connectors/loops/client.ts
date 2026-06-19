import "server-only";

import type {
  LoopsAccountMeta,
  LoopsApiKeyResponse,
  LoopsCredential,
  LoopsMailingList,
} from "@/lib/connectors/loops/types";

export { parseLoopsCredential } from "@/lib/connectors/loops/keys";

const LOOPS_API_BASE = "https://app.loops.so/api";
const MAX_RETRIES = 3;

export class LoopsConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "LoopsConnectorError";
    this.status = status;
  }
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.message === "string" && record.message.trim()) {
      return record.message;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  if (status === 401) {
    return "Clé API Loops invalide. Générez une clé dans Settings → API.";
  }
  if (status === 429) {
    return "Limite de requêtes Loops atteinte. Réessayez dans quelques secondes.";
  }

  return `Erreur Loops (${status})`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function loopsConnectorRequest<T>(
  credential: Pick<LoopsCredential, "apiKey">,
  path: string,
  options: { method?: "GET" | "POST" | "PUT" | "DELETE" } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const url = `${LOOPS_API_BASE}${path}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${credential.apiKey}`,
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
      throw new LoopsConnectorError(parseErrorMessage(parsed, res.status), res.status);
    }

    return parsed as T;
  }

  throw new LoopsConnectorError("Limite de requêtes Loops atteinte.", 429);
}

export async function validateApiKey(
  credential: Pick<LoopsCredential, "apiKey">,
): Promise<{ teamName: string }> {
  const res = await loopsConnectorRequest<LoopsApiKeyResponse>(credential, "/v1/api-key");
  if (!res.success || !res.teamName?.trim()) {
    throw new LoopsConnectorError("Clé API Loops invalide.", 401);
  }
  return { teamName: res.teamName.trim() };
}

export async function listMailingLists(
  credential: Pick<LoopsCredential, "apiKey">,
): Promise<LoopsMailingList[]> {
  const lists = await loopsConnectorRequest<LoopsMailingList[]>(credential, "/v1/lists");
  return Array.isArray(lists) ? lists : [];
}

export function buildAccountMeta(
  credential: LoopsCredential,
  conversionListName?: string | null,
): LoopsAccountMeta {
  return {
    accountLabel: credential.teamName ?? "Loops",
    webhookConfigured: Boolean(credential.webhookSigningSecret),
    conversionListName: conversionListName ?? null,
  };
}

export async function validateCredential(
  credential: LoopsCredential,
  conversionListName?: string | null,
): Promise<LoopsAccountMeta> {
  const { teamName } = await validateApiKey(credential);
  credential.teamName = teamName;
  return buildAccountMeta(credential, conversionListName);
}

export function getLoopsWebhookUrl(projectId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const path = `/api/connectors/loops/webhook?projectId=${encodeURIComponent(projectId)}`;
  return base ? `${base}${path}` : path;
}
