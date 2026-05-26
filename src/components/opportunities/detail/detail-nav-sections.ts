export type DetailNavSection = {
  id: string;
  number: number;
  title: string;
  locked: boolean;
  plan?: "BUILDER" | "PRO";
};

export const detailNavSections: DetailNavSection[] = [
  { id: "opportunite", number: 1, title: "L'opportunité", locked: false },
  { id: "pourquoi", number: 2, title: "Pourquoi ça marche", locked: false },
  { id: "chiffres", number: 3, title: "Le marché en chiffres", locked: false },
  { id: "saas-origine", number: 4, title: "Le SaaS aux US", locked: true, plan: "BUILDER" },
  { id: "financier", number: 5, title: "Potentiel financier", locked: true, plan: "BUILDER" },
  { id: "acquisition", number: 6, title: "Trouver tes clients", locked: true, plan: "BUILDER" },
  { id: "prompt", number: 7, title: "Prompt Claude Code", locked: true, plan: "PRO" },
  { id: "guide", number: 8, title: "Guide J1 → J14", locked: true, plan: "BUILDER" },
];

export const LOCKED_SECTIONS_COUNT = detailNavSections.filter((s) => s.locked).length;
