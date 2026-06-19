import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildCredentialFromTokens,
  ensureFreshAccessToken,
  getCurrentUser,
  validatePipedriveCredential,
} from "@/lib/connectors/pipedrive/client";
import { exchangePipedriveCode } from "@/lib/connectors/pipedrive/oauth";
import { fetchPipedriveConnectorSync } from "@/lib/connectors/pipedrive/metrics";
import type { PipedriveCredential } from "@/lib/connectors/pipedrive/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadPipedriveCredential(
  userId: string,
  projectId: string,
): Promise<PipedriveCredential | null> {
  const stored = await loadConnectorCredential<PipedriveCredential>(
    userId,
    projectId,
    "pipedrive",
  );
  return stored?.data ?? null;
}

async function persistPipedriveCredential(
  userId: string,
  projectId: string,
  credential: PipedriveCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "pipedrive", credential, {
    oauthConnected: true,
    accountLabel: credential.companyName,
    companyId: credential.companyId,
    ...metadata,
  });
}

export async function savePipedriveCredential(
  userId: string,
  projectId: string,
  credential: PipedriveCredential,
): Promise<{ accountLabel: string; credential: PipedriveCredential }> {
  const validated = await validatePipedriveCredential(credential);
  await persistPipedriveCredential(userId, projectId, validated.credential, {
    accountLabel: validated.accountLabel,
  });
  return validated;
}

export async function runPipedriveSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const loaded = await loadPipedriveCredential(userId, projectId);
  if (!loaded?.accessToken) {
    throw new Error("Pipedrive non connecté pour ce projet");
  }

  const { credential: fresh, refreshed } = await ensureFreshAccessToken(loaded);
  const result = await fetchPipedriveConnectorSync(fresh);

  if (refreshed) {
    await persistPipedriveCredential(userId, projectId, fresh, {
      accountLabel: fresh.companyName,
    });
  }

  return {
    ...result,
    accountLabel: fresh.companyName?.trim() || "Pipedrive",
  };
}

export async function disconnectPipedrive(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "pipedrive");
}

export async function exchangeAndStorePipedriveOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<{ accountLabel: string }> {
  const tokens = await exchangePipedriveCode(code);
  const credential = buildCredentialFromTokens(tokens);

  const me = await getCurrentUser(credential);
  const enriched = {
    ...credential,
    companyName: me?.company_name?.trim() || credential.companyName,
    companyId: me?.company_id ?? credential.companyId,
  };

  const { accountLabel } = await savePipedriveCredential(userId, projectId, enriched);
  return { accountLabel };
}
