import type { Opportunity } from "@/types/opportunity";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getChannelLabel } from "@/lib/campaign/channels";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import { getStageDefinition } from "@/lib/campaign/stages";
import type { ConnectorId } from "@/lib/connectors/types";

export type CampaignPlaybookId =
  | ExtendedChannelKey
  | "reddit"
  | "calls"
  | "product_hunt"
  | "hacker_news"
  | "partnerships"
  | "retargeting"
  | "nurture"
  | "reviews"
  | "communities";

export type PlaybookCategory =
  | "social"
  | "content"
  | "outreach"
  | "community"
  | "paid"
  | "launch"
  | "lifecycle";

export type PlaybookRelevance = "primary" | "recommended" | "available" | "later";

export type CampaignPlaybook = {
  id: CampaignPlaybookId;
  label: string;
  category: PlaybookCategory;
  description: string;
  bestFor: string;
  weeklyTimeHint: string;
  budgetHint: string;
  connectorIds: ConnectorId[];
  toolChannel: ExtendedChannelKey;
};

export const CAMPAIGN_PLAYBOOKS: CampaignPlaybook[] = [
  {
    id: "linkedin",
    label: "LinkedIn",
    category: "social",
    description: "Posts fondateur, DMs ciblés et thought leadership B2B.",
    bestFor: "Réseau, outreach et contenu organique B2B.",
    weeklyTimeHint: "3–5 h · 2 posts + 10 DMs",
    budgetHint: "0 € organique · dès 50 €/j en Ads",
    connectorIds: ["linkedin-ads", "plausible"],
    toolChannel: "linkedin",
  },
  {
    id: "cold_email",
    label: "Email froid",
    category: "outreach",
    description: "Prospection directe par séquences email personnalisées.",
    bestFor: "Outreach ciblé sur un ICP serré.",
    weeklyTimeHint: "4–6 h · liste + séquences",
    budgetHint: "dès 30 €/mois (Lemlist, domaine)",
    connectorIds: ["plausible"],
    toolChannel: "cold_email",
  },
  {
    id: "calls",
    label: "Calls & démos",
    category: "outreach",
    description: "Discovery calls, démos produit et closing fondateur-led.",
    bestFor: "Valider le problème et convertir les prospects chauds.",
    weeklyTimeHint: "2–4 h · 5 calls de 15 min",
    budgetHint: "0 € · Calendly + visio",
    connectorIds: ["plausible", "hubspot"],
    toolChannel: "cold_email",
  },
  {
    id: "seo",
    label: "SEO & blog",
    category: "content",
    description: "Contenu long format, mots-clés et autorité organique.",
    bestFor: "Signups récurrents sans budget pub.",
    weeklyTimeHint: "6–10 h · 1 article + optimisation",
    budgetHint: "0–200 €/mois (outils SEO)",
    connectorIds: ["plausible", "google-analytics"],
    toolChannel: "seo",
  },
  {
    id: "reddit",
    label: "Reddit",
    category: "community",
    description: "Participation utile dans r/SaaS, r/startups et niches métier.",
    bestFor: "Feedback early adopters et trafic qualifié.",
    weeklyTimeHint: "2–3 h · 5 commentaires utiles",
    budgetHint: "0 € · valeur avant promotion",
    connectorIds: ["plausible"],
    toolChannel: "linkedin",
  },
  {
    id: "referral",
    label: "Referral",
    category: "community",
    description: "Programme parrainage, partenaires et bouche-à-oreille.",
    bestFor: "Amplifier la confiance des premiers clients.",
    weeklyTimeHint: "2 h · 3 demandes de referral",
    budgetHint: "0 € ou incentive client",
    connectorIds: ["plausible", "loops"],
    toolChannel: "referral",
  },
  {
    id: "meta",
    label: "Meta Ads",
    category: "paid",
    description: "Facebook & Instagram — créas UGC et tests conversion.",
    bestFor: "Amplification et scale avec budget contrôlé.",
    weeklyTimeHint: "3–5 h · 3 variantes créatives",
    budgetHint: "dès 20 €/jour en test",
    connectorIds: ["meta-ads", "plausible"],
    toolChannel: "meta",
  },
  {
    id: "google",
    label: "Google Ads",
    category: "paid",
    description: "Search intent et display — capter la demande active.",
    bestFor: "Mots-clés transactionnels et retargeting.",
    weeklyTimeHint: "3–4 h · structure campagne + mots-clés",
    budgetHint: "dès 15 €/jour en test",
    connectorIds: ["google-ads", "plausible"],
    toolChannel: "google",
  },
  {
    id: "tiktok",
    label: "TikTok Ads",
    category: "paid",
    description: "Vidéos UGC courtes et tests créatifs viraux.",
    bestFor: "Produits visuels ou B2C léger.",
    weeklyTimeHint: "4–6 h · 3 vidéos 9:16",
    budgetHint: "dès 20 €/jour en test",
    connectorIds: ["tiktok-ads", "plausible"],
    toolChannel: "tiktok",
  },
  {
    id: "product_hunt",
    label: "Product Hunt",
    category: "launch",
    description: "Lancement PH — hunters, page produit et maker comment.",
    bestFor: "Pic de visibilité early adopters tech.",
    weeklyTimeHint: "1 semaine prep + jour J actif",
    budgetHint: "0 € · temps intense jour J",
    connectorIds: ["plausible"],
    toolChannel: "linkedin",
  },
  {
    id: "hacker_news",
    label: "Hacker News",
    category: "launch",
    description: "Show HN ou retour d'expérience — audience tech exigeante.",
    bestFor: "Feedback brut et trafic qualifié B2B tech.",
    weeklyTimeHint: "4 h jour J + réponses",
    budgetHint: "0 €",
    connectorIds: ["plausible"],
    toolChannel: "linkedin",
  },
  {
    id: "partnerships",
    label: "Partenariats",
    category: "community",
    description: "Outreach partenaires FR — associations, intégrateurs, médias niche.",
    bestFor: "Distribution via audiences existantes.",
    weeklyTimeHint: "2–3 h · 5 contacts partenaires",
    budgetHint: "0 € ou rev share",
    connectorIds: ["plausible", "hubspot"],
    toolChannel: "referral",
  },
  {
    id: "retargeting",
    label: "Retargeting",
    category: "paid",
    description: "Audiences chaudes — visiteurs et signups non convertis.",
    bestFor: "Stade amplification+ avec trafic existant.",
    weeklyTimeHint: "2 h · setup pixel + 2 créas",
    budgetHint: "dès 10 €/jour",
    connectorIds: ["meta-ads", "google-ads", "plausible"],
    toolChannel: "meta",
  },
  {
    id: "nurture",
    label: "Nurture email",
    category: "lifecycle",
    description: "Séquences post-signup — activation et conversion trial→payant.",
    bestFor: "Convertir les signups déjà acquis.",
    weeklyTimeHint: "3 h · séquence J+1 à J+7",
    budgetHint: "dès 0 € (Loops/Brevo)",
    connectorIds: ["loops", "brevo", "plausible"],
    toolChannel: "referral",
  },
  {
    id: "reviews",
    label: "Avis G2 / Capterra",
    category: "community",
    description: "Collecter des avis sur les plateformes — première source de recherche B2B.",
    bestFor: "Crédibilité et dark funnel (shortlist avant contact).",
    weeklyTimeHint: "2 h · 3 avis clients",
    budgetHint: "0 €",
    connectorIds: ["plausible"],
    toolChannel: "referral",
  },
  {
    id: "communities",
    label: "Communautés (Slack/Discord)",
    category: "community",
    description: "Présence utile dans les Slack/Discord où vit votre ICP.",
    bestFor: "Confiance et feedback early adopters.",
    weeklyTimeHint: "2–3 h · contributions utiles",
    budgetHint: "0 €",
    connectorIds: ["plausible"],
    toolChannel: "linkedin",
  },
];

