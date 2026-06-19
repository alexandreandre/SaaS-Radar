import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { validateCredential } from "@/lib/connectors/freemius/client";
import { fetchFreemiusConnectorSync } from "@/lib/connectors/freemius/metrics";
import type { FreemiusCredential } from "@/lib/connectors/freemius/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadFreemiusCredential(
  userId: string,
  projectId: string,
): Promise<FreemiusCredential | null> {
  const stored = await loadConnectorCredential<FreemiusCredential>(
    userId,
    projectId,
    "freemius",
  );
  return stored?.data ?? null;
}

export async function runFreemiusSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadFreemiusCredential(userId, projectId);
  if (!credential) {
    throw new Error("Freemius non connecté pour ce projet");
  }

  const result = await fetchFreemiusConnectorSync(credential);

  return {
    ...result,
    accountLabel: credential.productTitle,
  };
}

export async function saveFreemiusCredential(
  userId: string,
  projectId: string,
  credential: FreemiusCredential,
): Promise<{ accountLabel: string; credential: FreemiusCredential }> {
  const meta = await validateCredential(credential);

  await saveConnectorCredential(userId, projectId, "freemius", credential, {
    accountLabel: meta.accountLabel,
    productId: meta.productId,
    currency: meta.currency,
    sandbox: meta.sandbox,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deleteFreemiusCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "freemius");
}
