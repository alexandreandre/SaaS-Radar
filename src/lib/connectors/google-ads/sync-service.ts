import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildAccessTokenExpiry,
  exchangeGoogleAdsCode,
} from "@/lib/connectors/google-ads/oauth";
import {
  ensureFreshAccessToken,
  validateGoogleAdsCredential,
} from "@/lib/connectors/google-ads/client";
import { normalizeCustomerId } from "@/lib/connectors/google-ads/snapshots";
import { fetchGoogleAdsConnectorSync } from "@/lib/connectors/google-ads/metrics";
import type { GoogleAdsCredential } from "@/lib/connectors/google-ads/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadGoogleAdsCredential(
  userId: string,
  projectId: string,
): Promise<GoogleAdsCredential | null> {
  const stored = await loadConnectorCredential<GoogleAdsCredential>(
    userId,
    projectId,
    "google-ads",
  );
  return stored?.data ?? null;
}

async function persistGoogleAdsCredential(
  userId: string,
  projectId: string,
  credential: GoogleAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "google-ads", credential, {
    oauthConnected: true,
    customerId: credential.customerId,
    ...metadata,
  });
}

export async function saveGoogleAdsCredentialState(
  userId: string,
  projectId: string,
  credential: GoogleAdsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await persistGoogleAdsCredential(userId, projectId, credential, metadata);
}

export async function saveGoogleAdsOAuthTokens(
  userId: string,
  projectId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  },
): Promise<void> {
  const existing = await loadGoogleAdsCredential(userId, projectId);
  const credential: GoogleAdsCredential = {
    refreshToken: tokens.refreshToken || existing?.refreshToken || "",
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    customerId: existing?.customerId,
    loginCustomerId: existing?.loginCustomerId,
    currencyCode: existing?.currencyCode,
  };

  if (!credential.refreshToken) {
    throw new Error("Refresh token Google Ads manquant — réautorisez l'accès OAuth");
  }

  await persistGoogleAdsCredential(userId, projectId, credential, {
    accountLabel: existing?.customerId ? undefined : "Google Ads (OAuth)",
    oauthConnected: true,
  });
}

export async function saveGoogleAdsCredentialWithCustomer(
  userId: string,
  projectId: string,
  customerId: string,
  loginCustomerId?: string,
): Promise<{ accountLabel: string; credential: GoogleAdsCredential }> {
  const existing = await loadGoogleAdsCredential(userId, projectId);
  if (!existing?.refreshToken) {
    throw new Error("Google Ads non autorisé — lancez d'abord la connexion OAuth");
  }

  const { credential: freshExisting } = await ensureFreshAccessToken(existing);

  const credential: GoogleAdsCredential = {
    ...freshExisting,
    customerId: normalizeCustomerId(customerId),
    loginCustomerId: loginCustomerId
      ? normalizeCustomerId(loginCustomerId)
      : freshExisting.loginCustomerId,
  };

  const account = await validateGoogleAdsCredential(credential);
  credential.currencyCode = account.currencyCode;

  await persistGoogleAdsCredential(userId, projectId, credential, {
    accountLabel: account.descriptiveName,
    currencyCode: account.currencyCode,
  });

  return { accountLabel: account.descriptiveName, credential };
}

export async function runGoogleAdsSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const loaded = await loadGoogleAdsCredential(userId, projectId);
  if (!loaded?.refreshToken) {
    throw new Error("Google Ads non connecté pour ce projet");
  }

  const { credential: freshCredential, refreshed } = await ensureFreshAccessToken(loaded);
  const result = await fetchGoogleAdsConnectorSync(freshCredential);

  const credentialToSave = result.updatedCredential ?? freshCredential;
  if (refreshed || result.updatedCredential) {
    await persistGoogleAdsCredential(userId, projectId, credentialToSave, {
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

export async function disconnectGoogleAds(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "google-ads");
}

export async function exchangeAndStoreGoogleAdsOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<void> {
  const tokens = await exchangeGoogleAdsCode(code);
  if (!tokens.refreshToken) {
    const existing = await loadGoogleAdsCredential(userId, projectId);
    if (!existing?.refreshToken) {
      throw new Error("Refresh token manquant — révoquez l'accès et reconnectez Google Ads");
    }
  }

  await saveGoogleAdsOAuthTokens(userId, projectId, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? "",
    expiresIn: tokens.expiresIn,
  });
}
