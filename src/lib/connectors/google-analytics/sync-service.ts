import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildAccessTokenExpiry,
  exchangeGoogleAnalyticsCode,
} from "@/lib/connectors/google-analytics/oauth";
import {
  ensureFreshAccessToken,
  parseGoogleAnalyticsConnectInput,
  validateGoogleAnalyticsCredential,
} from "@/lib/connectors/google-analytics/client";
import { fetchGoogleAnalyticsConnectorSync } from "@/lib/connectors/google-analytics/metrics";
import type { GoogleAnalyticsCredential } from "@/lib/connectors/google-analytics/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadGoogleAnalyticsCredential(
  userId: string,
  projectId: string,
): Promise<GoogleAnalyticsCredential | null> {
  const stored = await loadConnectorCredential<GoogleAnalyticsCredential>(
    userId,
    projectId,
    "google-analytics",
  );
  return stored?.data ?? null;
}

async function persistGoogleAnalyticsCredential(
  userId: string,
  projectId: string,
  credential: GoogleAnalyticsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await saveConnectorCredential(userId, projectId, "google-analytics", credential, {
    oauthConnected: true,
    propertyId: credential.propertyId,
    ...metadata,
  });
}

export async function saveGoogleAnalyticsCredentialState(
  userId: string,
  projectId: string,
  credential: GoogleAnalyticsCredential,
  metadata?: Record<string, unknown>,
): Promise<void> {
  await persistGoogleAnalyticsCredential(userId, projectId, credential, metadata);
}

export async function saveGoogleAnalyticsOAuthTokens(
  userId: string,
  projectId: string,
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  },
): Promise<void> {
  const existing = await loadGoogleAnalyticsCredential(userId, projectId);
  const credential: GoogleAnalyticsCredential = {
    refreshToken: tokens.refreshToken || existing?.refreshToken || "",
    accessToken: tokens.accessToken,
    accessTokenExpiresAt: buildAccessTokenExpiry(tokens.expiresIn),
    propertyId: existing?.propertyId,
    propertyDisplayName: existing?.propertyDisplayName,
    signupEvent: existing?.signupEvent,
    trialEvent: existing?.trialEvent,
  };

  if (!credential.refreshToken) {
    throw new Error("Refresh token Google Analytics manquant — réautorisez l'accès OAuth");
  }

  await persistGoogleAnalyticsCredential(userId, projectId, credential, {
    accountLabel: existing?.propertyDisplayName
      ? undefined
      : "Google Analytics (OAuth)",
    oauthConnected: true,
  });
}

export async function saveGoogleAnalyticsCredentialWithProperty(
  userId: string,
  projectId: string,
  input: {
    propertyId: string;
    propertyDisplayName?: string;
    signupEvent?: string | null;
    trialEvent?: string | null;
  },
): Promise<{ accountLabel: string; credential: GoogleAnalyticsCredential }> {
  const existing = await loadGoogleAnalyticsCredential(userId, projectId);
  if (!existing?.refreshToken) {
    throw new Error("Google Analytics non autorisé — lancez d'abord la connexion OAuth");
  }

  const { credential: freshExisting, refreshed } = await ensureFreshAccessToken(existing);
  const parsed = parseGoogleAnalyticsConnectInput(input);

  const credential: GoogleAnalyticsCredential = {
    ...freshExisting,
    ...parsed,
    propertyDisplayName:
      parsed.propertyDisplayName ?? input.propertyDisplayName?.trim() ?? freshExisting.propertyDisplayName,
  };

  const { accountLabel, property } = await validateGoogleAnalyticsCredential(credential);
  credential.propertyDisplayName = property.displayName;

  if (refreshed) {
    await persistGoogleAnalyticsCredential(userId, projectId, credential, {
      accountLabel,
    });
  }

  await persistGoogleAnalyticsCredential(userId, projectId, credential, {
    accountLabel,
    propertyId: credential.propertyId,
    hasSignupEvent: Boolean(credential.signupEvent),
    hasTrialEvent: Boolean(credential.trialEvent),
  });

  return { accountLabel, credential };
}

export async function runGoogleAnalyticsSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string; tokenExpiresAt?: string }> {
  const loaded = await loadGoogleAnalyticsCredential(userId, projectId);
  if (!loaded?.refreshToken) {
    throw new Error("Google Analytics non connecté pour ce projet");
  }
  if (!loaded.propertyId) {
    throw new Error("Propriété GA4 non sélectionnée — terminez la configuration");
  }

  const { credential: freshCredential, refreshed } = await ensureFreshAccessToken(loaded);
  const result = await fetchGoogleAnalyticsConnectorSync(freshCredential);

  if (refreshed) {
    await persistGoogleAnalyticsCredential(userId, projectId, freshCredential, {
      accountLabel: result.accountLabel,
    });
  }

  return {
    snapshots: result.snapshots,
    stream: result.stream,
    accountLabel: result.accountLabel ?? "Google Analytics",
    syncedAt: result.syncedAt,
    tokenExpiresAt: freshCredential.accessTokenExpiresAt,
  };
}

export async function disconnectGoogleAnalytics(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "google-analytics");
}

export async function exchangeAndStoreGoogleAnalyticsOAuth(
  userId: string,
  projectId: string,
  code: string,
): Promise<void> {
  const tokens = await exchangeGoogleAnalyticsCode(code);
  if (!tokens.refreshToken) {
    const existing = await loadGoogleAnalyticsCredential(userId, projectId);
    if (!existing?.refreshToken) {
      throw new Error(
        "Refresh token manquant — révoquez l'accès et reconnectez Google Analytics",
      );
    }
  }

  await saveGoogleAnalyticsOAuthTokens(userId, projectId, {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken ?? "",
    expiresIn: tokens.expiresIn,
  });
}
