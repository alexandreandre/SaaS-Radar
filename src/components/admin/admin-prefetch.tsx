"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_NAV_HREFS, prefetchAdminRoute } from "@/lib/admin/route-prefetch";

/** Précharge uniquement la route admin courante (+ overview). */
export function AdminPrefetch() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const current =
      ADMIN_NAV_HREFS.find((href) => pathname === href || pathname.startsWith(`${href}/`)) ??
      "/admin";
    router.prefetch(current);
    prefetchAdminRoute(current);
    if (current !== "/admin") {
      router.prefetch("/admin");
      prefetchAdminRoute("/admin");
    }
  }, [router, pathname]);

  return null;
}
