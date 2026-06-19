import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildCredentialFromOrganization,
  ensureFreshAccessToken,
  getOrganization,
  validateQontoCredential,
} from "@/lib/connectors/qonto/client";
import { buildAccessTokenExpiry, exchangeQontoCode } from "@/lib/connectors/qonto/oauth";
import { fetchQontoConnectorSync } from "@/lib/connectors/qonto/metrics";
import type { QontoCredential } from "@/lib/connectors/qonto/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadQontoCredential(
  userId: string,
  projectId: string,
): Promise<QontoCredential | null> {
  const stored = await loadConnectorCredential<QontoCredential>(userId, projectId, "qonto");
  return stored?.data ?? null;
}

async function persistQontoCredential(
  userId: string,
  projectId: string,
  credential: QontoCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "qonto", credential, {
    oauthConnected: true,
    organizationId: credential.organizationId,
    accountLabel: credential.organizationName,
    ...metadata,
  });
}

export async function saveQontoCredential(
  userId: string,
  projectId: string,
  credential: QontoCredential,
): Promise<{ accountLabel: string; credential: QontoCredential }> {
  const validated = await validateQontoCredential(credential);
  await persistQontoCredential(userId, projectId, validated.credential, {
    accountLabel: validated.accountLabel,
  });
  return validated;
}

export async function runQontoSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadQontoCredential(userId, projectId);
  if (!credential?.refreshToken) {
    throw new Error("Qonto non connecté pour ce projet");
  }

  const { credential: freshCredential, refreshed: preRefresh } = await ensureFreshAccessToken(
    credential,
  );
  if (preRefresh) {
    await persistQontoCredential(userId, projectId, freshCredential);
  }

  const result = await fetchQontoConnectorSync(freshCredential);

  if (result.refreshedCredential) {
    await persistQontoCredential(userId, projectId, result.refreshedCredential, {
      accountLabel: result.accountLabel,
    });
  }

  return {
    stream: result.stream,
    accountLabel: result.accountLabel ?? freshCredential.organizationName,
    syncedAt: result.syncedAt,
    tokenExpiresAt: result.tokenExpiresAt,
  };
}

export async function disconnectQonto(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "qonto");
}

export async function exchangeAndStoreQontoOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<{ accountLabel: string }> {
  const tokens = await exchangeQontoCode(code);
  const tempCredential: QontoCredential = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    organizationId: "",
    organizationSlug: "",
    organizationName: "Qonto",
  };
  const org = await getOrganization(tempCredential);
  const credential = buildCredentialFromOrganization(tokens, org.organization);
  const { accountLabel } = await saveQontoCredential(userId, projectId, credential);
  return { accountLabel };
}
