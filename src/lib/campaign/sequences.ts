import type { ConnectorId } from "@/lib/connectors/types";
import type { CampaignToolId } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { CampaignPlaybookId } from "@/lib/campaign/playbooks";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import type { CampaignSetup } from "@/lib/campaign/kits";

export type CampaignSequenceId =
  | "founder_outreach_14d"
  | "cold_email_21d"
  | "content_aeo_4w"
  | "paid_test_7d"
  | "launch_ph_hn"
  | "linkedin_organic_14d";

export type CampaignSequenceStep = {
  id: string;
  day: number;
  label: string;
  detail?: string;
  toolId?: CampaignToolId;
  connectorId?: ConnectorId;
  playbookHint?: CampaignPlaybookId;
  externalUrl?: string;
};

export type CampaignSequence = {
  id: CampaignSequenceId;
  label: string;
  motion: GtmMotion;
  totalDays: number;
  steps: CampaignSequenceStep[];
};

const FOUNDER_OUTREACH_14D: CampaignSequence = {
  id: "founder_outreach_14d",
  label: "Outreach fondateur 14 jours",
  motion: "founder_led",
  totalDays: 14,
  steps: [
    { id: "fo-d1-profile", day: 1, label: "Optimiser profil LinkedIn fondateur", playbookHint: "linkedin" },
    { id: "fo-d1-connect", day: 1, label: "10 demandes de connexion ciblées", toolId: "typefully", playbookHint: "linkedin" },
    { id: "fo-d3-post", day: 3, label: "1 post problème (hook validé)", toolId: "claude", playbookHint: "linkedin" },
    { id: "fo-d5-dm", day: 5, label: "10 DMs personnalisés (pas de pitch)", playbookHint: "linkedin" },
    { id: "fo-d7-community", day: 7, label: "5 contributions utiles (Reddit/communauté)", playbookHint: "reddit" },
    { id: "fo-d10-call", day: 10, label: "Planifier 3 discovery calls", playbookHint: "calls", externalUrl: "https://cal.com" },
    { id: "fo-d14-retro", day: 14, label: "Noter verbatims & objections", playbookHint: "calls" },
  ],
};

const COLD_EMAIL_21D: CampaignSequence = {
  id: "cold_email_21d",
  label: "Cold email 21 jours",
  motion: "outbound",
  totalDays: 21,
  steps: [
    { id: "ce-d1-dns", day: 1, label: "Configurer SPF/DKIM/DMARC", detail: "Domaine d'envoi dédié" },
    { id: "ce-d3-warmup", day: 3, label: "Warm-up domaine 5–7 jours", toolId: "lemlist" },
    { id: "ce-d7-sequence", day: 7, label: "Rédiger séquence 4 emails", toolId: "claude" },
    { id: "ce-d10-list", day: 10, label: "Importer liste 50 prospects ICP", toolId: "apollo" },
    { id: "ce-d12-batch", day: 12, label: "Envoyer batch test (20 emails max)", toolId: "lemlist" },
    { id: "ce-d15-follow", day: 15, label: "Relances J+3 et J+7", toolId: "lemlist" },
    { id: "ce-d21-measure", day: 21, label: "Mesurer taux réponse (>5 % cible)", connectorId: "plausible" },
  ],
};

const CONTENT_AEO_4W: CampaignSequence = {
  id: "content_aeo_4w",
  label: "Contenu AEO 4 semaines",
  motion: "content",
  totalDays: 28,
  steps: [
    { id: "aeo-w1-keyword", day: 1, label: "Valider 1 mot-clé longue traîne", toolId: "claude", playbookHint: "seo" },
    { id: "aeo-w1-outline", day: 3, label: "Plan article answer-first (H2 = réponse directe)", toolId: "claude" },
    { id: "aeo-w2-publish", day: 10, label: "Publier article + visuels OG", toolId: "canva", playbookHint: "seo" },
    { id: "aeo-w3-gsc", day: 17, label: "Soumettre URL à Search Console", externalUrl: "https://search.google.com/search-console" },
    { id: "aeo-w4-refresh", day: 24, label: "Rafraîchir stats & section comparatif", toolId: "claude" },
    { id: "aeo-w4-reviews", day: 28, label: "Demander 3 avis G2/Capterra", playbookHint: "reviews" },
  ],
};

const PAID_TEST_7D: CampaignSequence = {
  id: "paid_test_7d",
  label: "Test pub 7 jours",
  motion: "paid_test",
  totalDays: 7,
  steps: [
    { id: "pt-d1-creatives", day: 1, label: "3 créas validées (UTM sur landing)", toolId: "adcreative" },
    { id: "pt-d2-pixel", day: 2, label: "Pixel installé + événement conversion", connectorId: "plausible" },
    { id: "pt-d3-launch", day: 3, label: "Campagne test 20 €/jour", connectorId: "meta-ads", playbookHint: "meta" },
    { id: "pt-d5-review", day: 5, label: "Couper créas sous ROAS 1", playbookHint: "meta" },
    { id: "pt-d7-scale", day: 7, label: "Doubler budget sur la créa gagnante", connectorId: "meta-ads" },
  ],
};

