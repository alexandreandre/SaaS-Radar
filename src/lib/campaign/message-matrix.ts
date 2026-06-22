import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getChannelLabel } from "@/lib/campaign/channels";
import type { CampaignPlaybookId } from "@/lib/campaign/playbooks";

export type ChannelMessageVariant = {
  channelLabel: string;
  hook: string;
  cta: string;
  format: string;
  constraints: string[];
};

const CHANNEL_RULES: Partial<
  Record<CampaignPlaybookId | ExtendedChannelKey, Omit<ChannelMessageVariant, "channelLabel">>
> = {
  linkedin: {
    hook: "Problème métier concret + insight fondateur",
    cta: "Commenter ou DM pour en savoir plus",
    format: "Post 800–1200 car. ou DM personnalisé",
    constraints: ["Pas de pitch direct en DM", "Montrer que vous connaissez leur contexte"],
  },
  cold_email: {
    hook: "Accroche personnalisée sur leur situation",
    cta: "15 min pour échanger ?",
    format: "Email < 120 mots, 1 CTA",
    constraints: ["SPF/DKIM configurés", "Pas de pièce jointe en J1"],
  },
  seo: {
    hook: "Mot-clé longue traîne + intention de recherche",
    cta: "Essai gratuit / démo",
    format: "Article 1200+ mots ou page pilier",
    constraints: ["1 mot-clé principal par page", "Meta title < 60 car."],
  },
  reddit: {
    hook: "Réponse utile à un problème décrit",
    cta: "Lien seulement si demandé",
    format: "Commentaire 3–5 phrases",
    constraints: ["Lire les règles du sub", "Pas de post promotionnel"],
  },
  calls: {
    hook: "Valider le problème avant la solution",
    cta: "Prochaine étape : trial ou démo",
    format: "Discovery 15 min",
    constraints: ["Écouter 70 %", "Noter objections"],
  },
  meta: {
    hook: "Hook visuel en 2 secondes",
    cta: "Essayer gratuitement",
    format: "Vidéo UGC 15–30 s ou static 1:1",
    constraints: ["1 audience · 1 objectif", "Budget test 20 €/jour"],
  },
  google: {
    hook: "Mot-clé transactionnel + bénéfice",
    cta: "Inscription / démo",
    format: "Search ad + landing alignée",
    constraints: ["UTM sur chaque URL", "Quality Score > 6 visé"],
  },
  tiktok: {
    hook: "Problème relatable immédiat",
    cta: "Lien bio / landing",
    format: "Vidéo 9:16, ton authentique",
    constraints: ["Hook < 2 s", "Pas corporate"],
  },
  referral: {
    hook: "Demande après un succès client",
    cta: "Parrainez un collègue → incentive",
    format: "Email ou message 1-to-1",
    constraints: ["Timing post-NPS élevé", "Incentive simple"],
  },
  product_hunt: {
    hook: "Histoire fondateur + problème résolu",
    cta: "Upvote + commentaire",
    format: "Launch page PH + maker comment",
    constraints: ["Préparer hunters 2 semaines avant", "Répondre à chaque commentaire"],
  },
  hacker_news: {
    hook: "Show HN technique ou retour d'expérience",
    cta: "Feedback brutally honest welcome",
    format: "Titre factuel, pas marketing",
    constraints: ["Pas de langage promo", "Être disponible 4h le jour J"],
  },
  partnerships: {
    hook: "Win-win pour l'audience du partenaire",
    cta: "Call partenariat 20 min",
    format: "Email ou LinkedIn partenaire",
    constraints: ["Personnaliser l'angle partenaire", "Proposer valeur d'abord"],
  },
  retargeting: {
    hook: "Rappel bénéfice + preuve sociale",
    cta: "Revenir essayer / finir inscription",
    format: "Display ou Meta retargeting",
    constraints: ["Audience visiteurs 7–30 j", "Fréquence cap 3/semaine"],
  },
  nurture: {
    hook: "Onboarding post-signup étape par étape",
    cta: "Activer la prochaine feature",
    format: "Séquence email J+1 à J+7",
    constraints: ["1 action par email", "Mesurer activation"],
  },
};

export function getChannelMessageVariant(
  channelId: CampaignPlaybookId | ExtendedChannelKey,
  positioning?: string,
  strategyBrief?: string,
): ChannelMessageVariant {
  const rules = CHANNEL_RULES[channelId] ?? {
    hook: positioning?.slice(0, 120) ?? "Adapter le message au canal",
    cta: "Découvrir le produit",
    format: "Format adapté au canal",
    constraints: ["Rester cohérent avec le brief global"],
  };

  const briefSnippet = strategyBrief?.split("\n").find((l) => l.trim().length > 20)?.slice(0, 100);

  return {
    channelLabel: getChannelLabel(channelId as ExtendedChannelKey) || String(channelId),
    hook: briefSnippet ? `${rules.hook} — ${briefSnippet}` : rules.hook,
    cta: rules.cta,
    format: rules.format,
    constraints: rules.constraints,
  };
}
