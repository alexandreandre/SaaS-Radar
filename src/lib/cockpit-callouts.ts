import type { LucideIcon } from "lucide-react";
import {
  AlertCircle,
  AlertTriangle,
  BarChart3,
  CreditCard,
  Info,
  Megaphone,
  Wallet,
} from "lucide-react";
import type { CockpitAlert } from "@/lib/cockpit-alerts";
import type { CockpitModuleId } from "@/lib/cockpit-modules";
import { CONNECTORS, getConnector } from "@/lib/connectors/registry";
import {
  getProductStream,
  hasProductAnalyticsConnected,
} from "@/lib/connectors/streams";
import { hasPaymentConnector } from "@/lib/revenue-helpers";
import type { StackHealth } from "@/lib/stack-health";
import { daysSince } from "@/lib/portfolio";
import { getBuildJourneyState } from "@/lib/build/journey";
import { getCampaignJourneyState, isCampaignStarted } from "@/lib/campaign/journey";
import { hasCampaignKit } from "@/lib/campaign/kits";
import {
  buildIntegrationHealthAlerts,
  filterIntegrationHealthAlerts,
} from "@/lib/connectors/integration-health";
import type { UserProject } from "@/lib/portfolio";
import type { Opportunity } from "@/types/opportunity";

export type ModuleCalloutDef = {
  id: string;
  title: string;
  description: string;
  actionModule: CockpitModuleId;
  actionLabel: string;
  icon?: LucideIcon;
  variant?: "default" | "warning" | "critical";
};

const ALERT_META: Record<
  string,
  Pick<ModuleCalloutDef, "title" | "actionLabel" | "variant"> & { icon?: LucideIcon }
> = {
  "ad-budget": { title: "Budget pub dépassé", actionLabel: "Acquisition", variant: "warning", icon: Megaphone },
  "cac-ltv": { title: "CAC trop élevé", actionLabel: "Acquisition", variant: "critical", icon: AlertCircle },
  "churn-spike": { title: "Pic de churn détecté", actionLabel: "Revenus", variant: "warning", icon: AlertTriangle },
  "mau-drop": { title: "Baisse de MAU", actionLabel: "Produit", variant: "warning", icon: BarChart3 },
  "stickiness-low": { title: "Stickiness faible", actionLabel: "Produit", variant: "warning", icon: BarChart3 },
  "activation-low": { title: "Activation in-app basse", actionLabel: "Produit", variant: "warning", icon: BarChart3 },
  "missing-product-analytics": {
    title: "Analytics produit non connecté",
    actionLabel: "Connecteurs",
    icon: BarChart3,
  },
  runway: { title: "Runway limité", actionLabel: "Finance", variant: "warning", icon: Wallet },
  "stale-data": { title: "Données obsolètes", actionLabel: "Revenus", icon: Info },
  "missing-p0": { title: "Connecteur essentiel manquant", actionLabel: "Connecteurs", variant: "warning" },
  "cash-mismatch": { title: "Écart trésorerie", actionLabel: "Finance", variant: "warning", icon: Wallet },
  "github-build": { title: "Suivi GitHub", actionLabel: "Build", variant: "warning" },
  "uptime-low": { title: "Disponibilité basse", actionLabel: "Build", variant: "warning" },
  "sentry-spike": { title: "Pic d'erreurs Sentry", actionLabel: "Build", variant: "critical", icon: AlertCircle },
  "crm-stagnant": { title: "Pipeline CRM stagnant", actionLabel: "Clients", icon: Info },
  "integration-error-google-ads": {
    title: "Google Ads — action requise",
    actionLabel: "Connecteurs",
    variant: "warning",
    icon: Megaphone,
  },
  "integration-error-meta-ads": {
    title: "Meta Ads — action requise",
    actionLabel: "Connecteurs",
    variant: "warning",
    icon: Megaphone,
  },
  "integration-token-google-ads": {
    title: "Token Google Ads",
    actionLabel: "Connecteurs",
    variant: "warning",
    icon: AlertTriangle,
  },
  "integration-token-meta-ads": {
    title: "Token Meta Ads",
    actionLabel: "Connecteurs",
    variant: "warning",
    icon: AlertTriangle,
  },
  "integration-stale-google-ads": {
    title: "Sync Google Ads obsolète",
    actionLabel: "Connecteurs",
    icon: Info,
  },
  "integration-stale-meta-ads": {
    title: "Sync Meta Ads obsolète",
    actionLabel: "Connecteurs",
    icon: Info,
  },
  "integration-error-tiktok-ads": {
    title: "TikTok Ads — action requise",
    actionLabel: "Connecteurs",
    variant: "warning",
    icon: Megaphone,
  },
  "integration-token-tiktok-ads": {
    title: "Token TikTok Ads",
    actionLabel: "Connecteurs",
    variant: "warning",
    icon: AlertTriangle,
  },
  "integration-stale-tiktok-ads": {
    title: "Sync TikTok Ads obsolète",
    actionLabel: "Connecteurs",
    icon: Info,
  },
  "integration-error-linkedin-ads": {
    title: "LinkedIn Ads — action requise",
    actionLabel: "Connecteurs",
    variant: "warning",
    icon: Megaphone,
  },
  "integration-token-linkedin-ads": {
    title: "Token LinkedIn Ads",
    actionLabel: "Connecteurs",
    variant: "warning",
    icon: AlertTriangle,
  },
  "integration-stale-linkedin-ads": {
    title: "Sync LinkedIn Ads obsolète",
    actionLabel: "Connecteurs",
    icon: Info,
  },
};

