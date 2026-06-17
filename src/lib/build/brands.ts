import type { BuildToolId } from "@/lib/build/tools";
import type { ConnectorId } from "@/lib/connectors/types";

export type BuildBrandSimpleIcon = {
  source: "simple-icon";
  icon: "SiV0" | "SiReplit" | "SiCursor" | "SiAnthropic" | "SiWindsurf" | "SiSupabase";
  color: string;
};

export type InfraBrandId = "supabase" | "firebase" | "stripe" | "resend" | "openai";

export type BuildBrandFavicon = {
  source: "favicon";
  domain: string;
  fallbackColor?: string;
};

export type BuildBrandConnector = {
  source: "connector";
  connectorId: ConnectorId;
};

export type BuildBrand = BuildBrandSimpleIcon | BuildBrandFavicon | BuildBrandConnector;

export const BUILD_TOOL_BRANDS: Record<BuildToolId, BuildBrand> = {
  base44: { source: "favicon", domain: "base44.com" },
  lovable: { source: "favicon", domain: "lovable.dev" },
  bolt: { source: "favicon", domain: "bolt.new" },
  v0: { source: "simple-icon", icon: "SiV0", color: "#000000" },
  replit: { source: "simple-icon", icon: "SiReplit", color: "#F26207" },
  cursor: { source: "simple-icon", icon: "SiCursor", color: "#000000" },
  "claude-code": { source: "simple-icon", icon: "SiAnthropic", color: "#191919" },
  windsurf: { source: "simple-icon", icon: "SiWindsurf", color: "#0B100F" },
};

export const BUILD_PLATFORM_BRANDS = {
  github: { source: "connector", connectorId: "github" } satisfies BuildBrandConnector,
  vercel: { source: "connector", connectorId: "vercel" } satisfies BuildBrandConnector,
  netlify: { source: "favicon", domain: "netlify.com" } satisfies BuildBrandFavicon,
} as const;

export type BuildPlatformId = keyof typeof BUILD_PLATFORM_BRANDS;

export const INFRA_BRANDS: Record<InfraBrandId, BuildBrandSimpleIcon | BuildBrandFavicon> = {
  supabase: { source: "simple-icon", icon: "SiSupabase", color: "#3FCF8E" },
  firebase: { source: "favicon", domain: "firebase.google.com", fallbackColor: "#FFCA28" },
  stripe: { source: "favicon", domain: "stripe.com", fallbackColor: "#635BFF" },
  resend: { source: "favicon", domain: "resend.com", fallbackColor: "#000000" },
  openai: { source: "favicon", domain: "openai.com", fallbackColor: "#412991" },
};

const INFRA_PROVIDER_ORDER: InfraBrandId[] = [
  "supabase",
  "firebase",
  "stripe",
  "resend",
  "openai",
];

export const INFRA_PROVIDER_LINKS: Record<
  InfraBrandId,
  { href: string; labelFr: string; labelEn: string }
> = {
  supabase: {
    href: "https://supabase.com",
    labelFr: "Ouvrir Supabase",
    labelEn: "Open Supabase",
  },
  firebase: {
    href: "https://console.firebase.google.com",
    labelFr: "Ouvrir Firebase",
    labelEn: "Open Firebase",
  },
  stripe: {
    href: "https://dashboard.stripe.com",
    labelFr: "Ouvrir Stripe",
    labelEn: "Open Stripe",
  },
  resend: {
    href: "https://resend.com",
    labelFr: "Ouvrir Resend",
    labelEn: "Open Resend",
  },
  openai: {
    href: "https://platform.openai.com",
    labelFr: "Ouvrir OpenAI",
    labelEn: "Open OpenAI",
  },
};

/** Déduit les fournisseurs externes à partir des variables d'environnement listées. */
export function inferInfraProvidersFromEnvVars(envVarNames: string[]): InfraBrandId[] {
  const found = new Set<InfraBrandId>();
  for (const name of envVarNames) {
    if (name.includes("SUPABASE")) found.add("supabase");
    if (name.includes("FIREBASE")) found.add("firebase");
    if (name.includes("STRIPE")) found.add("stripe");
    if (name.includes("RESEND")) found.add("resend");
    if (name.includes("OPENAI")) found.add("openai");
  }
  return INFRA_PROVIDER_ORDER.filter((id) => found.has(id));
}

export function matchInfraBrand(text: string): InfraBrandId | null {
  const lower = text.toLowerCase();
  if (/\bsupabase\b|supabase\.com/.test(lower)) return "supabase";
  if (/\bfirebase\b|console\.firebase/.test(lower)) return "firebase";
  if (/\bstripe\b|dashboard\.stripe/.test(lower)) return "stripe";
  if (/\bresend\b|resend\.com/.test(lower)) return "resend";
  if (/\bopenai\b|platform\.openai/.test(lower)) return "openai";
  return null;
}

export function faviconUrl(domain: string, size = 64): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=${size}`;
}
