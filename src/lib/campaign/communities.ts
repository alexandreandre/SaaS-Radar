export type CommunityTarget = {
  id: string;
  name: string;
  url: string;
  etiquette: string[];
  whenToMentionProduct: string;
};

export const COMMUNITY_TARGETS: CommunityTarget[] = [
  {
    id: "indie-hackers",
    name: "Indie Hackers",
    url: "https://www.indiehackers.com",
    etiquette: [
      "Partagez d'abord votre parcours ou une leçon apprise.",
      "Évitez le pitch direct — répondez à des threads existants.",
    ],
    whenToMentionProduct: "Quand quelqu'un décrit exactement le problème que vous résolvez.",
  },
  {
    id: "reddit-startups",
    name: "r/startups / r/SaaS",
    url: "https://www.reddit.com/r/SaaS",
    etiquette: [
      "Lisez les règles du subreddit avant de poster.",
      "Apportez de la valeur (retour d'expérience, chiffres) avant tout lien.",
    ],
    whenToMentionProduct: "Dans un commentaire utile, pas en post promotionnel.",
  },
  {
    id: "linkedin",
    name: "LinkedIn (réseau perso)",
    url: "https://www.linkedin.com",
    etiquette: [
      "Messages 1-to-1 personnalisés, pas de copier-coller générique.",
      "Montrez que vous connaissez leur contexte.",
    ],
    whenToMentionProduct: "Après avoir validé que la personne a le problème.",
  },
];

export function getCommunitiesForStage(stage: "network" | "outreach" | "content" | "amplification"): CommunityTarget[] {
  if (stage === "network") return COMMUNITY_TARGETS;
  if (stage === "content") return COMMUNITY_TARGETS.filter((c) => c.id !== "linkedin");
  return COMMUNITY_TARGETS.slice(0, 2);
}
