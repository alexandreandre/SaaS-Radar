import { AdminPageHeader } from "@/components/admin/admin-ui";
import { requireAdminPage } from "@/lib/admin/page-guard";
import { isAdminAccessTokenConfigured } from "@/lib/admin/access-token";
import { getAdminGateRateLimit, getAdminLoginRateLimit } from "@/lib/admin/access-policy";

export default async function AdminSecurityPage() {
  await requireAdminPage("/admin/security");

  const tokenConfigured = isAdminAccessTokenConfigured();
  const gateLimit = getAdminGateRateLimit();
  const loginLimit = getAdminLoginRateLimit();

  return (
    <div>
      <AdminPageHeader
        title="Sécurité"
        description="Accès admin protégé par token secret et session opérateur."
      />
      <section className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">
        <dl className="space-y-3">
          <div className="flex justify-between gap-4">
            <dt>Token d&apos;accès (ADMIN_ACCESS_TOKEN)</dt>
            <dd className="font-medium text-foreground">
              {tokenConfigured ? "Configuré" : "Non configuré (dev)"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Limite token / IP</dt>
            <dd className="font-medium text-foreground">
              {gateLimit.max} tentatives / {Math.round(gateLimit.windowSeconds / 60)} min
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt>Limite login / IP</dt>
            <dd className="font-medium text-foreground">
              {loginLimit.max} tentatives / {Math.round(loginLimit.windowSeconds / 60)} min
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-xs">
          Sans token valide, les routes <code>/admin</code> renvoient vers{" "}
          <code>/admin/access</code>. Le cookie de gate expire après 12 h.
        </p>
      </section>
    </div>
  );
}
