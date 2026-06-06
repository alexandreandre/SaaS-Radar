import type { UserProject } from "@/lib/portfolio";
import type { CockpitMetrics } from "@/lib/cockpit-metrics";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { CONNECTORS } from "@/lib/connectors/registry";
import {
  computeCac,
  computeLtv,
  computeRunwayMonths,
  daysSince,
  getChurnRate,
} from "@/lib/portfolio";
import { buildStackHealth } from "@/lib/stack-health";
import type { Opportunity } from "@/types/opportunity";

export type CockpitAlert = {
  id: string;
  severity: "info" | "warning" | "critical";
  message: string;
  actionModule: CockpitModuleId;
  /** @deprecated use actionModule */
  actionTab?: string;
};

export function buildCockpitAlerts(
  project: UserProject,
  metrics: CockpitMetrics,
  opportunity?: Opportunity
): CockpitAlert[] {
  const alerts: CockpitAlert[] = [];
  const latest = metrics.latest;
  const previous = metrics.previous;
  const campaigns = project.campaigns ?? [];

  const monthlyAdBudget = campaigns
    .filter((c) => c.status === "active")
    .reduce((s, c) => s + c.dailyBudget * 30, 0);
  const monthlyAdSpend = latest?.adSpend ?? 0;

  if (monthlyAdBudget > 0 && monthlyAdSpend > monthlyAdBudget) {
    alerts.push({
      id: "ad-budget",
      severity: "warning",
      message: `Budget pub dépassé : ${monthlyAdSpend.toLocaleString("fr-FR")} € dépensés vs ${monthlyAdBudget.toLocaleString("fr-FR")} € prévus.`,
      actionModule: "acquisition",
    });
  }

  if (latest) {
    const cac = computeCac(latest);
    const ltv = computeLtv(latest);
    if (cac > 0 && ltv > 0 && cac > ltv / 3) {
      alerts.push({
        id: "cac-ltv",
        severity: "critical",
        message: `CAC (${cac.toLocaleString("fr-FR")} €) trop élevé vs LTV (${ltv.toLocaleString("fr-FR")} €). Acquisition non rentable.`,
        actionModule: "acquisition",
      });
    }
  }

  if (latest && previous) {
    const churn = getChurnRate(latest, previous);
    const avgChurn =
      metrics.kpis.find((k) => k.key === "churn")?.sparkline.filter(Boolean).reduce((a, b, _, arr) => a + b / arr.length, 0) ??
      0;
    if (churn > avgChurn * 1.5 && churn > 5) {
      alerts.push({
        id: "churn-spike",
        severity: "warning",
        message: `Pic de churn détecté : ${churn} % ce mois (moyenne ~${Math.round(avgChurn)} %).`,
        actionModule: "revenus",
      });
    }
  }

  const runway = computeRunwayMonths(project);
  if (runway !== null && runway < 6) {
    alerts.push({
      id: "runway",
      severity: runway < 3 ? "critical" : "warning",
      message: `Runway de ${runway} mois — surveillez votre trésorerie.`,
      actionModule: "finance",
    });
  }

  const days = daysSince(project.lastCheckInAt ?? project.createdAt);
  if (days !== null && days > 30) {
    alerts.push({
      id: "stale-data",
      severity: "info",
      message: `Aucune mise à jour depuis ${days} jours. Synchronisez vos métriques.`,
      actionModule: "overview",
    });
  }

  for (const campaign of campaigns.filter((c) => c.status === "active")) {
    const roas = campaign.totalSpend > 0 ? (campaign.conversions * 79) / campaign.totalSpend : 0;
    if (campaign.totalSpend > 100 && roas < 1) {
      alerts.push({
        id: `roas-${campaign.id}`,
        severity: "warning",
        message: `ROAS < 1 sur « ${campaign.name} » (${roas.toFixed(1)}x) — optimisez ou pausez.`,
        actionModule: "acquisition",
      });
    }
  }

  const sentryStream = project.connectorStreams?.sentry;
  if (sentryStream?.type === "dev" && sentryStream.errorRate > 10) {
    alerts.push({
      id: "sentry-spike",
      severity: "critical",
      message: `Pic d'erreurs Sentry : ${sentryStream.errorRate} % — risque impact produit.`,
      actionModule: "build",
    });
  }

  const vercelStream = project.connectorStreams?.vercel ?? project.connectorStreams?.["better-stack"];
  if (vercelStream?.type === "dev" && vercelStream.uptimePct < 99) {
    alerts.push({
      id: "uptime-low",
      severity: "warning",
      message: `Disponibilité à ${vercelStream.uptimePct} % — en dessous du seuil 99 %.`,
      actionModule: "build",
    });
  }

  const crmStream =
    project.connectorStreams?.hubspot ?? project.connectorStreams?.pipedrive;
  if (crmStream?.type === "crm" && crmStream.dealsWon === 0 && crmStream.pipelineValue > 0) {
    alerts.push({
      id: "crm-stagnant",
      severity: "info",
      message: `Pipeline CRM à ${crmStream.pipelineValue.toLocaleString("fr-FR")} € sans deal gagné ce mois.`,
      actionModule: "clients",
    });
  }

  const qontoStream = project.connectorStreams?.qonto;
  const cashOnHand = project.cashOnHand ?? 5000;
  if (
    qontoStream?.type === "finance" &&
    Math.abs(qontoStream.cashBalance - cashOnHand) / Math.max(cashOnHand, 1) > 0.1
  ) {
    alerts.push({
      id: "cash-mismatch",
      severity: "warning",
      message: `Écart trésorerie Qonto (${qontoStream.cashBalance.toLocaleString("fr-FR")} €) vs saisie manuelle (${cashOnHand.toLocaleString("fr-FR")} €).`,
      actionModule: "finance",
    });
  }

  if (opportunity && project.phase === "revenue") {
    const stack = buildStackHealth(opportunity, project.integrations);
    const missingP0 = stack.missing.filter(
      (id) => CONNECTORS.find((c) => c.id === id)?.priority === "p0"
    );
    if (missingP0.length > 0) {
      alerts.push({
        id: "missing-p0",
        severity: "warning",
        message: `Connecteur essentiel manquant : ${CONNECTORS.find((c) => c.id === missingP0[0])?.name ?? missingP0[0]}.`,
        actionModule: "integrations",
      });
    }
  }

  return alerts;
}
