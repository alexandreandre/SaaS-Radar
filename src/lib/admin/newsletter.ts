import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";

export type NewsletterSubscriberStatus =
  | "pending"
  | "active"
  | "unsubscribed"
  | "bounced";

export type NewsletterCampaignStatus =
  | "draft"
  | "scheduled"
  | "sent"
  | "cancelled";

export type NewsletterEventType =
  | "sent"
  | "open"
  | "click"
  | "bounce"
  | "unsubscribe";

export type NewsletterCadenceStatus =
  | "on_time"
  | "due_today"
  | "late"
  | "never_sent";

export type NewsletterEventCounts = Record<NewsletterEventType, number>;

export type NewsletterCampaignSummary = {
  id: string;
  slug: string;
  title: string;
  subject: string;
  status: NewsletterCampaignStatus;
  sent_at: string | null;
  recipient_count: number;
  events: NewsletterEventCounts;
  openRate: number | null;
  clickRate: number | null;
  bounceRate: number | null;
};

export type AdminNewsletterData = {
  loadedAt: string;
  stats: {
    activeSubscribers: number;
    totalSubscribers: number;
    netGrowth30d: number;
    newSubscribers30d: number;
    unsubscribed30d: number;
    sentCampaigns: number;
    lastSentAt: string | null;
    lastRecipientCount: number;
    nextSendAt: string;
    cadenceStatus: NewsletterCadenceStatus;
    openRate: number | null;
    clickRate: number | null;
    deliveryIssues: number;
    hasEventTracking: boolean;
    senderEmail: string;
    scheduleLabel: string;
  };
  campaigns: NewsletterCampaignSummary[];
};

type RawSubscriber = {
  status: string | null;
  created_at: string;
  unsubscribed_at: string | null;
};

type RawCampaign = {
  id: string;
  slug: string;
  title: string;
  subject: string;
  status: string | null;
  sent_at: string | null;
  recipient_count: number | null;
  created_at: string;
};

type RawEvent = {
  campaign_id: string | null;
  event_type: string | null;
};

const PAGE_SIZE = 1000;
const CAMPAIGN_TABLE_LIMIT = 8;

const SUBSCRIBER_STATUSES: NewsletterSubscriberStatus[] = [
  "pending",
  "active",
  "unsubscribed",
  "bounced",
];

const CAMPAIGN_STATUSES: NewsletterCampaignStatus[] = [
  "draft",
  "scheduled",
  "sent",
  "cancelled",
];

const EVENT_TYPES: NewsletterEventType[] = [
  "sent",
  "open",
  "click",
  "bounce",
  "unsubscribe",
];

function emptyEventCounts(): NewsletterEventCounts {
  return { sent: 0, open: 0, click: 0, bounce: 0, unsubscribe: 0 };
}

function normalizeSubscriberStatus(status: string | null): NewsletterSubscriberStatus {
  return SUBSCRIBER_STATUSES.includes(status as NewsletterSubscriberStatus)
    ? (status as NewsletterSubscriberStatus)
    : "pending";
}

function normalizeCampaignStatus(status: string | null): NewsletterCampaignStatus {
  return CAMPAIGN_STATUSES.includes(status as NewsletterCampaignStatus)
    ? (status as NewsletterCampaignStatus)
    : "draft";
}

function normalizeEventType(eventType: string | null): NewsletterEventType | null {
  return EVENT_TYPES.includes(eventType as NewsletterEventType)
    ? (eventType as NewsletterEventType)
    : null;
}

function safeDateMs(value: string | null | undefined): number {
  if (!value) return 0;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : 0;
}

function daysAgo(days: number, from = new Date()): string {
  const date = new Date(from);
  date.setUTCDate(date.getUTCDate() - days);
  return date.toISOString();
}

function nullablePercent(part: number, total: number): number | null {
  if (!total) return null;
  return Math.round((part / total) * 1000) / 10;
}

function getNextMondayEightUtc(from = new Date()): Date {
  const base = new Date(
    Date.UTC(
      from.getUTCFullYear(),
      from.getUTCMonth(),
      from.getUTCDate(),
      8,
      0,
      0,
      0
    )
  );
  const day = base.getUTCDay();
  let daysUntilMonday = (1 - day + 7) % 7;
  let next = new Date(base);
  next.setUTCDate(base.getUTCDate() + daysUntilMonday);

  if (next.getTime() <= from.getTime()) {
    daysUntilMonday += 7;
    next = new Date(base);
    next.setUTCDate(base.getUTCDate() + daysUntilMonday);
  }

  return next;
}

function getLatestExpectedMondayEightUtc(from = new Date()): Date {
  const latest = getNextMondayEightUtc(from);
  latest.setUTCDate(latest.getUTCDate() - 7);
  return latest;
}

function getCadenceStatus(
  lastSentAt: string | null,
  latestExpectedSendAt: Date,
  now = new Date()
): NewsletterCadenceStatus {
  if (!lastSentAt) return "never_sent";
  if (safeDateMs(lastSentAt) >= latestExpectedSendAt.getTime()) return "on_time";

  const graceMs = 6 * 60 * 60 * 1000;
  if (now.getTime() - latestExpectedSendAt.getTime() <= graceMs) {
    return "due_today";
  }

  return "late";
}

