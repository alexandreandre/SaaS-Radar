import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { validateCredential } from "@/lib/connectors/better-stack/client";
import { fetchBetterStackConnectorSync } from "@/lib/connectors/better-stack/metrics";
import type { BetterStackCredential } from "@/lib/connectors/better-stack/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadBetterStackCredential(
  userId: string,
  projectId: string,
): Promise<BetterStackCredential | null> {
  const stored = await loadConnectorCredential<BetterStackCredential>(
    userId,
    projectId,
    "better-stack",
  );
  return stored?.data ?? null;
}

export async function runBetterStackSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const stored = await loadConnectorCredential<BetterStackCredential>(
    userId,
    projectId,
    "better-stack",
  );
  const credential = stored?.data ?? null;
  if (!credential) {
    throw new Error("Better Stack non connecté pour ce projet");
  }

  const result = await fetchBetterStackConnectorSync(credential);
  const accountLabel =
    typeof stored?.metadata?.accountLabel === "string" && stored.metadata.accountLabel.trim()
      ? stored.metadata.accountLabel.trim()
      : result.accountLabel;

  await saveConnectorCredential(userId, projectId, "better-stack", credential, {
    accountLabel,
    monitorId: credential.monitorId,
    monitorStatus: stored?.metadata?.monitorStatus,
    lastCheckedAt: stored?.metadata?.lastCheckedAt,
  });

  return {
    ...result,
    accountLabel,
  };
}

export async function saveBetterStackCredential(
  userId: string,
  projectId: string,
  credential: BetterStackCredential,
): Promise<{ accountLabel: string; credential: BetterStackCredential }> {
  const meta = await validateCredential(credential);

  await saveConnectorCredential(userId, projectId, "better-stack", credential, {
    accountLabel: meta.accountLabel,
    monitorId: credential.monitorId,
    monitorStatus: meta.monitorStatus,
    lastCheckedAt: meta.lastCheckedAt,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deleteBetterStackCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "better-stack");
}
