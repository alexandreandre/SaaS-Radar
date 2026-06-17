import "server-only";

import {
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { fetchStripeConnectorSync } from "@/lib/connectors/stripe/metrics";
import {
  buildAccountMeta,
  fetchStripeAccount,
  validateCredential,
} from "@/lib/connectors/stripe/client";
import { ensureFreshCredential } from "@/lib/connectors/stripe/token-refresh";
import type { StripeCredential } from "@/lib/connectors/stripe/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadStripeCredential(
  userId: string,
  projectId: string,
): Promise<StripeCredential | null> {
  const stored = await loadConnectorCredential<StripeCredential>(userId, projectId, "stripe");
  return stored?.data ?? null;
}

export async function runStripeSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const stored = await loadStripeCredential(userId, projectId);
  if (!stored) {
    throw new Error("Stripe non connecté pour ce projet");
  }

  const credential = await ensureFreshCredential(userId, projectId, stored);
  const account = await fetchStripeAccount(credential);
  const meta = buildAccountMeta(account, credential);
  const result = await fetchStripeConnectorSync(credential);

  return {
    ...result,
    accountLabel: meta.accountLabel,
  };
}

export async function saveStripeCredential(
  userId: string,
  projectId: string,
  credential: StripeCredential,
): Promise<{ accountLabel: string; credential: StripeCredential }> {
  const meta = await validateCredential(credential);
  const enriched =
    credential.mode === "rak" && !credential.accountId
      ? { ...credential, accountId: (await fetchStripeAccount(credential)).id }
      : credential;

  await saveConnectorCredential(userId, projectId, "stripe", enriched, {
    accountLabel: meta.accountLabel,
    livemode: meta.livemode,
    currency: meta.currency,
  });

  return { accountLabel: meta.accountLabel, credential: enriched };
}
