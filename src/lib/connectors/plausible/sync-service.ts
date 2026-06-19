import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { buildAccountMeta, validateCredential } from "@/lib/connectors/plausible/client";
import { fetchPlausibleConnectorSync } from "@/lib/connectors/plausible/metrics";
import type { PlausibleCredential } from "@/lib/connectors/plausible/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadPlausibleCredential(
  userId: string,
  projectId: string,
): Promise<PlausibleCredential | null> {
  const stored = await loadConnectorCredential<PlausibleCredential>(userId, projectId, "plausible");
  return stored?.data ?? null;
}

export async function runPlausibleSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadPlausibleCredential(userId, projectId);
  if (!credential) {
    throw new Error("Plausible non connecté pour ce projet");
  }

  const result = await fetchPlausibleConnectorSync(credential);

  return {
    ...result,
    accountLabel: credential.siteId,
  };
}

export async function savePlausibleCredential(
  userId: string,
  projectId: string,
  credential: PlausibleCredential,
): Promise<{ accountLabel: string; credential: PlausibleCredential }> {
  const meta = await validateCredential(credential);

  await saveConnectorCredential(userId, projectId, "plausible", credential, {
    accountLabel: meta.accountLabel,
    timezone: meta.timezone,
    hasSignupGoal: meta.hasSignupGoal,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deletePlausibleCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "plausible");
}

export { buildAccountMeta };
