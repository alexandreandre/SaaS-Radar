import "server-only";

import type {
  BrevoAccountMeta,
  BrevoAccountResponse,
  BrevoContact,
  BrevoContactList,
  BrevoContactsResponse,
  BrevoCredential,
  BrevoEmailCampaign,
  BrevoEmailCampaignsResponse,
  BrevoListsResponse,
} from "@/lib/connectors/brevo/types";

export { parseBrevoCredential, generateWebhookToken } from "@/lib/connectors/brevo/keys";

const BREVO_API_BASE = "https://api.brevo.com/v3";
const MAX_RETRIES = 3;
const CONTACTS_PAGE_SIZE = 1000;
const CAMPAIGNS_PAGE_SIZE = 50;
const LISTS_PAGE_SIZE = 50;

export class BrevoConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "BrevoConnectorError";
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
    return "Clé API Brevo invalide. Générez une clé dans Paramètres → Clés API.";
  }
  if (status === 403) {
    return "Permissions insuffisantes. Activez Contacts (lecture) et Campagnes email (lecture) sur la clé API.";
  }
  if (status === 429) {
    return "Limite de requêtes Brevo atteinte. Réessayez dans quelques secondes.";
  }

  return `Erreur Brevo (${status})`;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function brevoConnectorRequest<T>(
  credential: Pick<BrevoCredential, "apiKey">,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "DELETE";
    searchParams?: URLSearchParams;
  } = {},
): Promise<T> {
  const method = options.method ?? "GET";
  const url = new URL(`${BREVO_API_BASE}${path}`);
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
        "Content-Type": "application/json",
        "api-key": credential.apiKey,
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
      const resetHeader = res.headers.get("x-sib-ratelimit-reset");
      const waitMs = resetHeader ? Number(resetHeader) * 1000 : 250 * 2 ** attempt;
      await sleep(Number.isFinite(waitMs) && waitMs > 0 ? waitMs : 500);
      continue;
    }

    if (!res.ok) {
      throw new BrevoConnectorError(parseErrorMessage(parsed, res.status), res.status);
    }

    return parsed as T;
  }

  throw new BrevoConnectorError("Limite de requêtes Brevo atteinte.", 429);
}

export async function fetchAccount(
  credential: Pick<BrevoCredential, "apiKey">,
): Promise<BrevoAccountResponse> {
  return brevoConnectorRequest<BrevoAccountResponse>(credential, "/account");
}

export async function validateApiKey(
  credential: Pick<BrevoCredential, "apiKey">,
): Promise<{ companyName: string; accountEmail: string }> {
  const account = await fetchAccount(credential);
  const companyName = account.companyName?.trim() || account.email?.trim() || "Brevo";
  const accountEmail = account.email?.trim() || "";
  return { companyName, accountEmail };
}

export async function listContactLists(
  credential: Pick<BrevoCredential, "apiKey">,
): Promise<BrevoContactList[]> {
  const all: BrevoContactList[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      limit: String(LISTS_PAGE_SIZE),
      offset: String(offset),
      sort: "desc",
    });
    const res = await brevoConnectorRequest<BrevoListsResponse>(credential, "/contacts/lists", {
      searchParams: params,
    });
    const batch = res.lists ?? [];
    all.push(...batch);
    if (batch.length < LISTS_PAGE_SIZE) break;
    offset += LISTS_PAGE_SIZE;
  }

  return all;
}

export async function fetchAllContactsSince(
  credential: Pick<BrevoCredential, "apiKey">,
  createdSinceIso: string,
): Promise<BrevoContact[]> {
  const all: BrevoContact[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      limit: String(CONTACTS_PAGE_SIZE),
      offset: String(offset),
      sort: "desc",
      createdSince: createdSinceIso,
    });
    const res = await brevoConnectorRequest<BrevoContactsResponse>(credential, "/contacts", {
      searchParams: params,
    });
    const batch = res.contacts ?? [];
    all.push(...batch);
    if (batch.length < CONTACTS_PAGE_SIZE) break;
    offset += CONTACTS_PAGE_SIZE;
  }

  return all;
}

export async function fetchAllEmailCampaigns(
  credential: Pick<BrevoCredential, "apiKey">,
): Promise<BrevoEmailCampaign[]> {
  const all: BrevoEmailCampaign[] = [];
  let offset = 0;

  while (true) {
    const params = new URLSearchParams({
      limit: String(CAMPAIGNS_PAGE_SIZE),
      offset: String(offset),
      sort: "desc",
      statistics: "globalStats",
    });
    const res = await brevoConnectorRequest<BrevoEmailCampaignsResponse>(
      credential,
      "/emailCampaigns",
      { searchParams: params },
    );
    const batch = res.campaigns ?? [];
    all.push(...batch);
    if (batch.length < CAMPAIGNS_PAGE_SIZE) break;
    offset += CAMPAIGNS_PAGE_SIZE;
  }

  return all;
}

export function buildAccountMeta(
  credential: BrevoCredential,
  conversionListName?: string | null,
): BrevoAccountMeta {
  return {
    accountLabel: credential.companyName ?? credential.accountEmail ?? "Brevo",
    companyName: credential.companyName ?? null,
    webhookConfigured: credential.conversionMode === "list_addition",
    conversionListName: conversionListName ?? credential.conversionListName ?? null,
    conversionMode: credential.conversionMode,
  };
}

export async function validateCredential(
  credential: BrevoCredential,
  conversionListName?: string | null,
): Promise<BrevoAccountMeta> {
  const { companyName, accountEmail } = await validateApiKey(credential);
  credential.companyName = companyName;
  credential.accountEmail = accountEmail;
  return buildAccountMeta(credential, conversionListName);
}

export function getBrevoWebhookUrl(projectId: string, webhookToken: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "");
  const path = `/api/connectors/brevo/webhook?projectId=${encodeURIComponent(projectId)}&token=${encodeURIComponent(webhookToken)}`;
  return base ? `${base}${path}` : path;
}
