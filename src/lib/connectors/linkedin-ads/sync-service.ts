import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildAccessTokenExpiry,
  buildRefreshTokenExpiry,
  exchangeLinkedInAdsCode,
} from "@/lib/connectors/linkedin-ads/oauth";
import {
  ensureFreshAccessToken,
  validateLinkedInAdsCredential,
} from "@/lib/connectors/linkedin-ads/client";
import { normalizeAdAccountId, toAdAccountUrn } from "@/lib/connectors/linkedin-ads/snapshots";
import { fetchLinkedInAdsConnectorSync } from "@/lib/connectors/linkedin-ads/metrics";
import type { LinkedInAdsCredential } from "@/lib/connectors/linkedin-ads/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadLinkedInAdsCredential(
  userId: string,
  projectId: string,
): Promise<LinkedInAdsCredential | null> {
  const stored = await loadConnectorCredential<LinkedInAdsCredential>(
    userId,
    projectId,
    "linkedin-ads",
  );
  return stored?.data ?? null;
}

async function persistLinkedInAdsCredential(
  userId: string,
  projectId: string,
  credential: LinkedInAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "linkedin-ads", credential, {
    oauthConnected: true,
    adAccountId: credential.adAccountId,
    livemode: true,
    ...metadata,
  });
}

export async function saveLinkedInAdsCredentialState(
  userId: string,
  projectId: string,
  credential: LinkedInAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await persistLinkedInAdsCredential(userId, projectId, credential, metadata);
}

export async function saveLinkedInAdsOAuthTokens(
  userId: string,
  projectId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn?: number;
  },
): Promise<void> {
  const existing = await loadLinkedInAdsCredential(userId, projectId);
  const credential: LinkedInAdsCredential = {
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt: buildRefreshTokenExpiry(tokens.refreshExpiresIn),
    adAccountId: existing?.adAccountId,
    adAccountUrn: existing?.adAccountUrn,
    accountName: existing?.accountName,
    currencyCode: existing?.currencyCode,
  };

  await persistLinkedInAdsCredential(userId, projectId, credential, {
    accountLabel: existing?.accountName ?? "LinkedIn Ads (OAuth)",
    oauthConnected: true,
  });
}

export async function saveLinkedInAdsCredentialWithAdAccount(
  userId: string,
  projectId: string,
  adAccountId: string,
): Promise<{ accountLabel: string; credential: LinkedInAdsCredential }> {
  const existing = await loadLinkedInAdsCredential(userId, projectId);
  if (!existing?.accessToken) {
    throw new Error("LinkedIn Ads non autorisé — lancez d'abord la connexion OAuth");
  }

  const { credential: freshExisting } = await ensureFreshAccessToken(existing);
  const normalizedId = normalizeAdAccountId(adAccountId);

  const credential: LinkedInAdsCredential = {
    ...freshExisting,
    adAccountId: normalizedId,
    adAccountUrn: toAdAccountUrn(normalizedId),
  };

  const account = await validateLinkedInAdsCredential(credential);
  credential.accountName = account.name;
  credential.currencyCode = account.currencyCode;
  credential.adAccountUrn = account.adAccountUrn;

  await persistLinkedInAdsCredential(userId, projectId, credential, {
    accountLabel: account.name,
    currencyCode: account.currencyCode,
  });

  return { accountLabel: account.name, credential };
}

export async function runLinkedInAdsSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const loaded = await loadLinkedInAdsCredential(userId, projectId);
  if (!loaded?.accessToken) {
    throw new Error("LinkedIn Ads non connecté pour ce projet");
  }

  const { credential: freshCredential, refreshed } = await ensureFreshAccessToken(loaded);
  const result = await fetchLinkedInAdsConnectorSync(freshCredential);

  const credentialToSave = result.updatedCredential ?? freshCredential;
  if (refreshed || result.updatedCredential) {
    await persistLinkedInAdsCredential(userId, projectId, credentialToSave, {
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

export async function disconnectLinkedInAds(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "linkedin-ads");
}

export async function exchangeAndStoreLinkedInAdsOAuth(
  userId: string,
  projectId: string,
  authCode: string,
): Promise<void> {
  const exchanged = await exchangeLinkedInAdsCode(authCode);

  await saveLinkedInAdsOAuthTokens(userId, projectId, {
    accessToken: exchanged.accessToken,
    refreshToken: exchanged.refreshToken,
    expiresIn: exchanged.expiresIn,
    refreshExpiresIn: exchanged.refreshExpiresIn,
  });
}
