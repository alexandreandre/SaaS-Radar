import "server-only";

import {
  deleteConnectorCredential,
  loadConnectorCredential,
  saveConnectorCredential,
} from "@/lib/connectors/credentials-store";
import { buildAccountMeta, validateCredential } from "@/lib/connectors/posthog/client";
import { fetchPostHogConnectorSync } from "@/lib/connectors/posthog/metrics";
import type { PostHogCredential } from "@/lib/connectors/posthog/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function loadPostHogCredential(
  userId: string,
  projectId: string,
): Promise<PostHogCredential | null> {
  const stored = await loadConnectorCredential<PostHogCredential>(userId, projectId, "posthog");
  return stored?.data ?? null;
}

export async function runPostHogSync(
  userId: string,
  projectId: string,
): Promise<ConnectorSyncResult & { accountLabel: string }> {
  const credential = await loadPostHogCredential(userId, projectId);
  if (!credential) {
    throw new Error("PostHog non connecté pour ce projet");
  }

  const meta = buildAccountMeta(credential);
  const result = await fetchPostHogConnectorSync(credential);

  return {
    ...result,
    accountLabel: meta.accountLabel,
  };
}

export async function savePostHogCredential(
  userId: string,
  projectId: string,
  credential: PostHogCredential,
): Promise<{ accountLabel: string; credential: PostHogCredential }> {
  const meta = await validateCredential(credential);

  await saveConnectorCredential(userId, projectId, "posthog", credential, {
    accountLabel: meta.accountLabel,
    projectName: meta.projectName,
    timezone: meta.timezone,
    hasSignupEvent: meta.hasSignupEvent,
    hasActivationEvent: meta.hasActivationEvent,
  });

  return { accountLabel: meta.accountLabel, credential };
}

export async function deletePostHogCredential(
  userId: string,
  projectId: string,
): Promise<void> {
  await deleteConnectorCredential(userId, projectId, "posthog");
}

export { buildAccountMeta };
