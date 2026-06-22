import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import {
  ADMIN_GATE_COOKIE,
  isAdminAccessTokenConfigured,
  verifyAdminGateCookieValue,
} from "@/lib/admin/access-token";
import { AdminAccessClient } from "@/components/admin/admin-access-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administration — Accès",
  robots: { index: false, follow: false },
};

export default async function AdminAccessPage() {
  if (!isAdminAccessTokenConfigured()) {
    redirect("/admin/login");
  }

  const cookieStore = await cookies();
  const gateCookie = cookieStore.get(ADMIN_GATE_COOKIE)?.value;
  if (verifyAdminGateCookieValue(gateCookie)) {
    redirect("/admin/login");
  }

  return (
    <Suspense fallback={null}>
      <AdminAccessClient />
    </Suspense>
  );
}
