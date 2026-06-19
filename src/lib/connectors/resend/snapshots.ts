import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { ResendContact, ResendStoredEvent } from "@/lib/connectors/resend/types";
import type { MetricsSnapshot } from "@/lib/connectors/types";

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function eventTimeToMonthKey(eventTime: string): string {
  return eventTime.slice(0, 7);
}

export function contactCreatedAtToMonthKey(createdAt: string): string {
  const normalized = createdAt.includes("T") ? createdAt : createdAt.replace(" ", "T");
  return normalized.slice(0, 7);
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
    source: "resend",
  };
}

export function aggregateContactsToSignups(
  contacts: ResendContact[],
  monthKeys: string[],
): Map<string, number> {
  const monthSet = new Set(monthKeys);
  const counts = new Map<string, number>();

  for (const contact of contacts) {
    if (!contact.created_at) continue;
    const month = contactCreatedAtToMonthKey(contact.created_at);
    if (!monthSet.has(month)) continue;
    counts.set(month, (counts.get(month) ?? 0) + 1);
  }

  return counts;
}

function countUniqueByMonth(
  events: ResendStoredEvent[],
  monthKeys: string[],
  predicate: (event: ResendStoredEvent) => boolean,
  identity: (event: ResendStoredEvent) => string | null,
): Map<string, number> {
  const monthSet = new Set(monthKeys);
  const identitiesByMonth = new Map<string, Set<string>>();

  for (const event of events) {
    if (!predicate(event)) continue;
    const month = eventTimeToMonthKey(event.eventTime);
    if (!monthSet.has(month)) continue;

    const id = identity(event);
    if (!id) continue;

    const bucket = identitiesByMonth.get(month) ?? new Set<string>();
    bucket.add(id);
    identitiesByMonth.set(month, bucket);
  }

  const counts = new Map<string, number>();
  identitiesByMonth.forEach((identities, month) => {
    counts.set(month, identities.size);
  });
  return counts;
}

export function aggregateEmailClicksToConversions(
  events: ResendStoredEvent[],
  monthKeys: string[],
): Map<string, number> {
  return countUniqueByMonth(
    events,
    monthKeys,
    (event) => event.eventName === "email.clicked",
    (event) => event.recipientEmail ?? event.contactId,
  );
}

export function buildResendSnapshots(input: {
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
