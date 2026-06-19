import "server-only";

import {
  INTERCOM_API_VERSION,
  resolveIntercomApiBase,
} from "@/lib/connectors/intercom/snapshots";
import type {
  IntercomConversation,
  IntercomCredential,
  IntercomMeResponse,
  IntercomSearchQuery,
  IntercomSearchResponse,
} from "@/lib/connectors/intercom/types";

const MAX_RESPONSE_PAGES = 10;
const SEARCH_PER_PAGE = 150;

export class IntercomConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "IntercomConnectorError";
    this.status = status;
  }
}

function parseErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object") {
    const record = body as Record<string, unknown>;
    const errors = record.errors;
    if (Array.isArray(errors) && errors.length > 0) {
      const first = errors[0] as { message?: string; code?: string };
      if (typeof first.message === "string" && first.message.trim()) {
        return first.message;
      }
      if (typeof first.code === "string" && first.code.trim()) {
        return first.code;
      }
    }
    if (typeof record.error === "string" && record.error.trim()) {
      return record.error;
    }
  }

  if (status === 401) {
    return "Token Intercom invalide ou révoqué. Reconnectez Intercom depuis le marketplace.";
  }
  if (status === 403) {
    return "Permissions Intercom insuffisantes. Vérifiez les scopes Read conversations et Read and list users and companies.";
  }
  if (status === 429) {
    return "Quota API Intercom atteint. Réessayez dans quelques minutes.";
  }

  return `Erreur Intercom (${status})`;
}

export async function intercomRequest<T>(
  credential: Pick<IntercomCredential, "accessToken" | "region">,
  path: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
  } = {},
): Promise<T> {
  const base = resolveIntercomApiBase(credential.region);
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const method = options.method ?? "GET";

  const headers: Record<string, string> = {
    Authorization: `Bearer ${credential.accessToken}`,
    Accept: "application/json",
    "Intercom-Version": INTERCOM_API_VERSION,
  };

  let body: string | undefined;
  if (options.body !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.body);
  }

  const res = await fetch(url, { method, headers, body });
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
    throw new IntercomConnectorError(parseErrorMessage(parsed, res.status), res.status);
  }

  return parsed as T;
}

export async function getMe(
  accessToken: string,
  region?: string | null,
): Promise<IntercomMeResponse> {
  return intercomRequest<IntercomMeResponse>(
    { accessToken, region: region ?? "US" },
    "/me",
  );
}

export async function validateIntercomCredential(
  credential: IntercomCredential,
): Promise<{ accountLabel: string; credential: IntercomCredential }> {
  const me = await getMe(credential.accessToken, credential.region);
  const app = me.app;
  const appName = app?.name?.trim() || credential.appName || "Intercom";
  const appId = app?.id_code?.trim() || credential.appId;
  const region = app?.region?.trim() || credential.region || "US";
  const timezone = app?.timezone?.trim() || credential.timezone || "Europe/Paris";

  return {
    accountLabel: appName,
    credential: {
      ...credential,
      appId,
      appName,
      region,
      timezone,
    },
  };
}

async function searchConversations(
  credential: IntercomCredential,
  query: IntercomSearchQuery,
  pagination?: { per_page?: number; starting_after?: string },
): Promise<IntercomSearchResponse<IntercomConversation>> {
  return intercomRequest<IntercomSearchResponse<IntercomConversation>>(
    credential,
    "/conversations/search",
    {
      method: "POST",
      body: {
        query,
        pagination: {
          per_page: pagination?.per_page ?? 1,
          ...(pagination?.starting_after
            ? { starting_after: pagination.starting_after }
            : {}),
        },
      },
    },
  );
}

async function searchContacts(
  credential: IntercomCredential,
  query: IntercomSearchQuery,
  pagination?: { per_page?: number; starting_after?: string },
): Promise<IntercomSearchResponse<unknown>> {
  return intercomRequest<IntercomSearchResponse<unknown>>(credential, "/contacts/search", {
    method: "POST",
    body: {
      query,
      pagination: {
        per_page: pagination?.per_page ?? 1,
        ...(pagination?.starting_after ? { starting_after: pagination.starting_after } : {}),
      },
    },
  });
}

export async function countSearchResults(
  credential: IntercomCredential,
  resource: "conversations" | "contacts",
  query: IntercomSearchQuery,
): Promise<number> {
  const search = resource === "conversations" ? searchConversations : searchContacts;
  const response = await search(credential, query, { per_page: 1 });
  return Math.max(0, response.total_count ?? 0);
}

export async function countOpenConversations(credential: IntercomCredential): Promise<number> {
  return countSearchResults(credential, "conversations", {
    field: "open",
    operator: "=",
    value: true,
  });
}

export async function fetchCsatMetrics(
  credential: IntercomCredential,
  range: { start: number; end: number },
): Promise<{ rated4Plus: number; totalRated: number }> {
  const dateFilters: IntercomSearchQuery[] = [
    {
      field: "conversation_rating.replied_at",
      operator: ">",
      value: String(range.start),
    },
    {
      field: "conversation_rating.replied_at",
      operator: "<",
      value: String(range.end),
    },
  ];

  const [totalRated, rated4Plus] = await Promise.all([
    countSearchResults(credential, "conversations", {
      operator: "AND",
      value: dateFilters,
    }),
    countSearchResults(credential, "conversations", {
      operator: "AND",
      value: [
        ...dateFilters,
        {
          field: "conversation_rating.score",
          operator: "IN",
          value: ["4", "5"],
        },
      ],
    }),
  ]);

  return { rated4Plus, totalRated };
}

export async function fetchConversationsForMedianResponse(
  credential: IntercomCredential,
  range: { start: number; end: number },
): Promise<IntercomConversation[]> {
  const query: IntercomSearchQuery = {
    operator: "AND",
    value: [
      {
        field: "statistics.first_admin_reply_at",
        operator: ">",
        value: String(range.start),
      },
      {
        field: "statistics.first_admin_reply_at",
        operator: "<",
        value: String(range.end),
      },
    ],
  };

  const conversations: IntercomConversation[] = [];
  let startingAfter: string | undefined;

  for (let page = 0; page < MAX_RESPONSE_PAGES; page += 1) {
    const response = await searchConversations(credential, query, {
      per_page: SEARCH_PER_PAGE,
      starting_after: startingAfter,
    });

    const batch = response.conversations ?? [];
    conversations.push(...batch);

    const nextCursor = response.pages?.next?.starting_after;
    if (!nextCursor || batch.length < SEARCH_PER_PAGE) {
      break;
    }
    startingAfter = nextCursor;
  }

  return conversations;
}

export async function countActiveContactsInRange(
  credential: IntercomCredential,
  range: { start: number; end: number },
): Promise<number> {
  return countSearchResults(credential, "contacts", {
    operator: "AND",
    value: [
      {
        field: "last_request_at",
        operator: ">",
        value: String(range.start),
      },
      {
        field: "last_request_at",
        operator: "<",
        value: String(range.end),
      },
    ],
  });
}

export function buildCredentialFromMe(
  accessToken: string,
  me: IntercomMeResponse,
): IntercomCredential {
  const app = me.app;
  return {
    accessToken,
    appId: app?.id_code?.trim() || "intercom",
    appName: app?.name?.trim() || "Intercom",
    region: app?.region?.trim() || "US",
    timezone: app?.timezone?.trim() || "Europe/Paris",
  };
}
