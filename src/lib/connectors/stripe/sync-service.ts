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
import { parseLastSnapshot } from "@/lib/connectors/stripe/errors";
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
  const stored = await loadConnectorCredential<StripeCredential>(userId, projectId, "stripe");
  if (!stored?.data) {
    throw new Error("Stripe non connecté pour ce projet");
  }

  const credential = stored.data;
  const lastSnapshot = parseLastSnapshot(stored.metadata?.lastSnapshot);

  const account = await fetchStripeAccount(credential);
  const meta = buildAccountMeta(account, credential);
  const result = await fetchStripeConnectorSync(credential, { lastSnapshot });

  const latest = result.snapshots?.at(-1);
  await saveConnectorCredential(userId, projectId, "stripe", credential, {
    accountLabel: meta.accountLabel,
    livemode: meta.livemode,
    currency: meta.currency,
    analyticsAvailable: result.analyticsAvailable,
    analyticsProbedAt: result.syncedAt,
    ...(latest
      ? {
          lastSnapshot: {
            date: latest.date,
            mrr: latest.mrr,
            customers: latest.customers,
          },
        }
      : {}),
  });

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
  const { meta, credential: enriched } = await validateCredential(credential);

  await saveConnectorCredential(userId, projectId, "stripe", enriched, {
    accountLabel: meta.accountLabel,
    livemode: meta.livemode,
    currency: meta.currency,
  });

  return { accountLabel: meta.accountLabel, credential: enriched };
}
