import type { CampaignPlaybookId } from "@/lib/campaign/playbooks";
import type { CampaignSetup } from "@/lib/campaign/kits";

export const DISTRIBUTION_GUIDE_STEPS: Partial<Record<CampaignPlaybookId, string[]>> = {
  meta: [
    "Compte Meta Business Manager configuré",
    "Pixel installé sur la landing",
    "3 créas validées + UTM sur l'URL",
    "Campagne test lancée (20 €/jour)",
  ],
  google: [
    "Compte Google Ads + facturation",
    "Mots-clés transactionnels sélectionnés",
    "Landing alignée avec l'annonce",
    "Campagne Search test lancée",
  ],
  tiktok: [
    "Compte TikTok Ads + pixel",
    "3 vidéos UGC 9:16 prêtes",
    "Audience test définie",
    "Campagne lancée à 20 €/jour",
  ],
  cold_email: [
    "Domaine d'envoi + SPF/DKIM/DMARC",
    "Warm-up domaine 5–7 jours",
    "Liste 50 prospects importée",
    "Séquence J1 activée (20 max)",
  ],
  linkedin: [
    "Profil fondateur optimisé",
    "1 post + 10 DMs rédigés",
    "Calendrier publication défini",
    "Première publication live",
  ],
  seo: [
    "Mot-clé cible validé",
    "Article ou page pilier publiée",
    "Meta title + description optimisés",
    "Soumis à Google Search Console",
  ],
};

export function resolveDistributionGuideSteps(
  playbookId: CampaignPlaybookId,
  kitSteps?: string[],
): string[] {
  if (kitSteps?.length) return kitSteps;
  return DISTRIBUTION_GUIDE_STEPS[playbookId] ?? [];
}

export function getDistributionGuideStepCount(
  playbookId: CampaignPlaybookId,
  kitSteps?: string[],
): number {
  return resolveDistributionGuideSteps(playbookId, kitSteps).length;
}

export function isDistributionGuideFullyComplete(
  setup: CampaignSetup | undefined,
  playbookId: CampaignPlaybookId,
  kitSteps?: string[],
): boolean {
  const count = getDistributionGuideStepCount(playbookId, kitSteps);
  if (count === 0) return true;
  const progress = setup?.distributionProgress ?? {};
  for (let i = 0; i < count; i++) {
    if (!progress[`dist-${i}`]?.done) return false;
  }
  return true;
}
