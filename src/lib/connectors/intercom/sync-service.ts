import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildCredentialFromMe,
  getMe,
  validateIntercomCredential,
} from "@/lib/connectors/intercom/client";
import { exchangeIntercomCode } from "@/lib/connectors/intercom/oauth";
import { fetchIntercomConnectorSync } from "@/lib/connectors/intercom/metrics";
import type { IntercomCredential } from "@/lib/connectors/intercom/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadIntercomCredential(
  userId: string,
  projectId: string,
): Promise<IntercomCredential | null> {
  const stored = await loadConnectorCredential<IntercomCredential>(
    userId,
    projectId,
    "intercom",
  );
  return stored?.data ?? null;
}

async function persistIntercomCredential(
  userId: string,
  projectId: string,
  credential: IntercomCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "intercom", credential, {
    oauthConnected: true,
    accountLabel: credential.appName,
    appId: credential.appId,
    region: credential.region,
    ...metadata,
  });
}

export async function saveIntercomCredential(
  userId: string,
  projectId: string,
  credential: IntercomCredential,
): Promise<{ accountLabel: string; credential: IntercomCredential }> {
  const validated = await validateIntercomCredential(credential);
  await persistIntercomCredential(userId, projectId, validated.credential, {
    accountLabel: validated.accountLabel,
  });
  return validated;
}

export async function runIntercomSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadIntercomCredential(userId, projectId);
  if (!credential?.accessToken) {
    throw new Error("Intercom non connecté pour ce projet");
  }

  const result = await fetchIntercomConnectorSync(credential);

  return {
    ...result,
    accountLabel: credential.appName?.trim() || credential.appId,
  };
}

export async function disconnectIntercom(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "intercom");
}

export async function exchangeAndStoreIntercomOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<{ accountLabel: string }> {
  const { accessToken } = await exchangeIntercomCode(code);
  const me = await getMe(accessToken);
  const credential = buildCredentialFromMe(accessToken, me);
  const { accountLabel } = await saveIntercomCredential(userId, projectId, credential);
  return { accountLabel };
}
