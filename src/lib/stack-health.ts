import type { ConnectorId } from "@/lib/connectors/types";
import { CONNECTORS } from "@/lib/connectors/registry";
import type { Opportunity } from "@/types/opportunity";
import type { Integration } from "@/lib/connectors/types";

const STACK_CONNECTOR_MAP: Record<string, ConnectorId> = {
  stripe: "stripe",
  supabase: "vercel",
  resend: "resend",
  "next.js": "vercel",
  "next.js 14": "vercel",
  tailwind: "vercel",
  plausible: "plausible",
  posthog: "posthog",
};

const CHANNEL_CONNECTOR_MAP: Record<string, ConnectorId> = {
  "cold email": "brevo",
  linkedin: "linkedin-ads",
  seo: "plausible",
  google: "google-ads",
  meta: "meta-ads",
  referral: "hubspot",
};

export type StackHealth = {
  recommended: ConnectorId[];
  connected: ConnectorId[];
  missing: ConnectorId[];
  coveragePct: number;
  nextRecommended: ConnectorId | null;
};

function normalizeStackItem(item: string): string {
  return item.toLowerCase().trim();
}

export function resolveRecommendedConnectors(opportunity: Opportunity): ConnectorId[] {
  const ids = new Set<ConnectorId>();

  ids.add("stripe");
  ids.add("plausible");
  ids.add("google-ads");
  ids.add("brevo");
  ids.add("crisp");

  for (const item of opportunity.mvpPlan.stack) {
    const key = normalizeStackItem(item);
    for (const [pattern, connectorId] of Object.entries(STACK_CONNECTOR_MAP)) {
      if (key.includes(pattern)) ids.add(connectorId);
    }
  }

  for (const channel of opportunity.cacChannels) {
    const key = normalizeStackItem(channel.channel);
    for (const [pattern, connectorId] of Object.entries(CHANNEL_CONNECTOR_MAP)) {
      if (key.includes(pattern)) ids.add(connectorId);
    }
  }

  const p0 = CONNECTORS.filter((c) => c.priority === "p0").map((c) => c.id);
  for (const id of p0) {
    if (["stripe", "google-ads", "plausible"].includes(id)) ids.add(id);
  }

  return Array.from(ids);
}

export function buildStackHealth(
  opportunity: Opportunity,
  integrations: Integration[] = []
): StackHealth {
  const recommended = resolveRecommendedConnectors(opportunity);
  const connected = integrations
    .filter((i) => i.status === "demo" || i.status === "connected")
    .map((i) => i.connectorId)
    .filter((id) => recommended.includes(id));

  const missing = recommended.filter((id) => !connected.includes(id));
  const coveragePct =
    recommended.length > 0 ? Math.round((connected.length / recommended.length) * 100) : 0;

  const nextRecommended =
    missing.sort((a, b) => {
      const pa = CONNECTORS.find((c) => c.id === a)?.priority ?? "p2";
      const pb = CONNECTORS.find((c) => c.id === b)?.priority ?? "p2";
      const order = { p0: 0, p1: 1, p2: 2 };
      return order[pa] - order[pb];
    })[0] ?? null;

  return { recommended, connected, missing, coveragePct, nextRecommended };
}
