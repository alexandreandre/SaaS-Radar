import {
  getChurnRate,
  getDeltaPercent,
  getMetricsHistory,
  type UserProject,
} from "@/lib/portfolio";
import type { MetricsSnapshot } from "@/lib/connectors/types";
import { formatCurrency } from "@/lib/utils";

export type ProjectCardMetric = {
  label: string;
  value: string;
  deltaPct: number | null;
  /** true pour le churn : une hausse est mauvaise */
  invertDelta?: boolean;
};

const QUIPS = [
  "Quelqu'un, quelque part, utilise encore un tableur pour ça.",
  "Votre futur client ne sait pas encore qu'il a besoin de vous.",
  "Un SaaS de plus ne tuera personne. Enfin, on espère.",
  "L'idée est solide. Le café aussi.",
  "Ship fast. Sleep later. Peut-être.",
  "Le marché n'attendra pas votre troisième refonte.",
  "Moins de slides, plus de clients.",
  "Excel ne va pas se défendre tout seul.",
  "Quelqu'un paie déjà trop cher pour une solution pire.",
  "Votre concurrent tourne probablement sur de la volonté et Notion.",
  "La perfection est l'ennemie du premier abonnement à 9 €.",
  "Les bugs d'aujourd'hui sont les features de demain. Parfois.",
  "Personne n'a besoin d'un autre dashboard. Sauf si c'est le vôtre.",
  "Localhost ne paie pas les factures — mais l'idée, si.",
  "Construire, c'est facile. Expliquer pourquoi, un peu moins.",
  "Votre niche existe. Elle est juste mal servie.",
  "Un bon produit vaut dix pitch decks.",
  "Le premier client est le plus dur. Le deuxième aussi, d'ailleurs.",
  "Quelqu'un galère avec la même douleur en ce moment même.",
  "MVP : Minimum Viable Produit, pas Maximum Vain Perfectionnisme.",
];

const PAUSED_QUIPS = [
  "Le projet fait une sieste. Pas de jugement.",
  "Même les licornes mettent des projets en pause.",
  "On reprendra quand l'inspiration — ou la deadline — reviendra.",
];

function pickStableVariant(projectId: string, options: string[]): string {
  const seed = projectId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return options[seed % options.length] ?? options[0];
}

export function getProjectCardQuip(project: UserProject): string {
  if (project.phase === "paused") {
    return pickStableVariant(`${project.id}:paused`, PAUSED_QUIPS);
  }
  return pickStableVariant(project.id, QUIPS);
}

function formatCount(value: number): string {
  return new Intl.NumberFormat("fr-FR").format(value);
}

function pickUsersCount(snapshot: MetricsSnapshot): number {
  if (snapshot.activeUsers > 0) return snapshot.activeUsers;
  if (snapshot.mau > 0) return snapshot.mau;
  return snapshot.customers;
}

function resolveMrrMetric(project: UserProject): ProjectCardMetric {
  const history = getMetricsHistory(project);
  const latest = history.at(-1);
  const previous = history.length >= 2 ? history.at(-2) : undefined;
  const mrr = latest?.mrr ?? project.currentMrr;

  let deltaPct: number | null = null;
  if (latest && previous) {
    deltaPct = getDeltaPercent(latest.mrr, previous.mrr);
  } else if (project.mrrHistory.length >= 2) {
    const curr = project.mrrHistory.at(-1)!.amount;
    const prev = project.mrrHistory.at(-2)!.amount;
    deltaPct = getDeltaPercent(curr, prev);
  }

  return { label: "MRR", value: formatCurrency(mrr), deltaPct };
}

function resolveUsersMetric(project: UserProject): ProjectCardMetric {
  const history = getMetricsHistory(project);
  const latest = history.at(-1);
  const previous = history.length >= 2 ? history.at(-2) : undefined;

  if (!latest) {
    return { label: "Users", value: "—", deltaPct: null };
  }

  const count = pickUsersCount(latest);
  const deltaPct =
    previous !== undefined ? getDeltaPercent(count, pickUsersCount(previous)) : null;

  return {
    label: "Users",
    value: count > 0 ? formatCount(count) : "0",
    deltaPct,
  };
}

function resolveThirdMetric(project: UserProject): ProjectCardMetric {
  const history = getMetricsHistory(project);
  const latest = history.at(-1);
  const previous = history.length >= 2 ? history.at(-2) : undefined;
  const beforePrevious = history.length >= 3 ? history.at(-3) : undefined;

  if (!latest || !previous || latest.mrr <= 0) {
    if (latest && latest.customers > 0) {
      const deltaPct =
        previous !== undefined
          ? getDeltaPercent(latest.customers, previous.customers)
          : null;
      return {
        label: "Clients",
        value: formatCount(latest.customers),
        deltaPct,
      };
    }
    return { label: "Churn", value: "—", deltaPct: null };
  }

  const churn = getChurnRate(latest, previous);
  const previousChurn =
    previous && beforePrevious ? getChurnRate(previous, beforePrevious) : null;
  const deltaPct =
    previousChurn !== null ? getDeltaPercent(churn, previousChurn) : null;

  return {
    label: "Churn",
    value: `${churn.toLocaleString("fr-FR")} %`,
    deltaPct,
    invertDelta: true,
  };
}

export function getProjectCardMetrics(project: UserProject): ProjectCardMetric[] {
  return [resolveMrrMetric(project), resolveUsersMetric(project), resolveThirdMetric(project)];
}
