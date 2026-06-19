import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { buildAccountMeta, validateCredential } from "@/lib/connectors/loops/client";
import { fetchLoopsConnectorSync } from "@/lib/connectors/loops/metrics";
import { deleteLoopsWebhookEvents } from "@/lib/connectors/loops/webhook-store";
import type { LoopsCredential } from "@/lib/connectors/loops/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadLoopsCredential(
  userId: string,
  projectId: string,
): Promise<LoopsCredential | null> {
  const stored = await loadConnectorCredential<LoopsCredential>(userId, projectId, "loops");
  return stored?.data ?? null;
}

export async function runLoopsSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadLoopsCredential(userId, projectId);
  if (!credential) {
    throw new Error("Loops non connecté pour ce projet");
  }

  const result = await fetchLoopsConnectorSync(credential, projectId);

  return {
    ...result,
    accountLabel: credential.teamName ?? "Loops",
  };
}

export async function saveLoopsCredential(
  userId: string,
  projectId: string,
  credential: LoopsCredential,
  conversionListName?: string | null,
): Promise<{ accountLabel: string; credential: LoopsCredential }> {
  const meta = await validateCredential(credential, conversionListName);

  await saveConnectorCredential(userId, projectId, "loops", credential, {
    accountLabel: meta.accountLabel,
    webhookConfigured: meta.webhookConfigured,
    conversionListName: meta.conversionListName,
    conversionMode: credential.conversionMode,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deleteLoopsCredential(userId: string, projectId: string): Promise<void> {
  await deleteLoopsWebhookEvents(projectId);
  await deleteConnectorCredential(userId, projectId, "loops");
}

export { buildAccountMeta };
