import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { buildAccountMeta, validateCredential } from "@/lib/connectors/fathom/client";
import { fetchFathomConnectorSync } from "@/lib/connectors/fathom/metrics";
import type { FathomCredential } from "@/lib/connectors/fathom/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadFathomCredential(
  userId: string,
  projectId: string,
): Promise<FathomCredential | null> {
  const stored = await loadConnectorCredential<FathomCredential>(userId, projectId, "fathom");
  return stored?.data ?? null;
}

export async function runFathomSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const stored = await loadConnectorCredential<FathomCredential>(userId, projectId, "fathom");
  const credential = stored?.data ?? null;
  if (!credential) {
    throw new Error("Fathom non connecté pour ce projet");
  }

  const result = await fetchFathomConnectorSync(credential);
  const accountLabel =
    typeof stored?.metadata?.accountLabel === "string" && stored.metadata.accountLabel.trim()
      ? stored.metadata.accountLabel.trim()
      : credential.siteId;

  return {
    ...result,
    accountLabel,
  };
}

export async function saveFathomCredential(
  userId: string,
  projectId: string,
  credential: FathomCredential,
): Promise<{ accountLabel: string; credential: FathomCredential }> {
  const meta = await validateCredential(credential);

  await saveConnectorCredential(userId, projectId, "fathom", credential, {
    accountLabel: meta.accountLabel,
    timezone: meta.timezone,
    hasSignupEvent: meta.hasSignupEvent,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deleteFathomCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "fathom");
}

export { buildAccountMeta };
