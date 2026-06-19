import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { BrevoContact, BrevoEmailCampaign, BrevoStoredEvent } from "@/lib/connectors/brevo/types";
import type { MetricsSnapshot } from "@/lib/connectors/types";

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function eventTimeToMonthKey(eventTime: string): string {
  return eventTime.slice(0, 7);
}

export function contactCreatedAtToMonthKey(createdAt: string): string {
  return createdAt.slice(0, 7);
}

export function sentDateToMonthKey(sentDate: string): string {
  return sentDate.slice(0, 7);
}

export function createdSinceIsoForMonths(months: number): string {
  const monthKeys = getMonthKeys(months);
  const first = monthKeys[0];
  if (!first) {
    return new Date().toISOString();
  }
  return `${first}-01T00:00:00.000Z`;
}

function emptySnapshot(date: string): MetricsSnapshot {
  return {
    date,
    mrr: 0,
    newMrr: 0,
    expansionMrr: 0,
    churnedMrr: 0,
    customers: 0,
    signups: 0,
    trials: 0,
    activeUsers: 0,
    mau: 0,
    dau: 0,
    adSpend: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    source: "brevo",
  };
}

export function aggregateContactsToSignups(
  contacts: BrevoContact[],
  monthKeys: string[],
): Map<string, number> {
  const monthSet = new Set(monthKeys);
  const counts = new Map<string, number>();

  for (const contact of contacts) {
    if (!contact.createdAt) continue;
    const month = contactCreatedAtToMonthKey(contact.createdAt);
    if (!monthSet.has(month)) continue;
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }

  return counts;
}

export function aggregateCampaignClicksToConversions(
  campaigns: BrevoEmailCampaign[],
  monthKeys: string[],
): Map<string, number> {
  const monthSet = new Set(monthKeys);
  const counts = new Map<string, number>();

  for (const campaign of campaigns) {
    if (!campaign.sentDate || campaign.status !== "sent") continue;
    const month = sentDateToMonthKey(campaign.sentDate);
    if (!monthSet.has(month)) continue;
    const clicks = campaign.statistics?.globalStats?.uniqueClicks ?? 0;
    counts.set(month, (counts.get(month) ?? 0) + Math.max(0, clicks));
  }

  return counts;
}

export function aggregateWebhookListAdditions(
  events: BrevoStoredEvent[],
  monthKeys: string[],
  conversionListId: string | null,
): Map<string, number> {
  const monthSet = new Set(monthKeys);
  const targetListId = conversionListId ? Number(conversionListId) : null;
  const contactsByMonth = new Map<string, Set<string>>();

  for (const event of events) {
    if (event.eventName !== "list_addition") continue;
    if (targetListId !== null && !event.listIds.includes(targetListId)) continue;

    const month = eventTimeToMonthKey(event.eventTime);
    if (!monthSet.has(month)) continue;
    if (!event.contactId) continue;

    const bucket = contactsByMonth.get(month) ?? new Set<string>();
    bucket.add(event.contactId);
    contactsByMonth.set(month, bucket);
  }

  const counts = new Map<string, number>();
  contactsByMonth.forEach((contacts, month) => {
    counts.set(month, contacts.size);
  });
  return counts;
}

export function buildBrevoSnapshots(input: {
  monthKeys: string[];
  signupsByMonth: Map<string, number>;
  conversionsByMonth: Map<string, number>;
}): MetricsSnapshot[] {
  const { monthKeys, signupsByMonth, conversionsByMonth } = input;

  return monthKeys.map((date) => ({
    ...emptySnapshot(date),
    signups: signupsByMonth.get(date) ?? 0,
    conversions: conversionsByMonth.get(date) ?? 0,
  }));
}
