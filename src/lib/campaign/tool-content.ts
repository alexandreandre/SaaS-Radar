import type { CampaignToolId } from "@/lib/campaign/tools";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";

/** Instructions d'ouverture de l'outil avant de coller le prompt (FR). */
export const CAMPAIGN_TOOL_OPEN_HINTS: Partial<Record<CampaignToolId, string>> = {
  claude: "Ouvrez claude.ai, démarrez une nouvelle conversation, puis collez le prompt.",
  chatgpt: "Ouvrez chatgpt.com, nouvelle conversation, puis collez le prompt.",
  canva: "Ouvrez Canva → Créer un design → choisissez le format adapté à votre canal.",
  lemlist: "Ouvrez Lemlist → Campagnes → Nouvelle campagne email.",
  typefully: "Ouvrez Typefully → Nouveau brouillon pour votre fil LinkedIn/X.",
  buffer: "Ouvrez Buffer → Publier → composez votre post.",
  loops: "Ouvrez Loops → Campagnes → créez une séquence ou un broadcast.",
  brevo: "Ouvrez Brevo → Campagnes → Email ou Automation selon votre kit.",
};

/** Micro-étapes après copie du prompt. */
export const CAMPAIGN_TOOL_POST_COPY_STEPS: Partial<
  Record<CampaignToolId, string[]>
> = {
  claude: [
    "Collez le prompt dans le chat",
    "Affinez le ton si besoin",
    "Exportez ou copiez les textes finaux",
  ],
  chatgpt: [
    "Collez le prompt",
    "Demandez des variantes si utile",
    "Copiez les accroches retenues",
  ],
  canva: [
    "Collez le brief dans Magic Design ou le chat Canva",
    "Ajustez couleurs et logo",
    "Téléchargez ou publiez directement",
  ],
  lemlist: [
    "Importez votre liste de prospects",
    "Collez les emails générés",
    "Lancez un test sur 20–50 contacts",
  ],
  typefully: [
    "Collez le thread généré",
    "Planifiez ou publiez",
    "Suivez les réponses dans vos DMs",
  ],
  buffer: ["Collez le post", "Ajoutez visuel si besoin", "Planifiez la publication"],
  loops: ["Créez la séquence", "Collez le copy", "Activez sur votre liste"],
  brevo: ["Créez la campagne", "Collez le copy", "Envoyez un test puis la campagne"],
};

export const CAMPAIGN_PUBLISH_STEPS_BY_CHANNEL: Partial<
  Record<ExtendedChannelKey, string[]>
> = {
  linkedin: [
    "Publiez votre premier post avec le hook généré",
    "Répondez aux commentaires dans les 2 h",
    "Relancez avec une variante sous 48 h",
  ],
  cold_email: [
    "Importez vos contacts qualifiés",
    "Envoyez un batch test (20–50 emails)",
    "Itérez l'objet selon le taux d'ouverture",
  ],
  seo: [
    "Publiez la page ou l'article optimisé",
    "Soumettez l'URL à Search Console",
    "Mesurez les impressions sous 7 jours",
  ],
  tiktok: [
    "Publiez la vidéo avec CTA clair",
    "Répondez aux premiers commentaires",
    "Testez une variante hook sous 48 h",
  ],
  meta: [
    "Importez vos créas dans Meta Ads Manager",
    "Budget test 20–50 €/jour",
    "Attendez 48 h avant d'itérer",
  ],
  google: [
    "Créez la campagne Search ou Performance Max",
    "Budget test 20–50 €/jour",
    "Vérifiez les termes de recherche après 3 jours",
  ],
  referral: [
    "Activez le programme parrainage dans votre app",
    "Annoncez-le à vos premiers users",
    "Suivez les inscriptions référées",
  ],
};

export function getCampaignToolOpenHint(toolId: CampaignToolId): string | undefined {
  return CAMPAIGN_TOOL_OPEN_HINTS[toolId];
}

export function getCampaignToolPostCopySteps(toolId: CampaignToolId): string[] {
  return (
    CAMPAIGN_TOOL_POST_COPY_STEPS[toolId] ?? [
      "Collez le prompt dans l'outil",
      "Ajustez si besoin",
      "Passez à la publication",
    ]
  );
}

export function getCampaignPublishSteps(
  channel: ExtendedChannelKey,
): string[] {
  return (
    CAMPAIGN_PUBLISH_STEPS_BY_CHANNEL[channel] ?? [
      "Publiez votre premier contenu sur le canal choisi",
      "Suivez les réponses et engagements",
      "Itérez sous 48 h",
    ]
  );
}
