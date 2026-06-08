import type { ConnectorId } from "@/lib/connectors/types";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import type { CockpitMetrics } from "@/lib/cockpit-metrics";
import type { StackHealth } from "@/lib/stack-health";
import type { UserProject } from "@/lib/portfolio";
import { daysSince, getTargetMrr } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";

export type RadarAction = {
  id: string;
  priority: "high" | "medium" | "low";
  title: string;
  rationale: string;
  actionModule: CockpitModuleId;
  actionLabel: string;
  connectorHint?: ConnectorId;
};

export function buildRadarActions(
  project: UserProject,
  opportunity: Opportunity,
  metrics: CockpitMetrics,
  stackHealth: StackHealth
): RadarAction[] {
  const actions: RadarAction[] = [];
  const target = getTargetMrr(project, opportunity);
  const progressPct = target > 0 ? (project.currentMrr / target) * 100 : 0;
  const campaigns = project.campaigns ?? [];
  const activeCampaigns = campaigns.filter((c) => c.status === "active");

  if (stackHealth.nextRecommended && project.phase === "revenue") {
    const connector = stackHealth.nextRecommended;
    actions.push({
      id: "connect-stack",
      priority: "high",
      title: "Compléter votre stack",
      rationale: `Connectez ${connector} pour suivre votre promesse Radar (${project.targetScenario}).`,
      actionModule: "integrations",
      actionLabel: "Ouvrir intégrations",
      connectorHint: connector,
    });
  }

  if (progressPct < 30 && activeCampaigns.length === 0 && target > 0) {
    const channel = opportunity.cacChannels[0]?.channel ?? "acquisition";
    actions.push({
      id: "launch-campaign",
      priority: "high",
      title: "Lancer une campagne",
      rationale: `MRR à ${Math.round(progressPct)} % de l'objectif ${project.targetScenario.toLowerCase()} — activez ${channel}.`,
      actionModule: "acquisition",
      actionLabel: "Configurer une campagne",
      connectorHint: "google-ads",
    });
  }

  const metaCampaign = campaigns.find((c) => c.channel === "meta" && c.status === "active");
  const googleCampaign = campaigns.find((c) => c.channel === "google" && c.status === "active");
  if (metaCampaign && googleCampaign) {
    const metaRoas =
      metaCampaign.totalSpend > 0
        ? (metaCampaign.conversions * 79) / metaCampaign.totalSpend
        : 0;
    const googleRoas =
      googleCampaign.totalSpend > 0
        ? (googleCampaign.conversions * 79) / googleCampaign.totalSpend
        : 0;
    if (metaRoas < 1 && googleRoas > 2) {
      actions.push({
        id: "reallocate-ads",
        priority: "medium",
        title: "Réallouer le budget pub",
        rationale: `ROAS Meta (${metaRoas.toFixed(1)}x) faible vs Google (${googleRoas.toFixed(1)}x).`,
        actionModule: "acquisition",
        actionLabel: "Ajuster les campagnes",
      });
    }
  }

  const sentryStream = project.connectorStreams?.sentry;
  if (
    sentryStream?.type === "dev" &&
    sentryStream.errorRate > 5 &&
    metrics.churnRate > 5
  ) {
    actions.push({
      id: "fix-errors-churn",
      priority: "high",
      title: "Corriger les bugs critiques",
      rationale: `Taux d'erreur Sentry élevé (${sentryStream.errorRate} %) corrélé au churn (${metrics.churnRate} %).`,
      actionModule: "build",
      actionLabel: "Voir Build & Ship",
      connectorHint: "sentry",
    });
  }

  if (metrics.runwayMonths !== null && metrics.runwayMonths < 6) {
    actions.push({
      id: "runway-low",
      priority: metrics.runwayMonths < 3 ? "high" : "medium",
      title: "Sécuriser la trésorerie",
      rationale: `Runway de ${metrics.runwayMonths} mois — en dessous du seuil Radar (6 mois).`,
      actionModule: "finance",
      actionLabel: "Piloter la finance",
      connectorHint: "qonto",
    });
  }

  const days = daysSince(project.lastCheckInAt ?? project.createdAt);
  if (days !== null && days > 25) {
    actions.push({
      id: "check-in",
      priority: "medium",
      title: "Mettre à jour votre MRR",
      rationale: `Aucun check-in depuis ${days} jours — votre streak est en jeu.`,
      actionModule: "overview",
      actionLabel: "Faire le check-in",
    });
  }

  if (actions.length === 0 && project.currentMrr === 0) {
    actions.push({
      id: "first-milestone",
      priority: "medium",
      title: "Première étape du journal",
      rationale: "Suivez le plan de lancement pré-rempli depuis votre fiche Radar.",
      actionModule: "build",
      actionLabel: "Ouvrir le journal",
    });
  }

  const priorityOrder = { high: 0, medium: 1, low: 2 };
  return actions.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
}
