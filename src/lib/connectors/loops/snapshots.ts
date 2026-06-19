import { lastNMonths } from "@/lib/connectors/demo/seeded-random";
import type { LoopsConversionMode, LoopsStoredEvent } from "@/lib/connectors/loops/types";
import type { MetricsSnapshot } from "@/lib/connectors/types";

export function getMonthKeys(months = 12): string[] {
  return lastNMonths(months);
}

export function eventTimeToMonthKey(eventTime: string): string {
  return eventTime.slice(0, 7);
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
    source: "loops",
  };
}

export function buildEmptySnapshots(monthKeys: string[]): MetricsSnapshot[] {
  return monthKeys.map((date) => emptySnapshot(date));
}

function countUniqueContactsByMonth(
  events: LoopsStoredEvent[],
  monthKeys: string[],
  predicate: (event: LoopsStoredEvent) => boolean,
): Map<string, number> {
  const monthSet = new Set(monthKeys);
  const contactsByMonth = new Map<string, Set<string>>();

  for (const event of events) {
    if (!predicate(event)) continue;
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

export function aggregateLoopsEventsToSnapshots(input: {
  events: LoopsStoredEvent[];
  monthKeys: string[];
  conversionListId?: string | null;
  conversionMode?: LoopsConversionMode;
}): MetricsSnapshot[] {
  const { events, monthKeys, conversionListId, conversionMode = "email_clicked" } = input;

  const signupsByMonth = countUniqueContactsByMonth(
    events,
    monthKeys,
    (event) => event.eventName === "contact.created",
  );

  const conversionsByMonth = countUniqueContactsByMonth(events, monthKeys, (event) => {
    if (conversionMode === "mailing_list" && conversionListId) {
      return (
        event.eventName === "contact.mailingList.subscribed" &&
        event.mailingListId === conversionListId
      );
    }
    return event.eventName === "email.clicked";
  });

  return monthKeys.map((date) => ({
    ...emptySnapshot(date),
    signups: signupsByMonth.get(date) ?? 0,
    conversions: conversionsByMonth.get(date) ?? 0,
  }));
}
