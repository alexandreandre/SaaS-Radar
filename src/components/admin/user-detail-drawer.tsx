"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ADMIN_ROLE_LABELS, type AdminRole } from "@/lib/admin/rbac";
import {
  formatPlanLabel,
  formatSubscriptionStatus,
  subscriptionBadgeTone,
} from "@/lib/admin/user-labels.shared";
import { cn } from "@/lib/utils";

export type UserDetail = {
  id: string;
  email: string | null;
  full_name: string | null;
  plan: string;
  admin_role: AdminRole;
  subscription_status: string | null;
  billing_interval: string | null;
  current_period_end: string | null;
  stripe_customer_id: string | null;
  opportunities_viewed_this_month: number;
  created_at: string;
  last_reset_at: string;
};

type AuditLog = {
  id: string;
  actor_email: string | null;
  action: string;
  created_at: string;
};

function toneClass(tone: ReturnType<typeof subscriptionBadgeTone>): string {
  if (tone === "success") return "border-transparent bg-success/15 text-success";
  if (tone === "warning") return "border-transparent bg-warning/15 text-warning";
  if (tone === "info") return "border-transparent bg-primary/10 text-primary";
  return "border-transparent bg-muted text-muted-foreground";
}

export function UserDetailDrawer({
  user,
  open,
  onClose,
  canEdit,
  onUpdated,
}: {
  user: UserDetail | null;
  open: boolean;
  onClose: () => void;
  canEdit: boolean;
  onUpdated: () => void;
}) {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [planDraft, setPlanDraft] = useState("");
  const [confirmPlan, setConfirmPlan] = useState(false);
  const [savingPlan, setSavingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const loadLogs = useCallback(async (userId: string) => {
    setLoadingLogs(true);
    try {
      const res = await fetch(`/api/admin/audit?target_id=${encodeURIComponent(userId)}&limit=10`);
      const json = await res.json();
      if (res.ok) setLogs(json.logs ?? []);
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  useEffect(() => {
    if (user && open) {
      setPlanDraft(user.plan);
      setPlanError(null);
      setConfirmPlan(false);
      void loadLogs(user.id);
    }
  }, [user, open, loadLogs]);

  const copyText = async (label: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  };

  const savePlan = async () => {
    if (!user || planDraft === user.plan) return;
    setSavingPlan(true);
    setPlanError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, plan: planDraft }),
      });
      const json = await res.json();
      if (!res.ok) {
        setPlanError(json.error ?? "Échec de la mise à jour");
        return;
      }
      setConfirmPlan(false);
      onUpdated();
    } finally {
      setSavingPlan(false);
    }
  };

  const stripeUrl = user?.stripe_customer_id
    ? `${process.env.NEXT_PUBLIC_STRIPE_DASHBOARD_BASE ?? "https://dashboard.stripe.com"}/customers/${user.stripe_customer_id}`
    : null;

  if (!user) return null;

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} aria-hidden />
      )}
      {open && (
      <aside
        className="fixed right-0 top-0 z-50 flex h-full w-full max-w-md flex-col border-l border-border bg-background shadow-xl"
        aria-hidden={!open}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-4">
          <div className="min-w-0 pr-4">
            <p className="truncate font-display text-lg font-medium">
              {user.full_name ?? user.email ?? "Utilisateur"}
            </p>
            {user.full_name && user.email && (
              <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={onClose} aria-label="Fermer">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-5">
          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Profil
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Rôle admin</dt>
                <dd>{ADMIN_ROLE_LABELS[user.admin_role ?? "none"]}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Inscrit le</dt>
                <dd>{new Date(user.created_at).toLocaleDateString("fr-FR")}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Quota ce mois</dt>
                <dd className="tabular-nums">{user.opportunities_viewed_this_month} vue(s)</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Reset quota</dt>
                <dd className="text-xs text-muted-foreground">
                  {new Date(user.last_reset_at).toLocaleDateString("fr-FR")}
                </dd>
              </div>
            </dl>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Abonnement
            </h3>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{formatPlanLabel(user.plan)}</Badge>
              <span
                className={cn(
                  "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                  toneClass(subscriptionBadgeTone(user.subscription_status))
                )}
                title={user.subscription_status ?? undefined}
              >
                {formatSubscriptionStatus(user.subscription_status)}
              </span>
            </div>
            <dl className="space-y-2 text-sm">
              {user.billing_interval && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Intervalle</dt>
                  <dd>{user.billing_interval === "year" ? "Annuel" : "Mensuel"}</dd>
                </div>
              )}
              {user.current_period_end && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">Fin de période</dt>
                  <dd>{new Date(user.current_period_end).toLocaleDateString("fr-FR")}</dd>
                </div>
              )}
            </dl>
            {stripeUrl ? (
              <Link
                href={stripeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline"
              >
                Ouvrir dans Stripe →
              </Link>
            ) : (
              <Link href="/admin/billing" className="text-sm text-primary hover:underline">
                Voir la facturation →
              </Link>
            )}
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Identifiants
            </h3>
            <div className="rounded-md border border-border bg-muted/20 p-3 font-mono text-xs">
              <p className="break-all text-muted-foreground">{user.id}</p>
              <Button
                variant="outline"
                size="sm"
                className="mt-2"
                onClick={() => void copyText("id", user.id)}
              >
                {copied === "id" ? "Copié" : "Copier l'ID"}
              </Button>
            </div>
            {user.stripe_customer_id && (
              <div className="rounded-md border border-border bg-muted/20 p-3 font-mono text-xs">
                <p className="break-all text-muted-foreground">{user.stripe_customer_id}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => void copyText("stripe", user.stripe_customer_id!)}
                >
                  {copied === "stripe" ? "Copié" : "Copier Stripe ID"}
                </Button>
              </div>
            )}
          </section>

          {canEdit && (
            <section className="space-y-3 rounded-lg border border-dashed border-border p-4">
              <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Avancé
              </h3>
              <p className="text-xs text-muted-foreground">
                Override manuel du plan (hors Stripe). À utiliser uniquement pour le support.
              </p>
              <select
                value={planDraft}
                onChange={(e) => setPlanDraft(e.target.value)}
                className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="free">Free</option>
                <option value="builder">Builder</option>
                <option value="pro">Pro</option>
              </select>
              <Button
                variant="outline"
                size="sm"
                disabled={planDraft === user.plan}
                onClick={() => setConfirmPlan(true)}
              >
                Appliquer le plan
              </Button>
              {planError && <p className="text-xs text-destructive">{planError}</p>}
            </section>
          )}

          <section className="space-y-3">
            <h3 className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Audit récent
            </h3>
            {loadingLogs ? (
              <p className="text-sm text-muted-foreground">Chargement…</p>
            ) : logs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune entrée pour cet utilisateur.</p>
            ) : (
              <ul className="space-y-2">
                {logs.map((log) => (
                  <li key={log.id} className="rounded-md border border-border px-3 py-2 text-xs">
                    <p className="font-mono">{log.action}</p>
                    <p className="mt-1 text-muted-foreground">
                      {log.actor_email ?? "—"} —{" "}
                      {new Date(log.created_at).toLocaleString("fr-FR")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/admin/audit" className="text-sm text-primary hover:underline">
              Journal complet →
            </Link>
          </section>
        </div>
      </aside>
      )}

      <Dialog open={confirmPlan} onOpenChange={setConfirmPlan}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer le changement de plan</DialogTitle>
            <DialogDescription>
              Passer {user.email ?? user.id} de {formatPlanLabel(user.plan)} à{" "}
              {formatPlanLabel(planDraft)}. Cette action ne synchronise pas Stripe automatiquement.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmPlan(false)}>
              Annuler
            </Button>
            <Button disabled={savingPlan} onClick={() => void savePlan()}>
              {savingPlan ? "Enregistrement…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
