import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile, getAdminRole } from "@/lib/auth";
import { hasAdminAccess } from "@/lib/admin/rbac";
import { AdminLoginClient } from "@/components/admin/admin-login-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administration — Connexion",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getCurrentUser();
  const role = await getAdminRole();
  const profile = user ? await getProfile() : null;

  if (user && hasAdminAccess(role)) {
    redirect("/admin");
  }

  const forbidden = !!user && !hasAdminAccess(role);

  return (
    <Suspense fallback={null}>
      <AdminLoginClient
        forbidden={forbidden}
        signedInEmail={profile?.email ?? user?.email ?? null}
      />
    </Suspense>
  );
}