const ACTION_MODULE_OVERRIDE: Record<string, CockpitModuleId> = {
  "missing-product-analytics": "integrations",
  "missing-p0": "integrations",
  "integration-error-google-ads": "integrations",
  "integration-error-meta-ads": "integrations",
  "integration-token-google-ads": "integrations",
  "integration-token-meta-ads": "integrations",
  "integration-stale-google-ads": "integrations",
  "integration-stale-meta-ads": "integrations",
  "integration-error-tiktok-ads": "integrations",
  "integration-token-tiktok-ads": "integrations",
  "integration-stale-tiktok-ads": "integrations",
  "integration-error-linkedin-ads": "integrations",
  "integration-token-linkedin-ads": "integrations",
  "integration-stale-linkedin-ads": "integrations",
};

function alertToCallout(alert: CockpitAlert): ModuleCalloutDef {
  const meta = ALERT_META[alert.id] ?? {
    title: "Alerte",
    actionLabel: "Voir",
    variant: alert.severity === "critical" ? "critical" : alert.severity === "warning" ? "warning" : "default",
  };
  const actionModule =
    ACTION_MODULE_OVERRIDE[alert.id] ??
    alert.actionModule ??
    (alert.actionTab as CockpitModuleId) ??
    "overview";

  return {
    id: alert.id,
    title: meta.title,
    description: alert.message,
    actionModule,
    actionLabel: meta.actionLabel,
    icon: meta.icon,
    variant: meta.variant ?? (alert.severity === "critical" ? "critical" : alert.severity === "warning" ? "warning" : "default"),
  };
}

function isRevenuePhase(project: UserProject) {
  return project.onboardingCompleted === true && project.phase === "revenue";
}

function productAnalyticsCallout(): ModuleCalloutDef {
  return {
    id: "missing-product-analytics",
    title: "Analytics produit non connecté",
    description:
      "Connectez Plausible pour le trafic (P0) ou PostHog pour l'activation in-app et la rétention J7.",
    actionModule: "integrations",
    actionLabel: "Connecteurs",
    icon: BarChart3,
  };
}

function paymentCallout(): ModuleCalloutDef {
  return {
    id: "setup-payment",
    title: "Paiement non connecté",
    description:
      "Connectez Stripe ou Lemon Squeezy pour synchroniser MRR, clients et churn en temps réel.",
    actionModule: "integrations",
    actionLabel: "Connecteurs",
    icon: CreditCard,
  };
}

function missingP0Callout(connectorId: string): ModuleCalloutDef {
  const name = getConnector(connectorId as import("@/lib/connectors/types").ConnectorId)?.name ?? connectorId;
  return {
    id: "missing-p0",
    title: "Connecteur essentiel manquant",
    description: `Connectez ${name} pour compléter votre stack Radar (priorité P0).`,
    actionModule: "integrations",
    actionLabel: "Connecteurs",
    variant: "warning",
  };
}

function adsCallout(): ModuleCalloutDef {
  return {
    id: "setup-ads",
    title: "Publicité non connectée",
    description:
      "Connectez Google Ads ou Meta Ads pour suivre dépenses, conversions et ROAS depuis le cockpit.",
    actionModule: "integrations",
    actionLabel: "Connecteurs",
    icon: Megaphone,
  };
}

function qontoCallout(): ModuleCalloutDef {
  return {
    id: "setup-qonto",
    title: "Banque non connectée",
    description: "Connectez Qonto pour synchroniser trésorerie, burn rate et runway automatiquement.",
    actionModule: "integrations",
    actionLabel: "Connecteurs",
    icon: Wallet,
  };
}

function hasAdsConnected(project: UserProject) {
  return (project.integrations ?? []).some(
    (i) =>
      (i.connectorId === "google-ads" ||
        i.connectorId === "meta-ads" ||
        i.connectorId === "tiktok-ads" ||
        i.connectorId === "linkedin-ads") &&
      (i.status === "connected" || i.status === "demo"),
  );
}

function hasQontoConnected(project: UserProject) {
  return (project.integrations ?? []).some(
    (i) => i.connectorId === "qonto" && (i.status === "connected" || i.status === "demo"),
  );
}

function needsProductAnalytics(project: UserProject) {
  return (
    !getProductStream(project.connectorStreams) &&
    !hasProductAnalyticsConnected(project.integrations)
  );
}

