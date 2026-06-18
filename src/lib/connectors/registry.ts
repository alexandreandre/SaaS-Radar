import type { ConnectorDefinition } from "@/lib/connectors/types";
import { CONNECTOR_BRANDS } from "@/lib/connectors/brands";
import { generatePartialSnapshots } from "@/lib/connectors/demo/generators";

function makeConnector(
  def: Omit<ConnectorDefinition, "demo" | "brand"> & {
    demoFields: (keyof import("@/lib/connectors/types").MetricsSnapshot)[];
  }
): ConnectorDefinition {
  return {
    ...def,
    brand: CONNECTOR_BRANDS[def.id],
    demo: (seed, months, targetMrr) =>
      generatePartialSnapshots(seed, months, targetMrr, def.id, def.demoFields),
  };
}

function makeStreamOnlyConnector(
  def: Omit<ConnectorDefinition, "demo" | "provides" | "brand">
): ConnectorDefinition {
  return {
    ...def,
    brand: CONNECTOR_BRANDS[def.id],
    provides: [],
    demo: () => [],
  };
}

export const CONNECTORS: ConnectorDefinition[] = [
  makeConnector({
    id: "stripe",
    name: "Stripe",
    category: "payments",
    jobLabel: "Encaisser",
    priority: "p0",
    recommendedFor: ["stripe"],
    description:
      "Synchronise MRR, churn, expansion et clients actifs depuis ton compte Stripe pour alimenter le cockpit et comparer tes chiffres réels à la projection de ta fiche.",
    provides: ["mrr", "newMrr", "expansionMrr", "churnedMrr", "customers"],
    demoFields: ["mrr", "newMrr", "expansionMrr", "churnedMrr", "customers"],
  }),
  makeConnector({
    id: "lemon-squeezy",
    name: "Lemon Squeezy",
    category: "payments",
    jobLabel: "Encaisser",
    priority: "p0",
    recommendedFor: ["lemon"],
    description: "Revenus récurrents et clients actifs (MoR EU).",
    provides: ["mrr", "newMrr", "churnedMrr", "customers"],
    demoFields: ["mrr", "newMrr", "churnedMrr", "customers"],
  }),
  makeConnector({
    id: "paddle",
    name: "Paddle",
    category: "payments",
    jobLabel: "Encaisser",
    priority: "p1",
    description: "Billing MoR, TVA et remboursements.",
    provides: ["mrr", "newMrr", "churnedMrr", "customers"],
    demoFields: ["mrr", "newMrr", "churnedMrr", "customers"],
  }),
  makeConnector({
    id: "freemius",
    name: "Freemius",
    category: "payments",
    jobLabel: "Encaisser",
    priority: "p2",
    description: "Monétisation plugins et licences WordPress.",
    provides: ["mrr", "newMrr", "customers"],
    demoFields: ["mrr", "newMrr", "customers"],
  }),
  makeConnector({
    id: "google-ads",
    name: "Google Ads",
    category: "ads",
    jobLabel: "Acquérir",
    priority: "p0",
    cockpitImpact: "ROAS vs budget acquisition fiche",
    recommendedFor: ["google", "seo"],
    description: "Budget, impressions, clics et conversions par campagne.",
    provides: ["adSpend", "impressions", "clicks", "conversions"],
    demoFields: ["adSpend", "impressions", "clicks", "conversions"],
  }),
  makeConnector({
    id: "meta-ads",
    name: "Meta Ads",
    category: "ads",
    jobLabel: "Acquérir",
    priority: "p1",
    description: "Performance Facebook & Instagram Ads.",
    provides: ["adSpend", "impressions", "clicks", "conversions"],
    demoFields: ["adSpend", "impressions", "clicks", "conversions"],
  }),
  makeConnector({
    id: "linkedin-ads",
    name: "LinkedIn Ads",
    category: "ads",
    jobLabel: "Acquérir",
    priority: "p1",
    recommendedFor: ["linkedin", "b2b"],
    description: "Campagnes B2B LinkedIn.",
    provides: ["adSpend", "impressions", "clicks", "conversions"],
    demoFields: ["adSpend", "impressions", "clicks", "conversions"],
  }),
  makeConnector({
    id: "tiktok-ads",
    name: "TikTok Ads",
    category: "ads",
    jobLabel: "Acquérir",
    priority: "p2",
    description: "Campagnes TikTok pour niches B2C.",
    provides: ["adSpend", "impressions", "clicks", "conversions"],
    demoFields: ["adSpend", "impressions", "clicks", "conversions"],
  }),
  makeConnector({
    id: "microsoft-ads",
    name: "Microsoft Ads",
    category: "ads",
    jobLabel: "Acquérir",
    priority: "p2",
    description: "Search Bing et audiences Microsoft.",
    provides: ["adSpend", "impressions", "clicks", "conversions"],
    demoFields: ["adSpend", "impressions", "clicks", "conversions"],
  }),
  makeConnector({
    id: "plausible",
    name: "Plausible",
    category: "analytics",
    jobLabel: "Comprendre",
    priority: "p0",
    recommendedFor: ["plausible", "next.js"],
    description: "Visiteurs, pages vues et signups (RGPD-friendly).",
    provides: ["signups", "activeUsers", "mau", "dau"],
    demoFields: ["signups", "activeUsers", "mau", "dau"],
  }),
  makeConnector({
    id: "google-analytics",
    name: "Google Analytics",
    category: "analytics",
    jobLabel: "Comprendre",
    priority: "p1",
    description: "Trafic, engagement et conversions.",
    provides: ["signups", "trials", "activeUsers", "mau", "dau"],
    demoFields: ["signups", "trials", "activeUsers", "mau", "dau"],
  }),
  makeConnector({
    id: "posthog",
    name: "PostHog",
    category: "analytics",
    jobLabel: "Comprendre",
    priority: "p1",
    recommendedFor: ["posthog", "product"],
    description: "Product analytics, funnels et rétention in-app.",
    provides: ["signups", "activeUsers", "mau", "dau"],
    demoFields: ["signups", "activeUsers", "mau", "dau"],
  }),
  makeConnector({
    id: "mixpanel",
    name: "Mixpanel",
    category: "analytics",
    jobLabel: "Comprendre",
    priority: "p2",
    description: "Cohortes et funnels produit avancés.",
    provides: ["signups", "activeUsers", "mau"],
    demoFields: ["signups", "activeUsers", "mau"],
  }),
  makeConnector({
    id: "fathom",
    name: "Fathom",
    category: "analytics",
    jobLabel: "Comprendre",
    priority: "p2",
    description: "Analytics web simple et privacy-first.",
    provides: ["signups", "activeUsers", "mau", "dau"],
    demoFields: ["signups", "activeUsers", "mau", "dau"],
  }),
  makeConnector({
    id: "brevo",
    name: "Brevo",
    category: "email",
    jobLabel: "Convertir",
    priority: "p0",
    recommendedFor: ["email", "cold email"],
    description: "Campagnes email et nurturing.",
    provides: ["signups", "conversions"],
    demoFields: ["signups", "conversions"],
  }),
  makeConnector({
    id: "resend",
    name: "Resend",
    category: "email",
    jobLabel: "Convertir",
    priority: "p1",
    recommendedFor: ["resend"],
    description: "Emails transactionnels pour stack Next.js.",
    provides: ["signups", "conversions"],
    demoFields: ["signups", "conversions"],
  }),
  makeConnector({
    id: "loops",
    name: "Loops",
    category: "email",
    jobLabel: "Convertir",
    priority: "p2",
    description: "Email marketing pour SaaS early-stage.",
    provides: ["signups", "conversions"],
    demoFields: ["signups", "conversions"],
  }),
  makeConnector({
    id: "crisp",
    name: "Crisp",
    category: "support",
    jobLabel: "Supporter",
    priority: "p0",
    description: "Chat, tickets et satisfaction client.",
    provides: ["activeUsers"],
    demoFields: ["activeUsers"],
  }),
  makeConnector({
    id: "intercom",
    name: "Intercom",
    category: "support",
    jobLabel: "Supporter",
    priority: "p1",
    description: "Support, onboarding et messages in-app.",
    provides: ["activeUsers"],
    demoFields: ["activeUsers"],
  }),
  makeConnector({
    id: "zendesk",
    name: "Zendesk",
    category: "support",
    jobLabel: "Supporter",
    priority: "p2",
    description: "Help desk et base de connaissances.",
    provides: ["activeUsers"],
    demoFields: ["activeUsers"],
  }),
  makeStreamOnlyConnector({
    id: "qonto",
    name: "Qonto",
    category: "finance",
    jobLabel: "Comptabiliser (FR)",
    priority: "p1",
    cockpitImpact: "Runway réel vs estimé",
    recommendedFor: ["qonto", "france"],
    description: "Trésorerie, flux bancaires et runway réel.",
  }),
  makeStreamOnlyConnector({
    id: "pennylane",
    name: "Pennylane",
    category: "accounting",
    jobLabel: "Comptabiliser (FR)",
    priority: "p1",
    cockpitImpact: "CA comptable vs MRR Stripe",
    recommendedFor: ["pennylane", "france"],
    description: "Comptabilité startup FR, TVA et charges.",
  }),
  makeStreamOnlyConnector({
    id: "abby",
    name: "Abby",
    category: "accounting",
    jobLabel: "Comptabiliser (FR)",
    priority: "p1",
    recommendedFor: ["abby", "stripe"],
    description: "Sync Stripe → compta pour indie hackers FR.",
  }),
  makeStreamOnlyConnector({
    id: "github",
    name: "GitHub",
    category: "dev",
    jobLabel: "Construire",
    priority: "p1",
    recommendedFor: ["github", "next.js"],
    description: "Commits, PRs, releases et vélocité.",
  }),
  makeStreamOnlyConnector({
    id: "vercel",
    name: "Vercel",
    category: "dev",
    jobLabel: "Construire",
    priority: "p1",
    recommendedFor: ["vercel", "next.js"],
    description: "Deploys, coûts infra et performance.",
  }),
  makeStreamOnlyConnector({
    id: "sentry",
    name: "Sentry",
    category: "monitoring",
    jobLabel: "Construire",
    priority: "p1",
    description: "Erreurs, crash-free sessions et issues.",
  }),
  makeStreamOnlyConnector({
    id: "better-stack",
    name: "Better Stack",
    category: "monitoring",
    jobLabel: "Construire",
    priority: "p2",
    description: "Uptime, incidents et logs.",
  }),
  makeStreamOnlyConnector({
    id: "slack",
    name: "Slack",
    category: "communication",
    jobLabel: "Être alerté",
    priority: "p1",
    description: "Alertes MRR, ROAS et churn dans vos canaux.",
  }),
  makeStreamOnlyConnector({
    id: "hubspot",
    name: "HubSpot",
    category: "crm",
    jobLabel: "Vendre",
    priority: "p1",
    recommendedFor: ["b2b", "hubspot"],
    description: "CRM, pipeline et deals B2B.",
  }),
  makeStreamOnlyConnector({
    id: "pipedrive",
    name: "Pipedrive",
    category: "crm",
    jobLabel: "Vendre",
    priority: "p2",
    description: "CRM léger pour solo founders.",
  }),
];

export function getConnector(id: string): ConnectorDefinition | undefined {
  return CONNECTORS.find((c) => c.id === id);
}

export { getConnectorBrand } from "@/lib/connectors/brands";

export function getConnectorsByCategory(category: ConnectorDefinition["category"]) {
  return CONNECTORS.filter((c) => c.category === category);
}

export function getConnectorsByJobLabel(jobLabel: string) {
  return CONNECTORS.filter((c) => c.jobLabel === jobLabel);
}

export const CONNECTOR_JOB_LABELS = [
  "Encaisser",
  "Acquérir",
  "Comprendre",
  "Convertir",
  "Supporter",
  "Comptabiliser (FR)",
  "Construire",
  "Être alerté",
  "Vendre",
] as const;
