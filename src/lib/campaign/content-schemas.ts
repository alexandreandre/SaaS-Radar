/**
 * Registre des formats contenu par canal — atelier Création.
 *
 * Extension points (V2+) :
 * - Nouveau canal : ajouter une entrée CONTENT_ASSET_SCHEMAS + derive dans content-derive.ts
 * - Variantes A/B : étendre CampaignContentAsset avec variants[]
 * - IA par champ : regenerateField(assetId, fieldKey) via API
 * - Score qualité : enrichir validateContentAsset avec score + suggestions
 * - Traduction EN : param language sur derive
 * - Visuels : type séparé hors champs texte
 * - Preview landing : composant UI branché sur champs landing
 * - Intégration Build : pousser h1 si URL prod connectée
 */
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getChannelLabel } from "@/lib/campaign/channels";
import type { CampaignContentAsset, CampaignContentField } from "@/lib/campaign/kits";
import { CONTENT_ASSET_SCHEMA_VERSION } from "@/lib/campaign/content-constants";

export type ContentFieldSchema = {
  key: string;
  label: string;
  maxLength?: number;
  hint?: string;
  required?: boolean;
  multiline?: boolean;
};

export type ContentAssetSchema = {
  id: string;
  channel: ExtendedChannelKey | "landing";
  label: string;
  fields: ContentFieldSchema[];
};

export type ContentSchemaPlugin = ContentAssetSchema & {
  validate?: (asset: CampaignContentAsset) => string[];
};

const LANDING_SCHEMA: ContentAssetSchema = {
  id: "landing",
  channel: "landing",
  label: "Site / landing",
  fields: [
    { key: "h1", label: "Titre principal (H1)", maxLength: 60, required: true },
    { key: "subtitle", label: "Sous-titre", maxLength: 120, required: true, multiline: true },
    { key: "bullet1", label: "Point clé 1", maxLength: 80, required: true },
    { key: "bullet2", label: "Point clé 2", maxLength: 80, required: true },
    { key: "bullet3", label: "Point clé 3", maxLength: 80, required: true },
    { key: "cta", label: "Bouton d'action (CTA)", maxLength: 28, required: true },
  ],
};

const SEO_SCHEMA: ContentAssetSchema = {
  id: "seo",
  channel: "seo",
  label: "SEO",
  fields: [
    { key: "metaTitle", label: "Meta title", maxLength: 60, required: true },
    { key: "metaDescription", label: "Meta description", maxLength: 160, required: true, multiline: true },
    { key: "articleTitle", label: "Titre d'article / page pilier", maxLength: 80, required: true },
    { key: "angle", label: "Angle éditorial", maxLength: 120, required: true, multiline: true },
    { key: "outlineH2", label: "Plan (H2, une ligne par section)", maxLength: 300, required: true, multiline: true },
  ],
};

const GOOGLE_SCHEMA: ContentAssetSchema = {
  id: "google",
  channel: "google",
  label: "Google Ads",
  fields: [
    { key: "headline1", label: "Titre 1", maxLength: 30, required: true },
    { key: "headline2", label: "Titre 2", maxLength: 30, required: true },
    { key: "headline3", label: "Titre 3", maxLength: 30, required: true },
    { key: "description1", label: "Description 1", maxLength: 90, required: true, multiline: true },
    { key: "description2", label: "Description 2", maxLength: 90, required: true, multiline: true },
    { key: "finalUrlHint", label: "Page de destination (URL ou slug)", maxLength: 80, required: true },
  ],
};

const META_SCHEMA: ContentAssetSchema = {
  id: "meta",
  channel: "meta",
  label: "Meta Ads",
  fields: [
    { key: "primaryText", label: "Texte principal", maxLength: 125, required: true, multiline: true },
    { key: "headline", label: "Titre", maxLength: 40, required: true },
    { key: "description", label: "Description", maxLength: 30, required: true },
    { key: "ctaLabel", label: "Libellé CTA", maxLength: 24, required: true },
  ],
};

const TIKTOK_SCHEMA: ContentAssetSchema = {
  id: "tiktok",
  channel: "tiktok",
  label: "TikTok",
  fields: [
    { key: "hook3s", label: "Hook (3 premières secondes)", maxLength: 80, required: true },
    { key: "script15s", label: "Script vidéo (~15 s)", maxLength: 280, required: true, multiline: true },
    { key: "onScreenText", label: "Texte à l'écran", maxLength: 60, required: true },
    { key: "caption", label: "Légende / caption", maxLength: 150, required: true, multiline: true },
  ],
};

