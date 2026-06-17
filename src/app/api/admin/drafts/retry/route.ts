import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { CostTracker } from "@/lib/sourcing/openrouter";
import { structureLead } from "@/lib/sourcing/structure";
import { assembleOpportunity } from "@/lib/sourcing/assemble";
import {
  analyticalSchema,
  formatZodError,
  opportunityRawSchema,
  type FactualLead,
} from "@/lib/sourcing/schema";
import { loadExistingForDedup, findDedupMatches } from "@/lib/admin/sourcing-dedup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "editor", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { id } = body as { id?: string };

  if (!id) {
    return NextResponse.json({ error: "id requis" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: draft, error } = await admin
    .from("opportunity_drafts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !draft) {
    return NextResponse.json({ error: "Brouillon introuvable" }, { status: 404 });
  }

  const lead = (draft.source_lead ?? null) as FactualLead | null;
  if (!lead) {
    return NextResponse.json(
      { error: "source_lead absent — relance Sonar requise" },
      { status: 400 }
    );
  }

  try {
    const dedupIndex = await loadExistingForDedup(admin);
    const tracker = new CostTracker();
    const raw = await structureLead(lead, tracker);

    const analytical = analyticalSchema.safeParse(raw);
    if (!analytical.success) {
      return NextResponse.json(
        { error: formatZodError(analytical.error) },
        { status: 422 }
      );
    }

    const opportunity = assembleOpportunity(lead, analytical.data, {
      dbSlugs: dedupIndex.slugs,
      batchSlugs: new Set<string>(),
    });

    const validated = opportunityRawSchema.safeParse(opportunity);
    if (!validated.success) {
      return NextResponse.json(
        { error: formatZodError(validated.error) },
        { status: 422 }
      );
    }

    const dedupMatches = findDedupMatches(opportunity, dedupIndex);
    const { data: updated, error: updateError } = await admin
      .from("opportunity_drafts")
      .update({
        payload: opportunity as unknown as Record<string, unknown>,
        slug: opportunity.slug,
        name: opportunity.name,
        score: opportunity.scores.opportunity,
        dedup_matches: dedupMatches as unknown as Record<string, unknown>[],
        status: "pending",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();

    if (updateError) throw new Error(updateError.message);

    await withAdminAudit(auth.ctx, {
      action: "draft.retry",
      targetType: "opportunity_draft",
      targetId: id,
      metadata: { cost: tracker.formatCostLine() },
    });

    return NextResponse.json({ draft: updated });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
