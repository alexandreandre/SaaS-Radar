import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { CampaignSequenceId } from "@/lib/campaign/sequences";

export function buildCampaignUtmUrl(
  productionUrl: string,
  channel: ExtendedChannelKey,
  sequenceId?: CampaignSequenceId | string,
  variant = "v1",
): string {
  const base = productionUrl.replace(/\/$/, "");
  const params = new URLSearchParams({
    utm_source: "saas-radar",
    utm_medium: channel,
    utm_campaign: sequenceId ?? "campaign",
    utm_content: variant,
  });
  return `${base}?${params.toString()}`;
}
