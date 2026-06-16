import type { DedupMatch } from "@/lib/admin/sourcing-dedup.shared";
import type { Opportunity } from "@/types/opportunity";

export type AutoPublishRuleConditions = {
  minScore?: number;
  maxDedupMatches?: number;
  requirePremium?: boolean;
  allowedSectors?: string[] | null;
  allowedOriginCountries?: string[] | null;
  requireSourceVerified?: boolean;
  minConfidence?: "low" | "medium" | "high";
};

export type AutoPublishRule = {
  id: string;
  enabled: boolean;
  label: string;
  conditions: AutoPublishRuleConditions;
  actions: {
    publish: boolean;
    setWeeklyPick?: boolean;
  };
};

export type SourcingSettings = {
  id: string;
  default_mode: "draft" | "direct";
  auto_publish_enabled: boolean;
  auto_publish_rules: AutoPublishRule[];
  notify_on_pending: boolean;
  monthly_cost_cap_usd: number | null;
  discovery_model: string | null;
  structure_model: string | null;
  updated_by: string | null;
  updated_at: string;
};

export const RULE_PRESETS: AutoPublishRule[] = [
  {
    id: "score-80-no-dedup",
    enabled: true,
    label: "Score >= 80 sans doublon",
    conditions: { minScore: 80, maxDedupMatches: 0 },
    actions: { publish: true, setWeeklyPick: false },
  },
  {
    id: "score-90",
    enabled: false,
    label: "Score >= 90",
    conditions: { minScore: 90 },
    actions: { publish: true, setWeeklyPick: false },
  },
  {
    id: "premium-score-75",
    enabled: false,
    label: "Premium + score >= 75 sans doublon",
    conditions: { minScore: 75, maxDedupMatches: 0, requirePremium: true },
    actions: { publish: true, setWeeklyPick: false },
  },
];

export const DEFAULT_PUBLISH_SETTINGS: SourcingSettings = {
  id: "default",
  default_mode: "direct",
  auto_publish_enabled: false,
  auto_publish_rules: [],
  notify_on_pending: false,
  monthly_cost_cap_usd: null,
  discovery_model: null,
  structure_model: null,
  updated_by: null,
  updated_at: new Date().toISOString(),
};

export type AutoPublishEvaluation = {
  shouldPublish: boolean;
  matchedRuleId: string | null;
  matchedRuleLabel: string | null;
  setWeeklyPick: boolean;
  reasons: string[];
};

function hasPremiumFields(opp: Opportunity): boolean {
  return !!(
    opp.frenchCompetitors?.length ||
    opp.launchTimeline?.length ||
    opp.emailTemplates?.length
  );
}

function confidenceRank(c: "low" | "medium" | "high"): number {
  return c === "high" ? 3 : c === "medium" ? 2 : 1;
}

export function evaluateAutoPublish(
  opp: Opportunity,
  dedupMatches: DedupMatch[],
  settings: SourcingSettings,
  runPremium: boolean,
  extras?: {
    sourceVerified?: boolean;
    factConfidence?: "low" | "medium" | "high" | null;
  }
): AutoPublishEvaluation {
  const reasons: string[] = [];
  if (!settings.auto_publish_enabled) {
    return {
      shouldPublish: false,
      matchedRuleId: null,
      matchedRuleLabel: null,
      setWeeklyPick: false,
      reasons: ["Auto-publication désactivée"],
    };
  }

  const activeRules = settings.auto_publish_rules.filter((r) => r.enabled && r.actions.publish);
  if (activeRules.length === 0) {
    return {
      shouldPublish: false,
      matchedRuleId: null,
      matchedRuleLabel: null,
      setWeeklyPick: false,
      reasons: ["Aucune règle active"],
    };
  }

  for (const rule of activeRules) {
    const c = rule.conditions;

    if (c.minScore != null && opp.scores.opportunity < c.minScore) {
      continue;
    }
    if (c.maxDedupMatches != null && dedupMatches.length > c.maxDedupMatches) {
      continue;
    }
    if (c.requirePremium && !runPremium && !hasPremiumFields(opp)) {
      continue;
    }
    if (c.allowedSectors?.length && !c.allowedSectors.includes(opp.sector)) {
      continue;
    }
    if (
      c.allowedOriginCountries?.length &&
      !c.allowedOriginCountries.includes(opp.originCountryCode.toUpperCase())
    ) {
      continue;
    }
    if (c.requireSourceVerified && extras?.sourceVerified !== true) {
      continue;
    }
    if (c.minConfidence && extras?.factConfidence) {
      if (confidenceRank(extras.factConfidence) < confidenceRank(c.minConfidence)) {
        continue;
      }
    }

    return {
      shouldPublish: true,
      matchedRuleId: rule.id,
      matchedRuleLabel: rule.label,
      setWeeklyPick: rule.actions.setWeeklyPick === true,
      reasons: [`Règle « ${rule.label} » appliquée`],
    };
  }

  return {
    shouldPublish: false,
    matchedRuleId: null,
    matchedRuleLabel: null,
    setWeeklyPick: false,
    reasons: reasons.length ? reasons : ["Aucune règle ne correspond"],
  };
}

export function simulateRulesOnDrafts(
  drafts: Array<{
    payload: Opportunity;
    score: number | null;
    dedup_matches: DedupMatch[];
  }>,
  settings: SourcingSettings,
  runPremium: boolean
): { total: number; wouldPublish: number; matches: { slug: string; ruleId: string | null }[] } {
  const matches: { slug: string; ruleId: string | null }[] = [];
  let wouldPublish = 0;
  for (const d of drafts) {
    const opp = d.payload;
    const eval_ = evaluateAutoPublish(opp, d.dedup_matches ?? [], settings, runPremium);
    if (eval_.shouldPublish) wouldPublish += 1;
    matches.push({ slug: opp.slug, ruleId: eval_.matchedRuleId });
  }
  return { total: drafts.length, wouldPublish, matches };
}
