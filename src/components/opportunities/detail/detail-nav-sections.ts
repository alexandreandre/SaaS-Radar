export type DetailNavSection = {
  id: string;
  number: number;
  title: string;
  locked: boolean;
};

export const detailNavSections: DetailNavSection[] = [
  { id: "opportunite", number: 1, title: "L'opportunité", locked: false },
  { id: "chiffres", number: 2, title: "Ce que gagne le concurrent US 💰", locked: false },
  { id: "financier", number: 3, title: "Potentiel financier", locked: false },
  { id: "pourquoi", number: 4, title: "Pourquoi ça marche", locked: false },
  { id: "saas-origine", number: 5, title: "Le SaaS aux US", locked: false },
  { id: "business-plan", number: 6, title: "Business plan + Simulateur MRR", locked: false },
  { id: "acquisition", number: 7, title: "Trouver tes clients", locked: false },
  { id: "prompt", number: 8, title: "Prompt Claude Code", locked: false },
  { id: "guide", number: 9, title: "Guide J1 → J14", locked: false },
];
