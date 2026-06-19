import type { Opportunity } from "@/types/opportunity";
import {
  resolveChannelKey,
  type AcquisitionChannelKey,
} from "@/lib/acquisition-channels";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { resolveExtendedChannelKey } from "@/lib/campaign/channels";
import type {
  CampaignTool,
  CampaignToolId,
  MarketingProfile,
} from "@/lib/campaign/tools";
import { getChannelLabel } from "@/lib/campaign/channels";

export type GeneratorType = "prompt" | "email" | "message";

type ContentContext = {
  productName: string;
  target: string;
  price: number;
  pain: string;
  sector: string;
  tactics: string[];
  productionUrl?: string;
};

export type CampaignPromptContext = {
  opportunity: Opportunity;
  productName: string;
  tool: CampaignTool;
  channel: ExtendedChannelKey;
  profile: MarketingProfile;
  strategyBrief?: string;
  productionUrl?: string;
  language?: "fr" | "en";
};

function buildContext(
  opportunity: Opportunity,
  channel: string,
  productName?: string,
  productionUrl?: string,
): ContentContext {
  const name = productName ?? opportunity.name;
  const target = opportunity.targetClient;
  const price =
    opportunity.financialScenarios.find((s) => s.name === "Réaliste")?.avgPrice ?? 79;
  const pain =
    opportunity.foreignMarketProfile?.problemSolved ??
    `les ${target} perdent du temps et de l'argent sur des tâches répétitives`;
  const tactics = opportunity.acquisition.find((a) => a.title === channel)?.tactics ?? [];

  return {
    productName: name,
    target,
    price,
    pain,
    sector: opportunity.sector,
    tactics,
    productionUrl,
  };
}

function emailFromTemplates(
  opportunity: Opportunity,
  channelKey: AcquisitionChannelKey,
): string | null {
  const templates = opportunity.emailTemplates ?? [];
  if (templates.length === 0) return null;

  if (channelKey === "cold_email") {
    const match =
      templates.find((t) => /cold|email|prospection/i.test(t.name)) ?? templates[0];
    return `Objet : ${match.subject}\n\n${match.body}`;
  }

  if (channelKey === "referral" || channelKey === "linkedin") {
    const match =
      templates.find((t) => /partenaire|linkedin|connexion/i.test(t.name)) ?? templates[0];
    return `Objet : ${match.subject}\n\n${match.body}`;
  }

  return null;
}

function coldEmailPrompt(ctx: ContentContext): string {
  return `Tu es un expert en cold email B2B pour les SaaS français.

Produit : "${ctx.productName}"
Cible : ${ctx.target}
Problème résolu : ${ctx.pain}
Prix : ${ctx.price}€/mois

Génère une séquence complète de 4 emails cold :
- Email 1 : Accroche problème (max 5 lignes)
- Email 2 (J+3) : Preuve sociale / cas d'usage concret
- Email 3 (J+7) : Demo rapide 15 min
- Email 4 (J+14) : Break-up email

Tactiques à intégrer :
${ctx.tactics.map((t) => `- ${t}`).join("\n")}`;
}

function coldEmailBody(ctx: ContentContext): string {
  return `Objet : ${ctx.target} — ${ctx.pain.split(".")[0]}

Bonjour [Prénom],

${ctx.pain.charAt(0).toUpperCase() + ctx.pain.slice(1)}.

J'ai construit ${ctx.productName} pour aider les ${ctx.target} à résoudre exactement ce problème — sans changer leurs outils du jour au lendemain.

Est-ce que vous auriez 15 minutes cette semaine pour voir comment ça fonctionne ?

[Votre prénom]
Fondateur — ${ctx.productName} | ${ctx.price}€/mois`;
}

function coldEmailMessage(ctx: ContentContext): string {
  return `Bonjour [Prénom],

Je travaille sur ${ctx.productName} pour les ${ctx.target} — un outil qui ${ctx.pain.split(".")[0].toLowerCase()}.

Dispo pour 10 min cette semaine pour votre avis ?`;
}

