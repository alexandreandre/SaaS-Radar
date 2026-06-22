import type { Opportunity } from "@/types/opportunity";
import type { UserProject } from "@/lib/portfolio";
import type { CampaignSetup, CampaignIcpStructured } from "@/lib/campaign/kits";
import type { CampaignSmartGoal } from "@/lib/campaign/stages";
import type { AcquisitionStage } from "@/lib/campaign/stages";
import type { ExtendedChannelKey } from "@/lib/campaign/channels";
import { getChannelLabel, resolveExtendedChannelKey } from "@/lib/campaign/channels";
import { isChannelAllowedForStage } from "@/lib/campaign/stages";
import {
  recommendIcpSummary,
  recommendStageForProject,
} from "@/lib/campaign/recommend";
import { recommendGtmMotion } from "@/lib/campaign/gtm-engine";
import { profileFromStage } from "@/lib/campaign/stages";
import { defaultSmartGoalForStage } from "@/lib/campaign/stages";

export type FoundationsRiverStopId =
  | "intro"
  | "audience"
  | "goal"
  | "message"
  | "dock";

export type FoundationsRiverProgress = {
  startedAt?: string;
  audienceConfirmedAt?: string;
  goalConfirmedAt?: string;
  messageConfirmedAt?: string;
  completedAt?: string;
};

export type FoundationsRiverAudienceDraft = {
  who: string;
  pain: string;
  icpSummary: string;
};

export type RiverGoalStrategyId = "warm" | "trust" | "accelerate";

export type RiverGoalStrategy = {
  id: RiverGoalStrategyId;
  title: string;
  subtitle: string;
  hint: string;
  primaryChannel: ExtendedChannelKey;
  supportChannels: ExtendedChannelKey[];
  recommended?: boolean;
};

export type FoundationsRiverGoalDraft = {
  strategies: RiverGoalStrategy[];
  selectedStrategyId: RiverGoalStrategyId;
  label: string;
  recapLabel: string;
  targetValue: number;
  horizonDays: number;
  metric: CampaignSmartGoal["metric"];
  channel: ExtendedChannelKey;
  channelLabel: string;
  supportChannels: ExtendedChannelKey[];
  supportChannelLabels: string[];
};

export type MessageVariantId = "direct" | "benefit" | "cabinet";

export type RiverMessageVariant = {
  id: MessageVariantId;
  title: string;
  hint: string;
  text: string;
  recommended?: boolean;
};

export type FoundationsRiverMessageDraft = {
  variants: RiverMessageVariant[];
  selectedVariantId: MessageVariantId;
  positioning: string;
  adaptations: RiverMessageAdaptation[];
};

export type RiverMessageAdaptationChannel = ExtendedChannelKey | "landing";

export type RiverMessageAdaptation = {
  channel: RiverMessageAdaptationChannel;
  label: string;
  text: string;
};

export type FoundationsRiverDraft = {
  audience: FoundationsRiverAudienceDraft;
  goal: FoundationsRiverGoalDraft;
  message: FoundationsRiverMessageDraft;
  channelOptions: { key: ExtendedChannelKey; label: string }[];
};

export type FoundationsRiverAudiencePayload = {
  who: string;
  pain: string;
  icpSummary: string;
};

export type FoundationsRiverGoalPayload = {
  smartGoal: CampaignSmartGoal;
  channel: ExtendedChannelKey;
};

export type FoundationsRiverMessagePayload = {
  positioning: string;
};

export type FoundationsRiverConfirmStop =
  | "start"
  | "audience"
  | "goal"
  | "message"
  | "dock";

export function isLegacyFoundationsDataComplete(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  return Boolean(
    setup.smartGoal &&
      setup.primaryChannel &&
      setup.icpSummary?.trim() &&
      (setup.strategyBrief?.trim() || setup.positioning?.trim()),
  );
}

export function isFoundationsRiverComplete(setup: CampaignSetup | undefined): boolean {
  if (!setup?.foundationsRiver) return false;
  const r = setup.foundationsRiver;
  return Boolean(
    r.audienceConfirmedAt &&
      r.goalConfirmedAt &&
      r.messageConfirmedAt &&
      r.completedAt,
  );
}

export function isFoundationsCompleteWithRiver(setup: CampaignSetup | undefined): boolean {
  if (!setup) return false;
  return isFoundationsRiverComplete(setup) || isLegacyFoundationsDataComplete(setup);
}

export function recommendPositioningLine(
  project: UserProject,
  opportunity: Opportunity,
  who: string,
  pain?: string,
): string {
  const draft = buildMessageDraft(
    project,
    opportunity,
    { who, pain: pain ?? "", icpSummary: "" },
    undefined,
  );
  return draft.positioning;
}

const MESSAGE_MAX_LENGTH = 120;

const DANGLING_TAIL_WORDS = new Set([
  "entre",
  "pour",
  "avec",
  "sans",
  "de",
  "du",
  "des",
  "d",
  "à",
  "au",
  "aux",
  "en",
  "et",
  "ou",
  "ni",
  "que",
  "comme",
  "par",
  "sur",
  "sous",
  "dans",
  "chez",
  "le",
  "la",
  "les",
  "un",
  "une",
  "l",
]);

