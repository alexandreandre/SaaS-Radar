export type LaunchPlaybookStep = {
  id: string;
  label: string;
  detail: string;
  timing?: string;
};

export const PRODUCT_HUNT_PLAYBOOK: LaunchPlaybookStep[] = [
  {
    id: "ph-assets",
    label: "Préparer les assets PH",
    detail: "Tagline (60 car.), description, 3 screenshots, logo 240×240.",
    timing: "J-7",
  },
  {
    id: "ph-hunter",
    label: "Mobiliser 20–30 upvotes J0",
    detail: "Contactez votre réseau avec l'heure exacte du lancement (mar–jeu matin PT).",
    timing: "J-3",
  },
  {
    id: "ph-launch",
    label: "Lancer sur Product Hunt",
    detail: "Répondez à chaque commentaire dans l'heure. Pas de spam.",
    timing: "J0",
  },
  {
    id: "ph-followup",
    label: "Relayer sur LinkedIn / X",
    detail: "Post fondateur authentique — leçon apprise, pas un pitch plat.",
    timing: "J0–J1",
  },
];

export const HACKER_NEWS_PLAYBOOK: LaunchPlaybookStep[] = [
  {
    id: "hn-show",
    label: "Préparer un Show HN honnête",
    detail: "Titre factuel, lien direct, commentaire fondateur avec contexte et limites connues.",
    timing: "J-1",
  },
  {
    id: "hn-launch",
    label: "Poster Show HN",
    detail: "Restez disponible 4h pour répondre aux commentaires techniques.",
    timing: "J0",
  },
];

export function getLaunchPlaybook(platform: "product-hunt" | "hacker-news"): LaunchPlaybookStep[] {
  return platform === "product-hunt" ? PRODUCT_HUNT_PLAYBOOK : HACKER_NEWS_PLAYBOOK;
}
