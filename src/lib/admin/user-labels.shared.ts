import { PLAN_DISPLAY_NAME, type PaidPlan } from "@/lib/billing/plans";

export function formatPlanLabel(plan: string): string {
  if (plan === "free") return "Free";
  if (plan === "builder" || plan === "pro") return PLAN_DISPLAY_NAME[plan as PaidPlan];
  return plan;
}

export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  trialing: "Essai",
  past_due: "Impayé",
  canceled: "Annulé",
  unpaid: "Non payé",
  incomplete: "Incomplet",
  incomplete_expired: "Expiré",
  paused: "En pause",
};

export function formatSubscriptionStatus(status: string | null | undefined): string {
  if (!status) return "Aucun";
  return SUBSCRIPTION_STATUS_LABELS[status] ?? status;
}

export type SubscriptionBadgeTone = "success" | "warning" | "muted" | "info";

export function subscriptionBadgeTone(status: string | null | undefined): SubscriptionBadgeTone {
  if (!status) return "muted";
  if (status === "active") return "success";
  if (status === "trialing") return "info";
  if (status === "past_due" || status === "unpaid") return "warning";
  return "muted";
}