const LAUNCH_PH_HN: CampaignSequence = {
  id: "launch_ph_hn",
  label: "Lancement PH + HN",
  motion: "launch",
  totalDays: 14,
  steps: [
    { id: "ln-w1-assets", day: 1, label: "Préparer assets PH (tagline, screenshots)", playbookHint: "product_hunt" },
    { id: "ln-w2-hunters", day: 7, label: "Mobiliser réseau J0 (20–30 upvotes)", playbookHint: "product_hunt" },
    { id: "ln-d0-ph", day: 10, label: "Lancer Product Hunt + répondre aux comments", externalUrl: "https://www.producthunt.com", playbookHint: "product_hunt" },
    { id: "ln-d1-hn", day: 11, label: "Show HN — disponible 4 h", externalUrl: "https://news.ycombinator.com", playbookHint: "hacker_news" },
    { id: "ln-d2-relay", day: 12, label: "Relayer sur LinkedIn (post authentique)", toolId: "typefully", playbookHint: "linkedin" },
  ],
};

const LINKEDIN_ORGANIC_14D: CampaignSequence = {
  id: "linkedin_organic_14d",
  label: "LinkedIn organique 14 jours",
  motion: "founder_led",
  totalDays: 14,
  steps: FOUNDER_OUTREACH_14D.steps.filter((s) => s.playbookHint !== "reddit"),
};

export const CAMPAIGN_SEQUENCES: Record<CampaignSequenceId, CampaignSequence> = {
  founder_outreach_14d: FOUNDER_OUTREACH_14D,
  cold_email_21d: COLD_EMAIL_21D,
  content_aeo_4w: CONTENT_AEO_4W,
  paid_test_7d: PAID_TEST_7D,
  launch_ph_hn: LAUNCH_PH_HN,
  linkedin_organic_14d: LINKEDIN_ORGANIC_14D,
};

export function getCampaignSequence(id: CampaignSequenceId): CampaignSequence {
  return CAMPAIGN_SEQUENCES[id];
}

export function resolveSequenceId(
  stage: AcquisitionStage,
  channel: ExtendedChannelKey,
  motion?: GtmMotion,
): CampaignSequenceId {
  const m = motion ?? recommendGtmMotion(stage, channel);
  if (channel === "cold_email" || m === "outbound") return "cold_email_21d";
  if (m === "content" || channel === "seo") return "content_aeo_4w";
  if (m === "paid_test" || channel === "meta" || channel === "google" || channel === "tiktok") {
    return "paid_test_7d";
  }
  if (m === "launch" || stage === "amplification") return "launch_ph_hn";
  if (channel === "linkedin") return "linkedin_organic_14d";
  return "founder_outreach_14d";
}

export function getActiveSequence(setup: CampaignSetup | undefined): CampaignSequence | undefined {
  if (!setup?.activeSequenceId) return undefined;
  const id = setup.activeSequenceId as CampaignSequenceId;
  return CAMPAIGN_SEQUENCES[id];
}

export function getSequenceStepsWithProgress(
  setup: CampaignSetup | undefined,
): (CampaignSequenceStep & { done: boolean; doneAt?: string })[] {
  const seq = getActiveSequence(setup);
  if (!seq) return [];
  const progress = setup?.sequenceProgress ?? {};
  return seq.steps.map((step) => ({
    ...step,
    done: Boolean(progress[step.id]?.done),
    doneAt: progress[step.id]?.doneAt,
  }));
}

export function sequenceProgressPercent(setup: CampaignSetup | undefined): number {
  const steps = getSequenceStepsWithProgress(setup);
  if (steps.length === 0) return 0;
  return Math.round((steps.filter((s) => s.done).length / steps.length) * 100);
}

export function isSequenceStepComplete(
  setup: CampaignSetup | undefined,
  stepId: string,
): boolean {
  return Boolean(setup?.sequenceProgress?.[stepId]?.done);
}

export function isSequenceFullyComplete(setup: CampaignSetup | undefined): boolean {
  const steps = getSequenceStepsWithProgress(setup);
  return steps.length > 0 && steps.every((s) => s.done);
}

export function distributionProgressPercent(
  setup: CampaignSetup | undefined,
  stepCount: number,
): number {
  if (stepCount <= 0) return 100;
  const progress = setup?.distributionProgress ?? {};
  const done = Object.values(progress).filter((p) => p.done).length;
  return Math.round((done / stepCount) * 100);
}

export function isDistributionGuideComplete(
  setup: CampaignSetup | undefined,
  stepCount: number,
): boolean {
  if (stepCount <= 0) return true;
  const progress = setup?.distributionProgress ?? {};
  for (let i = 0; i < stepCount; i++) {
    if (!progress[`dist-${i}`]?.done) return false;
  }
  return true;
}