function isDanglingTailWord(word: string): boolean {
  const w = word.toLowerCase().replace(/['']/g, "").replace(/[,.!?…]+$/g, "");
  return DANGLING_TAIL_WORDS.has(w);
}

/** Tronque sans laisser une préposition ou conjonction en suspens. */
export function trimToCompletePhrase(text: string, maxLen: number): string {
  const t = stripTrailingPunctuation(text).replace(/\s+/g, " ");
  if (t.length <= maxLen) return t;

  let cut = t.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  if (lastSpace > maxLen * 0.45) cut = cut.slice(0, lastSpace);

  const words = cut.trim().split(/\s+/);
  while (words.length > 1 && isDanglingTailWord(words[words.length - 1]!)) {
    words.pop();
  }
  return words.join(" ").trim();
}

function stripTrailingPunctuation(text: string): string {
  return text.trim().replace(/[.!?…]+$/g, "").trim();
}

function shortAudienceLabel(who: string, maxLen = 45): string {
  const first = stripTrailingPunctuation(firstSentence(who));
  if (first.length <= maxLen) return first;
  return truncateAtSentence(first, maxLen).replace(/…$/g, "").trim();
}

/** Pain confirmé → fragment bénéfice (nom, pas infinitif). */
export function painToBenefitPhrase(pain: string): string {
  let p = pain.trim();
  p = p.replace(/^faciliter\s+(la|le|les|l'|d'|de\s+la|de\s+le)?\s*/i, "");
  p = p.replace(/^permettre\s+(de\s+)?(la|le|les|l'|d')?\s*/i, "");
  p = p.replace(/^optimiser\s+(la|le|les|l'|d'|de\s+la)?\s*/i, "");
  const comma = p.indexOf(",");
  if (comma > 24 && comma < 90) {
    p = p.slice(0, comma);
  }
  p = p.trim();
  if (!p) return "gagner du temps au quotidien";
  return p.charAt(0).toLowerCase() + p.slice(1);
}

