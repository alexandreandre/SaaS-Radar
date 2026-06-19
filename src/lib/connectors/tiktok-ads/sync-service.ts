import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildAccessTokenExpiry,
  buildRefreshTokenExpiry,
  exchangeTikTokAdsCode,
} from "@/lib/connectors/tiktok-ads/oauth";
import {
  ensureFreshAccessToken,
  validateTikTokAdsCredential,
} from "@/lib/connectors/tiktok-ads/client";
import { normalizeAdvertiserId } from "@/lib/connectors/tiktok-ads/snapshots";
import { fetchTikTokAdsConnectorSync } from "@/lib/connectors/tiktok-ads/metrics";
import type { TikTokAdsCredential } from "@/lib/connectors/tiktok-ads/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadTikTokAdsCredential(
  userId: string,
  projectId: string,
): Promise<TikTokAdsCredential | null> {
  const stored = await loadConnectorCredential<TikTokAdsCredential>(
    userId,
    projectId,
    "tiktok-ads",
  );
  return stored?.data ?? null;
}

async function persistTikTokAdsCredential(
  userId: string,
  projectId: string,
  credential: TikTokAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "tiktok-ads", credential, {
    oauthConnected: true,
    advertiserId: credential.advertiserId,
    ...metadata,
  });
}

export async function saveTikTokAdsCredentialState(
  userId: string,
  projectId: string,
  credential: TikTokAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await persistTikTokAdsCredential(userId, projectId, credential, metadata);
}

export async function saveTikTokAdsOAuthTokens(
  userId: string,
  projectId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    refreshExpiresIn?: number;
  },
): Promise<void> {
  const existing = await loadTikTokAdsCredential(userId, projectId);
  const credential: TikTokAdsCredential = {
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    refreshToken: tokens.refreshToken,
    refreshTokenExpiresAt: buildRefreshTokenExpiry(tokens.refreshExpiresIn),
    advertiserId: existing?.advertiserId,
    currencyCode: existing?.currencyCode,
  };

  await persistTikTokAdsCredential(userId, projectId, credential, {
    accountLabel: existing?.advertiserId ? undefined : "TikTok Ads (OAuth)",
    oauthConnected: true,
  });
}

export async function saveTikTokAdsCredentialWithAdvertiser(
  userId: string,
  projectId: string,
  advertiserId: string,
): Promise<{ accountLabel: string; credential: TikTokAdsCredential }> {
  const existing = await loadTikTokAdsCredential(userId, projectId);
  if (!existing?.accessToken) {
    throw new Error("TikTok Ads non autorisé — lancez d'abord la connexion OAuth");
  }

  const { credential: freshExisting } = await ensureFreshAccessToken(existing);

  const credential: TikTokAdsCredential = {
    ...freshExisting,
    advertiserId: normalizeAdvertiserId(advertiserId),
  };

  const account = await validateTikTokAdsCredential(credential);
  credential.currencyCode = account.currencyCode;

  await persistTikTokAdsCredential(userId, projectId, credential, {
    accountLabel: account.name,
    currencyCode: account.currencyCode,
  });

  return { accountLabel: account.name, credential };
}

export async function runTikTokAdsSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const loaded = await loadTikTokAdsCredential(userId, projectId);
  if (!loaded?.accessToken) {
    throw new Error("TikTok Ads non connecté pour ce projet");
  }

  const { credential: freshCredential, refreshed } = await ensureFreshAccessToken(loaded);
  const result = await fetchTikTokAdsConnectorSync(freshCredential);

  const credentialToSave = result.updatedCredential ?? freshCredential;
  if (refreshed || result.updatedCredential) {
    await persistTikTokAdsCredential(userId, projectId, credentialToSave, {
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

export async function disconnectTikTokAds(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "tiktok-ads");
}

export async function exchangeAndStoreTikTokAdsOAuth(
  userId: string,
  projectId: string,
  authCode: string,
): Promise<void> {
  const exchanged = await exchangeTikTokAdsCode(authCode);

  await saveTikTokAdsOAuthTokens(userId, projectId, {
    accessToken: exchanged.accessToken,
    refreshToken: exchanged.refreshToken,
    expiresIn: exchanged.expiresIn,
    refreshExpiresIn: exchanged.refreshExpiresIn,
  });
}
