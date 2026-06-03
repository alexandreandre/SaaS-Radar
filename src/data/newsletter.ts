import type { Tier } from "@/lib/tier";

export type ArticleCategory = "ia" | "actu-tech" | "saas";

export const categoryLabels: Record<ArticleCategory, string> = {
  ia: "IA",
  "actu-tech": "Actu Tech",
  saas: "SaaS",
};

export const categoryDescriptions: Record<ArticleCategory, string> = {
  ia: "Modèles, agents et outils qui changent la donne",
  "actu-tech": "Levées, régulation, tendances marché",
  saas: "Micro-SaaS à importer, scores et opportunités France",
};

export interface FlashBrief {
  id: string;
  sentence: string;
  category: ArticleCategory;
  dateLabel: string;
}

export interface NewsArticle {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string[];
  category: ArticleCategory;
  dateLabel: string;
  readMinutes: number;
  tier: Tier;
  featured?: boolean;
  opportunitySlug?: string;
}

export const newsletterStats = {
  subscribers: 8412,
  editionToday: "20 mai 2026",
};

/** Actus du jour — une phrase chacune */
export const flashBriefs: FlashBrief[] = [
  {
    id: "f1",
    sentence: "GPT-5 Pro : 2 millions de tokens de contexte. Les wrappers B2B vont suivre.",
    category: "ia",
    dateLabel: "Aujourd'hui",
  },
  {
    id: "f2",
    sentence: "Anthropic lève 4 milliards. Les agents pour PME deviennent un marché à part entière.",
    category: "ia",
    dateLabel: "Aujourd'hui",
  },
  {
    id: "f3",
    sentence:
      "L'AI Act resserre sur les données santé. Les SaaS médicaux français doivent revoir leur cadrage.",
    category: "actu-tech",
    dateLabel: "Aujourd'hui",
  },
  {
    id: "f4",
    sentence: "Stripe Atlas en France : SAS et compte pro en 48 heures.",
    category: "actu-tech",
    dateLabel: "Aujourd'hui",
  },
  {
    id: "f5",
    sentence:
      "Arini dépasse 50k$ de MRR aux US. En France, personne ne tient encore ce créneau dentaire.",
    category: "saas",
    dateLabel: "Aujourd'hui",
  },
  {
    id: "f6",
    sentence:
      "ReminderMeds lève en seed sur les no-shows kiné. 11k$ MRR, marché ennuyeux, preuve US.",
    category: "saas",
    dateLabel: "Aujourd'hui",
  },
  {
    id: "f7",
    sentence:
      "Cursor passe en mode « agent team » — le vibe coding entre dans les équipes produit.",
    category: "ia",
    dateLabel: "Hier",
  },
  {
    id: "f8",
    sentence:
      "Pennylane teste un portail client natif — menace pour les micro-SaaS comptables.",
    category: "saas",
    dateLabel: "Hier",
  },
];

