import type { Opportunity } from "@/types/opportunity";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { CampaignActionItem } from "@/lib/campaign/stages";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import { getLaunchPlaybook } from "@/lib/campaign/launch-playbooks";
import { getCommunitiesForStage } from "@/lib/campaign/communities";
import { getStageDefinition } from "@/lib/campaign/stages";
import type { CampaignToolId } from "@/lib/campaign/tools";
import type { ConnectorId } from "@/lib/connectors/types";

function actionId(prefix: string, index: number): string {
  return `${prefix}-${index}`;
}

function networkActions(channel: ExtendedChannelKey): CampaignActionItem[] {
  const items: CampaignActionItem[] = [
    {
      id: actionId("net", 0),
      phase: "prepare",
      label: "Lister 20 contacts nommés dans votre ICP",
      detail: "Anciens collègues, fondateurs, prospects identifiés — noms réels.",
      done: false,
    },
    {
      id: actionId("net", 1),
      phase: "execute",
      label: "Envoyer 5 DMs personnalisés cette semaine",
      detail: "Pas de pitch — validez le problème avant de mentionner le produit.",
      toolId: "claude",
      done: false,
    },
    {
      id: actionId("net", 2),
      phase: "execute",
      label: "Participer à 3 discussions en communauté (sans vendre)",
      done: false,
    },
    {
      id: actionId("net", 3),
      phase: "measure",
      label: "Noter les réponses reçues et relancer les intéressés",
      done: false,
    },
  ];

  if (channel === "linkedin") {
    items[1] = {
      ...items[1],
      toolId: "typefully",
      label: "Publier 1 post problème + envoyer 5 DMs",
    };
  }

  return items;
}

function outreachActions(_channel: ExtendedChannelKey): CampaignActionItem[] {
  void _channel;
  return [
    {
      id: actionId("out", 0),
      phase: "prepare",
      label: "Construire une liste de 50 prospects ICP",
      toolId: "apollo",
      done: false,
    },
    {
      id: actionId("out", 1),
      phase: "prepare",
      label: "Configurer domaine d'envoi + warm-up email",
      toolId: "lemlist",
      detail: "SPF/DKIM/DMARC avant tout envoi à froid.",
      done: false,
    },
    {
      id: actionId("out", 2),
      phase: "execute",
      label: "Envoyer la séquence J1 (20 emails max)",
      toolId: "lemlist",
      done: false,
    },
    {
      id: actionId("out", 3),
      phase: "execute",
      label: "Envoyer 10 messages LinkedIn personnalisés",
      toolId: "claude",
      done: false,
    },
    {
      id: actionId("out", 4),
      phase: "measure",
      label: "Planifier 5 discovery calls (15 min)",
      done: false,
    },
  ];
}

function contentActions(channel: ExtendedChannelKey): CampaignActionItem[] {
  const items: CampaignActionItem[] = [
    {
      id: actionId("cnt", 0),
      phase: "prepare",
      label: "Définir 3 angles de contenu (problème, avant/après, leçon)",
      toolId: "claude",
      done: false,
    },
    {
      id: actionId("cnt", 1),
      phase: "execute",
      label: "Publier 1 post LinkedIn cette semaine",
      toolId: "typefully",
      done: false,
    },
    {
      id: actionId("cnt", 2),
      phase: "execute",
      label: "Demander 3 referrals à vos clients satisfaits",
      done: false,
    },
    {
      id: actionId("cnt", 3),
      phase: "measure",
      label: "Mesurer signups organiques de la semaine",
      connectorId: "plausible" as ConnectorId,
      done: false,
    },
  ];

  if (channel === "seo") {
    items[1] = {
      ...items[1],
      label: "Publier 1 article SEO ciblé (mot-clé longue traîne)",
      toolId: "claude",
    };
  }

  return items;
}

function amplificationActions(channel: ExtendedChannelKey): CampaignActionItem[] {
  const phSteps = getLaunchPlaybook("product-hunt");
  const items: CampaignActionItem[] = phSteps.map((step, i) => ({
    id: `amp-ph-${i}`,
    phase: i < 2 ? ("prepare" as const) : ("execute" as const),
    label: step.label,
    detail: step.detail,
    externalUrl: "https://www.producthunt.com",
    done: false,
  }));

  if (channel === "meta" || channel === "tiktok" || channel === "google") {
    items.push({
      id: "amp-ads-test",
      phase: "execute",
      label: "Lancer un test pub à 20 €/jour pendant 5 jours",
      detail: "1 créa, 1 audience, 1 objectif conversion.",
      toolId: "adcreative",
      done: false,
    });
  }

  items.push({
    id: "amp-measure",
    phase: "measure",
    label: "Comparer signups PH vs organiques",
    connectorId: "plausible" as ConnectorId,
    done: false,
  });

  return items;
}

