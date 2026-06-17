import type { AcquisitionTab, CacChannel } from "@/types/opportunity";

/** Titres canoniques alignés sur CANONICAL_CAC. */
export const CANONICAL_ACQUISITION_TITLES = {
  coldEmail: "Cold email",
  linkedIn: "LinkedIn",
  seo: "SEO",
  referral: "Referral",
} as const;

const TITLE_ALIASES: Record<string, string> = {
  "cold email": CANONICAL_ACQUISITION_TITLES.coldEmail,
  "Cold Email": CANONICAL_ACQUISITION_TITLES.coldEmail,
  "Cold email": CANONICAL_ACQUISITION_TITLES.coldEmail,
  LinkedIn: CANONICAL_ACQUISITION_TITLES.linkedIn,
  linkedin: CANONICAL_ACQUISITION_TITLES.linkedIn,
  SEO: CANONICAL_ACQUISITION_TITLES.seo,
  seo: CANONICAL_ACQUISITION_TITLES.seo,
  Referral: CANONICAL_ACQUISITION_TITLES.referral,
  referral: CANONICAL_ACQUISITION_TITLES.referral,
  "Partenariats locaux": CANONICAL_ACQUISITION_TITLES.referral,
  "partenariats locaux": CANONICAL_ACQUISITION_TITLES.referral,
};

export type AcquisitionChannelKey = "cold_email" | "linkedin" | "seo" | "referral";

export function normalizeAcquisitionTitle(title: string): string {
  return TITLE_ALIASES[title] ?? title;
}

export function normalizeAcquisitionTabs(tabs: AcquisitionTab[]): AcquisitionTab[] {
  return tabs.map((tab) => ({
    ...tab,
    title: normalizeAcquisitionTitle(tab.title),
  }));
}

export function resolveChannelKey(title: string): AcquisitionChannelKey {
  const normalized = normalizeAcquisitionTitle(title).toLowerCase();
  if (normalized.includes("cold") || normalized === "email") return "cold_email";
  if (normalized.includes("linkedin")) return "linkedin";
  if (normalized.includes("seo")) return "seo";
  return "referral";
}

export function getCacForChannel(
  cacChannels: CacChannel[],
  tabTitle: string,
): CacChannel | undefined {
  const channelKey = normalizeAcquisitionTitle(tabTitle);
  return cacChannels.find((c) => c.channel.toLowerCase() === channelKey.toLowerCase());
}