const REFERRAL_SCHEMA: ContentAssetSchema = {
  id: "referral",
  channel: "referral",
  label: "Recommandation",
  fields: [
    { key: "askMessage", label: "Message de demande", maxLength: 280, required: true, multiline: true },
    { key: "followUp", label: "Relance si pas de réponse", maxLength: 200, required: true, multiline: true },
    { key: "incentiveLine", label: "Incitation (optionnelle)", maxLength: 80, required: false },
  ],
};

const LINKEDIN_SCHEMA: ContentAssetSchema = {
  id: "linkedin",
  channel: "linkedin",
  label: "LinkedIn",
  fields: [
    { key: "hook", label: "Accroche (1ère ligne)", maxLength: 120, required: true },
    { key: "body", label: "Corps du post", maxLength: 600, required: true, multiline: true },
    { key: "cta", label: "Appel à action", maxLength: 80, required: true },
  ],
};

const COLD_EMAIL_SCHEMA: ContentAssetSchema = {
  id: "cold_email",
  channel: "cold_email",
  label: "Email froid",
  fields: [
    { key: "subject", label: "Objet", maxLength: 60, required: true },
    { key: "body", label: "Corps de l'email", maxLength: 500, required: true, multiline: true },
    { key: "ps", label: "P.S.", maxLength: 120, required: false, multiline: true },
  ],
};

export const CONTENT_ASSET_SCHEMAS: Record<string, ContentAssetSchema> = {
  landing: LANDING_SCHEMA,
  seo: SEO_SCHEMA,
  google: GOOGLE_SCHEMA,
  meta: META_SCHEMA,
  tiktok: TIKTOK_SCHEMA,
  referral: REFERRAL_SCHEMA,
  linkedin: LINKEDIN_SCHEMA,
  cold_email: COLD_EMAIL_SCHEMA,
};

export function getContentSchemaForChannel(
  channel: ExtendedChannelKey | "landing",
): ContentAssetSchema | undefined {
  if (channel === "landing") return CONTENT_ASSET_SCHEMAS.landing;
  return CONTENT_ASSET_SCHEMAS[channel];
}

export function getRequiredContentAssetIds(
  primaryChannel: ExtendedChannelKey,
  supportChannels: ExtendedChannelKey[] = [],
): string[] {
  const ids: string[] = ["landing", primaryChannel];
  const support = supportChannels.find((c) => c !== primaryChannel);
  if (support && CONTENT_ASSET_SCHEMAS[support]) {
    ids.push(support);
  }
  return ids;
}

export function contentAssetLabel(assetId: string): string {
  const schema = CONTENT_ASSET_SCHEMAS[assetId];
  if (schema) return schema.label;
  return getChannelLabel(assetId as ExtendedChannelKey) || assetId;
}

export function buildEmptyFields(schema: ContentAssetSchema): CampaignContentField[] {
  return schema.fields.map((f) => ({
    key: f.key,
    label: f.label,
    value: "",
    maxLength: f.maxLength,
    hint: f.hint,
    required: f.required,
  }));
}

export function fieldsFromValues(
  schema: ContentAssetSchema,
  values: Record<string, string>,
): CampaignContentField[] {
  return schema.fields.map((f) => ({
    key: f.key,
    label: f.label,
    value: values[f.key]?.trim() ?? "",
    maxLength: f.maxLength,
    hint: f.hint,
    required: f.required,
  }));
}

export function fieldsToRecord(fields: CampaignContentField[]): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, f.value]));
}

export function validateContentAsset(asset: CampaignContentAsset): {
  valid: boolean;
  errors: string[];
} {
  const schema = CONTENT_ASSET_SCHEMAS[asset.id];
  if (!schema) return { valid: true, errors: [] };

  const errors: string[] = [];
  for (const fieldSchema of schema.fields) {
    const field = asset.fields.find((f) => f.key === fieldSchema.key);
    const value = field?.value?.trim() ?? "";
    if (fieldSchema.required && !value) {
      errors.push(`${fieldSchema.label} : requis`);
      continue;
    }
    if (fieldSchema.maxLength && value.length > fieldSchema.maxLength) {
      errors.push(`${fieldSchema.label} : max ${fieldSchema.maxLength} car.`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function isContentAssetConfirmed(asset: CampaignContentAsset | undefined): boolean {
  if (!asset?.confirmedAt) return false;
  return validateContentAsset(asset).valid;
}

export function assetFieldsMap(asset: CampaignContentAsset): Record<string, string> {
  return fieldsToRecord(asset.fields);
}

export { CONTENT_ASSET_SCHEMA_VERSION };
