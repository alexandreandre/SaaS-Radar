import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getChannelLabel } from "@/lib/campaign/channels";
import type { CampaignKit } from "@/lib/campaign/kits";

export type CampaignAssetItem = {
  id: string;
  label: string;
};

const BASE_ASSETS: CampaignAssetItem[] = [
  { id: "landing", label: "Promesse claire sur la landing" },
  { id: "channel_copy", label: "Copy canal prioritaire validée" },
  { id: "visual", label: "Visuel ou vidéo principale" },
  { id: "utm", label: "UTM prêt à coller" },
];

const CHANNEL_ASSETS: Partial<Record<ExtendedChannelKey, CampaignAssetItem[]>> = {
  linkedin: [{ id: "linkedin_hook", label: "Accroche LinkedIn testée (1ère ligne)" }],
  cold_email: [
    { id: "email_subject", label: "Objet email A/B prêt" },
    { id: "email_sequence", label: "Séquence 3 emails rédigée" },
  ],
  seo: [{ id: "seo_brief", label: "Brief article ou page pilier rédigé" }],
  referral: [{ id: "referral_ask", label: "Script de demande de parrainage" }],
  tiktok: [{ id: "tiktok_hook", label: "Hook vidéo 3 secondes validé" }],
  meta: [{ id: "meta_creative", label: "Créa Meta (image ou vidéo 15s)" }],
  google: [{ id: "google_ad_copy", label: "Annonces Google (3 titres + descriptions)" }],
};

function kitDerivedAssets(kit?: CampaignKit): CampaignAssetItem[] {
  if (!kit) return [];
  const items: CampaignAssetItem[] = [];
  if (kit.primaryPrompt?.trim()) {
    items.push({ id: "kit_primary", label: "Prompt principal du kit généré" });
  }
  for (const step of kit.distributionSteps ?? []) {
    if (!step.trim()) continue;
    items.push({
      id: `kit_dist_${items.length}`,
      label: step.length > 60 ? `${step.slice(0, 57)}…` : step,
    });
  }
  return items.slice(0, 3);
}

export function getCampaignAssetChecklist(
  channel: ExtendedChannelKey,
  kit?: CampaignKit,
): CampaignAssetItem[] {
  const channelLabel = getChannelLabel(channel);
  const base = BASE_ASSETS.map((item) =>
    item.id === "channel_copy"
      ? { ...item, label: `Copy ${channelLabel} validée` }
      : item,
  );
  const channelSpecific = CHANNEL_ASSETS[channel] ?? [];
  const fromKit = kitDerivedAssets(kit);

  const seen = new Set<string>();
  const merged: CampaignAssetItem[] = [];
  for (const item of [...base, ...channelSpecific, ...fromKit]) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    merged.push(item);
  }
  return merged.slice(0, 8);
}