export function buildModuleCallouts(
  moduleId: CockpitModuleId,
  project: UserProject,
  opportunity: Opportunity,
  options?: { stackHealth?: StackHealth; alerts?: CockpitAlert[] },
): ModuleCalloutDef[] {
  if (project.onboardingCompleted !== true) return [];

  const callouts: ModuleCalloutDef[] = [];
  const seen = new Set<string>();
  const push = (callout: ModuleCalloutDef) => {
    if (seen.has(callout.id)) return;
    seen.add(callout.id);
    callouts.push(callout);
  };

  const revenue = isRevenuePhase(project);
  const stackHealth = options?.stackHealth;
  const alerts = options?.alerts ?? [];

  if (revenue && needsProductAnalytics(project)) {
    if (moduleId === "overview" || moduleId === "produit") {
      push(productAnalyticsCallout());
    }
  }

  if (revenue && !hasPaymentConnector(project)) {
    if (moduleId === "overview" || moduleId === "revenus") {
      push(paymentCallout());
    }
  }

  if (revenue && stackHealth?.nextRecommended) {
    const next = stackHealth.nextRecommended;
    const priority = CONNECTORS.find((c) => c.id === next)?.priority;
    if (
      priority === "p0" &&
      (moduleId === "overview" || moduleId === "integrations") &&
      next !== "plausible" &&
      next !== "posthog" &&
      next !== "stripe"
    ) {
      push(missingP0Callout(next));
    }
  }

  if (revenue && !hasAdsConnected(project)) {
    if (moduleId === "overview" || moduleId === "acquisition") {
      push(adsCallout());
    }
  }

  if (revenue && !hasQontoConnected(project)) {
    if (moduleId === "overview" || moduleId === "finance") {
      push(qontoCallout());
    }
  }

  const days = daysSince(project.lastCheckInAt ?? project.createdAt);
  if (days !== null && days > 30 && (moduleId === "overview" || moduleId === "revenus")) {
    push({
      id: "stale-data",
      title: "Données obsolètes",
      description: `Aucune mise à jour depuis ${days} jours — synchronisez vos connecteurs ou saisissez vos métriques.`,
      actionModule: "revenus",
      actionLabel: "Revenus",
      icon: Info,
    });
  }

  const buildLive = getBuildJourneyState(project).displayPhase === "live";
  if (buildLive && !isCampaignStarted(project)) {
    if (moduleId === "overview" || moduleId === "build" || moduleId === "campagne") {
      push({
        id: "campaign-not-started",
        title: "Lancez votre campagne",
        description:
          "Votre app est en ligne — préparez votre stack marketing et vos premiers kits.",
        actionModule: "campagne",
        actionLabel: "Campagne",
        icon: Megaphone,
      });
    }
  }

  if (isCampaignStarted(project) && !hasCampaignKit(project)) {
    if (moduleId === "campagne" || moduleId === "overview") {
      push({
        id: "campaign-no-kit",
        title: "Générez votre premier kit",
        description: "Choisissez un outil et générez un prompt prêt à coller.",
        actionModule: "campagne",
        actionLabel: "Campagne",
        icon: Megaphone,
      });
    }
  }

  const campaignJourney = getCampaignJourneyState(project, opportunity);
  if (
    campaignJourney.currentStep >= 3 &&
    !hasProductAnalyticsConnected(project.integrations) &&
    !getProductStream(project.connectorStreams)
  ) {
    if (moduleId === "campagne" || moduleId === "overview") {
      push({
        id: "campaign-measure-missing",
        title: "Branchez la mesure",
        description: "Connectez Plausible ou PostHog pour suivre signups et conversions.",
        actionModule: "integrations",
        actionLabel: "Connecteurs",
        icon: BarChart3,
      });
    }
  }

  const alertModules: Partial<Record<CockpitModuleId, CockpitModuleId[]>> = {
    overview: [
      "overview",
      "revenus",
      "produit",
      "acquisition",
      "finance",
      "build",
      "campagne",
      "clients",
    ],
    revenus: ["revenus"],
    produit: ["produit"],
    acquisition: ["acquisition"],
    integrations: ["integrations"],
    finance: ["finance"],
    build: ["build"],
    campagne: ["campagne"],
    clients: ["clients"],
  };

  const allowedModules = alertModules[moduleId];
  if (allowedModules) {
    const integrationAlerts = filterIntegrationHealthAlerts(
      buildIntegrationHealthAlerts(project.integrations),
      moduleId,
    );
    for (const alert of integrationAlerts) {
      push(alertToCallout(alert));
    }

    for (const alert of alerts) {
      const actionModule = alert.actionModule ?? (alert.actionTab as CockpitModuleId) ?? "overview";
      if (allowedModules.includes(actionModule) || moduleId === "overview") {
        push(alertToCallout(alert));
      }
    }
  }

  return callouts;
}
