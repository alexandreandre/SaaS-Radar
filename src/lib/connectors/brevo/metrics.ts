import "server-only";

import {
  fetchAllContactsSince,
  fetchAllEmailCampaigns,
} from "@/lib/connectors/brevo/client";
import {
  aggregateCampaignClicksToConversions,
  aggregateContactsToSignups,
  aggregateWebhookListAdditions,
  buildBrevoSnapshots,
  createdSinceIsoForMonths,
  getMonthKeys,
} from "@/lib/connectors/brevo/snapshots";
import {
  fetchBrevoWebhookEvents,
  sinceIsoForMonths,
} from "@/lib/connectors/brevo/webhook-store";
import type { BrevoCredential } from "@/lib/connectors/brevo/types";
import type { ConnectorSyncResult } from "@/lib/connectors/types";

export async function fetchBrevoConnectorSync(
  credential: BrevoCredential,
  projectId: string,
  months = 12,
): Promise<ConnectorSyncResult> {
  const monthKeys = getMonthKeys(months);
  const createdSinceIso = createdSinceIsoForMonths(months);

  const contacts = await fetchAllContactsSince(credential, createdSinceIso);
  const signupsByMonth = aggregateContactsToSignups(contacts, monthKeys);

  let conversionsByMonth: Map<string, number>;

  if (credential.conversionMode === "list_addition") {
    const sinceIso = sinceIsoForMonths(months);
    const events = await fetchBrevoWebhookEvents(projectId, sinceIso);
    conversionsByMonth = aggregateWebhookListAdditions(
      events,
      monthKeys,
      credential.conversionListId,
    );
  } else {
    const campaigns = await fetchAllEmailCampaigns(credential);
    conversionsByMonth = aggregateCampaignClicksToConversions(campaigns, monthKeys);
  }

  const snapshots = buildBrevoSnapshots({
    monthKeys,
    signupsByMonth,
    conversionsByMonth,
  });

  return {
    snapshots,
    accountLabel: credential.companyName ?? credential.accountEmail ?? "Brevo",
    syncedAt: new Date().toISOString(),
  };
}
