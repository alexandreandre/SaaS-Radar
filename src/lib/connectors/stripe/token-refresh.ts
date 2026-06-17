import "server-only";

import { saveConnectorCredential } from "@/lib/connectors/credentials-store";
import { buildAccountMeta, fetchStripeAccount } from "@/lib/connectors/stripe/client";
import {
  isOAuthCredentialExpired,
  oauthTokenToCredential,
} from "@/lib/connectors/stripe/oauth-config";
import { refreshStripeAppToken } from "@/lib/connectors/stripe/oauth";
import type { StripeCredential, StripeOAuthCredential } from "@/lib/connectors/stripe/types";

export { isOAuthCredentialExpired } from "@/lib/connectors/stripe/oauth-config";

export async function ensureFreshOAuthCredential(
  userId: string,
  projectId: string,
  credential: StripeOAuthCredential,
): Promise<StripeOAuthCredential> {
  if (!isOAuthCredentialExpired(credential)) {
    return credential;
  }

  if (!credential.refreshToken) {
    throw new Error("Session Stripe expirée — reconnectez votre compte depuis les connecteurs.");
  }

  const token = await refreshStripeAppToken(credential.refreshToken);
  const refreshed = oauthTokenToCredential(token, credential.currency);
  const account = await fetchStripeAccount(refreshed);
  const meta = buildAccountMeta(account, refreshed);
  await saveConnectorCredential(userId, projectId, "stripe", refreshed, {
    accountLabel: meta.accountLabel,
    livemode: meta.livemode,
    currency: meta.currency,
  });
  return refreshed;
}

export async function ensureFreshCredential(
  userId: string,
  projectId: string,
  credential: StripeCredential,
): Promise<StripeCredential> {
  if (credential.mode !== "oauth") return credential;
  return ensureFreshOAuthCredential(userId, projectId, credential);
}