function linkedInPrompt(ctx: ContentContext): string {
  return `Tu es un expert en personal branding LinkedIn pour les fondateurs de SaaS B2B français.

Je lance "${ctx.productName}" pour ${ctx.target}.
Problème : ${ctx.pain}

Génère :
1. Un post LinkedIn viral (format storytelling, 150-200 mots) sur la douleur du marché
2. Un message de connexion (< 300 caractères) pour approcher des ${ctx.target}
3. Un DM de suivi après acceptation de la connexion
4. Une bio LinkedIn optimisée pour attirer des ${ctx.target}

Ton : direct, expert, pas de jargon startup`;
}

function linkedInEmail(ctx: ContentContext): string {
  return `Objet : Suite à votre post LinkedIn

Bonjour [Prénom],

J'ai vu votre post sur [sujet lié à leur métier] — ça m'a parlé directement.

Je construis ${ctx.productName}, un outil pour ${ctx.target} qui résout ${ctx.pain.split(".")[0].toLowerCase()}.

Je serais curieux d'avoir votre retour d'expert en 15 minutes — pas de pitch, juste votre avis.

Dispo cette semaine ?

[Votre prénom]`;
}

function linkedInMessage(ctx: ContentContext): string {
  return `Bonjour [Prénom],

Merci pour la connexion !

Je développe ${ctx.productName} pour ${ctx.target} — ${ctx.pain.split(".")[0].toLowerCase()}.

Votre avis m'intéresserait si vous avez 10 min cette semaine ?

Pas de pitch, promis.`;
}

function seoPrompt(ctx: ContentContext): string {
  return `Tu es un expert SEO pour les SaaS B2B français.

Site : ${ctx.productName} (${ctx.target})
Problème résolu : ${ctx.pain}

Génère :
1. 15 mots-clés prioritaires avec intention de recherche (transactional/informational)
2. Structure d'une page pilier optimisée SEO
3. 5 idées d'articles de blog avec titres et méta-descriptions
4. Stratégie de netlinking pour le secteur ${ctx.sector}
5. Les featured snippets à cibler en priorité`;
}

function seoEmail(ctx: ContentContext): string {
  return `Objet : Partenariat contenu — ${ctx.productName} x [Leur site]

Bonjour [Prénom],

Je viens de lire votre article sur [sujet lié] — excellente analyse.

Je lance ${ctx.productName}, un SaaS pour ${ctx.target}. On cible les mêmes lecteurs.

Je vous propose un échange de liens ou un article invité sur [sujet complémentaire].

Intéressé ?

[Votre prénom]`;
}

function seoMessage(ctx: ContentContext): string {
  return `Bonjour [Prénom],

J'ai vu que vous êtes actif dans l'écosystème ${ctx.sector}.

Je lance ${ctx.productName} et je cherche des partenaires contenu pour des articles croisés.

On touche les mêmes ${ctx.target} — ça vous dirait qu'on en parle ?`;
}

function referralPrompt(ctx: ContentContext): string {
  return `Tu es un expert en programme de referral B2B.

Produit : "${ctx.productName}" pour ${ctx.target} à ${ctx.price}€/mois
Problème : ${ctx.pain}

Génère :
1. Structure d'un programme de partenariat (commission, conditions)
2. Script pour approcher un premier partenaire référent
3. Email de présentation du programme
4. Mécanisme d'incentive pour les référents
5. Comment tracker les referrals sans outil complexe`;
}

function referralEmail(ctx: ContentContext): string {
  return `Objet : Programme partenaire — ${ctx.productName}

Bonjour [Prénom],

Je lance ${ctx.productName} pour ${ctx.target} et je cherche des partenaires référents.

Le deal : vous recommandez notre solution à vos clients/contacts, on vous verse 20% de commission récurrente.

Vos clients y gagnent, vous aussi.

Intéressé pour en discuter ?

[Votre prénom]`;
}

function referralMessage(ctx: ContentContext): string {
  return `Bonjour [Prénom],

Je développe ${ctx.productName} pour ${ctx.target}.

Je cherche des partenaires dans ${ctx.sector} pour un programme de referral — commission récurrente sur chaque client apporté.

Ça vous parlerait ?`;
}

function tiktokPrompt(ctx: ContentContext): string {
  return `Tu es un expert en ads TikTok UGC pour SaaS.

Produit : "${ctx.productName}"
URL : ${ctx.productionUrl ?? "[votre URL]"}
Cible : ${ctx.target}

Génère 3 scripts vidéo UGC 15-30s :
- Hook problème (3 premières secondes)
- Démo rapide produit
- CTA essai gratuit

Ton : authentique, face caméra, pas corporate.`;
}

