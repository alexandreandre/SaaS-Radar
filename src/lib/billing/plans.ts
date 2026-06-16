import type { Tier } from "@/lib/tier";

export type PaidPlan = Exclude<Tier, "free">; // 'builder' | 'pro'
export type BillingInterval = "month" | "year";

/**
 * SOURCE UNIQUE des montants affiches (aucun montant hardcode ailleurs / en JSX).
 * Les `price_id` Stripe vivent en variables d'env (resolus cote serveur uniquement).
 * Montants en euros TTC (pas de Stripe Tax au MVP).
 */
export interface PlanPricing {
  /** Montant mensuel si paye au mois. */
  monthlyAmount: number;
  /** Montant total facture une fois par an. */
  yearlyAmount: number;
  /** Equivalent mensuel quand on paie a l'annee (pour affichage "X€/mois"). */
  yearlyPerMonth: number;
}

export const PLAN_PRICING: Record<PaidPlan, PlanPricing> = {
  builder: { monthlyAmount: 19, yearlyAmount: 180, yearlyPerMonth: 15 },
  pro: { monthlyAmount: 39, yearlyAmount: 372, yearlyPerMonth: 31 },
};

/** Nom du label affiche. */
export const PLAN_DISPLAY_NAME: Record<PaidPlan, string> = {
  builder: "Builder",
  pro: "Pro",
};

/** Formatage euro court, sans decimales (montants entiers au MVP). */
export function formatEuro(amount: number): string {
  return `${amount}\u20ac`;
}

/**
 * Mapping interval -> variable d'env contenant le price_id Stripe.
 * NB : pas de prefixe NEXT_PUBLIC -> lisible cote serveur uniquement (route checkout).
 */
const PRICE_ID_ENV: Record<PaidPlan, Record<BillingInterval, string>> = {
  builder: {
    month: "STRIPE_PRICE_BUILDER_MONTHLY",
    year: "STRIPE_PRICE_BUILDER_YEARLY",
  },
  pro: {
    month: "STRIPE_PRICE_PRO_MONTHLY",
    year: "STRIPE_PRICE_PRO_YEARLY",
  },
};

/** Resout le price_id Stripe (serveur). Jette si l'env est absent. */
export function getPriceId(plan: PaidPlan, interval: BillingInterval): string {
  const envName = PRICE_ID_ENV[plan][interval];
  const priceId = process.env[envName];
  if (!priceId) {
    throw new Error(`Price Stripe non configure : ${envName} manquant`);
  }
  return priceId;
}

/**
 * Traduit un price_id Stripe -> plan (serveur, webhook).
 * Renvoie null si le price_id n'appartient a aucun plan connu.
 */
export function priceIdToPlan(priceId: string | null | undefined): PaidPlan | null {
  if (!priceId) return null;
  for (const plan of Object.keys(PRICE_ID_ENV) as PaidPlan[]) {
    for (const interval of ["month", "year"] as BillingInterval[]) {
      if (process.env[PRICE_ID_ENV[plan][interval]] === priceId) return plan;
    }
  }
  return null;
}

/** Validation d'entrees pour la route checkout. */
export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === "builder" || value === "pro";
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "month" || value === "year";
}
