import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildHubSpotAccountLabel,
  ensureFreshAccessToken,
  getAccessTokenInfo,
  validateHubSpotCredential,
} from "@/lib/connectors/hubspot/client";
import { fetchHubSpotConnectorSync } from "@/lib/connectors/hubspot/metrics";
import {
  buildAccessTokenExpiry,
  exchangeHubSpotCode,
} from "@/lib/connectors/hubspot/oauth";
import type { HubSpotCredential } from "@/lib/connectors/hubspot/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadHubSpotCredential(
  userId: string,
  projectId: string,
): Promise<HubSpotCredential | null> {
  const stored = await loadConnectorCredential<HubSpotCredential>(
    userId,
    projectId,
    "hubspot",
  );
  return stored?.data ?? null;
}

async function persistHubSpotCredential(
  userId: string,
  projectId: string,
  credential: HubSpotCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "hubspot", credential, {
    oauthConnected: true,
    accountLabel: buildHubSpotAccountLabel(credential),
    hubId: credential.hubId,
    hubDomain: credential.hubDomain,
    ...metadata,
  });
}

export async function saveHubSpotCredential(
  userId: string,
  projectId: string,
  credential: HubSpotCredential,
): Promise<{ accountLabel: string; credential: HubSpotCredential }> {
  const validated = await validateHubSpotCredential(credential);
  await persistHubSpotCredential(userId, projectId, validated.credential, {
    accountLabel: validated.accountLabel,
  });
  return validated;
}

export async function runHubSpotSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const loaded = await loadHubSpotCredential(userId, projectId);
  if (!loaded?.accessToken || !loaded.refreshToken) {
    throw new Error("HubSpot non connecté pour ce projet");
  }

  const { credential: freshCredential, refreshed } = await ensureFreshAccessToken(loaded);
  if (refreshed) {
    await persistHubSpotCredential(userId, projectId, freshCredential);
  }

  const result = await fetchHubSpotConnectorSync(freshCredential);
  const accountLabel = buildHubSpotAccountLabel(freshCredential);

  return {
    ...result,
    accountLabel,
  };
}

export async function disconnectHubSpot(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "hubspot");
}

export async function exchangeAndStoreHubSpotOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<{ accountLabel: string }> {
  const tokens = await exchangeHubSpotCode(code);
  const info = await getAccessTokenInfo(tokens.accessToken);

  const credential: HubSpotCredential = {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    hubId: info.hub_id !== undefined ? String(info.hub_id) : undefined,
    hubDomain: info.hub_domain,
    portalLabel: info.hub_domain,
  };

  const { accountLabel } = await saveHubSpotCredential(userId, projectId, credential);
  return { accountLabel };
}
