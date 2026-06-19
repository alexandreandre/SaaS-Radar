import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildAccessTokenExpiry,
  exchangeMicrosoftAdsCode,
  oauthProviderToIdentity,
  type MicrosoftAdsOAuthProvider,
} from "@/lib/connectors/microsoft-ads/oauth";
import {
  ensureFreshAccessToken,
  fetchAuthenticatedUser,
  validateMicrosoftAdsCredential,
} from "@/lib/connectors/microsoft-ads/client";
import {
  normalizeAccountId,
  normalizeCustomerId,
} from "@/lib/connectors/microsoft-ads/snapshots";
import { fetchMicrosoftAdsConnectorSync } from "@/lib/connectors/microsoft-ads/metrics";
import type { MicrosoftAdsCredential } from "@/lib/connectors/microsoft-ads/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadMicrosoftAdsCredential(
  userId: string,
  projectId: string,
): Promise<MicrosoftAdsCredential | null> {
  const stored = await loadConnectorCredential<MicrosoftAdsCredential>(
    userId,
    projectId,
    "microsoft-ads",
  );
  return stored?.data ?? null;
}

async function persistMicrosoftAdsCredential(
  userId: string,
  projectId: string,
  credential: MicrosoftAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "microsoft-ads", credential, {
    oauthConnected: true,
    accountId: credential.accountId,
    identityProvider: credential.identityProvider,
    ...metadata,
  });
}

export async function saveMicrosoftAdsCredentialState(
  userId: string,
  projectId: string,
  credential: MicrosoftAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await persistMicrosoftAdsCredential(userId, projectId, credential, metadata);
}

export async function saveMicrosoftAdsOAuthTokens(
  userId: string,
  projectId: string,
  provider: MicrosoftAdsOAuthProvider,
  tokens: {
    accessToken: string;
    refreshToken?: string;
    expiresIn: number;
  },
): Promise<void> {
  const existing = await loadMicrosoftAdsCredential(userId, projectId);
  const refreshToken = tokens.refreshToken || existing?.refreshToken || "";
  if (!refreshToken) {
    throw new Error("Refresh token Microsoft Ads manquant — réautorisez l'accès OAuth");
  }

  const credential: MicrosoftAdsCredential = {
    identityProvider: oauthProviderToIdentity(provider),
    refreshToken,
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    userId: existing?.userId,
    customerId: existing?.customerId,
    accountId: existing?.accountId,
    accountName: existing?.accountName,
    currencyCode: existing?.currencyCode,
  };

  await persistMicrosoftAdsCredential(userId, projectId, credential, {
    accountLabel: existing?.accountName ?? "Microsoft Ads (OAuth)",
    oauthConnected: true,
    identityProvider: credential.identityProvider,
  });
}

export async function saveMicrosoftAdsCredentialWithAccount(
  userId: string,
  projectId: string,
  accountId: string,
  customerId: string,
): Promise<{ accountLabel: string; credential: MicrosoftAdsCredential }> {
  const existing = await loadMicrosoftAdsCredential(userId, projectId);
  if (!existing?.refreshToken) {
    throw new Error("Microsoft Ads non autorisé — lancez d'abord la connexion OAuth");
  }

  const { credential: freshExisting } = await ensureFreshAccessToken(existing);
  const credential: MicrosoftAdsCredential = {
    ...freshExisting,
    accountId: normalizeAccountId(accountId),
    customerId: normalizeCustomerId(customerId),
  };

  const account = await validateMicrosoftAdsCredential(credential);
  credential.accountName = account.name;
  credential.currencyCode = account.currencyCode;

  const userResponse = await fetchAuthenticatedUser(credential);
  if (userResponse.User?.Id) {
    credential.userId = String(userResponse.User.Id);
  }

  await persistMicrosoftAdsCredential(userId, projectId, credential, {
    accountLabel: account.name,
    currencyCode: account.currencyCode,
  });

  return { accountLabel: account.name, credential };
}

export async function runMicrosoftAdsSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const loaded = await loadMicrosoftAdsCredential(userId, projectId);
  if (!loaded?.refreshToken) {
    throw new Error("Microsoft Ads non connecté pour ce projet");
  }

  const { credential: freshCredential, refreshed } = await ensureFreshAccessToken(loaded);
  const result = await fetchMicrosoftAdsConnectorSync(freshCredential);

  const credentialToSave = result.updatedCredential ?? freshCredential;
  if (refreshed || result.updatedCredential) {
    await persistMicrosoftAdsCredential(userId, projectId, credentialToSave, {
      accountLabel: result.accountLabel,
      currencyCode: credentialToSave.currencyCode,
    });
  }

  return {
    snapshots: result.snapshots,
    stream: result.stream,
    accountLabel: result.accountLabel,
    syncedAt: result.syncedAt,
    tokenExpiresAt: credentialToSave.accessTokenExpiresAt,
  };
}

export async function disconnectMicrosoftAds(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "microsoft-ads");
}

export async function exchangeAndStoreMicrosoftAdsOAuth(
  userId: string,
  projectId: string,
  code: string,
  provider: MicrosoftAdsOAuthProvider,
): Promise<void> {
  const tokens = await exchangeMicrosoftAdsCode(code, provider);
  await saveMicrosoftAdsOAuthTokens(userId, projectId, provider, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresIn: tokens.expiresIn,
  });
}
