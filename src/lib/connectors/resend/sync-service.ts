import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { validateCredential } from "@/lib/connectors/resend/client";
import { fetchResendConnectorSync } from "@/lib/connectors/resend/metrics";
import { deleteResendWebhookEvents } from "@/lib/connectors/resend/webhook-store";
import type { ResendCredential } from "@/lib/connectors/resend/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadResendCredential(
  userId: string,
  projectId: string,
): Promise<ResendCredential | null> {
  const stored = await loadConnectorCredential<ResendCredential>(userId, projectId, "resend");
  return stored?.data ?? null;
}

export async function runResendSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadResendCredential(userId, projectId);
  if (!credential) {
    throw new Error("Resend non connecté pour ce projet");
  }

  const result = await fetchResendConnectorSync(credential, projectId);

  return {
    ...result,
    accountLabel: credential.accountDomain ?? "Resend",
  };
}

export async function saveResendCredential(
  userId: string,
  projectId: string,
  credential: ResendCredential,
  conversionSegmentName?: string | null,
): Promise<{ accountLabel: string; credential: ResendCredential }> {
  const meta = await validateCredential(credential, conversionSegmentName);

  await saveConnectorCredential(userId, projectId, "resend", credential, {
    accountLabel: meta.accountLabel,
    webhookConfigured: meta.webhookConfigured,
    conversionSegmentName: meta.conversionSegmentName,
    conversionMode: credential.conversionMode,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deleteResendCredential(userId: string, projectId: string): Promise<void> {
  await deleteResendWebhookEvents(projectId);
  await deleteConnectorCredential(userId, projectId, "resend");
}
