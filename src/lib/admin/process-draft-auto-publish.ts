import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { evaluateAutoPublish, loadPublishSettings } from "@/lib/admin/publish-policy";
import type { DedupMatch } from "@/lib/admin/sourcing-dedup";
import { publishDraft } from "@/lib/admin/publish-draft";
import { writeAuditLog } from "@/lib/admin/audit";
import type { Opportunity } from "@/types/opportunity";

export type DraftAutoPublishResult = {
  draftId: string;
  slug: string;
  published: boolean;
  matchedRuleId: string | null;
  reasons: string[];
};

export async function processDraftsAutoPublish(opts: {
  draftIds: string[];
  runPremium: boolean;
  triggeredBy?: string;
}): Promise<DraftAutoPublishResult[]> {
  const settings = await loadPublishSettings();
  if (!settings.auto_publish_enabled) {
    return opts.draftIds.map((id) => ({
      draftId: id,
      slug: "",
      published: false,
      matchedRuleId: null,
      reasons: ["Auto-publication désactivée"],
    }));
  }

  const admin = createAdminClient();
  const results: DraftAutoPublishResult[] = [];

  for (const draftId of opts.draftIds) {
    const { data: draft } = await admin
      .from("opportunity_drafts")
      .select("*")
      .eq("id", draftId)
      .maybeSingle();

    if (!draft || draft.status !== "pending") {
      results.push({
        draftId,
        slug: (draft?.slug as string) ?? "",
        published: false,
        matchedRuleId: null,
        reasons: ["Brouillon absent ou déjà traité"],
      });
      continue;
    }

    const opp = draft.payload as Opportunity;
    const dedup = (draft.dedup_matches ?? []) as DedupMatch[];
    const evaluation = evaluateAutoPublish(opp, dedup, settings, opts.runPremium, {
      sourceVerified: draft.source_verified === true,
      factConfidence: (draft.fact_confidence as "low" | "medium" | "high" | null) ?? null,
    });

    if (!evaluation.shouldPublish) {
      results.push({
        draftId,
        slug: opp.slug,
        published: false,
        matchedRuleId: null,
        reasons: evaluation.reasons,
      });
      continue;
    }

    try {
      const pub = await publishDraft(draftId, opts.triggeredBy ?? "system", {
        setWeeklyPick: evaluation.setWeeklyPick,
      });
      await admin
        .from("opportunity_drafts")
        .update({ auto_publish_rule_id: evaluation.matchedRuleId })
        .eq("id", draftId);

      await writeAuditLog({
        actorId: opts.triggeredBy ?? null,
        action: "draft.auto_publish",
        targetType: "opportunity_draft",
        targetId: draftId,
        metadata: {
          ruleId: evaluation.matchedRuleId,
          ruleLabel: evaluation.matchedRuleLabel,
          slug: pub.slug,
        },
      });

      results.push({
        draftId,
        slug: pub.slug,
        published: true,
        matchedRuleId: evaluation.matchedRuleId,
        reasons: evaluation.reasons,
      });
    } catch (err) {
      results.push({
        draftId,
        slug: opp.slug,
        published: false,
        matchedRuleId: evaluation.matchedRuleId,
        reasons: [err instanceof Error ? err.message : String(err)],
      });
    }
  }

  return results;
}
