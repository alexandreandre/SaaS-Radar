import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { validateCredential } from "@/lib/connectors/abby/client";
import { fetchAbbyConnectorSync } from "@/lib/connectors/abby/metrics";
import type { AbbyCredential } from "@/lib/connectors/abby/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadAbbyCredential(
  userId: string,
  projectId: string,
): Promise<AbbyCredential | null> {
  const stored = await loadConnectorCredential<AbbyCredential>(userId, projectId, "abby");
  return stored?.data ?? null;
}

export async function saveAbbyCredential(
  userId: string,
  projectId: string,
  credential: AbbyCredential,
): Promise<{ accountLabel: string; credential: AbbyCredential }> {
  const meta = await validateCredential(credential);
  const enriched: AbbyCredential = {
    ...credential,
    companyId: meta.companyId,
    commercialName: meta.commercialName,
  };

  await saveConnectorCredential(userId, projectId, "abby", enriched, {
    accountLabel: meta.accountLabel,
    companyId: meta.companyId,
    commercialName: meta.commercialName,
  });

  return { accountLabel: meta.accountLabel, credential: enriched };
}

export async function runAbbySync(
  userId: string,
  projectId: string,
): Promise<
  ConnectorSyncResult & {
    accountLabel: string;
    revenueSource?: string;
    revenueUnavailable?: boolean;
  }
> {
  const stored = await loadConnectorCredential<AbbyCredential>(userId, projectId, "abby");
  const credential = stored?.data ?? null;
  if (!credential) {
    throw new Error("Abby non connecté pour ce projet");
  }

  const result = await fetchAbbyConnectorSync(credential);

  await saveConnectorCredential(userId, projectId, "abby", credential, {
    accountLabel: result.accountLabel ?? stored?.metadata?.accountLabel,
    companyId: credential.companyId ?? stored?.metadata?.companyId,
    commercialName: credential.commercialName ?? stored?.metadata?.commercialName,
    revenueSource: result.revenueSource,
    revenueUnavailable: result.revenueUnavailable ?? false,
    lastRevenueWarning:
      result.revenueUnavailable === true
        ? "CA comptable indisponible via l'API Abby — charges synchronisées."
        : null,
  });

  const accountLabel =
    typeof stored?.metadata?.accountLabel === "string" && stored.metadata.accountLabel.trim()
      ? stored.metadata.accountLabel.trim()
      : credential.commercialName?.trim() || "Abby";

  return {
    ...result,
    accountLabel,
  };
}

export async function deleteAbbyCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "abby");
}
