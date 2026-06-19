import "server-only";

import { fetchAllContacts } from "@/lib/connectors/resend/client";
import {
  aggregateContactsToSignups,
  aggregateEmailClicksToConversions,
  buildResendSnapshots,
  getMonthKeys,
} from "@/lib/connectors/resend/snapshots";
import {
  fetchResendWebhookEvents,
  sinceIsoForMonths,
} from "@/lib/connectors/resend/webhook-store";
import type { ResendCredential } from "@/lib/connectors/resend/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function fetchResendConnectorSync(
  credential: ResendCredential,
  projectId: string,
  months = 12,
): Promise<ConnectorSyncResult> {
  const monthKeys = getMonthKeys(months);

  const allContacts = await fetchAllContacts(credential);
  const signupsByMonth = aggregateContactsToSignups(allContacts, monthKeys);

  let conversionsByMonth: Map<string, number>;

  if (credential.conversionMode === "segment" && credential.conversionSegmentId) {
    const segmentContacts = await fetchAllContacts(credential, credential.conversionSegmentId);
    conversionsByMonth = aggregateContactsToSignups(segmentContacts, monthKeys);
  } else {
    const sinceIso = sinceIsoForMonths(months);
    const events = await fetchResendWebhookEvents(projectId, sinceIso);
    conversionsByMonth = aggregateEmailClicksToConversions(events, monthKeys);
  }

  const snapshots = buildResendSnapshots({
    monthKeys,
    signupsByMonth,
    conversionsByMonth,
  });

  return {
    snapshots,
    accountLabel: credential.accountDomain ?? "Resend",
    syncedAt: new Date().toISOString(),
  };
}
