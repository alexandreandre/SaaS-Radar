"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AdminTable } from "@/components/admin/admin-ui";
import { DraftPreviewPanel } from "@/components/admin/draft-preview-panel";
import { DraftReviewAlerts } from "@/components/admin/draft-review-alerts";
import { adminFetchJson, invalidateAdminCache } from "@/lib/admin/client-fetch";
import {
  draftListMeta,
  effectiveDedupMatches,
  hasPendingDraftDedup,
  normalizeDraftRow,
  type OpportunityDraftRow,
} from "@/lib/admin/draft-types.shared";
import { sectorLabels } from "@/data/opportunities";
import { canEditAdmin } from "@/lib/admin/rbac";
import { useAdminRole } from "@/contexts/admin-role-context";
import { cn } from "@/lib/utils";

type DraftsResponse = {
  drafts: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
  error?: string;
};

function formatDate(iso: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function parseApiError(json: { error?: string }, status?: number): string {
  if (status === 429 || json.error === "Rate limit exceeded") {
    return "Trop de requêtes — attendez 1 minute puis réessayez";
  }
  return json.error ?? "Erreur inconnue";
}

function DraftBadges({ draft }: { draft: OpportunityDraftRow }) {
  const dedupCount = effectiveDedupMatches(draft).length;
  const pendingDup = hasPendingDraftDedup(draft);

  return (
    <div className="flex flex-wrap gap-1">
      {draft.needs_review && (
        <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
          review
        </span>
      )}
      {draft.fact_confidence === "low" && (
        <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
          faits faibles
        </span>
      )}
      {draft.fact_confidence === "medium" && (
        <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
          faits moyens
        </span>
      )}
      {dedupCount > 0 && (
        <span
          className={cn(
            "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
            pendingDup
              ? "bg-orange-500/15 text-orange-800"
              : "bg-amber-500/10 text-amber-800"
          )}
        >
          {dedupCount} doublon{dedupCount > 1 ? "s" : ""}
          {pendingDup ? " (pending)" : ""}
        </span>
      )}
      {draft.invalid_urls.length > 0 && (
        <span className="rounded-full bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-800">
          URLs invalides
        </span>
      )}
    </div>
  );
}

export function DraftsQueueClient({
  initialDraftId,
  onRunClick,
  onDraftCountChange,
}: {
  initialDraftId?: string | null;
  onRunClick?: (runId: string) => void;
  onDraftCountChange?: (count: number) => void;
}) {
  const role = useAdminRole();
  const canEdit = canEditAdmin(role);

  const [drafts, setDrafts] = useState<OpportunityDraftRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(initialDraftId ?? null);
  const [actionLoading, setActionLoading] = useState<"publish" | "reject" | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [dedupConflict, setDedupConflict] = useState<{
    message: string;
    matches: unknown[];
  } | null>(null);
  const [rejectNotes, setRejectNotes] = useState("");
  const [showRejectForm, setShowRejectForm] = useState(false);
  const openedInitialRef = useRef(false);

  const loadDrafts = useCallback(async () => {
    setLoading(true);
    try {
      const { ok, status, data } = await adminFetchJson<DraftsResponse>(
        "/api/admin/drafts?status=pending&limit=50&sort=created_at&sortDir=desc",
        { skipCache: true }
      );
      if (!ok) throw new Error(parseApiError(data, status));
      const rows = (data.drafts ?? []).map((r) => normalizeDraftRow(r));
      setDrafts(rows);
      setTotal(data.total ?? rows.length);
      onDraftCountChange?.(data.total ?? rows.length);
      setLoadError(null);
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [onDraftCountChange]);

  useEffect(() => {
    void loadDrafts();
  }, [loadDrafts]);

  useEffect(() => {
    if (!initialDraftId || openedInitialRef.current || loading) return;
    if (drafts.some((d) => d.id === initialDraftId)) {
      setSelectedId(initialDraftId);
      openedInitialRef.current = true;
    }
  }, [initialDraftId, drafts, loading]);

  const selectedDraft = useMemo(
    () => drafts.find((d) => d.id === selectedId) ?? null,
    [drafts, selectedId]
  );

  const closeDetail = () => {
    setSelectedId(null);
    setActionError(null);
    setActionFeedback(null);
    setDedupConflict(null);
    setShowRejectForm(false);
    setRejectNotes("");
  };

  const patchDraft = async (
    action: "publish" | "reject",
    extra?: { force?: boolean; notes?: string }
  ) => {
    if (!selectedId || !canEdit) return;
    setActionLoading(action);
    setActionError(null);
    setActionFeedback(null);
    setDedupConflict(null);

    try {
      const body: Record<string, unknown> = { id: selectedId, action };
      if (action === "publish" && extra?.force) body.force = true;
      if (action === "reject") {
        body.notes = extra?.notes ?? rejectNotes;
        body.rejectionReason = extra?.notes ?? rejectNotes;
      }

      const { ok, status, data } = await adminFetchJson<{
        error?: string;
        dedupMatches?: unknown[];
        requiresForce?: boolean;
        slug?: string;
      }>("/api/admin/drafts", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (status === 409 && data.requiresForce) {
        setDedupConflict({
          message: data.error ?? "Collision dedup",
          matches: data.dedupMatches ?? [],
        });
        return;
      }

      if (!ok) throw new Error(parseApiError(data, status));

      invalidateAdminCache("/api/admin/drafts");
      invalidateAdminCache("/api/admin/sourcing/summary");

      if (action === "publish") {
        setActionFeedback(
          data.slug ? `Publié — /opportunities/${data.slug}` : "Brouillon publié"
        );
      } else {
        setActionFeedback("Brouillon rejeté");
      }

      await loadDrafts();
      setTimeout(() => closeDetail(), action === "publish" ? 1200 : 800);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    } finally {
      setActionLoading(null);
    }
  };

  if (loading && drafts.length === 0) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
        <Loader2 className="size-5 animate-spin" />
        <span className="text-sm">Chargement des brouillons…</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {total} brouillon{total !== 1 ? "s" : ""} en attente de relecture
        </p>
        <Button variant="outline" size="sm" onClick={() => void loadDrafts()} disabled={loading}>
          {loading ? "Actualisation…" : "Rafraîchir"}
        </Button>
      </div>

      {loadError && <p className="text-sm text-red-600">{loadError}</p>}

      {drafts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
          Aucun brouillon pending — lancez un sourcing en mode « Brouillon ».
        </div>
      ) : (
        <AdminTable headers={["Nom", "Score", "Pays", "Secteur", "Créé", "Run", "Signaux"]}>
          {drafts.map((draft) => {
            const meta = draftListMeta(draft);
            return (
              <tr key={draft.id} className="border-t border-border">
                <td className="px-3 py-2">
                  <button
                    type="button"
                    className="text-left font-medium text-primary hover:underline"
                    onClick={() => setSelectedId(draft.id)}
                  >
                    {draft.name}
                    <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                      {draft.slug}
                    </span>
                  </button>
                </td>
                <td className="px-3 py-2 tabular-nums">
                  {draft.score ?? draft.payload.scores?.opportunity ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs">{meta.countryCode}</td>
                <td className="px-3 py-2 text-xs">
                  {sectorLabels[meta.sector as keyof typeof sectorLabels] ?? meta.sector}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {formatDate(draft.created_at)}
                </td>
                <td className="px-3 py-2 text-xs">
                  {draft.source_run_id ? (
                    onRunClick ? (
                      <button
                        type="button"
                        className="font-mono text-primary hover:underline"
                        onClick={() => onRunClick(draft.source_run_id!)}
                      >
                        {draft.source_run_id.slice(0, 8)}…
                      </button>
                    ) : (
                      <span className="font-mono">{draft.source_run_id.slice(0, 8)}…</span>
                    )
                  ) : (
                    "—"
                  )}
                </td>
                <td className="px-3 py-2">
                  <DraftBadges draft={draft} />
                </td>
              </tr>
            );
          })}
        </AdminTable>
      )}

      <Dialog open={selectedId != null} onOpenChange={(open) => !open && closeDetail()}>
        <DialogContent className="max-h-[92vh] max-w-4xl overflow-y-auto">
          {selectedDraft && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedDraft.name}</DialogTitle>
                <DialogDescription asChild>
                  <div className="space-y-1 pt-1 text-left text-sm text-muted-foreground">
                    <p>
                      Score {selectedDraft.score ?? selectedDraft.payload.scores?.opportunity ?? "—"}{" "}
                      · {selectedDraft.payload.originCountryCode} ·{" "}
                      {sectorLabels[selectedDraft.payload.sector] ?? selectedDraft.payload.sector}
                    </p>
                    {effectiveDedupMatches(selectedDraft).length > 0 && (
                      <p className="flex items-center gap-1 text-amber-800">
                        <AlertTriangle className="size-3.5 shrink-0" />
                        {effectiveDedupMatches(selectedDraft).length} doublon(s) détecté(s) en live
                      </p>
                    )}
                  </div>
                </DialogDescription>
              </DialogHeader>

              <DraftReviewAlerts draft={selectedDraft} />

              <DraftPreviewPanel
                draft={{
                  payload: selectedDraft.payload,
                  score: selectedDraft.score,
                  source_verified: selectedDraft.source_verified,
                  verification_level: selectedDraft.verification_level,
                  premium_verified: selectedDraft.premium_verified,
                  invalid_urls: selectedDraft.invalid_urls,
                  source_run_id: selectedDraft.source_run_id,
                  dedup_matches: effectiveDedupMatches(selectedDraft),
                  needs_review: selectedDraft.needs_review,
                  fact_confidence: selectedDraft.fact_confidence,
                }}
                adminReviewDisclaimer
                onRunClick={onRunClick}
              />

              {actionFeedback && (
                <p className="text-sm text-emerald-600">{actionFeedback}</p>
              )}
              {actionError && <p className="text-sm text-red-600">{actionError}</p>}

              {dedupConflict && (
                <div className="rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2 text-sm text-amber-900">
                  <p className="font-medium">{dedupConflict.message}</p>
                  <p className="mt-1 text-xs">
                    Un doublon catalogue bloque la publication. Vous pouvez forcer si vous jugez
                    que ce n&apos;est pas un vrai doublon.
                  </p>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      disabled={actionLoading != null}
                      onClick={() => void patchDraft("publish", { force: true })}
                    >
                      Publier quand même (force)
                    </Button>
                  )}
                </div>
              )}

              {showRejectForm && (
                <div className="space-y-2">
                  <label className="text-xs uppercase text-muted-foreground">
                    Motif de rejet (optionnel)
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    rows={2}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                    placeholder="Doublon, qualité insuffisante…"
                  />
                </div>
              )}

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={closeDetail}>
                  Fermer
                </Button>
                {canEdit && (
                  <>
                    {!showRejectForm ? (
                      <Button
                        variant="outline"
                        className="border-red-500/40 text-red-700"
                        disabled={actionLoading != null}
                        onClick={() => setShowRejectForm(true)}
                      >
                        <X className="mr-1.5 size-3.5" />
                        Rejeter
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        className="border-red-500/40 text-red-700"
                        disabled={actionLoading != null}
                        onClick={() => void patchDraft("reject")}
                      >
                        {actionLoading === "reject" ? (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        ) : (
                          <X className="mr-1.5 size-3.5" />
                        )}
                        Confirmer le rejet
                      </Button>
                    )}
                    <Button
                      disabled={actionLoading != null}
                      onClick={() => void patchDraft("publish")}
                    >
                      {actionLoading === "publish" ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Check className="mr-1.5 size-3.5" />
                      )}
                      Approuver & publier
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