const PLAYBOOK_BY_ID = Object.fromEntries(
  CAMPAIGN_PLAYBOOKS.map((p) => [p.id, p]),
) as Record<CampaignPlaybookId, CampaignPlaybook>;

export function getCampaignPlaybook(id: CampaignPlaybookId): CampaignPlaybook {
  return PLAYBOOK_BY_ID[id];
}

const STAGE_PLAYBOOKS: Record<AcquisitionStage, CampaignPlaybookId[]> = {
  network: ["linkedin", "reddit", "calls", "referral"],
  outreach: ["cold_email", "linkedin", "calls", "reddit"],
  content: ["seo", "linkedin", "reddit", "referral", "nurture", "reviews"],
  amplification: ["product_hunt", "hacker_news", "linkedin", "meta", "google", "retargeting", "partnerships"],
  scale: ["meta", "google", "tiktok", "retargeting", "linkedin", "cold_email", "nurture"],
};

const CATEGORY_LABELS: Record<PlaybookCategory, string> = {
  social: "Social",
  content: "Contenu",
  outreach: "Outreach",
  community: "Communauté",
  paid: "Pub payante",
  launch: "Lancement",
  lifecycle: "Lifecycle",
};

export function getPlaybookCategoryLabel(category: PlaybookCategory): string {
  return CATEGORY_LABELS[category];
}