function scaleActions(channel: ExtendedChannelKey): CampaignActionItem[] {
  const connectorMap: Partial<Record<ExtendedChannelKey, ConnectorId>> = {
    meta: "meta-ads",
    tiktok: "tiktok-ads",
    google: "google-ads",
    linkedin: "linkedin-ads",
  };

  const adsConnector = connectorMap[channel];

  return [
    {
      id: "scale-0",
      phase: "prepare",
      label: "Préparer 3 variantes créatives",
      toolId: "adcreative" as CampaignToolId,
      done: false,
    },
    {
      id: "scale-1",
      phase: "prepare",
      label: "Configurer UTM sur toutes les URLs campagne",
      done: false,
    },
    {
      id: "scale-2",
      phase: "execute",
      label: "Lancer campagne avec budget test",
      connectorId: adsConnector,
      done: false,
    },
    {
      id: "scale-3",
      phase: "measure",
      label: "Analyser ROAS dans Acquisition",
      detail: "Coupez ce qui est sous le seuil, scalez ce qui convertit.",
      done: false,
    },
  ];
}

export function buildActionItemsForStage(
  stage: AcquisitionStage,
  channel: ExtendedChannelKey,
): CampaignActionItem[] {
  switch (stage) {
    case "network":
      return networkActions(channel);
    case "outreach":
      return outreachActions(channel);
    case "content":
      return contentActions(channel);
    case "amplification":
      return amplificationActions(channel);
    case "scale":
      return scaleActions(channel);
    default:
      return networkActions(channel);
  }
}

export function enrichActionsFromOpportunity(
  items: CampaignActionItem[],
  opportunity: Opportunity,
  productName: string,
): CampaignActionItem[] {
  const enriched = [...items];
  const emailTemplate = opportunity.emailTemplates?.[0];
  if (emailTemplate) {
    enriched.unshift({
      id: "opp-email-template",
      phase: "prepare",
      label: `Adapter le template « ${emailTemplate.name} »`,
      copyPayload: `Objet: ${emailTemplate.subject}\n\n${emailTemplate.body.replace(/\{\{product\}\}/g, productName)}`,
      toolId: "claude",
      done: false,
    });
  }

  const partner = opportunity.partnersFR?.[0];
  if (partner) {
    enriched.push({
      id: "opp-partner",
      phase: "execute",
      label: `Contacter ${partner.name} (${partner.type})`,
      detail: partner.angle,
      done: false,
    });
  }

  return enriched;
}

export function getRequiredConnectorsForStage(
  stage: AcquisitionStage,
): ConnectorId[] {
  const def = getStageDefinition(stage);
  if (!def.showPaidAds && stage !== "content") {
    return stage === "network" ? [] : ["plausible"];
  }
  if (stage === "content") return ["plausible"];
  if (stage === "amplification") return ["plausible"];
  return ["plausible", "google-ads", "meta-ads"];
}

export function buildTrackingPlan(
  productionUrl: string | undefined,
  stage: AcquisitionStage,
): { utmBase: string; requiredConnectors: ConnectorId[] } {
  const base = productionUrl?.replace(/\/$/, "") ?? "https://votre-site.fr";
  return {
    utmBase: `${base}?utm_source=saas-radar&utm_medium={canal}&utm_campaign={campagne}`,
    requiredConnectors: getRequiredConnectorsForStage(stage),
  };
}

export function actionProgress(items: CampaignActionItem[]): {
  prepare: { done: number; total: number };
  execute: { done: number; total: number };
  measure: { done: number; total: number };
} {
  const count = (phase: CampaignActionItem["phase"]) => {
    const subset = items.filter((i) => i.phase === phase);
    return {
      done: subset.filter((i) => i.done).length,
      total: subset.length,
    };
  };
  return {
    prepare: count("prepare"),
    execute: count("execute"),
    measure: count("measure"),
  };
}

export function isPrepareComplete(items: CampaignActionItem[]): boolean {
  const { prepare } = actionProgress(items);
  if (prepare.total === 0) return true;
  return prepare.done / prepare.total >= 0.8;
}

export function hasExecutedAction(items: CampaignActionItem[]): boolean {
  return items.some((i) => i.phase === "execute" && i.done);
}

export function communityGuideItems(stage: AcquisitionStage): string[] {
  if (stage === "scale") return [];
  const communities = getCommunitiesForStage(
    stage === "amplification" ? "amplification" : stage === "content" ? "content" : "network",
  );
  return communities.map((c) => `${c.name} — ${c.url}`);
}
