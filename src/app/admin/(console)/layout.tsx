import { redirect } from "next/navigation";
import { getCurrentUser, getProfile, getAdminRole } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin/rbac";
import { AdminNav } from "@/components/admin/admin-nav";
import { AdminCommandPalette } from "@/components/admin/command-palette";
import { AdminPrefetch } from "@/components/admin/admin-prefetch";
import { AdminRoleProvider } from "@/contexts/admin-role-context";

export const dynamic = "force-dynamic";

export default async function AdminConsoleLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/admin/login?next=/admin");
  }

  const profile = await getProfile();
  const role = await getAdminRole();
  if (!hasAdminAccess(role)) {
    redirect("/admin/login?error=forbidden");
  }

  return (
    <AdminRoleProvider role={role}>
      <AdminPrefetch />
      <div className="flex h-screen w-full overflow-hidden bg-background">
        <AdminNav role={role} email={profile?.email ?? user.email ?? null} />
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex shrink-0 items-center justify-between border-b border-border px-6 py-3">
            <AdminCommandPalette />
          </header>
          <main className="min-h-0 flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </AdminRoleProvider>
  );
}
