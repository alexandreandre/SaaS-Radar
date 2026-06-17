"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { AdminPageHeader, AdminTable, KpiCard } from "@/components/admin/admin-ui";
import { UserDetailDrawer, type UserDetail } from "@/components/admin/user-detail-drawer";
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
import { useAdminRole } from "@/contexts/admin-role-context";
import { adminFetchJson } from "@/lib/admin/client-fetch";
import {
  ADMIN_ROLE_LABELS,
  ADMIN_ROLE_RANK,
  type AdminRole,
} from "@/lib/admin/rbac";
import {
  formatPlanLabel,
  formatSubscriptionStatus,
  subscriptionBadgeTone,
} from "@/lib/admin/user-labels.shared";
import { cn } from "@/lib/utils";

type UserRow = UserDetail;

type UserStats = {
  totalUsers: number;
  activeAdmins: number;
  freeCount: number;
  builderCount: number;
  proCount: number;
  signupsLast7Days: number;
};

type Toast = { type: "success" | "error"; message: string };

const PAGE_SIZE = 50;
const ADMIN_ROLES: AdminRole[] = ["none", "viewer", "editor", "owner"];
const SUBSCRIPTION_FILTERS = [
  { value: "", label: "Tous statuts" },
  { value: "active", label: "Actif" },
  { value: "trialing", label: "Essai" },
  { value: "past_due", label: "Impayé" },
  { value: "canceled", label: "Annulé" },
  { value: "none", label: "Aucun abo" },
];

function toneClass(tone: ReturnType<typeof subscriptionBadgeTone>): string {
  if (tone === "success") return "border-transparent bg-success/15 text-success";
  if (tone === "warning") return "border-transparent bg-warning/15 text-warning";
  if (tone === "info") return "border-transparent bg-primary/10 text-primary";
  return "border-transparent bg-muted text-muted-foreground";
}

function isPrivilegeElevation(from: AdminRole, to: AdminRole): boolean {
  if (from === to) return false;
  if (to !== "editor" && to !== "owner") return false;
  return ADMIN_ROLE_RANK[to] > ADMIN_ROLE_RANK[from];
}