async function fetchAllRows<T>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  queryFactory: () => any
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await queryFactory().range(from, from + PAGE_SIZE - 1);
    if (error) throw new Error(error.message);

    const page = (data ?? []) as T[];
    rows.push(...page);
    if (page.length < PAGE_SIZE) break;
  }

  return rows;
}

function countEvents(events: RawEvent[], campaignId?: string): NewsletterEventCounts {
  return events.reduce((acc, event) => {
    if (campaignId && event.campaign_id !== campaignId) return acc;
    const eventType = normalizeEventType(event.event_type);
    if (eventType) acc[eventType] += 1;
    return acc;
  }, emptyEventCounts());
}

function campaignSummary(
  campaign: RawCampaign,
  events: RawEvent[]
): NewsletterCampaignSummary {
  const eventCounts = countEvents(events, campaign.id);
  const recipients = campaign.recipient_count ?? 0;
  const denominator = eventCounts.sent || recipients;

  return {
    id: campaign.id,
    slug: campaign.slug,
    title: campaign.title,
    subject: campaign.subject,
    status: normalizeCampaignStatus(campaign.status),
    sent_at: campaign.sent_at,
    recipient_count: recipients,
    events: eventCounts,
    openRate: nullablePercent(eventCounts.open, denominator),
    clickRate: nullablePercent(eventCounts.click, denominator),
    bounceRate: nullablePercent(eventCounts.bounce, denominator),
  };
}

export async function getAdminNewsletterData(): Promise<AdminNewsletterData> {
  const admin = createAdminClient();
  const now = new Date();
  const since30d = daysAgo(30, now);

  const [subscribers, campaigns, events] = await Promise.all([
    fetchAllRows<RawSubscriber>(() =>
      admin
        .from("newsletter_subscribers")
        .select("status,created_at,unsubscribed_at")
        .order("created_at", { ascending: false })
    ),
    fetchAllRows<RawCampaign>(() =>
      admin
        .from("newsletter_campaigns")
        .select("id,slug,title,subject,status,sent_at,recipient_count,created_at")
        .order("created_at", { ascending: false })
    ),
    fetchAllRows<RawEvent>(() =>
      admin
        .from("newsletter_events")
        .select("campaign_id,event_type")
    ),
  ]);

  const activeSubscribers = subscribers.filter(
    (subscriber) => normalizeSubscriberStatus(subscriber.status) === "active"
  ).length;
  const bouncedSubscribers = subscribers.filter(
    (subscriber) => normalizeSubscriberStatus(subscriber.status) === "bounced"
  ).length;
  const newSubscribers30d = subscribers.filter(
    (subscriber) => subscriber.created_at >= since30d
  ).length;
  const unsubscribed30d = subscribers.filter(
    (subscriber) => subscriber.unsubscribed_at && subscriber.unsubscribed_at >= since30d
  ).length;

  const sentCampaigns = campaigns
    .filter((campaign) => normalizeCampaignStatus(campaign.status) === "sent")
    .sort((a, b) => safeDateMs(b.sent_at ?? b.created_at) - safeDateMs(a.sent_at ?? a.created_at));

  const recentCampaigns = campaigns
    .slice()
    .sort((a, b) => safeDateMs(b.sent_at ?? b.created_at) - safeDateMs(a.sent_at ?? a.created_at))
    .slice(0, CAMPAIGN_TABLE_LIMIT)
    .map((campaign) => campaignSummary(campaign, events));

  const globalEvents = countEvents(events);
  const recipientsTotal = sentCampaigns.reduce(
    (total, campaign) => total + (campaign.recipient_count ?? 0),
    0
  );
  const denominator = globalEvents.sent || recipientsTotal;
  const lastCampaign = sentCampaigns[0] ?? null;
  const latestExpectedSendAt = getLatestExpectedMondayEightUtc(now);

  return {
    loadedAt: now.toISOString(),
    stats: {
      activeSubscribers,
      totalSubscribers: subscribers.length,
      netGrowth30d: newSubscribers30d - unsubscribed30d,
      newSubscribers30d,
      unsubscribed30d,
      sentCampaigns: sentCampaigns.length,
      lastSentAt: lastCampaign?.sent_at ?? null,
      lastRecipientCount: lastCampaign?.recipient_count ?? 0,
      nextSendAt: getNextMondayEightUtc(now).toISOString(),
      cadenceStatus: getCadenceStatus(lastCampaign?.sent_at ?? null, latestExpectedSendAt, now),
      openRate: nullablePercent(globalEvents.open, denominator),
      clickRate: nullablePercent(globalEvents.click, denominator),
      deliveryIssues: bouncedSubscribers + globalEvents.bounce,
      hasEventTracking: events.length > 0,
      senderEmail:
        process.env.BREVO_NEWSLETTER_SENDER_EMAIL ?? "newsletter@thebuildroad.com",
      scheduleLabel: "Lundi 08:00 UTC",
    },
    campaigns: recentCampaigns,
  };
}
