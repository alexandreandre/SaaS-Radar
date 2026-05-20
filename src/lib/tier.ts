export type Tier = "free" | "builder" | "pro";

export const tierRank: Record<Tier, number> = {
  free: 0,
  builder: 1,
  pro: 2,
};

export const tierLabels: Record<Tier, string> = {
  free: "Free",
  builder: "Builder",
  pro: "Pro",
};

export const tierPrices: Record<Exclude<Tier, "free">, string> = {
  builder: "29€/mois",
  pro: "79€/mois",
};

export function hasTier(current: Tier, required: Tier): boolean {
  return tierRank[current] >= tierRank[required];
}

export function nextTierFor(required: Tier): Exclude<Tier, "free"> {
  return required === "pro" ? "pro" : "builder";
}
