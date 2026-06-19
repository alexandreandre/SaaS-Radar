import "server-only";

import type {
  AbbyAccountMeta,
  AbbyCredential,
  AbbyReadMeResponse,
} from "@/lib/connectors/abby/types";

export { parseAbbyCredential } from "@/lib/connectors/abby/keys";

const DEFAULT_API_BASE = "https://api.app-abby.com";

export class AbbyConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AbbyConnectorError";
    this.status = status;
  }
}

export function getAbbyApiBase(): string {
  const fromEnv = process.env.ABBY_API_BASE?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  return DEFAULT_API_BASE;
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
    return "Clé API Abby invalide ou expirée. Régénérez-la dans Paramètres > Intégrations.";
  }
  if (status === 403) {
    return "Cette clé API n'a pas accès à cette ressource Abby.";
  }
  if (status === 404) {
    return "Ressource Abby introuvable.";
  }
  if (status === 429) {
    return "Limite de requêtes Abby atteinte. Réessayez dans quelques instants.";
  }

  return `Erreur Abby (${status})`;
}

export async function abbyConnectorRequest<T>(
  credential: Pick<AbbyCredential, "apiKey">,
  path: string,
  options: {
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
    searchParams?: URLSearchParams;
    allowNotFound?: boolean;
  } = {},
): Promise<T | null> {
  const method = options.method ?? "GET";
  const url = new URL(`${getAbbyApiBase()}${path}`);
  if (options.searchParams) {
    options.searchParams.forEach((value, key) => {
      url.searchParams.set(key, value);
    });
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      Authorization: `Bearer ${credential.apiKey}`,
      Accept: "application/json",
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

  if (res.status === 404 && options.allowNotFound) {
    return null;
  }

  if (!res.ok) {
    throw new AbbyConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function fetchCompanyMe(
  credential: AbbyCredential,
): Promise<AbbyReadMeResponse> {
  const response = await abbyConnectorRequest<AbbyReadMeResponse>(
    credential,
    "/v2/company/me",
  );
  return response ?? {};
}

export function buildAccountMetaFromMe(me: AbbyReadMeResponse): AbbyAccountMeta {
  const company = me.company;
  const commercialName =
    company?.commercialName?.trim() ||
    company?.name?.trim() ||
    "Entreprise Abby";
  const companyId = company?.id?.trim() || "unknown";

  return {
    accountLabel: commercialName,
    companyId,
    commercialName,
  };
}

export async function validateCredential(
  credential: AbbyCredential,
): Promise<AbbyAccountMeta> {
  const me = await fetchCompanyMe(credential);
  return buildAccountMetaFromMe(me);
}
