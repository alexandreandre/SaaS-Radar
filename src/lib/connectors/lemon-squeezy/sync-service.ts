import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { validateCredential } from "@/lib/connectors/lemon-squeezy/client";
import { fetchLemonSqueezyConnectorSync } from "@/lib/connectors/lemon-squeezy/metrics";
import type { LemonSqueezyCredential } from "@/lib/connectors/lemon-squeezy/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadLemonSqueezyCredential(
  userId: string,
  projectId: string,
): Promise<LemonSqueezyCredential | null> {
  const stored = await loadConnectorCredential<LemonSqueezyCredential>(
    userId,
    projectId,
    "lemon-squeezy",
  );
  return stored?.data ?? null;
}

export async function runLemonSqueezySync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadLemonSqueezyCredential(userId, projectId);
  if (!credential) {
    throw new Error("Lemon Squeezy non connecté pour ce projet");
  }

  const result = await fetchLemonSqueezyConnectorSync(credential);

  return {
    ...result,
    accountLabel: credential.storeName,
  };
}

export async function saveLemonSqueezyCredential(
  userId: string,
  projectId: string,
  credential: LemonSqueezyCredential,
): Promise<{ accountLabel: string; credential: LemonSqueezyCredential }> {
  const meta = await validateCredential(credential);

  await saveConnectorCredential(userId, projectId, "lemon-squeezy", credential, {
    accountLabel: meta.accountLabel,
    storeId: meta.storeId,
    currency: meta.currency,
    testMode: meta.testMode,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deleteLemonSqueezyCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "lemon-squeezy");
}
