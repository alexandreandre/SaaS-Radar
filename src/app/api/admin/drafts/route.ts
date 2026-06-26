import { NextResponse } from "next/server";
import { requireAdminApi, withAdminAudit } from "@/lib/admin/guard";
import { createAdminClient } from "@/lib/supabase/admin";
import { publishDraft, rejectDraft, DedupConflictError } from "@/lib/admin/publish-draft";
import { findDedupMatches, loadExistingForDedup } from "@/lib/admin/sourcing-dedup";
import type { Opportunity } from "@/types/opportunity";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID_STATUSES = new Set(["pending", "published", "rejected", "approved"]);
const VALID_SORT = new Set(["created_at", "score"]);

export async function GET(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "viewer" });
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "pending";
  const country = url.searchParams.get("country");
  const minScoreParam = url.searchParams.get("minScore");
  const needsReview = url.searchParams.get("needsReview");
  const sourceRunId = url.searchParams.get("sourceRunId");
  const sort = url.searchParams.get("sort") ?? "created_at";
  const sortDir = url.searchParams.get("sortDir") === "asc" ? "asc" : "desc";
  const limitParam = url.searchParams.get("limit");
  const offsetParam = url.searchParams.get("offset");

  if (!VALID_STATUSES.has(status)) {
    return NextResponse.json({ error: "status invalide" }, { status: 400 });
  }

  const sortCol = VALID_SORT.has(sort) ? sort : "created_at";
  const limit = Math.min(Math.max(Number.parseInt(limitParam ?? "50", 10) || 50, 1), 100);
  const offset = Math.max(Number.parseInt(offsetParam ?? "0", 10) || 0, 0);

  const admin = createAdminClient();
  let query = admin.from("opportunity_drafts").select("*", { count: "exact" }).eq("status", status);

  if (country) {
    query = query.eq("payload->>originCountryCode", country.toUpperCase());
  }

  if (minScoreParam != null && minScoreParam !== "") {
    const minScore = Number.parseInt(minScoreParam, 10);
    if (Number.isFinite(minScore)) {
      query = query.gte("score", minScore);
    }
  }

  if (needsReview === "true") {
    query = query.eq("needs_review", true);
  }

  if (sourceRunId) {
    query = query.eq("source_run_id", sourceRunId);
  }

  query = query
    .order(sortCol, { ascending: sortDir === "asc", nullsFirst: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const dedupIndex = await loadExistingForDedup(admin);
  const drafts = (data ?? []).map((row) => {
    const record = row as Record<string, unknown>;
    const payload = record.payload as Opportunity;
    const live_dedup_matches = findDedupMatches(payload, dedupIndex, {
      excludeDraftId: String(record.id),
      excludeSlug: String(record.slug ?? payload.slug ?? ""),
    });
    return { ...record, live_dedup_matches };
  });

  return NextResponse.json({
    drafts,
    total: count ?? 0,
    limit,
    offset,
  });
}

export async function PATCH(request: Request) {
  const auth = await requireAdminApi(request, { minimumRole: "editor", requireEdit: true });
  if (auth instanceof NextResponse) return auth;

  const body = await request.json();
  const { id, action, notes, payload, setWeeklyPick, force, rejectionReason } = body as {
    id: string;
    action: "publish" | "reject" | "update";
    notes?: string;
    payload?: unknown;
    setWeeklyPick?: boolean;
    force?: boolean;
    rejectionReason?: string;
  };

  if (!id || !action) {
    return NextResponse.json({ error: "id et action requis" }, { status: 400 });
  }

  try {
    if (action === "publish") {
      try {
        const result = await publishDraft(id, auth.ctx.userId, {
          setWeeklyPick: setWeeklyPick === true,
          force: force === true,
        });
        await withAdminAudit(auth.ctx, {
          action: "draft.publish",
          targetType: "opportunity_draft",
          targetId: id,
          metadata: { ...result, force: force === true },
        });
        return NextResponse.json(result);
      } catch (err) {
        if (err instanceof DedupConflictError) {
          return NextResponse.json(
            { error: err.message, dedupMatches: err.matches, requiresForce: true },
            { status: 409 }
          );
        }
        throw err;
      }
    }

    if (action === "reject") {
      await rejectDraft(id, auth.ctx.userId, notes, rejectionReason ?? notes);
      await withAdminAudit(auth.ctx, {
        action: "draft.reject",
        targetType: "opportunity_draft",
        targetId: id,
        metadata: { notes, rejectionReason },
      });
      return NextResponse.json({ ok: true });
    }

    if (action === "update" && payload) {
      const admin = createAdminClient();
      const { data, error } = await admin
        .from("opportunity_drafts")
        .update({ payload, updated_at: new Date().toISOString() })
        .eq("id", id)
        .select("*")
        .maybeSingle();
      if (error) throw new Error(error.message);
      await withAdminAudit(auth.ctx, {
        action: "draft.update",
        targetType: "opportunity_draft",
        targetId: id,
      });
      return NextResponse.json({ draft: data });
    }

    return NextResponse.json({ error: "action invalide" }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