function relevanceForPlaybook(
  playbookId: CampaignPlaybookId,
  stage: AcquisitionStage,
  primaryChannel: ExtendedChannelKey,
): PlaybookRelevance {
  const stagePlaybooks = STAGE_PLAYBOOKS[stage];
  if (playbookId === primaryChannel) return "primary";
  if (!stagePlaybooks.includes(playbookId)) return "later";
  const stageDef = getStageDefinition(stage);
  if (stageDef.allowedChannels.includes(playbookId as ExtendedChannelKey)) {
    return "recommended";
  }
  if (playbookId === "reddit" || playbookId === "calls" || playbookId === "partnerships") {
    return stage === "network" || stage === "outreach" ? "recommended" : "available";
  }
  if (playbookId === "product_hunt" || playbookId === "hacker_news") {
    return stage === "amplification" ? "recommended" : stage === "content" ? "available" : "later";
  }
  if (playbookId === "retargeting" || playbookId === "nurture") {
    return stage === "scale" || stage === "amplification" ? "recommended" : "available";
  }
  return "available";
}

export type PlaybookWithRelevance = CampaignPlaybook & {
  relevance: PlaybookRelevance;
};

const RELEVANCE_ORDER: Record<PlaybookRelevance, number> = {
  primary: 0,
  recommended: 1,
  available: 2,
  later: 3,
};

export function getPlaybooksForCampaign(
  stage: AcquisitionStage,
  primaryChannel: ExtendedChannelKey,
  opportunity?: Opportunity,
): PlaybookWithRelevance[] {
  const fromOpportunity = new Set<CampaignPlaybookId>();
  for (const tab of opportunity?.acquisition ?? []) {
    const key = tab.title.toLowerCase();
    if (key.includes("linkedin")) fromOpportunity.add("linkedin");
    if (key.includes("seo") || key.includes("blog")) fromOpportunity.add("seo");
    if (key.includes("email") || key.includes("cold")) fromOpportunity.add("cold_email");
    if (key.includes("referral") || key.includes("parrain")) fromOpportunity.add("referral");
    if (key.includes("meta") || key.includes("facebook")) fromOpportunity.add("meta");
    if (key.includes("google")) fromOpportunity.add("google");
    if (key.includes("tiktok")) fromOpportunity.add("tiktok");
    if (key.includes("reddit")) fromOpportunity.add("reddit");
    if (key.includes("product hunt") || key.includes("producthunt")) fromOpportunity.add("product_hunt");
    if (key.includes("hacker") || key.includes("show hn")) fromOpportunity.add("hacker_news");
    if (key.includes("partenaire") || key.includes("partner")) fromOpportunity.add("partnerships");
  }

  if ((opportunity?.partnersFR?.length ?? 0) > 0) {
    fromOpportunity.add("partnerships");
  }

  const stageIds = STAGE_PLAYBOOKS[stage];
  const candidateIds = new Set<CampaignPlaybookId>([
    primaryChannel,
    ...stageIds,
    ...Array.from(fromOpportunity),
  ]);

  return CAMPAIGN_PLAYBOOKS.filter((p) => candidateIds.has(p.id))
    .map((p) => ({
      ...p,
      relevance: relevanceForPlaybook(p.id, stage, primaryChannel),
    }))
    .sort((a, b) => {
      const rel = RELEVANCE_ORDER[a.relevance] - RELEVANCE_ORDER[b.relevance];
      if (rel !== 0) return rel;
      return stageIds.indexOf(a.id) - stageIds.indexOf(b.id);
    });
}

export function getVisiblePlaybooks(
  stage: AcquisitionStage,
  primaryChannel: ExtendedChannelKey,
  opportunity?: Opportunity,
): PlaybookWithRelevance[] {
  return getPlaybooksForCampaign(stage, primaryChannel, opportunity).filter(
    (p) => p.relevance !== "later",
  );
}

