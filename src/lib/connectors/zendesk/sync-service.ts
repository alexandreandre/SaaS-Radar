import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  ensureFreshAccessToken,
  validateZendeskCredential,
} from "@/lib/connectors/zendesk/client";
import {
  buildCredentialFromTokens,
  exchangeZendeskCode,
} from "@/lib/connectors/zendesk/oauth";
import { fetchZendeskConnectorSync } from "@/lib/connectors/zendesk/metrics";
import type { ZendeskCredential } from "@/lib/connectors/zendesk/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadZendeskCredential(
  userId: string,
  projectId: string,
): Promise<ZendeskCredential | null> {
  const stored = await loadConnectorCredential<ZendeskCredential>(
    userId,
    projectId,
    "zendesk",
  );
  return stored?.data ?? null;
}

async function persistZendeskCredential(
  userId: string,
  projectId: string,
  credential: ZendeskCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "zendesk", credential, {
    oauthConnected: true,
    accountLabel: credential.accountName ?? credential.subdomain,
    subdomain: credential.subdomain,
    ...metadata,
  });
}

export async function saveZendeskCredential(
  userId: string,
  projectId: string,
  credential: ZendeskCredential,
): Promise<{ accountLabel: string; credential: ZendeskCredential }> {
  const validated = await validateZendeskCredential(credential);
  await persistZendeskCredential(userId, projectId, validated.credential, {
    accountLabel: validated.accountLabel,
  });
  return validated;
}

export async function runZendeskSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const loaded = await loadZendeskCredential(userId, projectId);
  if (!loaded?.accessToken) {
    throw new Error("Zendesk non connecté pour ce projet");
  }

  const { credential: fresh, refreshed } = await ensureFreshAccessToken(loaded);
  const result = await fetchZendeskConnectorSync(fresh);

  if (refreshed) {
    await persistZendeskCredential(userId, projectId, fresh, {
      accountLabel: fresh.accountName ?? fresh.subdomain,
    });
  }

  return {
    ...result,
    accountLabel: fresh.accountName?.trim() || fresh.subdomain,
  };
}

export async function disconnectZendesk(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "zendesk");
}

export async function exchangeAndStoreZendeskOAuth(
  userId: string,
  projectId: string,
  subdomain: string,
  code: string,
): Promise<{ accountLabel: string }> {
  const tokens = await exchangeZendeskCode(subdomain, code);
  const credential = buildCredentialFromTokens(subdomain, tokens);
  const { accountLabel } = await saveZendeskCredential(userId, projectId, credential);
  return { accountLabel };
}
