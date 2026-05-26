export type DetailNavSection = {
  id: string;
  number: number;
  title: string;
  locked: boolean;
  plan?: "BUILDER" | "PRO";
};

export const detailNavSections: DetailNavSection[] = [
  { id: "opportunite", number: 1, title: "L'opportunité", locked: false },
  { id: "chiffres", number: 2, title: "Ce que gagne le concurrent US 💰", locked: false },
  { id: "simulateur", number: 3, title: "Simuler mon MRR 📈", locked: false },
  { id: "pourquoi", number: 4, title: "Pourquoi ça marche", locked: false },
  { id: "saas-origine", number: 5, title: "Le SaaS aux US", locked: true, plan: "BUILDER" },
  { id: "financier", number: 6, title: "Potentiel financier", locked: true, plan: "BUILDER" },
  { id: "acquisition", number: 7, title: "Trouver tes clients", locked: true, plan: "BUILDER" },
  { id: "prompt", number: 8, title: "Prompt Claude Code", locked: true, plan: "PRO" },
  { id: "guide", number: 9, title: "Guide J1 → J14", locked: true, plan: "BUILDER" },
];

export const LOCKED_SECTIONS_COUNT = detailNavSections.filter((s) => s.locked).length;
