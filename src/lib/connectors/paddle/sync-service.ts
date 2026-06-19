import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { validateCredential } from "@/lib/connectors/paddle/client";
import { fetchPaddleConnectorSync } from "@/lib/connectors/paddle/metrics";
import type { PaddleCredential } from "@/lib/connectors/paddle/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadPaddleCredential(
  userId: string,
  projectId: string,
): Promise<PaddleCredential | null> {
  const stored = await loadConnectorCredential<PaddleCredential>(userId, projectId, "paddle");
  return stored?.data ?? null;
}

export async function runPaddleSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const stored = await loadConnectorCredential<PaddleCredential>(userId, projectId, "paddle");
  const credential = stored?.data;
  if (!credential) {
    throw new Error("Paddle non connecté pour ce projet");
  }

  const metricsAvailable =
    typeof stored.metadata?.metricsAvailable === "boolean"
      ? stored.metadata.metricsAvailable
      : true;

  const result = await fetchPaddleConnectorSync(credential, { metricsAvailable });

  if (result.accountLabel) {
    const currencyMatch = result.accountLabel.match(/\(([A-Z]{3})\)$/);
    if (currencyMatch?.[1]) {
      credential.currency = currencyMatch[1];
    }
  }

  await saveConnectorCredential(userId, projectId, "paddle", credential, {
    accountLabel: result.accountLabel,
    sandbox: credential.sandbox,
    currency: credential.currency,
    metricsAvailable,
  });

  return {
    ...result,
    accountLabel: result.accountLabel ?? stored.metadata?.accountLabel?.toString() ?? "Paddle",
  };
}

export async function savePaddleCredential(
  userId: string,
  projectId: string,
  credential: PaddleCredential,
): Promise<{ accountLabel: string; credential: PaddleCredential; metricsAvailable: boolean }> {
  const meta = await validateCredential(credential);

  await saveConnectorCredential(userId, projectId, "paddle", credential, {
    accountLabel: meta.accountLabel,
    sandbox: meta.sandbox,
    currency: meta.currency,
    metricsAvailable: meta.metricsAvailable,
  });

  return {
    accountLabel: meta.accountLabel,
    credential,
    metricsAvailable: meta.metricsAvailable,
  };
}

export async function deletePaddleCredential(userId: string, projectId: string): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "paddle");
}
