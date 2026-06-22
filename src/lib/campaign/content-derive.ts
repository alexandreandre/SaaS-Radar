import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CampaignContentAsset, CampaignSetup } from "@/lib/campaign/kits";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import type { RiverGoalStrategyId, RiverMessageAdaptation } from "@/lib/campaign/foundations-river";
import {
  buildAudienceDraft,
  generateMessageVariants,
  resolveMessageAdaptations,
  trimToCompletePhrase,
} from "@/lib/campaign/foundations-river";
import {
  CONTENT_ASSET_SCHEMAS,
  fieldsFromValues,
  getContentSchemaForChannel,
  getRequiredContentAssetIds,
  isContentAssetConfirmed,
  type ContentAssetSchema,
} from "@/lib/campaign/content-schemas";
import { CONTENT_ASSET_SCHEMA_VERSION } from "@/lib/campaign/content-constants";

export type ContentDeriveContext = {
  productName: string;
  who: string;
  pain: string;
  positioning: string;
  messageAdaptations: RiverMessageAdaptation[];
  primaryChannel: ExtendedChannelKey;
  supportChannels: ExtendedChannelKey[];
  goalStrategyId?: RiverGoalStrategyId;
  strategyBrief?: string;
};

function capitalizeSentence(text: string): string {
  const t = text.trim().replace(/[.!?…]+$/g, "").trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function sanitizeCopy(text: string): string {
  return text.replace(/\s—\s/g, ", ").replace(/—/g, ", ").replace(/\s+/g, " ").trim();
}

function clampField(text: string, maxLen: number): string {
  const clean = sanitizeCopy(text);
  return trimToCompletePhrase(clean, maxLen);
}

function seedForChannel(context: ContentDeriveContext, channel: ExtendedChannelKey | "landing"): string {
  const hit = context.messageAdaptations.find((a) => a.channel === channel);
  if (hit?.text?.trim()) return sanitizeCopy(hit.text);
  if (channel === "landing" && context.positioning) {
    const colon = context.positioning.indexOf(":");
    if (colon > 0) return sanitizeCopy(context.positioning.slice(colon + 1).trim());
    return sanitizeCopy(context.positioning);
  }
  const variants = generateMessageVariants({
    productName: context.productName,
    who: context.who,
    pain: context.pain,
    goalStrategyId: context.goalStrategyId,
  });
  const recommended = variants.find((v) => v.recommended) ?? variants[0]!;
  return sanitizeCopy(recommended.text);
}

function shortWho(context: ContentDeriveContext, maxLen = 45): string {
  const first = context.who.split(/[.!?]/)[0]?.trim() ?? context.who;
  return clampField(first, maxLen);
}

function buildAssetFromValues(
  schema: ContentAssetSchema,
  values: Record<string, string>,
  source: CampaignContentAsset["source"] = "derived",
): CampaignContentAsset {
  return {
    id: schema.id,
    channel: schema.channel,
    label: schema.label,
    fields: fieldsFromValues(schema, values),
    source,
    schemaVersion: CONTENT_ASSET_SCHEMA_VERSION,
  };
}

function deriveLandingContent(context: ContentDeriveContext): CampaignContentAsset {
  const schema = CONTENT_ASSET_SCHEMAS.landing!;
  const seed = seedForChannel(context, "landing");
  const h1 = clampField(
    seed.includes(context.productName) ? seed : `${context.productName} : ${seed}`,
    60,
  );
  const subtitle = clampField(
    `Pour ${shortWho(context)} : ${clampField(context.pain, 70)}`,
    120,
  );
  return buildAssetFromValues(schema, {
    h1: capitalizeSentence(h1),
    subtitle: capitalizeSentence(subtitle),
    bullet1: capitalizeSentence(clampField("Suivi simple entre deux rendez-vous", 80)),
    bullet2: capitalizeSentence(clampField("Échanges sécurisés, sans contrainte horaire", 80)),
    bullet3: capitalizeSentence(clampField(`Pensé pour ${shortWho(context, 35)}`, 80)),
    cta: "Demander une démo",
  });
}

function deriveSeoContent(context: ContentDeriveContext): CampaignContentAsset {
  const schema = CONTENT_ASSET_SCHEMAS.seo!;
  const seed = seedForChannel(context, "seo");
  const topic = clampField(seed, 55);
  return buildAssetFromValues(schema, {
    metaTitle: clampField(`${context.productName} : ${topic}`, 60),
    metaDescription: clampField(
      `${capitalizeSentence(topic)}. Découvrez comment ${shortWho(context, 30)} gagnent du temps avec ${context.productName}.`,
      160,
    ),
    articleTitle: capitalizeSentence(clampField(`Comment ${topic.charAt(0).toLowerCase()}${topic.slice(1)} ?`, 80)),
    angle: capitalizeSentence(
      clampField(`Guide pratique pour ${shortWho(context)} : problème, solution, mise en place.`, 120),
    ),
    outlineH2: [
      "Le problème au quotidien",
      "Ce qu'il faut savoir avant de se lancer",
      `Comment ${context.productName} aide concrètement`,
      "Premiers pas en cabinet",
    ].join("\n"),
  });
}

function deriveGoogleAdsContent(context: ContentDeriveContext): CampaignContentAsset {
  const schema = CONTENT_ASSET_SCHEMAS.google!;
  const seed = clampField(seedForChannel(context, "google"), 50);
  return buildAssetFromValues(schema, {
    headline1: clampField(context.productName, 30),
    headline2: clampField("Suivi patient simple", 30),
    headline3: clampField(seed, 30),
    description1: clampField(`${seed}. Idéal pour ${shortWho(context, 25)}.`, 90),
    description2: clampField(`Essayez ${context.productName}. Sans engagement.`, 90),
    finalUrlHint: "/demo ou page d'accueil",
  });
}

function deriveMetaAdsContent(context: ContentDeriveContext): CampaignContentAsset {
  const schema = CONTENT_ASSET_SCHEMAS.meta!;
  const seed = seedForChannel(context, "meta");
  return buildAssetFromValues(schema, {
    primaryText: clampField(
      `${shortWho(context, 40)} : ${clampField(seed, 60)}. Découvrez ${context.productName}.`,
      125,
    ),
    headline: clampField(context.productName, 40),
    description: clampField("Essai gratuit", 30),
    ctaLabel: "En savoir plus",
  });
}

function deriveTikTokContent(context: ContentDeriveContext): CampaignContentAsset {
  const schema = CONTENT_ASSET_SCHEMAS.tiktok!;
  return buildAssetFromValues(schema, {
    hook3s: clampField("Vos patients ont des questions entre deux RDV ?", 80),
    script15s: clampField(
      `[0-3 s] Question relatable.\n[3-12 s] ${context.productName} : ${clampField(seedForChannel(context, "tiktok"), 80)}.\n[12-15 s] Lien en bio pour essayer.`,
      280,
    ),
    onScreenText: clampField("Suivi patient sans RDV imposé", 60),
    caption: clampField(`${context.productName} · ${clampField(context.pain, 80)} #santé #cabinet`, 150),
  });
}

function deriveReferralContent(context: ContentDeriveContext): CampaignContentAsset {
  const schema = CONTENT_ASSET_SCHEMAS.referral!;
  const seed = seedForChannel(context, "referral");
  return buildAssetFromValues(schema, {
    askMessage: clampField(seed, 280),
    followUp: clampField(
      `Re-bonjour, je repasse sur ${context.productName} : toujours pertinent pour votre cabinet ?`,
      200,
    ),
    incentiveLine: clampField("Je peux vous faire une intro si vous voulez tester.", 80),
  });
}

function deriveLinkedinContent(context: ContentDeriveContext): CampaignContentAsset {
  const schema = CONTENT_ASSET_SCHEMAS.linkedin!;
  const seed = seedForChannel(context, "linkedin");
  return buildAssetFromValues(schema, {
    hook: clampField(`Entre deux rendez-vous, vos clients ont des questions.`, 120),
    body: clampField(
      `${capitalizeSentence(seed)}\n\nOn a construit ${context.productName} pour ${shortWho(context)}.\n\nVous en pensez quoi ?`,
      600,
    ),
    cta: clampField("Commentez ou envoyez-moi un message.", 80),
  });
}

function deriveColdEmailContent(context: ContentDeriveContext): CampaignContentAsset {
  const schema = CONTENT_ASSET_SCHEMAS.cold_email!;
  const seed = seedForChannel(context, "cold_email");
  return buildAssetFromValues(schema, {
    subject: clampField(`${context.productName} : ${clampField(seed, 35)}`, 60),
    body: clampField(
      `Bonjour,\n\n${capitalizeSentence(seed)}\n\n${context.productName} aide ${shortWho(context)} à gagner du temps.\n\n15 min pour en parler ?`,
      500,
    ),
    ps: clampField("Répondez « oui » et je vous propose un créneau.", 120),
  });
}

const DERIVE_BY_ID: Record<string, (ctx: ContentDeriveContext) => CampaignContentAsset> = {
  landing: deriveLandingContent,
  seo: deriveSeoContent,
  google: deriveGoogleAdsContent,
  meta: deriveMetaAdsContent,
  tiktok: deriveTikTokContent,
  referral: deriveReferralContent,
  linkedin: deriveLinkedinContent,
  cold_email: deriveColdEmailContent,
};

export function deriveContentAsset(
  assetId: string,
  context: ContentDeriveContext,
): CampaignContentAsset | undefined {
  const derive = DERIVE_BY_ID[assetId];
  if (!derive) return undefined;
  return derive(context);
}

export function deriveAllContentAssets(context: ContentDeriveContext): Record<string, CampaignContentAsset> {
  const ids = getRequiredContentAssetIds(context.primaryChannel, context.supportChannels);
  const out: Record<string, CampaignContentAsset> = {};
  for (const id of ids) {
    const asset = deriveContentAsset(id, context);
    if (asset) out[id] = asset;
  }
  return out;
}

export function buildContentDeriveContext(
  project: UserProject,
  opportunity: Opportunity,
): ContentDeriveContext {
  const setup = project.campaignSetup;
  const audience = buildAudienceDraft(project, opportunity);
  const productName = project.productName ?? opportunity.name;
  const primaryChannel = setup?.primaryChannel ?? "linkedin";
  const supportChannels = setup?.foundationsRiver?.supportChannelKeys ?? [];

  const messageAdaptations = resolveMessageAdaptations(setup, {
    productName,
    who: audience.who,
    pain: audience.pain,
    primaryChannel,
    supportChannels,
  });

  return {
    productName,
    who: audience.who,
    pain: audience.pain,
    positioning: setup?.positioning?.trim() ?? "",
    messageAdaptations,
    primaryChannel,
    supportChannels,
    goalStrategyId: setup?.foundationsRiver?.goalStrategyId,
    strategyBrief: setup?.strategyBrief,
  };
}

function mergeAssetFields(
  persisted: CampaignContentAsset,
  derived: CampaignContentAsset,
): CampaignContentAsset {
  const derivedMap = Object.fromEntries(derived.fields.map((f) => [f.key, f]));
  const fields = persisted.fields.map((f) => ({
    ...f,
    label: derivedMap[f.key]?.label ?? f.label,
    maxLength: derivedMap[f.key]?.maxLength ?? f.maxLength,
    hint: derivedMap[f.key]?.hint ?? f.hint,
    required: derivedMap[f.key]?.required ?? f.required,
  }));
  return {
    ...derived,
    ...persisted,
    fields,
    label: derived.label,
  };
}

export function resolveContentAssets(
  setup: CampaignSetup | undefined,
  context: ContentDeriveContext,
): Record<string, CampaignContentAsset> {
  const derived = deriveAllContentAssets(context);
  const persisted = setup?.contentAssets ?? {};
  const out: Record<string, CampaignContentAsset> = { ...derived };

  for (const [id, saved] of Object.entries(persisted)) {
    const base = derived[id];
    if (base) {
      out[id] = mergeAssetFields(saved, base);
    } else {
      out[id] = saved;
    }
  }
  return out;
}

export function getConfirmedContentAssets(
  assets: Record<string, CampaignContentAsset>,
): CampaignContentAsset[] {
  return Object.values(assets).filter((a) => Boolean(a.confirmedAt));
}

export function formatContentAssetAsMarkdown(asset: CampaignContentAsset): string {
  const lines = [`## ${asset.label}`, ""];
  for (const f of asset.fields) {
    if (!f.value.trim()) continue;
    lines.push(`**${f.label}**`, f.value.trim(), "");
  }
  return lines.join("\n").trim();
}

export function legacyAssetChecklistComplete(setup: CampaignSetup | undefined): boolean {
  return (setup?.assetChecklist?.filter(Boolean).length ?? 0) >= 2;
}

/** Créas prêts : atelier contenu entièrement validé. */
export function isContentCreativeReady(project: UserProject): boolean {
  const setup = project.campaignSetup;
  if (!setup?.foundationsRiver?.completedAt) return false;
  if (setup.contentStudio?.completedAt) return true;

  const primary = setup.primaryChannel ?? "linkedin";
  const support = setup.foundationsRiver?.supportChannelKeys ?? [];
  const requiredIds = getRequiredContentAssetIds(primary, support);
  const assets = setup.contentAssets ?? {};
  if (requiredIds.length === 0) return false;

  return requiredIds.every((id) => {
    const asset = assets[id];
    return asset ? isContentAssetConfirmed(asset) : false;
  });
}

export function usesContentStudio(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  if (setup.contentStudio?.startedAt) return true;
  const keys = Object.keys(setup.contentAssets ?? {});
  return keys.length > 0;
}

export function getContentSchemaForAssetId(assetId: string) {
  return getContentSchemaForChannel(assetId as ExtendedChannelKey | "landing");
}
