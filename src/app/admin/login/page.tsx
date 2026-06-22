import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser, getProfile } from "@/lib/auth";
import { evaluateAdminSessionGate } from "@/lib/admin/session-gate";
import { requireAdminGateOnly } from "@/lib/admin/page-guard";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { AdminLoginClient } from "@/components/admin/admin-login-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administration — Connexion",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  await requireAdminGateOnly("/admin/login");

  const supabase = await createServerSupabaseClient();
  const user = await getCurrentUser();
  const profile = user ? await getProfile() : null;
  const gate = await evaluateAdminSessionGate(supabase, user, profile);

  if (gate.status === "ok") {
    redirect("/admin");
  }

  const forbidden = gate.status === "forbidden";

  return (
    <Suspense fallback={null}>
      <AdminLoginClient
        forbidden={forbidden}
        signedInEmail={profile?.email ?? user?.email ?? null}
      />
    </Suspense>
  );
}
