import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { buildAccountMeta, validateCredential } from "@/lib/connectors/brevo/client";
import { fetchBrevoConnectorSync } from "@/lib/connectors/brevo/metrics";
import { deleteBrevoWebhookEvents } from "@/lib/connectors/brevo/webhook-store";
import type { BrevoCredential } from "@/lib/connectors/brevo/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadBrevoCredential(
  userId: string,
  projectId: string,
): Promise<BrevoCredential | null> {
  const stored = await loadConnectorCredential<BrevoCredential>(userId, projectId, "brevo");
  return stored?.data ?? null;
}

export async function runBrevoSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadBrevoCredential(userId, projectId);
  if (!credential) {
    throw new Error("Brevo non connecté pour ce projet");
  }

  const result = await fetchBrevoConnectorSync(credential, projectId);

  return {
    ...result,
    accountLabel: credential.companyName ?? credential.accountEmail ?? "Brevo",
  };
}

export async function saveBrevoCredential(
  userId: string,
  projectId: string,
  credential: BrevoCredential,
  conversionListName?: string | null,
): Promise<{ accountLabel: string; credential: BrevoCredential }> {
  const meta = await validateCredential(credential, conversionListName);

  await saveConnectorCredential(userId, projectId, "brevo", credential, {
    accountLabel: meta.accountLabel,
    companyName: meta.companyName,
    webhookConfigured: meta.webhookConfigured,
    conversionListName: meta.conversionListName,
    conversionMode: credential.conversionMode,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deleteBrevoCredential(userId: string, projectId: string): Promise<void> {
  await deleteBrevoWebhookEvents(projectId);
  await deleteConnectorCredential(userId, projectId, "brevo");
}

export { buildAccountMeta };
