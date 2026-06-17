"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ADMIN_NAV_HREFS, prefetchAllAdminRoutes } from "@/lib/admin/route-prefetch";

/** Précharge toutes les pages et APIs admin en arrière-plan. */
export function AdminPrefetch() {
  const router = useRouter();

  useEffect(() => {
    for (const href of ADMIN_NAV_HREFS) {
      router.prefetch(href);
    }
    prefetchAllAdminRoutes();
  }, [router]);

  return null;
}