function metaPrompt(ctx: ContentContext): string {
  return `Tu es un expert Meta Ads (Facebook/Instagram) pour SaaS B2B/B2C.

Produit : "${ctx.productName}"
Cible : ${ctx.target}
Problème : ${ctx.pain}

Génère :
1. 5 accroches primary text (max 125 caractères)
2. 3 headlines
3. Brief créatif pour vidéo UGC 15s
4. Audience suggérée (intérêts, lookalike)`;
}

function googlePrompt(ctx: ContentContext): string {
  return `Tu es un expert Google Ads Search pour SaaS.

Produit : "${ctx.productName}"
Cible : ${ctx.target}

Génère :
1. 10 mots-clés search à fort intent
2. 3 annonces RSA (15 titres + 4 descriptions chacune)
3. Extensions sitelink suggérées
4. Landing page angle recommandé`;
}

export function getGeneratorTabLabels(channelKey: AcquisitionChannelKey): {
  id: GeneratorType;
  label: string;
}[] {
  switch (channelKey) {
    case "cold_email":
      return [
        { id: "prompt", label: "Prompt Claude" },
        { id: "email", label: "Cold email" },
        { id: "message", label: "Relance courte" },
      ];
    case "linkedin":
      return [
        { id: "prompt", label: "Prompt Claude" },
        { id: "email", label: "Email" },
        { id: "message", label: "Message LinkedIn" },
      ];
    case "seo":
      return [
        { id: "prompt", label: "Prompt Claude" },
        { id: "email", label: "Email partenaire" },
        { id: "message", label: "Message outreach" },
      ];
    case "referral":
      return [
        { id: "prompt", label: "Prompt Claude" },
        { id: "email", label: "Email partenaire" },
        { id: "message", label: "Script partenaire" },
      ];
  }
}

export function generateAcquisitionContent(
  opportunity: Opportunity,
  channel: string,
  type: GeneratorType,
  productName?: string,
): string {
  const channelKey = resolveChannelKey(channel);
  const ctx = buildContext(opportunity, channel, productName);

  if (type === "email") {
    const fromTemplate = emailFromTemplates(opportunity, channelKey);
    if (fromTemplate) return fromTemplate;
  }

  switch (channelKey) {
    case "cold_email":
      if (type === "prompt") return coldEmailPrompt(ctx);
      if (type === "email") return coldEmailBody(ctx);
      return coldEmailMessage(ctx);
    case "linkedin":
      if (type === "prompt") return linkedInPrompt(ctx);
      if (type === "email") return linkedInEmail(ctx);
      return linkedInMessage(ctx);
    case "seo":
      if (type === "prompt") return seoPrompt(ctx);
      if (type === "email") return seoEmail(ctx);
      return seoMessage(ctx);
    case "referral":
      if (type === "prompt") return referralPrompt(ctx);
      if (type === "email") return referralEmail(ctx);
      return referralMessage(ctx);
  }
}

export function getStaticPromptForTool(
  ctx: CampaignPromptContext,
): string | null {
  const tabTitle =
    ctx.opportunity.acquisition.find(
      (a) => resolveExtendedChannelKey(a.title) === ctx.channel,
    )?.title ?? getChannelLabel(ctx.channel);

  if (ctx.tool.id === "claude" || ctx.tool.id === "chatgpt") {
    if (ctx.channel === "tiktok") {
      return tiktokPrompt(
        buildContext(ctx.opportunity, tabTitle, ctx.productName, ctx.productionUrl),
      );
    }
    if (ctx.channel === "meta") {
      return metaPrompt(buildContext(ctx.opportunity, tabTitle, ctx.productName));
    }
    if (ctx.channel === "google") {
      return googlePrompt(buildContext(ctx.opportunity, tabTitle, ctx.productName));
    }
    return generateAcquisitionContent(
      ctx.opportunity,
      tabTitle,
      "prompt",
      ctx.productName,
    );
  }

  if (ctx.tool.id === "higgsfield" && ctx.productionUrl) {
    return `Marketing Studio — ${ctx.productName}

Product URL: ${ctx.productionUrl}
Format: UGC Tutorial
Cible: ${ctx.opportunity.targetClient}
Angle: ${ctx.opportunity.foreignMarketProfile?.problemSolved ?? ctx.opportunity.sector}

Instructions:
1. Collez l'URL dans Higgsfield Marketing Studio
2. Choisissez le format UGC ou Product Review
3. Générez 3 variantes (problème, démo, témoignage)
4. Exportez en 9:16 pour TikTok/Meta`;
  }

  if (ctx.tool.id === "creatify" && ctx.productionUrl) {
    return `Creatify — ${ctx.productName}

Product URL: ${ctx.productionUrl}
Cible: ${ctx.opportunity.targetClient}
Prix: ${ctx.opportunity.financialScenarios.find((s) => s.name === "Réaliste")?.avgPrice ?? 79}€/mois

Générez 3 vidéos UGC avatar avec scripts orientés douleur → solution → CTA essai.`;
  }

  return null;
}

