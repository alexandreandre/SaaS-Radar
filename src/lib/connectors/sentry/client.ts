import "server-only";

import {
  getSentryApiHost,
  refreshSentryTokenWithJwt,
  refreshSentryTokenWithRefreshToken,
} from "@/lib/connectors/sentry/oauth";
import { isSentryTokenExpired } from "@/lib/connectors/sentry/token";
import type {
  SentryConnectInput,
  SentryCredential,
  SentryInstallationDetails,
  SentryOrganizationSummary,
  SentryProjectSummary,
} from "@/lib/connectors/sentry/types";

export class SentryConnectorError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "SentryConnectorError";
    this.status = status;
  }
}

function apiBase(credential: Pick<SentryCredential, "apiHost">): string {
  const host = credential.apiHost?.trim() || getSentryApiHost();
  return `${host.replace(/\/$/, "")}/api/0`;
}

async function sleep(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function sentryFetch<T>(
  credential: SentryCredential,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const url = path.startsWith("http") ? path : `${apiBase(credential)}${path.startsWith("/") ? path : `/${path}`}`;

  let attempt = 0;
  while (attempt < 3) {
    attempt += 1;
    const res = await fetch(url, {
      ...init,
      headers: {
        Authorization: `Bearer ${credential.accessToken}`,
        Accept: "application/json",
        ...(init?.headers ?? {}),
      },
    });

    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("Retry-After") ?? "1");
      await sleep(Math.max(1, retryAfter) * 1000);
      continue;
    }

    if (!res.ok) {
      const text = await res.text();
      let message = `Erreur API Sentry (${res.status})`;
      try {
        const parsed = JSON.parse(text) as { detail?: string };
        if (parsed.detail) message = parsed.detail;
      } catch {
        if (text) message = text.slice(0, 240);
      }
      throw new SentryConnectorError(message, res.status);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (await res.json()) as T;
  }

  throw new SentryConnectorError("Rate limit Sentry — réessayez plus tard", 429);
}

export async function ensureFreshSentryCredential(
  credential: SentryCredential,
): Promise<{ credential: SentryCredential; refreshed: boolean }> {
  if (!isSentryTokenExpired(credential.expiresAt)) {
    return { credential, refreshed: false };
  }

  let tokens;
  try {
    tokens = await refreshSentryTokenWithJwt(credential.installationId);
  } catch {
    tokens = await refreshSentryTokenWithRefreshToken(
      credential.installationId,
      credential.refreshToken,
    );
  }

  return {
    credential: {
      ...credential,
      accessToken: tokens.token,
      refreshToken: tokens.refreshToken,
      expiresAt: tokens.expiresAt,
    },
    refreshed: true,
  };
}

export async function fetchInstallationDetails(
  credential: SentryCredential,
): Promise<SentryInstallationDetails> {
  return sentryFetch<SentryInstallationDetails>(
    credential,
    `/sentry-app-installations/${credential.installationId}/`,
  );
}

export async function fetchOrganizations(
  credential: SentryCredential,
): Promise<SentryOrganizationSummary[]> {
  return sentryFetch<SentryOrganizationSummary[]>(credential, "/organizations/");
}

export async function fetchOrganizationProjects(
  credential: SentryCredential,
  organizationSlug: string,
): Promise<SentryProjectSummary[]> {
  const projects = await sentryFetch<SentryProjectSummary[]>(
    credential,
    `/organizations/${encodeURIComponent(organizationSlug)}/projects/?per_page=100`,
  );
  return projects ?? [];
}

export function parseSentryConnectInput(input: SentryConnectInput): {
  sentryProjectId: string;
  sentryProjectSlug?: string;
  projectName?: string;
} {
  const sentryProjectId = input.sentryProjectId.trim();
  if (!sentryProjectId) {
    throw new SentryConnectorError("Projet Sentry requis", 400);
  }

  return {
    sentryProjectId,
    sentryProjectSlug: input.sentryProjectSlug?.trim() || undefined,
    projectName: input.projectName?.trim() || undefined,
  };
}

export async function validateSentryProjectSelection(
  credential: SentryCredential,
  input: SentryConnectInput,
): Promise<{ project: SentryProjectSummary; accountLabel: string }> {
  const parsed = parseSentryConnectInput(input);
  const projects = await fetchOrganizationProjects(credential, credential.organizationSlug);
  const project = projects.find(
    (item) => item.id === parsed.sentryProjectId || item.slug === parsed.sentryProjectSlug,
  );

  if (!project) {
    throw new SentryConnectorError(
      "Projet Sentry introuvable ou inaccessible — vérifiez les permissions de l'intégration",
      404,
    );
  }

  const accountLabel = `${project.name} (${credential.organizationSlug})`;
  return { project, accountLabel };
}

export async function resolveOrganizationFromInstallation(
  credential: SentryCredential,
): Promise<SentryCredential> {
  if (credential.organizationSlug) return credential;

  const installation = await fetchInstallationDetails(credential);
  const slug = installation.organization?.slug;
  if (!slug) {
    throw new SentryConnectorError(
      "Organisation Sentry introuvable pour cette installation",
      404,
    );
  }

  return {
    ...credential,
    organizationSlug: slug,
    organizationId: installation.organization?.id,
  };
}