export function getPlaybookGuide(playbook: CampaignPlaybook, stage: AcquisitionStage): string[] {
  const stageDef = getStageDefinition(stage);
  const base = [
    `Stade actuel : ${stageDef.label} (${stageDef.customerRange}).`,
    `Métrique clé : ${stageDef.primaryMetric}.`,
    playbook.bestFor,
  ];

  switch (playbook.id) {
    case "linkedin":
      return [
        ...base,
        "Semaine 1 : 1 post problème + 10 DMs personnalisés (pas de pitch direct).",
        "Semaine 2 : 1 post avant/après + relance des intéressés.",
        stageDef.showPaidAds
          ? "Quand l'organique convertit : tester LinkedIn Ads sur l'audience engagée."
          : "Pas de pub à ce stade — validez le message en organique d'abord.",
      ];
    case "cold_email":
      return [
        ...base,
        "Configurez SPF/DKIM/DMARC avant tout envoi.",
        "20 emails max en J1 — personnalisez l'accroche sur le contexte du prospect.",
        "Objectif : taux de réponse > 5 %, puis planifier des calls.",
      ];
    case "calls":
      return [
        ...base,
        "Script discovery : problème → impact → solution actuelle → next step.",
        "15 min max — écoutez 70 %, parlez 30 %.",
        "Notez les objections récurrentes pour affiner le message.",
      ];
    case "seo":
      return [
        ...base,
        "1 mot-clé longue traîne par article — intention transactionnelle ou informationnelle.",
        "Format AEO : réponse directe en première phrase de chaque H2, stats nommées, fraîcheur <12 mois.",
        "Page pilier + 3 articles satellites · Search Console sous 7 jours.",
        "Mesurez signups organiques / semaine, pas seulement le trafic.",
      ];
    case "reddit":
      return [
        ...base,
        "Lisez les règles du subreddit — pas de post promotionnel.",
        "Répondez à des threads existants avec une vraie valeur.",
        "Mentionnez le produit seulement si la personne décrit exactement votre problème.",
      ];
    case "meta":
      return [
        ...base,
        "1 audience · 1 objectif conversion · 3 créas max au départ.",
        "Budget test : 20 €/jour pendant 5 jours avant de scaler.",
        "Coupez ce qui est sous ROAS 1 — doublez ce qui convertit.",
      ];
    case "google":
      return [
        ...base,
        "Commencez par Search sur mots-clés à intention d'achat.",
        "UTM sur chaque URL — suivez signups, pas seulement les clics.",
        "Ajoutez le retargeting display après 500 visiteurs qualifiés.",
      ];
    case "tiktok":
      return [
        ...base,
        "Hook en 2 secondes — montrez le problème avant la solution.",
        "3 vidéos UGC 9:16 · ton authentique, pas corporate.",
        "Testez 20 €/jour — itérez sur les hooks qui retiennent > 3 s.",
      ];
    case "referral":
      return [
        ...base,
        "Demandez un referral juste après un succès client (NPS élevé).",
        "Offrez un incentive simple : mois offert ou crédit.",
        "Suivez le taux referral → signup par client satisfait.",
      ];
    case "product_hunt":
      return [
        ...base,
        "Préparez hunters et assets 2 semaines avant le lancement.",
        "Maker comment : histoire authentique, pas un pitch marketing.",
        "Répondez à chaque commentaire le jour J.",
      ];
    case "hacker_news":
      return [
        ...base,
        "Titre factuel : Show HN: [Produit] – [problème résolu].",
        "Soyez disponible 4 h pour répondre aux commentaires.",
        "Pas de langage marketing — transparence et technique.",
      ];
    case "partnerships":
      return [
        ...base,
        "Identifiez 5 partenaires dont l'audience = votre ICP.",
        "Proposez une valeur claire au partenaire avant de demander.",
        "Angle win-win : co-webinar, intégration, ou commission.",
      ];
    case "retargeting":
      return [
        ...base,
        "Pixel installé + audience visiteurs 7–30 jours.",
        "Message : rappel bénéfice + preuve sociale.",
        "Fréquence max 3 impressions / semaine / personne.",
      ];
    case "nurture":
      return [
        ...base,
        "Séquence J+1 welcome → J+3 activation → J+7 conversion.",
        "1 action claire par email.",
        "Mesurez taux activation, pas seulement ouvertures.",
      ];
    case "reviews":
      return [
        ...base,
        "Profil G2/Capterra complet avec screenshots à jour.",
        "Demandez un avis après un succès client (NPS élevé).",
        "Répondez à chaque avis — positif ou négatif.",
      ];
    case "communities":
      return [
        ...base,
        "Identifiez 2–3 Slack/Discord où votre ICP est actif.",
        "Apportez de la valeur 2 semaines avant toute mention produit.",
        "Partagez le lien seulement quand la question correspond exactement.",
      ];
    default:
      return base;
  }
}

export function playbookRelevanceLabel(relevance: PlaybookRelevance): string {
  switch (relevance) {
    case "primary":
      return "Canal prioritaire";
    case "recommended":
      return "Recommandé";
    case "available":
      return "Disponible";
    case "later":
      return "Plus tard";
  }
}

export function resolvePlaybookLabel(id: CampaignPlaybookId): string {
  if (id in PLAYBOOK_BY_ID) return PLAYBOOK_BY_ID[id].label;
  return getChannelLabel(id as ExtendedChannelKey);
}
