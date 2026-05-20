import type { Tier } from "@/lib/tier";

export type DetailSection = {
  id: string;
  label: string;
  step: number;
  tier: Tier;
};

/** Parcours guidé — 7 étapes */
export const detailSections: DetailSection[] = [
  { id: "why", label: "1. L'idée en bref", step: 1, tier: "free" },
  { id: "market", label: "2. Le marché en France", step: 2, tier: "free" },
  { id: "revenus", label: "3. Combien vous pouvez gagner", step: 3, tier: "free" },
  { id: "foreign", label: "4. Le SaaS sur son marché d'origine", step: 4, tier: "builder" },
  { id: "prompt", label: "5. Prompt Claude Code", step: 5, tier: "pro" },
  { id: "clients", label: "6. Trouvez vos premiers clients", step: 6, tier: "builder" },
  { id: "guide", label: "7. Guide d'action complet", step: 7, tier: "pro" },
];

export const TOTAL_DETAIL_STEPS = detailSections.length;
