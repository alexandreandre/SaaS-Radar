import type { CampaignToolId } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";

export type CampaignWorkflowNode = {
  toolId: CampaignToolId;
  mode: "series" | "parallel";
  label: string;
  dependsOn?: CampaignToolId[];
};

export const WORKFLOW_TEMPLATES: Record<ExtendedChannelKey, CampaignWorkflowNode[]> = {
  cold_email: [
    { toolId: "claude", mode: "series", label: "Séquence email" },
    { toolId: "lemlist", mode: "series", label: "Envoi", dependsOn: ["claude"] },
  ],
  linkedin: [
    { toolId: "claude", mode: "parallel", label: "Posts & DMs" },
    { toolId: "typefully", mode: "parallel", label: "Planification" },
  ],
  seo: [
    { toolId: "claude", mode: "series", label: "Stratégie contenu" },
    { toolId: "canva", mode: "series", label: "Visuels", dependsOn: ["claude"] },
  ],
  referral: [
    { toolId: "claude", mode: "series", label: "Programme partenaire" },
    { toolId: "loops", mode: "series", label: "Emails nurturing", dependsOn: ["claude"] },
  ],
  tiktok: [
    { toolId: "higgsfield", mode: "parallel", label: "Vidéos UGC" },
    { toolId: "adcreative", mode: "parallel", label: "Statics retargeting" },
  ],
  meta: [
    { toolId: "creatify", mode: "parallel", label: "Vidéos UGC" },
    { toolId: "adcreative", mode: "parallel", label: "Images ads" },
  ],
  google: [
    { toolId: "adcreative", mode: "series", label: "Visuels search/display" },
  ],
};

export function getWorkflowTemplate(channel: ExtendedChannelKey): CampaignWorkflowNode[] {
  return WORKFLOW_TEMPLATES[channel] ?? WORKFLOW_TEMPLATES.linkedin;
}

export function buildWorkflowForStack(
  channel: ExtendedChannelKey,
  toolIds: CampaignToolId[],
): CampaignWorkflowNode[] {
  const template = getWorkflowTemplate(channel);
  if (toolIds.length === 0) return template;

  const templateIds = new Set(template.map((n) => n.toolId));
  const orderedFromTemplate = template.filter((n) => toolIds.includes(n.toolId));
  const extras = toolIds
    .filter((id) => !templateIds.has(id))
    .map(
      (id): CampaignWorkflowNode => ({
        toolId: id,
        mode: "parallel",
        label: id,
      }),
    );

  return [...orderedFromTemplate, ...extras];
}

export function defaultToolIdsForChannel(channel: ExtendedChannelKey): CampaignToolId[] {
  return getWorkflowTemplate(channel).map((n) => n.toolId);
}