export const newsArticles: NewsArticle[] = [
  {
    id: "a1",
    slug: "reception-ia-dentaire-france",
    title: "Les dentistes perdent 400€ par appel manqué",
    excerpt:
      "Arini fait 42k$ MRR aux US. En France, les cabinets perdent des RDV chaque jour. Voici pourquoi c'est encore vide.",
    body: [
      "Les SaaS de réception téléphonique IA pour cabinets dentaires explosent outre-Atlantique. Arini, DentalAI, SmileLine — tous au-dessus de 30k$ MRR. En France ? Silence radio.",
      "Ce n'est pas un problème de technologie. Les dentistes ne cherchent pas une « IA cool ». Ils cherchent quelqu'un qui répond quand l'assistante est en consultation. L'angle qui convertit : « On récupère vos RDV manqués », pas « On utilise GPT-4 ».",
      "28 000 cabinets privés en France. La majorité n'a pas de standard dédié. Les acteurs locaux vendent encore des packs d'appels humains à 800 €/mois. Un SaaS à 149 €/mois avec intégration Doctolib change la donne.",
      "Conseil terrain : ciblez les cabinets 1-3 praticiens en province. Moins de cycles, plus de douleur téléphonique. Évitez Paris au début.",
    ],
    category: "saas",
    dateLabel: "20 mai 2026",
    readMinutes: 4,
    tier: "free",
    featured: true,
    opportunitySlug: "ai-receptionist-dental",
  },
  {
    id: "a2",
    slug: "agents-ia-pme-2026",
    title: "Les agents IA créent des milliers de micro-SaaS",
    excerpt:
      "Arrêtez de chercher le « ChatGPT killer ». Les PME veulent des agents qui font une tâche, pas un cerveau généraliste.",
    body: [
      "La hype 2024 : un modèle pour tout faire. La réalité 2026 : des agents spécialisés branchés sur un workflow métier — prise de RDV, relance facture, tri email.",
      "Chaque agent spécialisé = un micro-SaaS potentiel. Marge élevée, churn faible si la tâche est récurrente. Le fondateur qui gagne vend la tranquillité, pas la technologie.",
      "Signaux à suivre : wrappers autour de Claude 4 et GPT-5 Pro, intégrations natives Slack/Notion, pricing à l'action plutôt qu'au siège.",
    ],
    category: "ia",
    dateLabel: "20 mai 2026",
    readMinutes: 3,
    tier: "free",
  },
  {
    id: "a3",
    slug: "stripe-atlas-france",
    title: "Stripe Atlas en France — créer sa boîte en 48h",
    excerpt:
      "Création SAS + compte pro en 48 h. Pour les indie hackers, c'est un accélérateur invisible.",
    body: [
      "Stripe Atlas n'est pas nouveau, mais son déploiement FR simplifie la stack administrative des premiers SaaS. Moins de friction = plus de builders qui passent de l'idée au premier client.",
      "Pour vous : le différentiateur n'est plus « je peux encaisser ». C'est « je résous une douleur métier que personne n'a adressée en français ».",
    ],
    category: "actu-tech",
    dateLabel: "19 mai 2026",
    readMinutes: 2,
    tier: "free",
  },
  {
    id: "a4",
    slug: "rappels-sms-kine-boring",
    title: "11k MRR avec des rappels SMS pour kinés",
    excerpt:
      "ReminderMeds US. 23 % de no-shows en France. Un SMS automatique suffit.",
    body: [
      "ReminderMeds cartonne avec un produit qu'on n'affiche pas sur Product Hunt : des rappels SMS pour kinés. Boring business, marge 88 %, CAC faible via annuaires métier.",
      "12 000 kinés indépendants en France. Peu d'outils verticaux. Doctolib couvre la prise de RDV, pas la réduction des absences.",
    ],
    category: "saas",
    dateLabel: "19 mai 2026",
    readMinutes: 3,
    tier: "free",
    opportunitySlug: "sms-reminder-physio",
  },
  {
    id: "a5",
    slug: "claude-code-micro-saas",
    title: "Claude Code accélère les fondateurs qui savent quoi construire",
    excerpt:
      "Le prompt sans le marché = un side project de plus. Le marché sans le prompt = six mois de dev.",
    body: [
      "Les abonnés Pro reçoivent chaque samedi un prompt Claude Code calibré sur l'opportunité de la semaine. Pas un tutoriel générique : schéma DB, stack, séquence cold email.",
      "La valeur n'est pas l'IA. C'est le cadrage : quoi ne pas construire au jour 1, quel segment cibler en premier, quelle erreur réglementaire éviter.",
    ],
    category: "ia",
    dateLabel: "18 mai 2026",
    readMinutes: 5,
    tier: "pro",
  },
  {
    id: "a6",
    slug: "ai-act-sante-saas",
    title: "AI Act santé — ce qui change en juin",
    excerpt:
      "Hébergement, consentement, données patients : trois points qui tuent les MVPs mal cadrés.",
    body: [
      "Les SaaS qui touchent des données santé en France doivent anticiper HDS, RGPD renforcé et classification risque AI Act. Bonne nouvelle : pour une prise de RDV, vous n'avez pas besoin du dossier médical.",
      "Restez sur métadonnées + sync calendrier. La certification peut attendre la traction, pas le jour 1.",
    ],
    category: "actu-tech",
    dateLabel: "18 mai 2026",
    readMinutes: 4,
    tier: "builder",
  },
  {
    id: "a7",
    slug: "devis-btp-artisans",
    title: "380 000 artisans font leurs devis sur Word",
    excerpt:
      "BuildQuote à 28k MRR. Obat lève en France. La fenêtre se referme.",
    body: [
      "Le générateur de devis BTP est le cliché parfait du micro-SaaS importable : douleur universelle, willingness to pay, faible complexité technique.",
      "Angle France : SMS + signature électronique + modèles par métier (plombier, électricien, peintre).",
    ],
    category: "saas",
    dateLabel: "17 mai 2026",
    readMinutes: 3,
    tier: "free",
    opportunitySlug: "quote-generator-contractors",
  },
  {
    id: "a8",
    slug: "cursor-agent-teams",
    title: "Cursor agent team — solo dev ou studio à 2 ?",
    excerpt:
      "Un humain, trois agents. Le coût d'un MVP chute encore — la différenciation monte en distribution.",
    body: [
      "Quand tout le monde peut shipper en 14 jours, le moat redevient l'accès client et la confiance métier. Les newsletters qui ne parlent que tech ratent le point.",
      "Notre lecture : doublez le temps passé sur l'ICP et divisez par deux le temps en IDE.",
    ],
    category: "ia",
    dateLabel: "17 mai 2026",
    readMinutes: 3,
    tier: "free",
  },
  {
    id: "a9",
    slug: "product-hunt-mort-vivant",
    title: "Product Hunt a changé — les verticals B2B percent",
    excerpt:
      "Les lancements « IA généraliste » noient le feed. Les verticals B2B boring percent.",
    body: [
      "Les top hunts 2026 : outils métier, pas démos wow. Si vous lancez, amenez 20 utilisateurs métier avant le hunt, pas 200 makers Twitter.",
    ],
    category: "actu-tech",
    dateLabel: "16 mai 2026",
    readMinutes: 2,
    tier: "free",
  },
  {
    id: "a10",
    slug: "portail-comptable-fr",
    title: "22 000 cabinets comptables attendent un portail client",
    excerpt:
      "ClientPortal US à 19k MRR. Pennylane s'approche. Il reste une place pour le spécialiste.",
    body: [
      "Le portail client comptable est un classique sous-estimé : forte rétention, faible churn, vente par le réseau du cabinet.",
      "Différenciation : onboarding en 5 clics, pas de usine à gaz ERP.",
    ],
    category: "saas",
    dateLabel: "16 mai 2026",
    readMinutes: 3,
    tier: "builder",
    opportunitySlug: "accounting-client-portal",
  },
];

export function getFeaturedArticle(): NewsArticle {
  return newsArticles.find((a) => a.featured) ?? newsArticles[0];
}

export function getArticlesByCategory(category: ArticleCategory | "all"): NewsArticle[] {
  if (category === "all") return newsArticles;
  return newsArticles.filter((a) => a.category === category);
}

export function getArticleBySlug(slug: string): NewsArticle | undefined {
  return newsArticles.find((a) => a.slug === slug);
}

export function getTodayFlashBriefs(): FlashBrief[] {
  return flashBriefs.filter((f) => f.dateLabel === "Aujourd'hui");
}
