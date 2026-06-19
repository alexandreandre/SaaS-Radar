import "server-only";

import type {
  CrispAccountMeta,
  CrispAnalyticsGenerateData,
  CrispAnalyticsGenerateQuery,
  CrispApiEnvelope,
  CrispConversationListItem,
  CrispCredential,
  CrispWebsiteData,
} from "@/lib/connectors/crisp/types";

export { parseCrispCredential } from "@/lib/connectors/crisp/keys";

const DEFAULT_API_BASE = "https://api.crisp.chat/v1";
const MAX_UNRESOLVED_PAGES = 10;
const CONVERSATIONS_PER_PAGE = 50;

export class CrispConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "CrispConnectorError";
    this.status = status;
  }
}

export function isCrispPluginConfigured(): boolean {
  return Boolean(
    process.env.CRISP_PLUGIN_IDENTIFIER?.trim() && process.env.CRISP_PLUGIN_KEY?.trim(),
  );
}

function getPluginAuth(): { identifier: string; key: string; tier: string } {
  const identifier = process.env.CRISP_PLUGIN_IDENTIFIER?.trim();
  const key = process.env.CRISP_PLUGIN_KEY?.trim();
  const tier = process.env.CRISP_PLUGIN_TIER?.trim() || "plugin";

  if (!identifier || !key) {
    throw new CrispConnectorError(
      "Connecteur Crisp non configuré (CRISP_PLUGIN_IDENTIFIER / CRISP_PLUGIN_KEY).",
      503,
    );
  }

  return { identifier, key, tier };
}

function getApiBase(): string {
  return process.env.CRISP_API_BASE?.trim().replace(/\/$/, "") || DEFAULT_API_BASE;
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    if (typeof record.reason === "string" && record.reason.trim() && record.reason !== "ok") {
      return record.reason;
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  if (status === 401) {
    return "Identifiants plugin Crisp invalides.";
  }
  if (status === 403) {
    return "Accès refusé. Installez d'abord le plugin SaaS-Radar sur ce workspace Crisp.";
  }
  if (status === 404) {
    return "Website ID Crisp introuvable. Vérifiez l'identifiant copié depuis le dashboard.";
  }
  if (status === 402) {
    return "Analytics Crisp requis (plan Essentials+). Activez Analytics sur votre workspace.";
  }
  if (status === 423) {
    return "Analytics Crisp temporairement verrouillé. Réessayez plus tard.";
  }
  if (status === 429) {
    return "Quota API Crisp atteint. Réessayez demain ou contactez le support Crisp.";
  }

  return `Erreur Crisp (${status})`;
}

function assertEnvelopeOk<T>(envelope: CrispApiEnvelope<T>, status: number): T {
  if (envelope.error) {
    throw new CrispConnectorError(parseErrorMessage(envelope, status), status);
  }
  return envelope.data;
}

export async function crispPluginRequest<T>(
  path: string,
  options: {
    method?: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    searchParams?: URLSearchParams;
  } = {},
): Promise<T> {
  const { identifier, key, tier } = getPluginAuth();
  const method = options.method ?? "GET";
  const base = getApiBase();
  const url = new URL(`${base}${path.startsWith("/") ? path : `/${path}`}`);

  if (options.searchParams) {
    options.searchParams.forEach((value, param) => {
      url.searchParams.set(param, value);
    });
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`${identifier}:${key}`).toString("base64")}`,
    "X-Crisp-Tier": tier,
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url.toString(), { method, headers, body });
  const text = await res.text();
  let parsed: unknown = {};
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = { raw: text };
    }
  }

  if (!res.ok) {
    throw new CrispConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  if (parsed && typeof parsed === "object" && "error" in parsed) {
    return assertEnvelopeOk(parsed as CrispApiEnvelope<T>, res.status);
  }

  return parsed as T;
}

export async function fetchWebsiteDetails(websiteId: string): Promise<CrispWebsiteData> {
  const encoded = encodeURIComponent(websiteId);
  return crispPluginRequest<CrispWebsiteData>(`/website/${encoded}`);
}

export async function validateWebsiteAccess(
  credential: Pick<CrispCredential, "websiteId">,
): Promise<CrispAccountMeta> {
  const website = await fetchWebsiteDetails(credential.websiteId);
  const accountLabel = website.name?.trim() || credential.websiteId;

  return {
    accountLabel,
    websiteName: website.name ?? accountLabel,
    domain: website.domain,
    timezone: "Europe/Paris",
  };
}

export async function generateAnalytics(
  websiteId: string,
  query: CrispAnalyticsGenerateQuery,
): Promise<CrispAnalyticsGenerateData> {
  const encoded = encodeURIComponent(websiteId);
  return crispPluginRequest<CrispAnalyticsGenerateData>(`/website/${encoded}/analytics/generate`, {
    method: "POST",
    body: query,
  });
}

export async function countUnresolvedConversations(websiteId: string): Promise<number> {
  const encoded = encodeURIComponent(websiteId);
  let total = 0;

  for (let page = 1; page <= MAX_UNRESOLVED_PAGES; page += 1) {
    const params = new URLSearchParams({
      per_page: String(CONVERSATIONS_PER_PAGE),
      filter_not_resolved: "1",
    });

    const batch = await crispPluginRequest<CrispConversationListItem[]>(
      `/website/${encoded}/conversations/${page}`,
      { searchParams: params },
    );

    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }

    total += batch.length;

    if (batch.length < CONVERSATIONS_PER_PAGE) {
      break;
    }
  }

  return total;
}

export function buildAccountMeta(credential: CrispCredential): CrispAccountMeta {
  return {
    accountLabel: credential.websiteName?.trim() || credential.websiteId,
    websiteName: credential.websiteName?.trim() || credential.websiteId,
    timezone: credential.timezone ?? "Europe/Paris",
  };
}
