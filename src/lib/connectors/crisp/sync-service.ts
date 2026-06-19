import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import {
  buildAccountMeta,
  validateWebsiteAccess,
} from "@/lib/connectors/crisp/client";
import { fetchCrispConnectorSync } from "@/lib/connectors/crisp/metrics";
import type { CrispCredential } from "@/lib/connectors/crisp/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadCrispCredential(
  userId: string,
  projectId: string,
): Promise<CrispCredential | null> {
  const stored = await loadConnectorCredential<CrispCredential>(userId, projectId, "crisp");
  return stored?.data ?? null;
}

export async function runCrispSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadCrispCredential(userId, projectId);
  if (!credential) {
    throw new Error("Crisp non connecté pour ce projet");
  }

  const result = await fetchCrispConnectorSync(credential);

  return {
    ...result,
    accountLabel: credential.websiteName?.trim() || credential.websiteId,
  };
}

export async function saveCrispCredential(
  userId: string,
  projectId: string,
  credential: CrispCredential,
): Promise<{ accountLabel: string; credential: CrispCredential }> {
  const meta = await validateWebsiteAccess(credential);
  const enriched: CrispCredential = {
    ...credential,
    websiteName: meta.websiteName,
    timezone: meta.timezone,
  };

  await saveConnectorCredential(userId, projectId, "crisp", enriched, {
    accountLabel: meta.accountLabel,
    websiteName: meta.websiteName,
    domain: meta.domain,
    timezone: meta.timezone,
  });

  return { accountLabel: meta.accountLabel, credential: enriched };
}

export async function deleteCrispCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "crisp");
}

export { buildAccountMeta };
