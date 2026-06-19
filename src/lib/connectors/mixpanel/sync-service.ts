import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { buildAccountMeta, validateCredential } from "@/lib/connectors/mixpanel/client";
import { fetchMixpanelConnectorSync } from "@/lib/connectors/mixpanel/metrics";
import type { MixpanelCredential } from "@/lib/connectors/mixpanel/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadMixpanelCredential(
  userId: string,
  projectId: string,
): Promise<MixpanelCredential | null> {
  const stored = await loadConnectorCredential<MixpanelCredential>(userId, projectId, "mixpanel");
  return stored?.data ?? null;
}

export async function runMixpanelSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadMixpanelCredential(userId, projectId);
  if (!credential) {
    throw new Error("Mixpanel non connecté pour ce projet");
  }

  const meta = buildAccountMeta(credential);
  const result = await fetchMixpanelConnectorSync(credential);

  return {
    ...result,
    accountLabel: meta.accountLabel,
  };
}

export async function saveMixpanelCredential(
  userId: string,
  projectId: string,
  credential: MixpanelCredential,
): Promise<{ accountLabel: string; credential: MixpanelCredential }> {
  const meta = await validateCredential(credential);

  await saveConnectorCredential(userId, projectId, "mixpanel", credential, {
    accountLabel: meta.accountLabel,
    projectLabel: meta.projectLabel,
    region: meta.region,
    hasSignupEvent: meta.hasSignupEvent,
    hasActivationEvent: meta.hasActivationEvent,
    hasActivityEvent: meta.hasActivityEvent,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deleteMixpanelCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "mixpanel");
}

export { buildAccountMeta };
