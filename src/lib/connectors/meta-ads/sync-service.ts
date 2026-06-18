import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildAccessTokenExpiry,
  exchangeLongLivedToken,
  exchangeMetaAdsCode,
} from "@/lib/connectors/meta-ads/oauth";
import {
  ensureFreshAccessToken,
  validateMetaAdsCredential,
} from "@/lib/connectors/meta-ads/client";
import { normalizeAdAccountId } from "@/lib/connectors/meta-ads/snapshots";
import { fetchMetaAdsConnectorSync } from "@/lib/connectors/meta-ads/metrics";
import type { MetaAdsCredential } from "@/lib/connectors/meta-ads/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadMetaAdsCredential(
  userId: string,
  projectId: string,
): Promise<MetaAdsCredential | null> {
  const stored = await loadConnectorCredential<MetaAdsCredential>(
    userId,
    projectId,
    "meta-ads",
  );
  return stored?.data ?? null;
}

async function persistMetaAdsCredential(
  userId: string,
  projectId: string,
  credential: MetaAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "meta-ads", credential, {
    oauthConnected: true,
    adAccountId: credential.adAccountId,
    ...metadata,
  });
}

export async function saveMetaAdsCredentialState(
  userId: string,
  projectId: string,
  credential: MetaAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await persistMetaAdsCredential(userId, projectId, credential, metadata);
}

export async function saveMetaAdsOAuthTokens(
  userId: string,
  projectId: string,
  tokens: {
    accessToken: string;
    expiresIn: number;
  },
): Promise<void> {
  const existing = await loadMetaAdsCredential(userId, projectId);
  const credential: MetaAdsCredential = {
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    adAccountId: existing?.adAccountId,
    currencyCode: existing?.currencyCode,
  };

  await persistMetaAdsCredential(userId, projectId, credential, {
    accountLabel: existing?.adAccountId ? undefined : "Meta Ads (OAuth)",
    oauthConnected: true,
  });
}

export async function saveMetaAdsCredentialWithAdAccount(
  userId: string,
  projectId: string,
  adAccountId: string,
): Promise<{ accountLabel: string; credential: MetaAdsCredential }> {
  const existing = await loadMetaAdsCredential(userId, projectId);
  if (!existing?.accessToken) {
    throw new Error("Meta Ads non autorisé — lancez d'abord la connexion OAuth");
  }

  const { credential: freshExisting } = await ensureFreshAccessToken(existing);

  const credential: MetaAdsCredential = {
    ...freshExisting,
    adAccountId: normalizeAdAccountId(adAccountId),
  };

  const account = await validateMetaAdsCredential(credential);
  credential.currencyCode = account.currencyCode;

  await persistMetaAdsCredential(userId, projectId, credential, {
    accountLabel: account.name,
    currencyCode: account.currencyCode,
  });

  return { accountLabel: account.name, credential };
}

export async function runMetaAdsSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const loaded = await loadMetaAdsCredential(userId, projectId);
  if (!loaded?.accessToken) {
    throw new Error("Meta Ads non connecté pour ce projet");
  }

  const { credential: freshCredential, refreshed } = await ensureFreshAccessToken(loaded);
  const result = await fetchMetaAdsConnectorSync(freshCredential);

  const credentialToSave = result.updatedCredential ?? freshCredential;
  if (refreshed || result.updatedCredential) {
    await persistMetaAdsCredential(userId, projectId, credentialToSave, {
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

export async function disconnectMetaAds(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "meta-ads");
}

export async function exchangeAndStoreMetaAdsOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<void> {
  const shortLived = await exchangeMetaAdsCode(code);
  const longLived = await exchangeLongLivedToken(shortLived.accessToken);

  await saveMetaAdsOAuthTokens(userId, projectId, {
    accessToken: longLived.accessToken,
    expiresIn: longLived.expiresIn,
  });
}
