export type DetailNavSection = {
  id: string;
  number: number;
  title: string;
};

export const detailNavSections: DetailNavSection[] = [
  { id: "opportunite", number: 1, title: "L'opportunité" },
  { id: "chiffres", number: 2, title: "Ce que gagne le concurrent US 💰" },
  { id: "simulateur", number: 3, title: "Simuler mon MRR 📈" },
  { id: "pourquoi", number: 4, title: "Pourquoi ça marche" },
  { id: "saas-origine", number: 5, title: "Le SaaS aux US" },
  { id: "financier", number: 6, title: "Potentiel financier" },
  { id: "acquisition", number: 7, title: "Trouver tes clients" },
  { id: "prompt", number: 8, title: "Prompt Claude Code" },
  { id: "guide", number: 9, title: "Guide J1 → J14" },
];