function TableSkeleton() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} className="border-t border-border">
          {Array.from({ length: 6 }).map((__, j) => (
            <td key={j} className="px-3 py-3">
              <div className="h-4 animate-pulse rounded bg-muted" />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

export function AdminUsersClient() {
  const currentRole = useAdminRole();
  const router = useRouter();
  const searchParams = useSearchParams();

  const qParam = searchParams.get("q") ?? "";
  const planParam = searchParams.get("plan") ?? "";
  const roleParam = searchParams.get("admin_role") ?? "";
  const statusParam = searchParams.get("subscription_status") ?? "";
  const offsetParam = Math.max(Number.parseInt(searchParams.get("offset") ?? "0", 10), 0);

  const [qInput, setQInput] = useState(qParam);
  const [debouncedQ, setDebouncedQ] = useState(qParam);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [roleOverrides, setRoleOverrides] = useState<Record<string, AdminRole>>({});
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingRoleChange, setPendingRoleChange] = useState<{
    user: UserRow;
    nextRole: AdminRole;
  } | null>(null);
  const [savingRole, setSavingRole] = useState(false);

  const canEditRoles = currentRole === "owner";
  const currentPage = Math.floor(offsetParam / PAGE_SIZE) + 1;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") params.delete(key);
        else params.set(key, value);
      }
      router.replace(`/admin/users${params.toString() ? `?${params}` : ""}`, { scroll: false });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQ(qInput), 300);
    return () => clearTimeout(timer);
  }, [qInput]);

  useEffect(() => {
    if (debouncedQ === qParam) return;
    updateParams({ q: debouncedQ || null, offset: null });
  }, [debouncedQ, qParam, updateParams]);

  useEffect(() => {
    setQInput(qParam);
    setDebouncedQ(qParam);
  }, [qParam]);

  const showToast = useCallback((next: Toast) => {
    setToast(next);
    setTimeout(() => setToast(null), 4000);
  }, []);

  const loadStats = useCallback(async () => {
    const { ok, data: json } = await adminFetchJson<{ stats?: UserStats }>(
      "/api/admin/users/stats"
    );
    if (ok) setStats(json.stats ?? null);
  }, []);

  const loadUsers = useCallback(async () => {
    setError(null);
    setRefreshing(true);
    try {
      const params = new URLSearchParams();
      if (debouncedQ) params.set("q", debouncedQ);
      if (planParam) params.set("plan", planParam);
      if (roleParam) params.set("admin_role", roleParam);
      if (statusParam) params.set("subscription_status", statusParam);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(offsetParam));

      const { ok, data: json } = await adminFetchJson<{
        users?: UserRow[];
        total?: number;
        hasMore?: boolean;
        error?: string;
      }>(`/api/admin/users?${params}`);
      if (!ok) {
        setError(json.error ?? "Impossible de charger les utilisateurs");
        return;
      }
      const rows = json.users ?? [];
      setUsers(rows);
      setTotal(json.total ?? rows.length);
      setHasMore(Boolean(json.hasMore));
      setRoleOverrides(
        Object.fromEntries(rows.map((u) => [u.id, (u.admin_role ?? "none") as AdminRole]))
      );
    } catch {
      setError("Erreur réseau lors du chargement");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedQ, planParam, roleParam, statusParam, offsetParam]);

  useEffect(() => {
    void loadStats();
  }, [loadStats]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  useEffect(() => {
    if (!selectedUser) return;
    const updated = users.find((u) => u.id === selectedUser.id);
    if (updated && updated !== selectedUser) setSelectedUser(updated);
  }, [users, selectedUser]);

  const applyRoleChange = async (user: UserRow, nextRole: AdminRole) => {
    const previous = roleOverrides[user.id] ?? user.admin_role ?? "none";
    setRoleOverrides((prev) => ({ ...prev, [user.id]: nextRole }));
    setSavingRole(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: user.id, admin_role: nextRole }),
      });
      const json = await res.json();
      if (!res.ok) {
        setRoleOverrides((prev) => ({ ...prev, [user.id]: previous }));
        showToast({ type: "error", message: json.error ?? "Échec de la mise à jour du rôle" });
        return;
      }
      showToast({
        type: "success",
        message: `Rôle de ${user.email ?? user.full_name ?? "l'utilisateur"} mis à jour`,
      });
      void loadUsers();
      void loadStats();
    } catch {
      setRoleOverrides((prev) => ({ ...prev, [user.id]: previous }));
      showToast({ type: "error", message: "Erreur réseau" });
    } finally {
      setSavingRole(false);
      setPendingRoleChange(null);
    }
  };

  const handleRoleSelect = (user: UserRow, nextRole: AdminRole) => {
    const current = roleOverrides[user.id] ?? user.admin_role ?? "none";
    if (nextRole === current) return;
    if (isPrivilegeElevation(current, nextRole)) {
      setPendingRoleChange({ user, nextRole });
      return;
    }
    void applyRoleChange(user, nextRole);
  };

  const openDrawer = (user: UserRow) => {
    setSelectedUser(user);
    setDrawerOpen(true);
  };

  const resetFilters = () => {
    setQInput("");
    setDebouncedQ("");
    router.replace("/admin/users", { scroll: false });
  };

  const displayedCount = users.length;
  const truncated = hasMore || offsetParam + displayedCount < total;

  return (
    <div>
      <AdminPageHeader
        title="Utilisateurs"
        description="Profils, plans et rôles admin."
        actions={
          <Link href="/admin/billing" className="text-sm text-primary hover:underline">
            Voir abonnements →
          </Link>
        }
      />

      {stats && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Total utilisateurs" value={stats.totalUsers} />
          <KpiCard label="Admins actifs" value={stats.activeAdmins} />
          <KpiCard
            label="Plans"
            value={`${stats.freeCount} / ${stats.builderCount} / ${stats.proCount}`}
            hint="Free · Builder · Pro"
          />
          <KpiCard label="Inscriptions 7 j" value={stats.signupsLast7Days} />
        </div>
      )}

      {toast && (
        <div
          className={cn(
            "mb-4 rounded-md border px-4 py-3 text-sm",
            toast.type === "success"
              ? "border-success/30 bg-success/10 text-success"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
        >
          {toast.message}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
        <div className="flex min-w-[220px] flex-1 flex-col gap-1">
          <label className="text-xs text-muted-foreground">Recherche</label>
          <input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Email ou nom…"
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Plan</label>
          <select
            value={planParam}
            onChange={(e) => updateParams({ plan: e.target.value || null, offset: null })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Tous plans</option>
            <option value="free">Free</option>
            <option value="builder">Builder</option>
            <option value="pro">Pro</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Rôle admin</label>
          <select
            value={roleParam}
            onChange={(e) => updateParams({ admin_role: e.target.value || null, offset: null })}
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            <option value="">Tous rôles</option>
            {ADMIN_ROLES.map((r) => (
              <option key={r} value={r}>
                {ADMIN_ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">Abonnement</label>
          <select
            value={statusParam}
            onChange={(e) =>
              updateParams({ subscription_status: e.target.value || null, offset: null })
            }
            className="rounded-md border border-border bg-background px-3 py-2 text-sm"
          >
            {SUBSCRIPTION_FILTERS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </div>
        <Button variant="outline" onClick={resetFilters}>
          Réinitialiser
        </Button>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>
          {loading ? "Chargement…" : `${displayedCount} utilisateur(s) affiché(s) sur ${total}`}
          {truncated && !loading && " — liste tronquée, affinez les filtres ou paginez"}
        </p>
        {refreshing && !loading && <span className="text-xs">Actualisation…</span>}
      </div>

      <AdminTable headers={["Nom", "Email", "Plan", "Abonnement", "Rôle", "Inscrit le"]}>
        {loading ? (
          <TableSkeleton />
        ) : users.length === 0 ? (
          <tr>
            <td colSpan={6} className="px-3 py-10 text-center text-sm text-muted-foreground">
              Aucun utilisateur ne correspond à vos filtres.
            </td>
          </tr>
        ) : (
          users.map((u) => {
            const role = roleOverrides[u.id] ?? u.admin_role ?? "none";
            return (
              <tr
                key={u.id}
                className="cursor-pointer border-t border-border hover:bg-muted/30"
                onClick={() => openDrawer(u)}
              >
                <td className="px-3 py-2">{u.full_name ?? "—"}</td>
                <td className="px-3 py-2">{u.email ?? "—"}</td>
                <td className="px-3 py-2">
                  <Badge variant={u.plan === "free" ? "outline" : "secondary"}>
                    {formatPlanLabel(u.plan)}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-sm border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide",
                      toneClass(subscriptionBadgeTone(u.subscription_status))
                    )}
                    title={u.subscription_status ?? undefined}
                  >
                    {formatSubscriptionStatus(u.subscription_status)}
                  </span>
                </td>
                <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                  {canEditRoles ? (
                    <select
                      value={role}
                      disabled={savingRole}
                      onChange={(e) => handleRoleSelect(u, e.target.value as AdminRole)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs"
                    >
                      {ADMIN_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ADMIN_ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Badge variant="outline">{ADMIN_ROLE_LABELS[role]}</Badge>
                  )}
                </td>
                <td className="px-3 py-2 text-xs text-muted-foreground">
                  {new Date(u.created_at).toLocaleDateString("fr-FR")}
                </td>
              </tr>
            );
          })
        )}
      </AdminTable>

      {!loading && total > PAGE_SIZE && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            Page {currentPage} / {totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={offsetParam <= 0}
              onClick={() =>
                updateParams({ offset: String(Math.max(0, offsetParam - PAGE_SIZE)) })
              }
            >
              <ChevronLeft className="mr-1 h-4 w-4" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={!hasMore}
              onClick={() => updateParams({ offset: String(offsetParam + PAGE_SIZE) })}
            >
              Suivant
              <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <UserDetailDrawer
        user={selectedUser}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        canEdit={canEditRoles}
        onUpdated={() => {
          void loadUsers();
          void loadStats();
          showToast({ type: "success", message: "Profil mis à jour" });
        }}
      />

      <Dialog open={Boolean(pendingRoleChange)} onOpenChange={() => setPendingRoleChange(null)}>
        <DialogContent onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Confirmer l&apos;élévation de privilège</DialogTitle>
            <DialogDescription>
              {pendingRoleChange && (
                <>
                  Accorder le rôle{" "}
                  <strong>{ADMIN_ROLE_LABELS[pendingRoleChange.nextRole]}</strong> à{" "}
                  {pendingRoleChange.user.email ?? pendingRoleChange.user.full_name ?? "cet utilisateur"}{" "}
                  lui donne un accès à la console admin
                  {pendingRoleChange.nextRole === "owner"
                    ? " avec tous les droits, y compris la gestion des rôles."
                    : pendingRoleChange.nextRole === "editor"
                      ? " avec droits d'édition."
                      : "."}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingRoleChange(null)}>
              Annuler
            </Button>
            <Button
              disabled={savingRole || !pendingRoleChange}
              onClick={() =>
                pendingRoleChange &&
                void applyRoleChange(pendingRoleChange.user, pendingRoleChange.nextRole)
              }
            >
              {savingRole ? "Enregistrement…" : "Confirmer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
