import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  ensureFreshSentryCredential,
  resolveOrganizationFromInstallation,
  validateSentryProjectSelection,
} from "@/lib/connectors/sentry/client";
import {
  exchangeSentryInstallCode,
  verifySentryInstallation,
} from "@/lib/connectors/sentry/oauth";
import { fetchSentryConnectorSync } from "@/lib/connectors/sentry/metrics";
import { buildAccountLabel } from "@/lib/connectors/sentry/streams";
import type { SentryConnectInput, SentryCredential } from "@/lib/connectors/sentry/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";
import { getSentryApiHost } from "@/lib/connectors/sentry/oauth";

export async function loadSentryCredential(
  userId: string,
  projectId: string,
): Promise<SentryCredential | null> {
  const stored = await loadConnectorCredential<SentryCredential>(userId, projectId, "sentry");
  return stored?.data ?? null;
}

async function persistSentryCredential(
  userId: string,
  projectId: string,
  credential: SentryCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "sentry", credential, {
    oauthConnected: true,
    organizationSlug: credential.organizationSlug,
    projectName: credential.projectName,
    ...metadata,
  });
}

export async function saveSentryOAuthTokens(
  userId: string,
  projectId: string,
  input: {
    installationId: string;
    code: string;
    organizationSlug?: string;
    organizationId?: string;
  },
): Promise<SentryCredential> {
  const tokens = await exchangeSentryInstallCode(input.installationId, input.code);
  await verifySentryInstallation(input.installationId, tokens.token);

  const credential: SentryCredential = {
    installationId: input.installationId,
    accessToken: tokens.token,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
    organizationSlug: input.organizationSlug ?? "",
    organizationId: input.organizationId,
    apiHost: getSentryApiHost(),
  };

  const resolved = await resolveOrganizationFromInstallation(credential);
  await persistSentryCredential(userId, projectId, resolved, {
    accountLabel: buildAccountLabel(resolved.organizationSlug),
    oauthConnected: true,
    tokenExpiresAt: resolved.expiresAt,
  });

  return resolved;
}

export async function saveSentryCredentialWithProject(
  userId: string,
  projectId: string,
  input: SentryConnectInput,
): Promise<{ accountLabel: string; credential: SentryCredential }> {
  const existing = await loadSentryCredential(userId, projectId);
  if (!existing?.installationId || !existing.accessToken) {
    throw new Error("Sentry non autorisé — lancez d'abord la connexion OAuth");
  }

  const { credential: freshCredential, refreshed } = await ensureFreshSentryCredential(existing);
  const { project, accountLabel } = await validateSentryProjectSelection(freshCredential, input);

  const credential: SentryCredential = {
    ...freshCredential,
    sentryProjectId: project.id,
    sentryProjectSlug: project.slug,
    projectName: project.name,
  };

  await persistSentryCredential(userId, projectId, credential, {
    accountLabel,
    projectName: project.name,
    sentryProjectId: project.id,
    tokenExpiresAt: credential.expiresAt,
  });

  if (refreshed) {
    await persistSentryCredential(userId, projectId, credential, { accountLabel });
  }

  return { accountLabel, credential };
}

export async function runSentrySync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string; tokenExpiresAt?: string }> {
  const loaded = await loadSentryCredential(userId, projectId);
  if (!loaded?.installationId) {
    throw new Error("Sentry non connecté pour ce projet");
  }
  if (!loaded.sentryProjectId) {
    throw new Error("Projet Sentry non sélectionné — terminez la configuration");
  }

  const { credential: freshCredential, refreshed } = await ensureFreshSentryCredential(loaded);
  const result = await fetchSentryConnectorSync(freshCredential);

  if (refreshed) {
    await persistSentryCredential(userId, projectId, freshCredential, {
      accountLabel: result.accountLabel,
      tokenExpiresAt: freshCredential.expiresAt,
    });
  }

  return {
    stream: result.stream,
    accountLabel: result.accountLabel,
    syncedAt: result.syncedAt,
    tokenExpiresAt: freshCredential.expiresAt,
  };
}

export async function deleteSentryCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "sentry");
}

export async function exchangeAndStoreSentryOAuth(
  userId: string,
  projectId: string,
  installationId: string,
  code: string,
): Promise<void> {
  await saveSentryOAuthTokens(userId, projectId, { installationId, code });
}

export async function connectSentryWithProject(
  userId: string,
  projectId: string,
  input: SentryConnectInput,
): Promise<ConnectorSyncResult & { accountLabel: string; tokenExpiresAt?: string }> {
  await saveSentryCredentialWithProject(userId, projectId, input);
  return runSentrySync(userId, projectId);
}
