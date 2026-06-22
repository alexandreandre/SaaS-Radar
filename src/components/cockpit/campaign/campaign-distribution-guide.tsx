"use client";

import type { CampaignPlaybookId } from "@/lib/campaign/playbooks";
import { Button } from "@/components/ui/button";

const DISTRIBUTION_STEPS: Partial<Record<CampaignPlaybookId, string[]>> = {
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

type CampaignDistributionGuideProps = {
  playbookId: CampaignPlaybookId;
  kitSteps?: string[];
  acknowledged?: boolean;
  onAcknowledge: () => void;
};

export function CampaignDistributionGuide({
  playbookId,
  kitSteps,
  acknowledged,
  onAcknowledge,
}: CampaignDistributionGuideProps) {
  const steps = kitSteps?.length ? kitSteps : DISTRIBUTION_STEPS[playbookId];
  if (!steps?.length) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-card">
      <h4 className="text-sm font-semibold">Guide diffusion</h4>
      <p className="mt-1 text-xs text-muted-foreground">
        Validez chaque étape avant de lancer.
      </p>
      <ol className="mt-3 space-y-2">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{i + 1}.</span>
            {step}
          </li>
        ))}
      </ol>
      {!acknowledged ? (
        <Button type="button" size="sm" className="mt-4" onClick={onAcknowledge}>
          Marquer la diffusion prête
        </Button>
      ) : (
        <p className="mt-3 text-xs text-emerald-600">Diffusion validée ✓</p>
      )}
    </div>
  );
}