function capitalizeSentence(text: string): string {
  const t = stripTrailingPunctuation(text).trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function formatHeadline(text: string, maxLen = 60): string {
  return capitalizeSentence(trimToCompletePhrase(stripTrailingPunctuation(text), maxLen));
}

function productFromCore(core: string): string | undefined {
  const colon = core.indexOf(":");
  const dash = core.indexOf(" — ");
  if (colon > 0 && colon < 45) return core.slice(0, colon).trim();
  if (dash > 0 && dash < 45) return core.slice(0, dash).trim();
  return undefined;
}

function isHealthcareAsyncContext(pain: string, who: string): boolean {
  return /téléconsult|asynchrone|communication.*(dentiste|patient)|dentiste.*patient|suivi.*patient/i.test(
    `${pain} ${who}`,
  );
}

export type MessageCopyContext = {
  productName?: string;
  who?: string;
  pain?: string;
};

type MessageCopyBundle = {
  direct: string;
  benefit: string;
  cabinet: string;
  landingTitle: string;
  channelPrimary: Partial<Record<ExtendedChannelKey | "landing", string>>;
  channelSupport: Partial<Record<ExtendedChannelKey, string>>;
};

function buildMessageCopyBundle(input: MessageVariantInput): MessageCopyBundle {
  const product = input.productName.trim();
  const shortWho = shortAudienceLabel(input.who);
  const whoLabel = capitalizeSentence(shortWho);

  if (isHealthcareAsyncContext(input.pain, input.who)) {
    return {
      direct: clampMessage(`${product} : suivi patient asynchrone pour ${shortWho}.`),
      benefit: clampMessage(`${whoLabel} : un suivi simple et sécurisé avec ${product}.`),
      cabinet: clampMessage(`${product} : vos patients écrivent, vous répondez à votre rythme.`),
      landingTitle: formatHeadline(`${product} : suivi patient asynchrone pour cabinets dentaires`),
      channelPrimary: {
        seo: formatHeadline(
          "Téléconsultation dentaire : suivre vos patients sans rendez-vous imposé",
        ),
        referral: clampMessage(
          `Vous connaissez un collègue cabinet ? ${product} simplifie le suivi patient à distance.`,
        ),
        linkedin: clampMessage(
          `Entre deux rendez-vous, vos patients ont des questions. ${product} y répond.`,
        ),
        google: formatHeadline("Suivi patient asynchrone pour cabinets dentaires"),
        meta: formatHeadline("Suivi patient asynchrone pour cabinets dentaires"),
        tiktok: formatHeadline("Suivi patient sans rendez-vous imposé"),
        cold_email: clampMessage(`Objet : Suivi patient asynchrone avec ${product}`),
      },
      channelSupport: {
        seo: formatHeadline("Guide : téléconsultation asynchrone en cabinet dentaire"),
        referral: clampMessage(`À recommander : ${product} pour le suivi à distance.`),
        linkedin: clampMessage(`À partager avec un collègue cabinet : ${product}.`),
        google: formatHeadline("Suivi patient à distance pour dentistes"),
        meta: formatHeadline("Suivi patient à distance pour dentistes"),
        tiktok: formatHeadline("Mieux suivre vos patients entre deux RDV"),
        cold_email: clampMessage(`Relance : suivi patient avec ${product}`),
      },
    };
  }

  const promise = capitalizeSentence(extractCoreBenefit(input.pain));
  const promiseBody = promise.charAt(0).toLowerCase() + promise.slice(1);

  return {
    direct: clampMessage(`${product} : ${promiseBody}, pour ${shortWho}.`),
    benefit: clampMessage(`${whoLabel} : ${promiseBody}, avec ${product}.`),
    cabinet: clampMessage(`${product} : ${promiseBody}.`),
    landingTitle: formatHeadline(`${product} : ${promise}`),
    channelPrimary: {
      seo: formatHeadline(`Comment ${promiseBody} ?`),
      referral: clampMessage(`Vous connaissez quelqu'un concerné ? ${product} : ${promiseBody}.`),
      linkedin: clampMessage(`${product} : ${promiseBody}.`),
      google: formatHeadline(promise),
      meta: formatHeadline(promise),
      tiktok: formatHeadline(trimToCompletePhrase(promise, 50)),
      cold_email: clampMessage(`Objet : ${product}, ${trimToCompletePhrase(promise, 45)}`),
    },
    channelSupport: {
      seo: formatHeadline(`Guide : ${trimToCompletePhrase(promise, 45)}`),
      referral: clampMessage(`À recommander : ${product}.`),
      linkedin: clampMessage(`À partager : ${product}, ${trimToCompletePhrase(promiseBody, 45)}.`),
      google: formatHeadline(trimToCompletePhrase(promise, 45)),
      meta: formatHeadline(trimToCompletePhrase(promise, 45)),
      tiktok: formatHeadline(trimToCompletePhrase(promise, 40)),
      cold_email: clampMessage(`Relance : ${product}`),
    },
  };
}

function resolveMessageCopyContext(
  core: string,
  context?: MessageCopyContext,
): MessageVariantInput | null {
  const productName = context?.productName?.trim() || productFromCore(core);
  if (!productName || !context?.pain?.trim() || !context?.who?.trim()) return null;
  return {
    productName,
    who: context.who.trim(),
    pain: context.pain.trim(),
  };
}

function channelAdaptationText(
  bundle: MessageCopyBundle,
  channel: ExtendedChannelKey,
  variant: "primary" | "support",
): string {
  const map = variant === "support" ? bundle.channelSupport : bundle.channelPrimary;
  const custom = map[channel];
  if (custom) return custom;

  const fallbackCore =
    variant === "support"
      ? bundle.channelSupport.referral ?? bundle.cabinet
      : bundle.channelPrimary.seo ?? bundle.direct;
  return clampMessage(fallbackCore, variant === "support" ? 95 : 100);
}

function extractCoreBenefit(pain: string): string {
  const benefit = painToBenefitPhrase(pain);
  if (/communication|échange|téléconsult|asynchrone/i.test(benefit)) {
    if (/patient|dentiste|cabin|santé|médic|praticien/i.test(benefit)) {
      return "suivez vos patients entre deux rendez-vous, en toute sécurité";
    }
    return "échangez avec vos clients simplement, sans contrainte horaire";
  }
  return trimToCompletePhrase(benefit, 68);
}

function shortCoreSnippet(core: string, maxLen = 70): string {
  const body = messageBodyFromCore(core);
  return trimToCompletePhrase(body, maxLen);
}

function messageBodyFromCore(core: string): string {
  if (core.includes(":")) {
    return core
      .slice(core.indexOf(":") + 1)
      .trim()
      .replace(/, pour .+$/i, "")
      .replace(/, avec .+$/i, "")
      .trim();
  }
  if (core.includes(" — ")) {
    const parts = core.split(" — ");
    const tail = parts[1]?.replace(/, avec .+$/i, "").trim();
    if (tail && tail.length > 8) return tail;
    return parts[0]!.trim();
  }
  return core.trim();
}

export function clampMessage(text: string, maxLen = MESSAGE_MAX_LENGTH): string {
  let t = text.trim().replace(/\s+/g, " ");
  t = t.replace(/\s+([,.!?])/g, "$1");
  if (t.length <= maxLen) {
    return t.endsWith(".") || t.endsWith("!") || t.endsWith("?") ? t : `${t}.`;
  }
  const cut = trimToCompletePhrase(stripTrailingPunctuation(t), maxLen - 1);
  return `${cut}.`;
}

export type MessageVariantInput = {
  productName: string;
  who: string;
  pain: string;
  goalStrategyId?: RiverGoalStrategyId;
};

export function generateMessageVariants(input: MessageVariantInput): RiverMessageVariant[] {
  const bundle = buildMessageCopyBundle(input);

  const variants: RiverMessageVariant[] = [
    {
      id: "direct",
      title: "Direct",
      hint: "Produit en tête, bénéfice clair.",
      text: bundle.direct,
      recommended: true,
    },
    {
      id: "benefit",
      title: "Centré cible",
      hint: "On parle d'abord à votre client idéal.",
      text: bundle.benefit,
    },
    {
      id: "cabinet",
      title: "Court & percutant",
      hint: "Une ligne pour posts, bio et signatures.",
      text: bundle.cabinet,
    },
  ];

  if (input.goalStrategyId === "warm") {
    variants.find((v) => v.id === "benefit")!.recommended = true;
    variants.find((v) => v.id === "direct")!.recommended = false;
  } else if (input.goalStrategyId === "trust") {
    variants.find((v) => v.id === "cabinet")!.recommended = true;
    variants.find((v) => v.id === "direct")!.recommended = false;
  } else if (input.goalStrategyId === "accelerate") {
    variants.find((v) => v.id === "cabinet")!.recommended = true;
    variants.find((v) => v.id === "direct")!.recommended = false;
  }

  return variants;
}

export function formatMessageRecap(setup: CampaignSetup | undefined): string {
  const text = setup?.positioning?.trim();
  if (!text) return "—";
  if (text.length <= MESSAGE_MAX_LENGTH) return `« ${text} »`;
  const short = clampMessage(text, MESSAGE_MAX_LENGTH - 3).replace(/\.$/, "…");
  return `« ${short} »`;
}

export function formatMessageAdaptationsRecap(setup: CampaignSetup | undefined): RiverMessageAdaptation[] {
  return resolveMessageAdaptations(setup);
}

function landingTitleFromCore(core: string, context?: MessageCopyContext): string {
  const input = resolveMessageCopyContext(core, context);
  if (input) return buildMessageCopyBundle(input).landingTitle;

  const product = context?.productName?.trim() || productFromCore(core);
  const body = capitalizeSentence(trimToCompletePhrase(messageBodyFromCore(core), 50));
  if (product && body.length >= 8) return formatHeadline(`${product} : ${body}`);
  return formatHeadline(body || core);
}

function legacyAdaptCoreForChannel(
  core: string,
  channel: ExtendedChannelKey,
  variant: "primary" | "support",
): string {
  const snippet = capitalizeSentence(shortCoreSnippet(core, variant === "support" ? 55 : 70));

  if (channel === "seo") {
    return clampMessage(
      variant === "support"
        ? `Guide : ${snippet}`
        : `Comment ${snippet.charAt(0).toLowerCase()}${snippet.slice(1)} ?`,
      100,
    );
  }
  if (channel === "referral" || channel === "linkedin") {
    return clampMessage(
      variant === "support"
        ? `À recommander : ${snippet}`
        : `Vous connaissez quelqu'un concerné ? ${snippet}.`,
      100,
    );
  }
  if (channel === "google" || channel === "meta" || channel === "tiktok") {
    const adSnippet = capitalizeSentence(shortCoreSnippet(core, variant === "support" ? 40 : 50));
    return clampMessage(adSnippet, 80);
  }
  if (channel === "cold_email") {
    return clampMessage(`Objet : ${snippet}`, 90);
  }
  return clampMessage(snippet, 95);
}

export function deriveMessageAdaptations(
  core: string,
  primaryChannel: ExtendedChannelKey,
  supportChannels: ExtendedChannelKey[] = [],
  context?: MessageCopyContext,
): RiverMessageAdaptation[] {
  const normalized = core.trim();
  if (!normalized) return [];

  const input = resolveMessageCopyContext(normalized, context);
  const bundle = input ? buildMessageCopyBundle(input) : null;

  const adaptations: RiverMessageAdaptation[] = [
    {
      channel: "landing",
      label: "Site / landing",
      text: bundle?.landingTitle ?? landingTitleFromCore(normalized, context),
    },
    {
      channel: primaryChannel,
      label: getChannelLabel(primaryChannel),
      text: bundle
        ? channelAdaptationText(bundle, primaryChannel, "primary")
        : legacyAdaptCoreForChannel(normalized, primaryChannel, "primary"),
    },
  ];

  const support = supportChannels.find((c) => c !== primaryChannel);
  if (support) {
    adaptations.push({
      channel: support,
      label: getChannelLabel(support),
      text: bundle
        ? channelAdaptationText(bundle, support, "support")
        : legacyAdaptCoreForChannel(normalized, support, "support"),
    });
  }

  return adaptations;
}

export function resolveMessageAdaptations(
  setup: CampaignSetup | undefined,
  fallback?: {
    positioning?: string;
    primaryChannel?: ExtendedChannelKey;
    supportChannels?: ExtendedChannelKey[];
    productName?: string;
    who?: string;
    pain?: string;
  },
): RiverMessageAdaptation[] {
  const saved = setup?.foundationsRiver?.messageAdaptations;
  if (saved?.length) return saved;

  const core = setup?.positioning?.trim() ?? fallback?.positioning?.trim();
  const primary = setup?.primaryChannel ?? fallback?.primaryChannel;
  if (!core || !primary) return [];

  const who = setup?.icpStructured?.segment?.trim() ?? fallback?.who;
  const pain = setup?.icpStructured?.pain?.trim() ?? fallback?.pain;

  return deriveMessageAdaptations(
    core,
    primary,
    setup?.foundationsRiver?.supportChannelKeys ?? fallback?.supportChannels ?? [],
    {
      productName: fallback?.productName,
      who,
      pain,
    },
  );
}

export function buildMessageDraft(
  project: UserProject,
  opportunity: Opportunity,
  audience: FoundationsRiverAudienceDraft,
  goal?: FoundationsRiverGoalDraft,
): FoundationsRiverMessageDraft {
  const setup = project.campaignSetup;
  const productName = project.productName ?? opportunity.name;
  const confirmed = Boolean(setup?.foundationsRiver?.messageConfirmedAt);
  const pain =
    audience.pain.trim() ||
    audiencePainFromOpportunity(opportunity);
  const who = audience.who.trim() || audienceWhoFromOpportunity(opportunity);

  const primaryChannel = goal?.channel ?? setup?.primaryChannel ?? "linkedin";
  const supportChannels =
    goal?.supportChannels ?? setup?.foundationsRiver?.supportChannelKeys ?? [];

  const variants = generateMessageVariants({
    productName,
    who,
    pain,
    goalStrategyId: goal?.selectedStrategyId ?? setup?.foundationsRiver?.goalStrategyId,
  });

  const copyContext: MessageCopyContext = { productName, who, pain };

  if (confirmed && setup?.positioning?.trim()) {
    const saved = setup.positioning.trim();
    const match = variants.find((v) => v.text === saved);
    const selectedVariantId = match?.id ?? variants.find((v) => v.recommended)?.id ?? "direct";
    return {
      variants,
      selectedVariantId,
      positioning: saved,
      adaptations: resolveMessageAdaptations(setup, {
        positioning: saved,
        primaryChannel,
        supportChannels,
        productName,
        who,
        pain,
      }),
    };
  }

  const selected = variants.find((v) => v.recommended) ?? variants[0]!;
  return {
    variants,
    selectedVariantId: selected.id,
    positioning: selected.text,
    adaptations: deriveMessageAdaptations(
      selected.text,
      primaryChannel,
      supportChannels,
      copyContext,
    ),
  };
}

/** Format admin legacy produit par recommendIcpSummary / migrate-v2. */
export function isLegacyIcpSummaryText(text: string | undefined): boolean {
  if (!text?.trim()) return false;
  return text.includes(" — secteur ") && text.includes("Problème :");
}

function firstSentence(text: string): string {
  const trimmed = text.trim();
  const match = trimmed.match(/^[^.!?]+[.!?]?/);
  return match?.[0]?.trim() ?? trimmed;
}

function audienceWhoFromOpportunity(opportunity: Opportunity): string {
  return (
    opportunity.targetClient?.trim() ||
    (opportunity.pitch?.trim() ? firstSentence(opportunity.pitch) : "") ||
    opportunity.name
  );
}

function audiencePainFromOpportunity(opportunity: Opportunity): string {
  return (
    opportunity.foreignMarketProfile?.problemSolved?.trim() ||
    opportunity.pitch?.trim() ||
    ""
  );
}

/** Troncature douce pour l'affichage (valeur complète conservée en édition). */
export function truncateAtSentence(text: string, maxLen = 140): string {
  const trimmed = text.trim();
  if (trimmed.length <= maxLen) return trimmed;
  const slice = trimmed.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxLen * 0.6 ? slice.slice(0, lastSpace) : slice;
  return `${cut.trim()}…`;
}

/** Masque le pain si redondant avec who (après normalisation). */
export function shouldHideAudiencePain(who: string, pain: string): boolean {
  const w = who.trim().toLowerCase();
  const p = pain.trim().toLowerCase();
  if (!w || !p) return !p;
  if (w === p) return true;
  if (w.includes(p) || p.includes(w)) return true;
  const wPrefix = w.slice(0, Math.min(40, w.length));
  return wPrefix.length >= 20 && p.startsWith(wPrefix);
}

export function formatAudienceRecap(
  setup: CampaignSetup | undefined,
  opportunity: Opportunity,
): string {
  const segment = setup?.icpStructured?.segment?.trim();
  const structuredPain = setup?.icpStructured?.pain?.trim();
  const icpSummary = setup?.icpSummary?.trim();

  if (segment && !isLegacyIcpSummaryText(segment)) {
    return structuredPain ? `${segment} — ${structuredPain}` : segment;
  }
  if (icpSummary && !isLegacyIcpSummaryText(icpSummary)) {
    return icpSummary;
  }

  const who = audienceWhoFromOpportunity(opportunity);
  const pain = audiencePainFromOpportunity(opportunity);
  return pain ? `${who} — ${pain}` : who;
}

export function buildAudienceDraft(
  project: UserProject,
  opportunity: Opportunity,
): FoundationsRiverAudienceDraft {
  const setup = project.campaignSetup;
  const confirmed = Boolean(setup?.foundationsRiver?.audienceConfirmedAt);
  const segment = setup?.icpStructured?.segment?.trim();
  const structuredPain = setup?.icpStructured?.pain?.trim();

  let who: string;
  let pain: string;

  if (confirmed && segment && !isLegacyIcpSummaryText(segment)) {
    who = segment;
    pain = structuredPain ?? audiencePainFromOpportunity(opportunity);
  } else {
    who = audienceWhoFromOpportunity(opportunity);
    pain = audiencePainFromOpportunity(opportunity);

    if (!opportunity.targetClient?.trim() && segment && !isLegacyIcpSummaryText(segment)) {
      who = segment;
    }
    if (
      !opportunity.foreignMarketProfile?.problemSolved?.trim() &&
      !opportunity.pitch?.trim() &&
      structuredPain &&
      !isLegacyIcpSummaryText(structuredPain)
    ) {
      pain = structuredPain;
    }
  }

  const icpSummary = setup?.icpSummary?.trim() || recommendIcpSummary(opportunity);
  return { who, pain, icpSummary };
}

export function buildChannelOptions(
  opportunity: Opportunity,
  stage: AcquisitionStage,
  selected?: ExtendedChannelKey,
): { key: ExtendedChannelKey; label: string }[] {
  const fromFiche = opportunity.acquisition
    .map((tab) => ({
      key: resolveExtendedChannelKey(tab.title),
      label: getChannelLabel(resolveExtendedChannelKey(tab.title)),
    }))
    .filter((c) => isChannelAllowedForStage(stage, c.key));

  const seen = new Set<ExtendedChannelKey>();
  const merged: { key: ExtendedChannelKey; label: string }[] = [];
  for (const c of fromFiche) {
    if (seen.has(c.key)) continue;
    seen.add(c.key);
    merged.push(c);
  }

  if (selected && !seen.has(selected)) {
    merged.unshift({ key: selected, label: getChannelLabel(selected) });
  }

  return merged.slice(0, 6);
}

const CONVERSATION_CHANNELS = new Set<ExtendedChannelKey>([
  "linkedin",
  "referral",
  "cold_email",
]);

/** Libellé humain de la métrique, adapté au canal. */
export function formatGoalMetricPhrase(
  metric: CampaignSmartGoal["metric"],
  channel: ExtendedChannelKey,
): string {
  if (metric === "conversations") return "conversations";
  if (metric === "signups" && channel === "seo") return "visites qualifiées sur votre site";
  if (metric === "signups") return "inscriptions";
  if (metric === "customers") return "clients";
  return "€ MRR";
}

export function goalDefaultsForChannel(
  channel: ExtendedChannelKey,
  stage: AcquisitionStage,
  clientsFromScenario?: number,
): Pick<FoundationsRiverGoalDraft, "metric" | "horizonDays" | "targetValue"> {
  const scenarioTarget = clientsFromScenario
    ? Math.min(10, Math.max(3, clientsFromScenario))
    : 10;

  if (channel === "seo") {
    return {
      metric: "signups",
      horizonDays: 30,
      targetValue: Math.min(30, Math.max(15, scenarioTarget * 3)),
    };
  }
  if (CONVERSATION_CHANNELS.has(channel)) {
    return {
      metric: "conversations",
      horizonDays: 14,
      targetValue: scenarioTarget,
    };
  }
  if (channel === "meta" || channel === "google" || channel === "tiktok") {
    return {
      metric: "signups",
      horizonDays: 30,
      targetValue: Math.min(30, Math.max(10, scenarioTarget * 2)),
    };
  }

  const stageGoal = defaultSmartGoalForStage(stage);
  return {
    metric: stageGoal.metric,
    horizonDays: stageGoal.horizonDays,
    targetValue: stageGoal.targetValue,
  };
}

export function formatGoalLabel(
  draft: Pick<
    FoundationsRiverGoalDraft,
    "targetValue" | "metric" | "horizonDays" | "channel" | "channelLabel"
  >,
): string {
  const phrase = formatGoalMetricPhrase(draft.metric, draft.channel);
  return `${draft.targetValue} ${phrase} via ${draft.channelLabel} · ${draft.horizonDays} jours`;
}

export function formatStrategyRecap(strategy: RiverGoalStrategy): string {
  const primary = getChannelLabel(strategy.primaryChannel);
  if (strategy.supportChannels.length === 0) {
    return `${strategy.title} · ${primary}`;
  }
  const support = strategy.supportChannels.map(getChannelLabel).join(" + ");
  return `${strategy.title} · ${primary} + ${support} en parallèle`;
}

export function formatGoalRecap(setup: CampaignSetup | undefined): string {
  const strategyId = setup?.foundationsRiver?.goalStrategyId;
  const goal = setup?.smartGoal;
  if (strategyId && goal?.label) {
    return goal.label;
  }
  if (goal && setup?.primaryChannel) {
    const support = (setup.foundationsRiver?.supportChannelKeys ?? [])
      .map(getChannelLabel)
      .join(" + ");
    const primary = getChannelLabel(setup.primaryChannel);
    if (support) return `${primary} + ${support} en parallèle`;
    return goal.label || formatGoalLabel({
      targetValue: goal.targetValue,
      metric: goal.metric,
      horizonDays: goal.horizonDays,
      channel: setup.primaryChannel,
      channelLabel: primary,
    });
  }
  return "—";
}

export function adaptGoalDraftForChannel(
  draft: FoundationsRiverGoalDraft,
  channel: ExtendedChannelKey,
  stage: AcquisitionStage,
  clientsFromScenario?: number,
  keepTargetValue = false,
): FoundationsRiverGoalDraft {
  const defaults = goalDefaultsForChannel(channel, stage, clientsFromScenario);
  const targetValue = keepTargetValue ? draft.targetValue : defaults.targetValue;
  const channelLabel = getChannelLabel(channel);
  const next: FoundationsRiverGoalDraft = {
    channel,
    channelLabel,
    metric: defaults.metric,
    horizonDays: defaults.horizonDays,
    targetValue,
    label: "",
  };
  next.label = formatGoalLabel(next);
  return next;
}

export function buildRiverGoalStrategies(
  channelOptions: { key: ExtendedChannelKey; label: string }[],
  opportunity?: Opportunity,
): RiverGoalStrategy[] {
  const keys = new Set(channelOptions.map((c) => c.key));
  if (opportunity) {
    for (const tab of opportunity.acquisition) {
      keys.add(resolveExtendedChannelKey(tab.title));
    }
  }
  const has = (k: ExtendedChannelKey) => keys.has(k);
  const strategies: RiverGoalStrategy[] = [];

  if (has("referral") || has("linkedin")) {
    strategies.push({
      id: "warm",
      title: "Partir de mon réseau",
      subtitle: has("referral")
        ? "Recommandations et contacts chauds"
        : "LinkedIn et contacts directs",
      hint: "Le plus simple pour un premier retour — sans budget pub.",
      primaryChannel: has("referral") ? "referral" : "linkedin",
      supportChannels:
        has("referral") && has("linkedin") ? (["linkedin"] as ExtendedChannelKey[]) : [],
    });
  }

  if (has("seo")) {
    strategies.push({
      id: "trust",
      title: "Se faire connaître",
      subtitle: has("referral")
        ? "Visibilité (SEO) + recommandations en parallèle"
        : "Visibilité organique (SEO)",
      hint: "On installe la confiance pendant que le réseau travaille pour vous.",
      primaryChannel: "seo",
      supportChannels: has("referral") ? (["referral"] as ExtendedChannelKey[]) : [],
    });
  }

  const paidChannel = (["google", "meta"] as const).find(has);
  if (paidChannel) {
    const paidLabel = paidChannel === "google" ? "Google Ads (SEA)" : getChannelLabel("meta");
    strategies.push({
      id: "accelerate",
      title: "Accélérer avec de la pub",
      subtitle: has("referral")
        ? `${paidLabel} + recommandations en parallèle`
        : paidLabel,
      hint: "Un coup de boost payant — on garde le réseau actif en même temps.",
      primaryChannel: paidChannel,
      supportChannels: has("referral") ? (["referral"] as ExtendedChannelKey[]) : [],
    });
  }

  if (strategies.length === 0 && channelOptions[0]) {
    const first = channelOptions[0];
    strategies.push({
      id: "warm",
      title: `Commencer par ${first.label}`,
      subtitle: "Première approche suggérée pour votre fiche Idée",
      hint: "On ajuste les chiffres et le détail plus tard.",
      primaryChannel: first.key,
      supportChannels: [],
    });
  }

  const trust = strategies.find((s) => s.id === "trust");
  const accelerate = strategies.find((s) => s.id === "accelerate");
  if (accelerate) {
    accelerate.recommended = true;
  } else if (trust) {
    trust.recommended = true;
  } else if (strategies[0]) {
    strategies[0].recommended = true;
  }

  return strategies;
}

export function resolveGoalFromStrategy(
  strategy: RiverGoalStrategy,
  stage: AcquisitionStage,
  clientsFromScenario?: number,
): Omit<FoundationsRiverGoalDraft, "strategies" | "selectedStrategyId"> {
  const defaults = goalDefaultsForChannel(strategy.primaryChannel, stage, clientsFromScenario);
  const channelLabel = getChannelLabel(strategy.primaryChannel);
  const supportChannelLabels = strategy.supportChannels.map(getChannelLabel);
  const recapLabel = formatStrategyRecap(strategy);
  const label = `${strategy.title} — ${strategy.subtitle}`;

  return {
    label,
    recapLabel,
    channel: strategy.primaryChannel,
    channelLabel,
    supportChannels: strategy.supportChannels,
    supportChannelLabels,
    metric: defaults.metric,
    horizonDays: defaults.horizonDays,
    targetValue: defaults.targetValue,
  };
}

export function strategyToSmartGoal(
  strategy: RiverGoalStrategy,
  stage: AcquisitionStage,
  clientsFromScenario?: number,
): CampaignSmartGoal {
  const resolved = resolveGoalFromStrategy(strategy, stage, clientsFromScenario);
  return {
    label: resolved.label,
    metric: resolved.metric,
    targetValue: resolved.targetValue,
    horizonDays: resolved.horizonDays,
    setAt: new Date().toISOString(),
  };
}

export function buildGoalDraft(
  project: UserProject,
  opportunity: Opportunity,
  stage: AcquisitionStage,
  channelOptions: { key: ExtendedChannelKey; label: string }[],
): FoundationsRiverGoalDraft {
  const setup = project.campaignSetup;
  const confirmed = Boolean(setup?.foundationsRiver?.goalConfirmedAt);
  const clients = opportunity.financialScenarios?.find((s) => s.name === "Réaliste")?.clients;
  const strategies = buildRiverGoalStrategies(channelOptions, opportunity);

  const savedId = setup?.foundationsRiver?.goalStrategyId;
  const selectedStrategy =
    strategies.find((s) => s.id === savedId) ??
    strategies.find((s) => s.recommended) ??
    strategies[0]!;

  if (confirmed && setup?.smartGoal && setup.primaryChannel && savedId) {
    const strategy =
      strategies.find((s) => s.id === savedId) ??
      ({
        id: savedId,
        title: setup.smartGoal.label.split(" — ")[0] ?? "Objectif",
        subtitle: setup.smartGoal.label.split(" — ").slice(1).join(" — ") || "",
        hint: "",
        primaryChannel: setup.primaryChannel,
        supportChannels: setup.foundationsRiver?.supportChannelKeys ?? [],
      } satisfies RiverGoalStrategy);

    const resolved = resolveGoalFromStrategy(strategy, stage, clients);
    return {
      strategies,
      selectedStrategyId: strategy.id,
      ...resolved,
      label: setup.smartGoal.label,
      targetValue: setup.smartGoal.targetValue,
      horizonDays: setup.smartGoal.horizonDays,
      metric: setup.smartGoal.metric,
    };
  }

  const resolved = resolveGoalFromStrategy(selectedStrategy, stage, clients);
  return {
    strategies,
    selectedStrategyId: selectedStrategy.id,
    ...resolved,
  };
}

export function buildFoundationsRiverDraft(
  project: UserProject,
  opportunity: Opportunity,
  stage: AcquisitionStage,
): FoundationsRiverDraft {
  const setup = project.campaignSetup;
  const audience = buildAudienceDraft(project, opportunity);
  const channelOptions = buildChannelOptions(opportunity, stage, setup?.primaryChannel);
  const goal = buildGoalDraft(project, opportunity, stage, channelOptions);
  const message = buildMessageDraft(project, opportunity, audience, goal);

  return {
    audience,
    goal,
    message,
    channelOptions,
  };
}

export function resolveFoundationsRiverStop(project: UserProject): FoundationsRiverStopId {
  const setup = project.campaignSetup;
  const river = setup?.foundationsRiver;

  if (isLegacyFoundationsDataComplete(setup) && !river?.startedAt) {
    return "dock";
  }

  if (!river?.startedAt) return "intro";
  if (!river.audienceConfirmedAt) return "audience";
  if (!river.goalConfirmedAt) return "goal";
  if (!river.messageConfirmedAt) return "message";
  return "dock";
}

export function audienceToStructured(
  payload: FoundationsRiverAudiencePayload,
): CampaignIcpStructured {
  return {
    segment: payload.who.trim(),
    pain: payload.pain.trim(),
  };
}

export function goalPayloadToSmartGoal(
  draft: Pick<
    FoundationsRiverGoalDraft,
    "label" | "metric" | "targetValue" | "horizonDays"
  >,
): CampaignSmartGoal {
  return {
    label: draft.label,
    metric: draft.metric,
    targetValue: draft.targetValue,
    horizonDays: draft.horizonDays,
    setAt: new Date().toISOString(),
  };
}

export function deriveStageAndMotionForGoal(
  project: UserProject,
  opportunity: Opportunity,
  channel: ExtendedChannelKey,
): { stage: AcquisitionStage; motion: ReturnType<typeof recommendGtmMotion>; profile: ReturnType<typeof profileFromStage> } {
  const stage = recommendStageForProject(
    { ...project, campaignSetup: { ...project.campaignSetup!, primaryChannel: channel } },
    opportunity,
  );
  const setup = project.campaignSetup;
  const motion = recommendGtmMotion(stage, channel, setup);
  const profile = profileFromStage(stage);
  return { stage, motion, profile };
}

export function getFoundationsRiverProgressIndex(stop: FoundationsRiverStopId): number {
  switch (stop) {
    case "audience":
      return 0;
    case "goal":
      return 1;
    case "message":
      return 2;
    default:
      return -1;
  }
}