export function buildStrategySystemPrompt(language: "fr" | "en" = "fr"): string {
  if (language === "en") {
    return `You are a senior go-to-market strategist for French indie SaaS founders.
Output structured markdown in English. Be specific, actionable, no generic advice.
Return JSON with a single field "strategyBrief" containing markdown.`;
  }
  return `Tu es un directeur marketing senior pour fondateurs de micro-SaaS français.
Produis un brief structuré en markdown, en français, vouvoiement.
Sois précis et actionnable — zéro conseil générique.
Réponds en JSON avec un seul champ "strategyBrief" contenant le markdown.`;
}

export function buildStrategyUserPrompt(ctx: CampaignPromptContext): string {
  const price =
    ctx.opportunity.financialScenarios.find((s) => s.name === "Réaliste")?.avgPrice ?? 79;
  const pain =
    ctx.opportunity.foreignMarketProfile?.problemSolved ??
    `problème pour ${ctx.opportunity.targetClient}`;
  const tactics =
    ctx.opportunity.acquisition.find(
      (a) => resolveExtendedChannelKey(a.title) === ctx.channel,
    )?.tactics ?? [];

  return `Produit : ${ctx.productName}
Secteur : ${ctx.opportunity.sector}
Cible : ${ctx.opportunity.targetClient}
Problème : ${pain}
Prix : ${price}€/mois
Canal prioritaire : ${getChannelLabel(ctx.channel)}
Profil marketing : ${ctx.profile}
URL : ${ctx.productionUrl ?? "non renseignée"}

Tactiques fiche :
${tactics.map((t) => `- ${t}`).join("\n")}

Le brief doit inclure :
1. Positionnement (1 phrase)
2. Persona principal
3. 3 messages clés
4. Objection #1 + réponse
5. CTA principal
6. Budget temps/semaine et budget € indicatif`;
}

export function buildKitSystemPrompt(language: "fr" | "en" = "fr"): string {
  if (language === "en") {
    return `You generate campaign kits for external marketing tools.
Return valid JSON only with fields: brief (markdown), primaryPrompt (string), secondaryPrompts (array of {label, content}), distributionSteps (string array).
Prompts must be copy-paste ready for the specified tool.`;
  }
  return `Tu génères des kits campagne pour outils marketing externes.
Réponds uniquement en JSON valide avec : brief (markdown), primaryPrompt (string), secondaryPrompts (tableau {label, content}), distributionSteps (tableau de strings).
Les prompts doivent être prêts à coller dans l'outil indiqué.`;
}

export function buildKitUserPrompt(ctx: CampaignPromptContext): string {
  const staticPrompt = getStaticPromptForTool(ctx);
  const base = `Outil : ${ctx.tool.name} (${ctx.tool.category})
Produit : ${ctx.productName}
Canal : ${getChannelLabel(ctx.channel)}
Profil : ${ctx.profile}
${ctx.strategyBrief ? `\nBrief stratégie :\n${ctx.strategyBrief}` : ""}
${staticPrompt ? `\nTemplate de base :\n${staticPrompt}` : ""}

Génère un kit complet adapté à ${ctx.tool.name}.`;

  return base;
}

export const VALID_CAMPAIGN_TOOL_IDS: CampaignToolId[] = [
  "claude",
  "chatgpt",
  "canva",
  "adcreative",
  "higgsfield",
  "creatify",
  "arcads",
  "heygen",
  "lemlist",
  "apollo",
  "smartlead",
  "typefully",
  "buffer",
  "loops",
  "brevo",
  "beehiiv",
  "n8n",
];
