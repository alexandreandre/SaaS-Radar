import type { UserProject } from "@/lib/portfolio";
import type { CampaignSetup } from "@/lib/campaign/kits";
import { getBuildJourneyState } from "@/lib/build/journey";
import { isTrackingConfigured } from "@/lib/campaign/kits";
import type { GtmMotion } from "@/lib/campaign/gtm-engine";

export type InfraGateId =
  | "app_live"
  | "tracking_or_attribution"
  | "crm_or_tracker"
  | "email_auth"
  | "creative_ready";

export type InfraGate = {
  id: InfraGateId;
  label: string;
  detail: string;
  required: boolean;
  satisfied: boolean;
  blockerAnchor: string;
};

function isAnalyticsConnected(project: UserProject): boolean {
  return (project.integrations ?? []).some(
    (i) =>
      ["plausible", "posthog", "google-analytics", "fathom"].includes(i.connectorId) &&
      (i.status === "connected" || i.status === "demo"),
  );
}

function isCrmConnected(project: UserProject): boolean {
  return (project.integrations ?? []).some(
    (i) =>
      ["hubspot", "pipedrive"].includes(i.connectorId) &&
      (i.status === "connected" || i.status === "demo"),
  );
}

function hasKit(project: UserProject): boolean {
  const kits = project.campaignSetup?.kitsByTool ?? {};
  return Object.values(kits).some((k) => Boolean(k?.primaryPrompt));
}

export function getInfraGates(
  project: UserProject,
  motion: GtmMotion,
): InfraGate[] {
  const setup = project.campaignSetup;
  const buildLive = getBuildJourneyState(project).displayPhase === "live";
  const gates = setup?.infraGates ?? {};

  const appLive = buildLive || Boolean(gates.app_live);
  const trackingOk =
    isTrackingConfigured(setup) ||
    isAnalyticsConnected(project) ||
    Boolean(setup?.attributionQuestionEnabled) ||
    Boolean(gates.tracking_or_attribution);
  const crmOk =
    isCrmConnected(project) ||
    Boolean(gates.crm_or_tracker);
  const emailAuthOk =
    motion !== "outbound" ||
    Boolean(gates.email_auth);
  const creativeOk = hasKit(project) || Boolean(gates.creative_ready);

  return [
    {
      id: "app_live",
      label: "App / landing en ligne",
      detail: "URL produit accessible pour convertir le trafic.",
      required: false,
      satisfied: appLive,
      blockerAnchor: "infra-gates",
    },
    {
      id: "tracking_or_attribution",
      label: "Tracking ou question attribution",
      detail: "Plausible/PostHog connecté, UTM configuré, ou question « Comment nous avez-vous connu ? ».",
      required: true,
      satisfied: trackingOk,
      blockerAnchor: "infra-gates",
    },
    {
      id: "crm_or_tracker",
      label: "CRM ou suivi prospects",
      detail: "HubSpot/Pipedrive connecté, ou suivi manuel validé (Notion/Folk).",
      required: motion === "outbound" || motion === "founder_led",
      satisfied: crmOk,
      blockerAnchor: "infra-gates",
    },
    {
      id: "email_auth",
      label: "Authentification email (SPF/DKIM)",
      detail: "Obligatoire avant cold email — domaine dédié configuré.",
      required: motion === "outbound",
      satisfied: emailAuthOk,
      blockerAnchor: "infra-gates",
    },
    {
      id: "creative_ready",
      label: "Kit / créas prêts",
      detail: "Au moins un kit généré ou checklist assets validée.",
      required: true,
      satisfied: creativeOk,
      blockerAnchor: "creation-screen",
    },
  ];
}

export function canAccessDiffusionPhase(
  project: UserProject,
  motion: GtmMotion,
): boolean {
  const gates = getInfraGates(project, motion);
  return gates.filter((g) => g.required).every((g) => g.satisfied);
}

export function getDiffusionBlockers(
  project: UserProject,
  motion: GtmMotion,
): InfraGate[] {
  return getInfraGates(project, motion).filter((g) => g.required && !g.satisfied);
}
