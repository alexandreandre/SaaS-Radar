import "server-only";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { toOpportunityRow } from "@/lib/supabase/mappers";
import type { Opportunity } from "@/types/opportunity";
import { promoteWeeklyPick, revalidateOpportunitiesCache } from "@/lib/admin/weekly-pick";
import { syncWorldMarketOnPublish } from "@/lib/admin/world-markets-sync";
import {
  hasBlockingDedup,
  type DedupMatch,
} from "@/lib/admin/sourcing-dedup.shared";

export type PublishDraftOptions = {
  setWeeklyPick?: boolean;
  force?: boolean;
};

export class DedupConflictError extends Error {
  constructor(public readonly matches: DedupMatch[]) {
    super(
      `Collision dedup détectée (${matches.map((m) => m.type).join(", ")}) — utilisez force=true pour publier quand même`
    );
    this.name = "DedupConflictError";
  }
}

export async function publishDraft(
  draftId: string,
  reviewerId: string,
  options: PublishDraftOptions = {}
): Promise<{ slug: string }> {
  const admin = createAdminClient();
  const { data: draft, error } = await admin
    .from("opportunity_drafts")
    .select("*")
    .eq("id", draftId)
    .maybeSingle();

  if (error || !draft) throw new Error("Brouillon introuvable");
  if (draft.status === "published") throw new Error("Déjà publié");

  const dedupMatches = (draft.dedup_matches ?? []) as DedupMatch[];
  if (!options.force && hasBlockingDedup(dedupMatches)) {
    throw new DedupConflictError(dedupMatches);
  }

  const payload = draft.payload as Opportunity;
  const publishedAt = new Date().toISOString();
  const enrichedPayload: Opportunity = {
    ...payload,
    ...(draft.source_verified ? { sourceVerified: true } : {}),
  };

  const row = {
    ...toOpportunityRow(enrichedPayload),
    status: "published",
    published_at: publishedAt,
    weekly_pick: options.setWeeklyPick === true,
  };

  const { error: upsertError } = await admin
    .from("opportunities")
    .upsert(row, { onConflict: "slug" });
  if (upsertError) throw new Error(upsertError.message);

  if (options.setWeeklyPick) {
    await promoteWeeklyPick(payload.slug);
  }

  await syncWorldMarketOnPublish(enrichedPayload);

  await admin
    .from("opportunity_drafts")
    .update({
      status: "published",
      reviewed_by: reviewerId,
      reviewed_at: publishedAt,
      updated_at: publishedAt,
    })
    .eq("id", draftId);

  revalidateOpportunitiesCache();
  revalidatePath("/opportunities/[slug]", "page");

  return { slug: payload.slug };
}

export async function rejectDraft(
  draftId: string,
  reviewerId: string,
  notes?: string,
  rejectionReason?: string
): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from("opportunity_drafts")
    .update({
      status: "rejected",
      review_notes: notes ?? null,
      rejection_reason: rejectionReason ?? notes ?? null,
      reviewed_by: reviewerId,
      reviewed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId);
}

export async function publishDraftDespiteDedup(
  draftId: string,
  reviewerId: string,
  options: PublishDraftOptions = {}
): Promise<{ slug: string }> {
  return publishDraft(draftId, reviewerId, { ...options, force: true });
}
